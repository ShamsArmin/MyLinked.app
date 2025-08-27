import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { monitor } from "./monitoring";
import { securityMiddleware } from "./security-middleware";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { db } from "./db";
import path from "path";
import { fileURLToPath } from "url";
// Temporarily disabled problematic imports
// import { initializeEmailTemplates } from "./init-email-templates";
// import { initAIEmailTemplates } from "./ai-email-templates";
// import { initMarketingCampaigns } from "./marketing-campaigns";

const app = express();
app.set("trust proxy", 1);

// Add security middleware (must be first)
app.use(securityMiddleware.securityHeaders);
app.use(securityMiddleware.rateLimiter);
app.use(securityMiddleware.suspiciousActivityDetection);
app.use(securityMiddleware.sqlInjectionProtection);
app.use(securityMiddleware.xssProtection);
app.use(securityMiddleware.inputValidation);

// If you keep CORS, restrict to single origin
app.use(
  cors({
    origin: "https://mylinked.app",
    credentials: true,
  })
);

// Add monitoring middleware
app.use(monitor.requestTracker);

// Enhanced custom domain handling middleware
app.use((req, res, next) => {
  const host = req.get('host');
  
  // Handle custom domain requests with extensive logging
  if (host === 'mylinked.app' || host === 'www.mylinked.app' || host === 'app.mylinked.app') {
    console.log(`✅ Custom domain request received: ${host}${req.path}`);
    console.log(`Request headers:`, {
      host: req.get('host'),
      'x-forwarded-for': req.get('x-forwarded-for'),
      'user-agent': req.get('user-agent'),
      'x-forwarded-proto': req.get('x-forwarded-proto')
    });
    
    // Set custom domain headers
    req.headers['x-forwarded-host'] = host;
    req.headers['x-custom-domain'] = 'true';
    
    // Force HTTPS for custom domains
    if (req.get('x-forwarded-proto') !== 'https' && req.get('x-forwarded-proto')) {
      console.log(`🔄 Redirecting to HTTPS: ${host}${req.path}`);
      return res.redirect(308, `https://${host}${req.path}`);
    }
  }
  
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use(session({
  secret: process.env.SESSION_SECRET!, // set in Render → Environment
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true, // HTTPS on Render
    sameSite: 'lax', // single-origin default
  },
  // TODO: move to a persistent store later; MemoryStore is OK short-term
}));

app.get("/healthz", (_req, res) => res.status(200).send("ok"));

app.get("/api/auth/whoami", (req, res) => {
  const user = (req as any).user || (req as any).session?.user || null;
  res.json({ user });
});

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

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});


(async () => {
  const runMigrations = process.env.RUN_MIGRATIONS_ON_START !== "0";
  if (runMigrations) {
    try {
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const migrationsFolder = path.join(__dirname, "../migrations");
      await migrate(db, { migrationsFolder });
      console.log("db bootstrap: ok");
    } catch (err: any) {
      // Ignore "already exists" errors since some tables may have been
      // created outside of the migrations tracked by Drizzle.
      if (err?.code === "42P07") {
        console.log("db bootstrap: tables already exist");
      } else {
        console.error("db bootstrap failed:", err);
      }
    }
  } else {
    console.log("db bootstrap: skipped");
  }

  const server = await registerRoutes(app);

  // Add custom domain route handler AFTER API routes are registered
  app.get('*', (req, res, next) => {
    const host = req.get('host');
    
    // If request is from custom domain and not an API route
    if ((host === 'mylinked.app' || host === 'www.mylinked.app') && !req.path.startsWith('/api')) {
      console.log(`Serving custom domain request: ${host}${req.path}`);
      // Continue to next middleware (Vite/static serving)
      next();
    } else {
      // Continue normally
      next();
    }
  });

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      return next(err);
    }
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Server error:", err);
    return res.status(status).json({ message });
    // Don't throw the error again as it could crash the server
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use the port provided by the environment (Render sets PORT)
  // fallback to 5000 for local development
  const port = Number(process.env.PORT) || 5000;

  app.use((req, res, next) => {
    if (req.headers.host === "www.mylinked.app") {
      return res.redirect(301, `https://mylinked.app${req.url}`);
    }
    next();
  });

  // Add error handling for port conflicts
  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Trying to kill existing process...`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
  
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
    // Skip initialization functions for now to get app running
    console.log('Server started successfully');
  });
})();
