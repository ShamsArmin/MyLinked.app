import { Express, Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as UserType } from "../shared/schema";
import createMemoryStore from "memorystore";
import { dbEnabled } from "./db";

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

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) return false;
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Configure session with fallback to memory store if database fails
  const MemoryStore = createMemoryStore(session);
  let sessionStore;
  
  try {
    // Try to use database session store
    sessionStore = storage.sessionStore;
  } catch (error) {
    console.warn('Database session store failed, using memory store:', error);
    sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "mylinked-secret-key",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: false, // Set to false for development
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
    name: 'mylinked.session'
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      if (!dbEnabled) {
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
        console.error('Login error:', error);
        if (error?.message?.includes('does not exist')) {
          return done({ type: 'dbUnavailable' });
        }
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
    if (!dbEnabled) {
      return res.status(503).json({ message: "Database temporarily unavailable" });
    }
    try {
      const { username, password, name, email, bio } = req.body;

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }

      // Create user (storage will handle password hashing)
      const user = await storage.createUser({
        username,
        password,
        name,
        email,
        bio,
      });

      // Log user in
      req.login(user as any, (err) => {
        if (err) return next(err);
        return res.status(201).json({ message: "User registered successfully", user });
      });
    } catch (error: any) {
      if (error?.message?.includes('does not exist')) {
        return res.status(503).json({ message: "Database temporarily unavailable" });
      }
      next(error);
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
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user route
  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
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
    if (req.isAuthenticated() && req.user && req.user.id === parseInt(req.params[paramName])) {
      return next();
    }
    return res.status(403).json({ message: "Forbidden" });
  };
}