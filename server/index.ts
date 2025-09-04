import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import cors from "cors";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { sql, eq } from "drizzle-orm";
import { users } from "../shared/schema";
import { registerRoutes } from "./routes";
import { seedPermissions } from "../seeds/01_permissions";
import { seedSystemRoles } from "../seeds/02_roles";
import { setupVite, serveStatic, log } from "./vite";
import { monitor } from "./monitoring";
import { securityMiddleware } from "./security-middleware";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { db, pool } from "./db";
import path from "path";
import { fileURLToPath } from "url";
import referralRequestsRouter from "./routes/referral-requests";

// const { something } = require('something') // (none)

// ---------------------------------------------------------------------------
// App init & core middleware
// ---------------------------------------------------------------------------
const app = express();
app.set("trust proxy", 1);

// Body parsers MUST be before any routes/passport
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

const PgStore = connectPgSimple(session);
const isProd = process.env.NODE_ENV === "production";

// Security middleware (early)
app.use(securityMiddleware.securityHeaders);
app.use(securityMiddleware.rateLimiter);
app.use(securityMiddleware.suspiciousActivityDetection);
app.use(securityMiddleware.sqlInjectionProtection);
app.use(securityMiddleware.xssProtection);
app.use(securityMiddleware.inputValidation);

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || true, // set exact URL if cross-origin
    credentials: true,
  })
);

// Monitoring
app.use(monitor.requestTracker);

// Custom-domain helper
app.use((req, res, next) => {
  const host = req.get("host");
  if (host === "mylinked.app" || host === "www.mylinked.app" || host === "app.mylinked.app") {
    console.log(`✅ Custom domain request received: ${host}${req.path}`);
    console.log(`Request headers:`, {
      host: req.get("host"),
      "x-forwarded-for": req.get("x-forwarded-for"),
      "user-agent": req.get("user-agent"),
      "x-forwarded-proto": req.get("x-forwarded-proto"),
    });
    req.headers["x-forwarded-host"] = host;
    req.headers["x-custom-domain"] = "true";
    if (req.get("x-forwarded-proto") && req.get("x-forwarded-proto") !== "https") {
      console.log(`🔄 Redirecting to HTTPS: ${host}${req.path}`);
      return res.redirect(308, `https://${host}${req.path}`);
    }
  }
  next();
});

// Sessions (PG store in prod; MemoryStore in dev)
app.use(
  session({
    store: isProd
      ? new PgStore({
          pool,
          tableName: "sessions",
          createTableIfMissing: true,
        })
      : undefined,
    secret: process.env.SESSION_SECRET || "change-me-in-env",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
      secure: isProd,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    },
  })
);

// Passport
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    done(null, user as any);
  } catch (err) {
    done(err);
  }
});

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if ((req.session as any)?.userId) return next();
  return res.status(401).json({ message: "Unauthorized" });
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const role = (req.session as any)?.role;
  if (role !== "admin" && role !== "super_admin") {
    return res.status(403).json({ message: "Administrator privileges required" });
  }
  next();
}

// ---------------------------------------------------------------------------
// Passport strategies (username / email)
// ---------------------------------------------------------------------------
passport.use(
  "local-username",
  new LocalStrategy(
    { usernameField: "username", passwordField: "password" },
    async (username, password, done) => {
      const usernameNorm = (username || "").trim().toLowerCase();
      console.log("DBG login uname:", usernameNorm);
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(sql`lower(${users.username}) = ${usernameNorm}`)
          .limit(1);
        if (!user) return done(null, false, { message: "Invalid username or password" });
        if ((user as any).status === "suspended")
          return done(null, false, { status: 403, message: "Account suspended" });
        const ok = await bcrypt.compare(password, (user as any).password);
        if (!ok) return done(null, false, { message: "Invalid username or password" });
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.use(
  "local-email",
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      const emailNorm = (email || "").trim().toLowerCase();
      console.log("DBG login email:", emailNorm);
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(sql`lower(${users.email}) = ${emailNorm}`)
          .limit(1);
        console.log("[ADMIN LOGIN] emailNorm=", emailNorm, "result=", !!user, "role=", (user as any)?.role);
        if (!user) return done(null, false, { message: "Invalid email or password" });
        const role = (user as any).role;
        if (role !== "admin" && role !== "super_admin")
          return done(null, false, { status: 403, message: "Forbidden" });
        if ((user as any).status === "suspended")
          return done(null, false, { status: 403, message: "Account suspended" });
        const ok = await bcrypt.compare(password, (user as any).password);
        if (!ok) return done(null, false, { message: "Invalid email or password" });
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// ---------------------------------------------------------------------------
// Auth routes
// ---------------------------------------------------------------------------

// Dashboard (username) login – explicit handler with deep logs
app.post("/api/login", async (req, res, next) => {
  try {
    const rawUsername = String(req.body?.username ?? "");
    const rawPassword = String(req.body?.password ?? "");
    const usernameNorm = rawUsername.trim().toLowerCase();

    console.log("[LOGIN] username route hit");
    console.log("[LOGIN] body keys:", Object.keys(req.body || {}));
    console.log("[LOGIN] normalized username:", usernameNorm);

    if (!usernameNorm || !rawPassword) {
      console.log("[LOGIN] missing credentials");
      return res.status(400).json({ message: "Missing credentials" });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(sql`lower(${users.username}) = ${usernameNorm}`)
      .limit(1);

    console.log(
      "[LOGIN] user lookup result:",
      !!user,
      user ? { id: (user as any).id, username: (user as any).username, email: (user as any).email } : null
    );

    if (!user) return res.status(401).json({ message: "Invalid username or password" });
    if ((user as any).status === "suspended")
      return res.status(403).json({ message: "Account suspended" });

    const ok = await bcrypt.compare(rawPassword, (user as any).password);
    console.log("[LOGIN] bcrypt compare =>", ok);
    if (!ok) return res.status(401).json({ message: "Invalid username or password" });

    (req.session as any).userId = (user as any).id;
    (req.session as any).role = (user as any).role;

    console.log("[LOGIN] success for:", {
      id: (user as any).id,
      username: (user as any).username,
      role: (user as any).role,
    });

    return res.json({
      ok: true,
      user: {
        id: (user as any).id,
        username: (user as any).username,
        email: (user as any).email,
        name: (user as any).name,
        role: (user as any).role,
      },
    });
  } catch (err) {
    console.error("[LOGIN] error:", err);
    next(err);
  }
});

// Admin (email) login – via passport, sets session + returns dto
app.post("/api/login-admin", (req, res, next) => {
  passport.authenticate("local-email", (err: any, user: any, info: any) => {
    if (err) return next(err);
    if (!user) {
      const status = info?.status === 403 ? 403 : 401;
      return res.status(status).json({ message: info?.message || "Authentication failed" });
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      (req.session as any).userId = user.id;
      (req.session as any).role = user.role;
      return res.json({
        ok: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    });
  })(req, res, next);
});

// Logout
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// Who am I
app.get("/api/user", async (req, res) => {
  const userId = (req.session as any).userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return res.status(401).json({ message: "Unauthorized" });
  return res.json({
    id: (user as any).id,
    username: (user as any).username,
    email: (user as any).email,
    name: (user as any).name,
    role: (user as any).role,
  });
});

// Simple protected admin example
app.get("/api/admin/summary", requireAuth, requireAdmin, (_req, res) => {
  res.json({ ok: true, stats: { users: 0 } });
});

// ---------------------------------------------------------------------------
// Debug helpers
// ---------------------------------------------------------------------------
app.get("/healthz", (_req, res) => res.status(200).send("ok"));

app.get("/api/auth/whoami", (req, res) => {
  const user = (req as any).user || (req as any).session?.user || null;
  res.json({ user });
});

app.post("/api/referral-requests/debug-echo", (req, res) => {
  console.log("[debug-echo] body ->", req.body);
  res.json({ ok: true, received: req.body });
});

// API response logger
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      log(logLine);
    }
  });

  next();
});

// ---------------------------------------------------------------------------
// Bootstrap & start
// ---------------------------------------------------------------------------
(async () => {
  const runMigrations = process.env.RUN_MIGRATIONS_ON_START !== "0";
  if (runMigrations) {
    try {
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const migrationsFolder = path.join(__dirname, "../migrations");
      await migrate(db, { migrationsFolder });
      console.log("db bootstrap: ok");
    } catch (err: any) {
      if (err?.code === "42P07") {
        console.log("db bootstrap: tables already exist");
      } else {
        console.error("db bootstrap failed:", err);
      }
    }
  } else {
    console.log("db bootstrap: skipped");
  }

  // Smoke tests
  try {
    await pool.query('SELECT 1');
    try {
      await pool.query('SELECT 1 FROM role_invitations LIMIT 1');
    } catch (err: any) {
      if (err.code === '42P01') {
        console.warn('role_invitations table missing; continuing');
      } else {
        throw err;
      }
    }
  } catch (err) {
    console.error('Database smoke test failed:', err);
  }

  await seedPermissions();
  await seedSystemRoles();
  const server = await registerRoutes(app);

  app.use(referralRequestsRouter);

  // Custom domain handler after API routes
  app.get("*", (req, res, next) => {
    const host = req.get("host");
    if ((host === "mylinked.app" || host === "www.mylinked.app") && !req.path.startsWith("/api")) {
      console.log(`Serving custom domain request: ${host}${req.path}`);
      next();
    } else {
      next();
    }
  });

  // Global error handler
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Server error:", err);
    return res.status(status).json({ message });
  });

  // Vite/static
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT) || 5000;

  app.use((req, res, next) => {
    if (req.headers.host === "www.mylinked.app") {
      return res.redirect(301, `https://mylinked.app${req.url}`);
    }
    next();
  });

  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use. Trying to kill existing process...`);
      process.exit(1);
    } else {
      console.error("Server error:", err);
      process.exit(1);
    }
  });

  server.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
      console.log("Server started successfully");
    }
  );
})();
