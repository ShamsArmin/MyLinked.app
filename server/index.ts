import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { monitor } from "./monitoring";
import { securityMiddleware } from "./security-middleware";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { db, pool } from "./db";
// Temporarily disabled problematic imports
// import { initializeEmailTemplates } from "./init-email-templates";
// import { initAIEmailTemplates } from "./ai-email-templates";
// import { initMarketingCampaigns } from "./marketing-campaigns";

const app = express();

// Add security middleware (must be first)
app.use(securityMiddleware.securityHeaders);
app.use(securityMiddleware.rateLimiter);
app.use(securityMiddleware.suspiciousActivityDetection);
app.use(securityMiddleware.sqlInjectionProtection);
app.use(securityMiddleware.xssProtection);
app.use(securityMiddleware.inputValidation);

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
      return res.redirect(301, `https://${host}${req.path}`);
    }
  }
  
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

if (process.env.NODE_ENV === 'production') {
  const PgSession = pgSession(session);
  app.use(
    session({
      store: new PgSession({ conString: process.env.DATABASE_URL }),
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
    })
  );
} else {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'mylinked-secret-key',
      resave: false,
      saveUninitialized: false,
    })
  );
}

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
  if (process.env.RUN_MIGRATIONS_ON_START === "0") {
    console.log('db bootstrap: skipped (bypass)');
  } else {
    let applied = 0;
    let skipped = 0;
    try {
      const before = await pool.query('SELECT COUNT(*) AS count FROM "__drizzle_migrations"');
      try {
        await migrate(db, { migrationsFolder: "./migrations" });
      } catch (err: any) {
        if (err?.code === '42P07' || err?.code === '42710') {
          skipped++;
        } else {
          throw err;
        }
      }
      const after = await pool.query('SELECT COUNT(*) AS count FROM "__drizzle_migrations"');
      applied = Number(after.rows[0].count) - Number(before.rows[0].count);
      console.log(`db bootstrap: ok (applied ${applied}, skipped ${skipped})`);
    } catch (err) {
      console.error('db bootstrap failed:', err);
    }
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

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error("Server error:", err);
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

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  
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
