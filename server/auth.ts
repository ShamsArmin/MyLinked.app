import { Express, Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import "express-session";
import { storage } from "./storage";
import { User as UserType, users } from "../shared/schema";
import { isDbAvailable, db } from "./db";
import { sql } from "drizzle-orm";
import { getUserColumnSet } from "./user-columns";
import { hashPassword, verifyPassword } from "./auth/password";

export { hashPassword };
export const comparePasswords = verifyPassword;

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

export function setupAuth(app: Express) {
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      if (!(await isDbAvailable())) {
        return done({ type: 'dbUnavailable' });
      }
      try {
        console.log('Login attempt for username:', username);
        const user = await storage.getUserByUsername(username);
        if (!user) {
          console.log('User not found:', username);
          return done(null, false, { message: "Invalid username or password" });
        }

        console.log('User found, checking password...');
        console.log('Stored password hash:', user.password);
        const isPasswordValid = await storage.comparePasswords(password, user.password);
        console.log('Password valid:', isPasswordValid);

        if (!isPasswordValid) {
          console.log('Password verification failed for user:', username);
          return done(null, false, { message: "Invalid username or password" });
        }

        console.log('Login successful for user:', username);
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
    })
  );

  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user as any);
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
    console.log('Login route called with body:', req.body);
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
        console.log('Login successful for user:', user.username);
        return res.json({ 
          message: "Login successful", 
          user: user 
        });
      });
    })(req, res, next);
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