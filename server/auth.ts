import { Express, Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import "express-session";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { User as UserType, users } from "../shared/schema";
import { isDbAvailable, db } from "./db";
import { sql, eq } from "drizzle-orm";
import { getUserColumnSet } from "./user-columns";

// Extend the Express namespace for TypeScript
declare global {
  namespace Express {
    // Define a custom User interface that matches our UserType
    interface User extends Omit<UserType, 'socialScore'> {
      socialScore?: number;
    }
    // Session interface for OAuth state management
    interface Session {
      twitterCodeVerifier?: string;
      twitterState?: string;
    }
  }
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePasswords(supplied: string, stored: string) {
  return bcrypt.compare(supplied, stored);
}

export function setupAuth(app: Express) {
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy
  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, password, done) => {
        if (!(await isDbAvailable())) {
          return done({ type: 'dbUnavailable' });
        }
        try {
          const emailNorm = String(email || '').trim().toLowerCase();
          console.log('Login attempt for email:', emailNorm);
          const user = await storage.getUserByEmail(emailNorm);
          console.log('User lookup result:', !!user);
          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }
          const isPasswordValid = await bcrypt.compare(String(password || ''), user.password);
          console.log('Password valid:', isPasswordValid);
          if (!isPasswordValid) {
            return done(null, false, { message: "Invalid email or password" });
          }
          return done(null, user as any);
        } catch (error: any) {
          console.error('Login error:', {
            code: error?.code,
            column: error?.column,
            table: error?.table,
            message: error?.message,
          });
          return done(error);
        }
      }
    )
  );

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await db.query.users.findFirst({ where: eq(users.id, id) });
      done(null, user as any || false);
    } catch (error) {
      done(error);
    }
  });

  // Authentication routes
  app.post("/api/register", async (req, res, next) => {
    if (!(await isDbAvailable())) {
      return res.status(503).json({ message: "Database temporarily unavailable" });
    }
    try {
      const body = req.body ?? {};
      const {
        password,
        confirmPassword,
        passwordConfirmation,
        passwordConfirm,
        ...rest
      } = body;

      const userRecord = { name: rest.username, ...rest } as Record<string, any>;
      if (userRecord.email) {
        userRecord.email = String(userRecord.email).trim().toLowerCase();
      }

      // Password is required for registration
      if (!userRecord.username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userRecord.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }

      const columnSet = await getUserColumnSet(db);
      const dbFields: Record<string, any> = {};
      const extraFields: Record<string, any> = {};

      for (const [key, value] of Object.entries(userRecord)) {
        if (columnSet.has(key)) {
          dbFields[key] = value;
        } else {
          extraFields[key] = value;
        }
      }

      if (process.env.LOG_AUTH === '1') {
        console.log('Register insert columns:', Object.keys(dbFields));
        console.log('Register extra keys→settings:', Object.keys(extraFields));
      }

      dbFields.password = await hashPassword(password);

      let [user] = await db.insert(users).values(dbFields as any).returning();

      if (Object.keys(extraFields).length > 0 && columnSet.has('settings')) {
        const json = JSON.stringify(extraFields);
        const { rows } = await db.execute(
          sql`UPDATE users SET settings = COALESCE(settings,'{}'::jsonb) || ${json}::jsonb WHERE id = ${user.id} RETURNING settings`
        );
        if (rows.length > 0) {
          (user as any).settings = rows[0].settings;
        }
      }

      req.login(user as any, (err) => {
        if (err) return next(err);
        return res.status(201).json({ message: "User registered successfully", user });
      });
    } catch (error: any) {
      console.error('Register error:', {
        code: error?.code,
        column: error?.column,
        table: error?.table,
        message: error?.message,
      });
      return res.status(500).json({ message: 'Database error' });
    }
  });

  // Login route using Passport.js local strategy
  app.post("/api/login", (req, res, next) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    console.log('Login route called for email:', email);
    passport.authenticate("local", (err: any, user: any, info: any) => {
      console.log('Passport authenticate callback:', { err, user: !!user, info });
      if (err) {
        if (err.type === 'dbUnavailable') {
          return res.status(503).json({ message: "Database temporarily unavailable" });
        }
        console.error('Authentication error:', err);
        return next(err);
      }
      if (!user) {
        console.log('Authentication failed:', info);
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      req.logIn(user, (err) => {
        if (err) {
          console.error('Login error:', err);
          return next(err);
        }
        console.log('Login successful for user:', user.email);
        const { password: _pwd, ...safeUser } = user;
        return res.json({
          message: "Login successful",
          user: safeUser
        });
      });
    })(req, res, next);
  });

  // Admin bootstrap route
  app.post('/api/admin/bootstrap', async (req, res) => {
    const token = req.body?.token || req.query.token;
    if (!process.env.ADMIN_BOOTSTRAP_TOKEN || token !== process.env.ADMIN_BOOTSTRAP_TOKEN) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const username = String(req.body?.username || 'admin');
    const name = String(req.body?.name || 'Admin');
    let user = await storage.getUserByEmail(email);
    if (!user) {
      const hashed = await bcrypt.hash(password || 'Admin123!', 10);
      [user] = await db.insert(users).values({ email, username, name, password: hashed, role: 'admin' }).returning();
    } else if (user.role !== 'admin') {
      await db.update(users).set({ role: 'admin' }).where(eq(users.id, user.id));
      user.role = 'admin';
    }
    const { password: _pw, ...safe } = user;
    res.json({ ok: true, user: safe });
  });

  // Logout route
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      return res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user route
  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json(req.user);
    } else {
      return res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Simple endpoint to inspect session information
  app.get("/api/auth/whoami", (req, res) => {
    const user = (req as any).user || (req as any).session?.user || null;
    res.json({ user });
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
}

// Middleware to check if user is the owner of a resource
export function isOwner(paramName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated() && req.user && String(req.user.id) === req.params[paramName]) {
      return next();
    }
    return res.status(403).json({ message: "Forbidden" });
  };
}