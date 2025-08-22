import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  setupAuth,
  comparePasswords,
  hashPassword,
  isAuthenticated,
} from "./auth";
import { z } from "zod";
import {
  insertLinkSchema,
  updateLinkSchema,
  updateUserSchema,
  insertSocialPostSchema,
  insertFollowSchema,
  referralRequests,
  forgotPasswordSchema,
  resetPasswordSchema,
  insertCollaborationRequestSchema,
  updateCollaborationRequestSchema,
} from "../shared/schema";
import { db, pool, dbGuard } from "./db";
import { and, eq, gt, desc } from "drizzle-orm";
import {
  suggestLinkPriority,
  generateSocialScore,
  generateBrandingSuggestions,
  generateAnalyticsInsights,
} from "./openai";
import { getOAuthStatus } from "./oauth-status";
import { WebSocketServer, WebSocket } from "ws";
import { InstagramAPI } from "./instagram-api";
import { spotlightRouter } from "./spotlight-routes";
import { industryRouter } from "./industry-routes";
import { referralRouter } from "./referral-routes";

import { socialOAuthRouter } from "./social-oauth-simple";
import { twitterOAuthRouter } from "./twitter-oauth-fixed";
import { twitterDebugRouter } from "./twitter-debug-tool";
import { oauthSetupRouter } from "./oauth-setup-guide";
import { facebookComplianceRouter } from "./facebook-compliance";
import { aiSupportRouter } from "./ai-support-routes";
import { adminRouter } from "./admin-routes";
import { professionalAdminRouter } from "./professional-admin-routes";
import { monitoringRouter } from "./monitoring-routes";
import { securityRouter } from "./security-routes";
import bcrypt from "bcrypt";
import { handleCustomDomain, domainHealthCheck } from "./domain-middleware";
import emailRouter from "./email-routes";
import supportRouter from "./support-routes";
import { setupTikTokOAuth } from "./tiktok-oauth";
import { sendPasswordResetEmail } from "./email-service";

// Error handling middleware
const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Validation helper
const validateId = (id: string): number => {
  const numId = Number(id);
  if (isNaN(numId) || numId <= 0) {
    throw new Error("Invalid ID provided");
  }
  return numId;
};

// Environment validation
const validateEnvironmentVars = () => {
  const required = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'FACEBOOK_CLIENT_ID',
    'FACEBOOK_CLIENT_SECRET',
    'TWITTER_CLIENT_ID',
    'TWITTER_CLIENT_SECRET',
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET'
  ];

  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(', ')}`);
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Validate environment variables
  validateEnvironmentVars();

  // Custom domain handling middleware
  app.use(handleCustomDomain);

  // Domain health check endpoint
  app.get("/health", domainHealthCheck);

  // Database diagnostics
  app.get('/api/db/diag', async (_req, res) => {
    const mask = (url?: string) => {
      if (!url) return undefined;
      try {
        const u = new URL(url);
        if (u.password) u.password = '***';
        return u.toString();
      } catch {
        return undefined;
      }
    };

    const info: any = {
      connected: false,
      db: undefined as string | undefined,
      schema: undefined as string | undefined,
      tables: [] as string[],
      hostMasked: mask(process.env.DATABASE_URL),
      guard: { bypass: dbGuard.bypass, reason: dbGuard.reason },
    };

    try {
      await Promise.race([
        pool.query('SELECT 1'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
      ]);
      info.connected = true;
    } catch {}

    try {
      const { rows: meta } = await pool.query('select current_database() as db, current_schema() as schema');
      info.db = meta[0]?.db;
      info.schema = meta[0]?.schema;
      const { rows: tbl } = await pool.query("select table_name from information_schema.tables where table_schema='public'");
      info.tables = tbl.map((r: any) => r.table_name);
    } catch {}

    res.json(info);
  });

  // Set up authentication
  setupAuth(app);

  // Set up TikTok OAuth
  setupTikTokOAuth(app);

  // Serve static HTML files for OAuth flows
  app.use(
    express.static(".", {
      dotfiles: "ignore",
      index: false,
      setHeaders: (res: any, path: string) => {
        if (path.endsWith(".html")) {
          res.setHeader("Content-Type", "text/html");
        }
      },
    }),
  );

  // =============================================================================
  // OAUTH AUTHENTICATION ROUTES
  // =============================================================================

  // Google OAuth
  app.get("/api/auth/google", asyncHandler(async (req: any, res: any) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const baseUrl = (
      process.env.BASE_URL || `${req.protocol}://${req.get("host")}`
    ).replace(/\/$/, "");
    const redirectUri = `${baseUrl}/api/auth/google/callback`;
    const scope = "openid email profile";

    if (!clientId) {
      return res.status(400).json({ error: "Google OAuth not configured" });
    }

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=code&` +
      `access_type=offline`;

    res.redirect(authUrl);
  }));

  app.get("/api/auth/google/callback", asyncHandler(async (req: any, res: any) => {
    const { code } = req.query;

    if (!code) {
      return res.redirect("/?error=google_auth_failed");
    }

    // Exchange code for access token
    const baseUrl = (
      process.env.BASE_URL || `${req.protocol}://${req.get("host")}`
    ).replace(/\/$/, "");

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${baseUrl}/api/auth/google/callback`,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return res.redirect("/?error=google_token_failed");
    }

    // Get user profile
    const profileResponse = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenData.access_token}`,
    );
    const profile = await profileResponse.json();

    // Check if user exists or create new user
    let user = await storage.getUserByEmail(profile.email);

    if (!user) {
      // Create new user
      const hashedPassword = await hashPassword(Math.random().toString(36));
      user = await storage.createUser({
        username:
          profile.email.split("@")[0] +
          "_" +
          Math.random().toString(36).substr(2, 5),
        password: hashedPassword,
        name: profile.name || profile.email,
        email: profile.email,
        profileImage: profile.picture,
      });
    }

    // Log the user in
    req.login(user, (err: any) => {
      if (err) {
        return res.redirect("/?error=login_failed");
      }
      res.redirect("/");
    });
  }));

  // Facebook OAuth - Consolidated Implementation
  app.get("/api/auth/facebook", asyncHandler(async (req: any, res: any) => {
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    const redirectUri = `${baseUrl.replace(/\/$/, "")}/api/auth/facebook/callback`;

    if (!clientId) {
      console.error("Facebook OAuth: Missing client ID");
      return res.redirect(
        "/auth?error=facebook_not_configured&message=" +
        encodeURIComponent("Facebook OAuth is not configured"),
      );
    }

    const isMobile = /Mobile|Android|iPhone|iPad/.test(req.get("User-Agent") || "");
    const scope = "public_profile,email";
    const state = Math.random().toString(36).substring(2, 15);

    // Store state in session for verification
    if (req.session) {
      (req.session as any).facebookState = state;
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scope,
      response_type: "code",
      state: state,
      display: isMobile ? "touch" : "page",
    });

    console.log("Facebook OAuth redirect:", {
      clientId: clientId.substring(0, 10) + "...",
      redirectUri,
      scope,
      isMobile,
    });

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
    res.redirect(authUrl);
  }));

  app.get("/api/auth/facebook/callback", asyncHandler(async (req: any, res: any) => {
    const { code, error, error_description: errorDescription, state } = req.query;

    console.log("Facebook OAuth callback received:", {
      hasCode: !!code,
      error: error || "none",
      errorDescription: errorDescription || "none",
      hasState: !!state,
    });

    // Handle Facebook OAuth errors
    if (error) {
      console.error("Facebook OAuth error received:", { error, errorDescription });

      const errorMessages: Record<string, string> = {
        access_denied: "Facebook login was cancelled by user",
        temporarily_unavailable: "Facebook app may be in Development Mode. Switch to Live Mode or add yourself as a developer.",
        invalid_client_id: "Facebook app configuration error. Check App ID in Facebook Developer Console.",
      };

      const message = errorMessages[error as string] || `Facebook authentication failed: ${error}`;
      return res.redirect(`/auth?error=facebook_${error}&message=${encodeURIComponent(message)}`);
    }

    if (!code || !state) {
      console.error("Facebook OAuth: Missing authorization code or state");
      return res.redirect("/auth?error=facebook_no_code&message=" + 
        encodeURIComponent("Missing authorization parameters from Facebook"));
    }

    // Verify state parameter
    if (!req.session || (req.session as any).facebookState !== state) {
      console.error("Facebook OAuth: Invalid state parameter");
      return res.redirect("/auth?error=facebook_invalid_state&message=" + 
        encodeURIComponent("Invalid authentication state"));
    }

    // Clear session state
    if (req.session) {
      delete (req.session as any).facebookState;
    }

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    const redirectUri = `${baseUrl.replace(/\/$/, "")}/api/auth/facebook/callback`;

    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://graph.facebook.com/v18.0/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.FACEBOOK_CLIENT_ID!,
        client_secret: process.env.FACEBOOK_CLIENT_SECRET!,
        code: code as string,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token || tokenData.error) {
      console.error("Facebook token exchange failed:", tokenData);
      return res.redirect("/auth?error=facebook_token_failed&message=" + 
        encodeURIComponent("Failed to get access token from Facebook"));
    }

    // Get user profile from Facebook
    const profileResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name,email,picture.type(large)&access_token=${tokenData.access_token}`,
    );
    const profile = await profileResponse.json();

    if (!profileResponse.ok || profile.error || !profile.id) {
      console.error("Facebook profile fetch failed:", profile);
      return res.redirect("/auth?error=facebook_profile_failed&message=" + 
        encodeURIComponent("Failed to get profile from Facebook"));
    }

    // Create or find user
    const facebookUsername = `fb_${profile.id}`;
    let user = await storage.getUserByUsername(facebookUsername);

    if (!user) {
      console.log("Creating new user for Facebook ID:", profile.id);

      const randomPassword = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const hashedPassword = await hashPassword(randomPassword);

      user = await storage.createUser({
        username: facebookUsername,
        password: hashedPassword,
        name: profile.name || `Facebook User`,
        email: profile.email || null,
        profileImage: profile.picture?.data?.url || null,
      });
    }

    // Login user with session
    req.login(user as any, (loginError: any) => {
      if (loginError) {
        console.error("Facebook session login error:", loginError);
        return res.redirect("/auth?error=session_failed&message=" + 
          encodeURIComponent("Failed to create login session"));
      }

      console.log("Facebook OAuth login successful for:", user.username);
      res.redirect("/?login=facebook_success");
    });
  }));

  // Twitter/X OAuth - Consolidated Implementation
  app.get("/api/auth/twitter", asyncHandler(async (req: any, res: any) => {
    const clientId = process.env.TWITTER_CLIENT_ID_NEW || process.env.TWITTER_CLIENT_ID;
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    const redirectUri = `${baseUrl.replace(/\/$/, "")}/api/auth/twitter/callback`;
    const scope = "users.read tweet.read";

    if (!clientId) {
      console.error("X OAuth: Missing client ID");
      return res.redirect("/auth?error=twitter_not_configured&message=" + 
        encodeURIComponent("X OAuth is not configured"));
    }

    const state = `state_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Store state in session for verification
    if (req.session) {
      (req.session as any).twitterState = state;
    }

    const authUrl =
      `https://twitter.com/i/oauth2/authorize?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${state}`;

    console.log("X OAuth URL generated successfully");
    res.redirect(authUrl);
  }));

  app.get("/api/auth/twitter/callback", asyncHandler(async (req: any, res: any) => {
    const { code, state, error, error_description: errorDescription } = req.query;

    console.log("X OAuth callback received:", {
      hasCode: !!code,
      hasState: !!state,
      error: error || "none",
      errorDescription: errorDescription || "none",
    });

    // Handle X OAuth errors
    if (error) {
      console.error("X OAuth error received:", { error, errorDescription });

      if (error === "access_denied") {
        return res.redirect("/auth?error=twitter_access_denied&message=" + 
          encodeURIComponent("X login was cancelled"));
      }

      return res.redirect("/auth?error=twitter_oauth_error&message=" + 
        encodeURIComponent(errorDescription || "X authentication failed"));
    }

    if (!code || !state) {
      console.error("X OAuth: Missing authorization code or state");
      return res.redirect("/auth?error=twitter_no_code&message=" + 
        encodeURIComponent("Missing authorization parameters from X"));
    }

    // Verify state parameter
    if (!req.session || (req.session as any).twitterState !== state) {
      console.error("X OAuth: Invalid state parameter");
      return res.redirect("/auth?error=twitter_invalid_state&message=" + 
        encodeURIComponent("Invalid authentication state"));
    }

    // Clear session state
    if (req.session) {
      delete (req.session as any).twitterState;
    }

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    const redirectUri = `${baseUrl.replace(/\/$/, "")}/api/auth/twitter/callback`;
    const clientId = process.env.TWITTER_CLIENT_ID_NEW || process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET_NEW || process.env.TWITTER_CLIENT_SECRET;

    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        code: code as string,
        grant_type: "authorization_code",
        client_id: clientId!,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token || tokenData.error) {
      console.error("X token exchange failed:", tokenData);
      return res.redirect("/auth?error=twitter_token_failed&message=" + 
        encodeURIComponent("Failed to get access token from X"));
    }

    // Get user profile from X API
    const profileResponse = await fetch(
      "https://api.twitter.com/2/users/me?user.fields=profile_image_url,public_metrics",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      },
    );

    const profileData = await profileResponse.json();

    if (!profileResponse.ok || profileData.errors || !profileData.data) {
      console.error("X profile fetch failed:", profileData.errors || "No data");
      return res.redirect("/auth?error=twitter_profile_failed&message=" + 
        encodeURIComponent("Failed to get profile from X"));
    }

    const profile = profileData.data;

    // Create or find user using X-specific username format
    const xUsername = `tw_${profile.username}`;
    let user = await storage.getUserByUsername(xUsername);

    if (!user) {
      console.log("Creating new user for X username:", profile.username);

      const randomPassword = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const hashedPassword = await hashPassword(randomPassword);

      user = await storage.createUser({
        username: xUsername,
        password: hashedPassword,
        name: profile.name || `@${profile.username}`,
        email: null,
        profileImage: profile.profile_image_url || null,
      });
    }

    // Login user with session
    req.login(user as any, (loginError: any) => {
      if (loginError) {
        console.error("X session login error:", loginError);
        return res.redirect("/auth?error=session_failed&message=" + 
          encodeURIComponent("Failed to create login session"));
      }

      console.log("X OAuth login successful for:", user.username);
      res.redirect("/?login=twitter_success");
    });
  }));

  // GitHub OAuth - Consolidated Implementation
  app.get("/api/auth/github", asyncHandler(async (req: any, res: any) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    const redirectUri = `${baseUrl.replace(/\/$/, "")}/api/auth/github/callback`;
    const scope = "user:email";

    if (!clientId) {
      return res.status(400).json({ error: "GitHub OAuth not configured" });
    }

    const authUrl =
      `https://github.com/login/oauth/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}`;

    res.redirect(authUrl);
  }));

  app.get("/api/auth/github/callback", asyncHandler(async (req: any, res: any) => {
    const { code } = req.query;

    if (!code) {
      return res.redirect("/?error=github_auth_failed");
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error("GitHub token failed:", tokenData);
      return res.redirect("/?error=github_token_failed");
    }

    // Get user profile
    const profileResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "User-Agent": "MyLinked-App",
      },
    });
    const profile = await profileResponse.json();

    if (profile.message && profile.message.includes("Bad credentials")) {
      console.error("GitHub profile error:", profile.message);
      return res.redirect("/?error=github_credentials_failed");
    }

    // Get user email
    const emailResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "User-Agent": "MyLinked-App",
      },
    });
    const emails = await emailResponse.json();

    const primaryEmail = Array.isArray(emails)
      ? emails.find((email: any) => email.primary)?.email || emails[0]?.email
      : null;

    // Check if user exists or create new user
    let user = (primaryEmail ? await storage.getUserByEmail(primaryEmail) : null) ||
      (await storage.getUserByUsername(profile.login));

    if (!user) {
      const hashedPassword = await hashPassword(Math.random().toString(36));
      user = await storage.createUser({
        username: profile.login,
        password: hashedPassword,
        name: profile.name || profile.login,
        email: primaryEmail || null,
        profileImage: profile.avatar_url || null,
      });
    }

    // Log the user in
    req.login(user, (err: any) => {
      if (err) {
        return res.redirect("/?error=login_failed");
      }
      res.redirect("/");
    });
  }));

  // =============================================================================
  // SOCIAL MEDIA OAUTH (Instagram, TikTok, etc.)
  // =============================================================================

  // Instagram OAuth
  app.get("/api/auth/instagram", asyncHandler(async (req: any, res: any) => {
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
            <h2>Instagram OAuth Not Configured</h2>
            <p>Instagram client credentials are missing.</p>
            <p>Please contact the administrator to configure Instagram OAuth.</p>
            <button onclick="window.close()">Close Window</button>
          </body>
        </html>
      `);
    }

    const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/instagram/callback`;
    const authUrl =
      `https://api.instagram.com/oauth/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=user_profile,user_media&` +
      `response_type=code`;

    res.redirect(authUrl);
  }));

  app.get("/api/auth/instagram/callback", asyncHandler(async (req: any, res: any) => {
    const { code } = req.query;

    if (!code) {
      return res.redirect("/?error=instagram_auth_failed");
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.INSTAGRAM_CLIENT_ID!,
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET!,
        grant_type: "authorization_code",
        redirect_uri: `${req.protocol}://${req.get("host")}/api/auth/instagram/callback`,
        code: code as string,
      }),
    });

    const tokens = await tokenResponse.json();

    if (tokens.access_token && req.user) {
      // Save Instagram connection
      await storage.saveSocialConnection({
        userId: (req.user as any).id,
        platform: "instagram",
        platformUserId: tokens.user_id,
        platformUsername: tokens.user_id,
        accessToken: tokens.access_token,
        refreshToken: null,
      });
    }

    res.redirect("/?instagram=connected");
  }));

  // TikTok OAuth
  app.get("/api/auth/tiktok", asyncHandler(async (req: any, res: any) => {
    const clientId = process.env.TIKTOK_CLIENT_ID;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
            <h2>TikTok OAuth Not Configured</h2>
            <p>TikTok client credentials are missing.</p>
            <p>Please contact the administrator to configure TikTok OAuth.</p>
            <button onclick="window.close()">Close Window</button>
          </body>
        </html>
      `);
    }

    const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/tiktok/callback`;
    const authUrl =
      `https://www.tiktok.com/auth/authorize/?` +
      `client_key=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=user.info.basic&` +
      `response_type=code`;

    res.redirect(authUrl);
  }));

  app.get("/api/auth/tiktok/callback", asyncHandler(async (req: any, res: any) => {
    const { code } = req.query;

    if (!code) {
      return res.redirect("/?error=tiktok_auth_failed");
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://open-api.tiktok.com/oauth/access_token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_ID!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        code: code as string,
        grant_type: "authorization_code",
        redirect_uri: `${req.protocol}://${req.get("host")}/api/auth/tiktok/callback`,
      }),
    });

    const tokens = await tokenResponse.json();

    if (tokens.data?.access_token && req.user) {
      // Save TikTok connection
      await storage.saveSocialConnection({
        userId: (req.user as any).id,
        platform: "tiktok",
        platformUserId: tokens.data.open_id,
        platformUsername: tokens.data.open_id,
        accessToken: tokens.data.access_token,
        refreshToken: tokens.data.refresh_token,
      });
    }

    res.redirect("/?tiktok=connected");
  }));

  // =============================================================================
  // OAUTH TEST AND DEBUG PAGES
  // =============================================================================

  // Serve OAuth test pages
  app.get("/test-oauth", (req: any, res: any) => {
    const fs = require("fs");
    const pathModule = require("path");
    const filePath = pathModule.join(__dirname, "../test-oauth-simple.html");
    fs.readFile(filePath, "utf8", (err: any, data: string) => {
      if (err) {
        res.status(404).send("Test page not found");
        return;
      }
      res.type("html").send(data);
    });
  });

  app.get("/test-oauth-advanced", (req: any, res: any) => {
    const fs = require("fs");
    const pathModule = require("path");
    const filePath = pathModule.join(__dirname, "../test-oauth-flow.html");
    fs.readFile(filePath, "utf8", (err: any, data: string) => {
      if (err) {
        res.status(404).send("Advanced test page not found");
        return;
      }
      res.type("html").send(data);
    });
  });

  app.get("/debug-oauth", (req: any, res: any) => {
    const fs = require("fs");
    const pathModule = require("path");
    const filePath = pathModule.join(__dirname, "../test-oauth-debug.html");
    fs.readFile(filePath, "utf8", (err: any, data: string) => {
      if (err) {
        res.status(404).send("Debug monitor not found");
        return;
      }
      res.type("html").send(data);
    });
  });

  app.get("/test-facebook-login", (req: any, res: any) => {
    const fs = require("fs");
    const pathModule = require("path");
    const filePath = pathModule.join(__dirname, "../test-facebook-login.html");
    fs.readFile(filePath, "utf8", (err: any, data: string) => {
      if (err) {
        res.status(404).send("Facebook test page not found");
        return;
      }
      res.type("html").send(data);
    });
  });

  // =============================================================================
  // PASSWORD RESET ENDPOINTS - FIXED VERSION
  // =============================================================================

  app.post("/api/forgot-password", asyncHandler(async (req: any, res: any) => {
    console.log('=== FORGOT PASSWORD REQUEST ===');
    const { email } = forgotPasswordSchema.parse(req.body);
    console.log('Email:', email);

    // Check if user exists
    const user = await storage.getUserByEmail(email);
    console.log('User found:', user ? user.username : 'no');

    if (!user) {
      // Don't reveal whether email exists for security
      console.log('User not found, returning generic message');
      return res.json({ 
        message: "If an account with this email exists, you will receive a password reset link shortly." 
      });
    }

    try {
      // Clean up expired tokens first
      console.log('Cleaning up expired tokens...');
      await storage.cleanupExpiredTokens();

      // Create password reset token - THIS WAS THE MISSING PIECE!
      console.log('Creating password reset token for email:', email);
      const resetToken = await storage.createPasswordResetToken(email);
      console.log('Reset token created successfully:', resetToken ? 'yes' : 'no');

      if (!resetToken) {
        console.log('Failed to create reset token');
        return res.status(500).json({ 
          error: "Failed to create password reset token. Please try again later." 
        });
      }

      // Send password reset email
      console.log('Sending password reset email...');
      const emailSent = await sendPasswordResetEmail(email, resetToken.token);
      console.log('Email sent:', emailSent ? 'yes' : 'no');

      if (!emailSent) {
        console.log('Email sending failed');
        return res.status(500).json({ 
          error: "Failed to send password reset email. Please try again later." 
        });
      }

      console.log('Password reset process completed successfully');
      res.json({ 
        message: "If an account with this email exists, you will receive a password reset link shortly." 
      });

    } catch (error) {
      console.error('Error in forgot password process:', error);
      return res.status(500).json({ 
        error: "An error occurred while processing your request. Please try again later." 
      });
    }
  }));

  app.post("/api/reset-password", asyncHandler(async (req: any, res: any) => {
    console.log('=== PASSWORD RESET REQUEST ===');
    console.log('Request body:', { 
      token: req.body.token?.substring(0, 10) + '...', 
      passwordLength: req.body.newPassword?.length 
    });

    try {
      const { token, newPassword } = resetPasswordSchema.parse(req.body);

      // Reset password using token
      console.log('Calling storage.resetPassword...');
      const user = await storage.resetPassword(token, newPassword);
      console.log('Reset password result:', user ? `User ${user.username} updated successfully` : 'Failed');

      if (!user) {
        console.log('Password reset failed - invalid or expired token');
        return res.status(400).json({ 
          error: "Invalid or expired password reset token." 
        });
      }

      // Clean up expired tokens
      await storage.cleanupExpiredTokens();

      console.log('Password reset completed successfully for user:', user.username);
      res.json({ 
        message: "Password has been reset successfully. You can now log in with your new password." 
      });

    } catch (error) {
      console.error('Error in reset password process:', error);
      return res.status(500).json({ 
        error: "An error occurred while resetting your password. Please try again." 
      });
    }
  }));

  app.get("/api/verify-reset-token/:token", asyncHandler(async (req: any, res: any) => {
    const { token } = req.params;

    try {
      const resetToken = await storage.getPasswordResetToken(token);

      if (!resetToken || resetToken.used || new Date() > new Date(resetToken.expiresAt)) {
        return res.status(400).json({ 
          valid: false, 
          error: "Invalid or expired reset token." 
        });
      }

      res.json({ 
        valid: true, 
        email: resetToken.email 
      });
    } catch (error) {
      console.error('Error verifying reset token:', error);
      return res.status(500).json({ 
        valid: false, 
        error: "An error occurred while verifying the token." 
      });
    }
  }));

  // =============================================================================
  // USER PROFILE AND THEME ROUTES
  // =============================================================================

  // User theme routes
  app.get("/api/user/theme", asyncHandler(async (req: any, res: any) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.user.id);
    res.json({ theme: user?.theme || "default" });
  }));

  app.post("/api/user/theme", asyncHandler(async (req: any, res: any) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { themeId } = req.body;

    if (!themeId) {
      return res.status(400).json({ message: "Missing theme ID" });
    }

    const updatedUser = await storage.updateUser(req.user.id, {
      theme: themeId,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ theme: updatedUser.theme });
  }));

  // User profile routes
  app.get("/api/profile", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;

    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Don't include password in the response
    const { password, ...userWithoutPassword } = user;

    res.json(userWithoutPassword);
  }));

  app.patch("/api/profile", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const updates = updateUserSchema.parse(req.body);

    // Check if username is being changed and if it's already taken
    if (updates.username) {
      const existingUser = await storage.getUserByUsername(updates.username);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }

    const updatedUser = await storage.updateUser(userId, updates);

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    // Don't include password in the response
    const { password, ...userWithoutPassword } = updatedUser;

    res.json(userWithoutPassword);
  }));

  // Delete user account
  app.delete("/api/profile", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;

    console.log(`Attempting to delete account for user ID: ${userId}`);

    // Delete the user and all related data
    const deleted = await storage.deleteUser(userId);

    if (!deleted) {
      return res.status(500).json({ message: "Failed to delete account" });
    }

    // Destroy the session after successful deletion
    req.logout((err: any) => {
      if (err) {
        console.error("Error during logout:", err);
      }

      req.session.destroy((err: any) => {
        if (err) {
          console.error("Error destroying session:", err);
        }

        res.json({
          message: "Account deleted successfully",
          redirectTo: "/",
        });
      });
    });
  }));

  // Pitch Mode API endpoint
  app.patch("/api/pitch-mode", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const { enabled, type, description, focusAreas } = req.body;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({ message: "enabled must be a boolean" });
    }

    if (type && !["professional", "creative", "startup", "speaker"].includes(type)) {
      return res.status(400).json({ message: "Invalid pitch mode type" });
    }

    if (focusAreas && (!Array.isArray(focusAreas) || !focusAreas.every((area) => typeof area === "string"))) {
      return res.status(400).json({ message: "focusAreas must be an array of strings" });
    }

    const updatedUser = await storage.updatePitchMode(userId, enabled, type, description, focusAreas);

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Don't include password in response
    const { password, ...userWithoutPassword } = updatedUser;

    res.json(userWithoutPassword);
  }));

  // =============================================================================
  // LINKS MANAGEMENT ROUTES
  // =============================================================================

  app.get("/api/links", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const links = await storage.getLinks(userId);
    res.json(links);
  }));

  app.post("/api/links", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const linkData = insertLinkSchema.parse(req.body);
    const newLink = await storage.createLink(userId, linkData);
    res.status(201).json(newLink);
  }));

  app.patch("/api/links/:id", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const linkId = validateId(req.params.id);

    // Verify link belongs to user
    const link = await storage.getLinkById(linkId);
    if (!link) return res.status(404).json({ message: "Link not found" });
    if (link.userId !== userId) return res.status(403).json({ message: "Not authorized" });

    const updates = updateLinkSchema.parse(req.body);
    const updatedLink = await storage.updateLink(linkId, updates);
    res.json(updatedLink);
  }));

  app.delete("/api/links/:id", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const linkId = validateId(req.params.id);

    // Verify link belongs to user
    const link = await storage.getLinkById(linkId);
    if (!link) return res.status(404).json({ message: "Link not found" });
    if (link.userId !== userId) return res.status(403).json({ message: "Not authorized" });

    const success = await storage.deleteLink(linkId);
    if (success) {
      res.status(204).send();
    } else {
      res.status(500).json({ message: "Failed to delete link" });
    }
  }));

  // Record link click
  app.post("/api/links/:id/click", asyncHandler(async (req: any, res: any) => {
    const linkId = validateId(req.params.id);

    const link = await storage.getLinkById(linkId);
    if (!link) return res.status(404).json({ message: "Link not found" });

    const updatedLink = await storage.incrementLinkClicks(linkId);
    res.json(updatedLink);
  }));

  // =============================================================================
  // PUBLIC PROFILE ROUTES
  // =============================================================================

  app.get("/api/profile/:username", asyncHandler(async (req: any, res: any) => {
    const { username } = req.params;

    const user = await storage.getUserByUsername(username);
    if (!user) return res.status(404).json({ message: "Profile not found" });

    // Record the view
    await storage.recordProfileView(user.id);

    // Don't include password and sensitive info in the response
    const { password, ...userWithoutPassword } = user;

    // Get user's links
    const links = await storage.getLinks(user.id);

    // Get additional data with proper error handling
    let spotlightProjects = [];
    let referralLinks = [];
    let skills = [];

    try {
      if (typeof storage.getSpotlightProjects === "function") {
        spotlightProjects = await storage.getSpotlightProjects(user.id);
      }
    } catch (error) {
      console.warn("Failed to fetch spotlight projects:", error);
    }

    try {
      if (typeof storage.getReferralLinks === "function") {
        referralLinks = await storage.getReferralLinks(user.id);
      }
    } catch (error) {
      console.warn("Failed to fetch referral links:", error);
    }

    try {
      if (typeof storage.getSkills === "function") {
        skills = await storage.getSkills(user.id);
      }
    } catch (error) {
      console.warn("Failed to fetch skills:", error);
    }

    res.json({
      profile: userWithoutPassword,
      links,
      spotlightProjects,
      referralLinks,
      skills,
    });
  }));

  // =============================================================================
  // ANALYTICS AND STATS ROUTES
  // =============================================================================

  app.get("/api/stats", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const timeRange = (req.query.timeRange as string) || "30d";

    // Calculate date filter based on time range
    let dateFilter = new Date();
    switch (timeRange) {
      case "7d":
        dateFilter.setDate(dateFilter.getDate() - 7);
        break;
      case "30d":
        dateFilter.setDate(dateFilter.getDate() - 30);
        break;
      case "90d":
        dateFilter.setDate(dateFilter.getDate() - 90);
        break;
      default:
        dateFilter.setDate(dateFilter.getDate() - 30);
    }

    const stats = await storage.getUserStats(userId, dateFilter);
    res.json(stats);
  }));

  // =============================================================================
  // AI-POWERED FEATURES
  // =============================================================================

  // Social Score API
  app.get("/api/social-score", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const links = await storage.getLinks(userId);
    const stats = await storage.getUserStats(userId);
    const followers = await storage.getFollowers(userId);
    const following = await storage.getFollowing(userId);

    // Calculate social score if not already present
    if (!user.socialScore && process.env.OPENAI_API_KEY) {
      try {
        const socialScoreResult = await generateSocialScore(user, links, stats);
        if (socialScoreResult) {
          await storage.updateSocialScore(userId, socialScoreResult.score);
          user.socialScore = socialScoreResult.score;
        }
      } catch (error) {
        console.warn("Failed to generate social score:", error);
      }
    }

    // Generate historical data
    const historicalData = [];
    let baseScore = Math.max(30, (user.socialScore || 75) - 20);

    for (let i = 7; i >= 0; i--) {
      const weekNumber = 8 - i;
      const scoreIncrease = Math.floor(i * 3);
      const weekScore = Math.min(100, baseScore + scoreIncrease);

      historicalData.push({
        date: `Week ${weekNumber}`,
        score: weekScore,
        views: Math.floor((stats.views * (0.7 + Math.random() * 0.3)) / 8),
        clicks: Math.floor((stats.clicks * (0.7 + Math.random() * 0.3)) / 8),
      });
    }

    // Get comparative data
    const compareData = [
      {
        category: "Profile Completeness",
        userScore: user.bio && user.profileImage ? 85 : user.bio ? 60 : 40,
        avgScore: 65,
      },
      {
        category: "Link Diversity",
        userScore: Math.min(90, links.length * 15),
        avgScore: 60,
      },
      {
        category: "Content Freshness",
        userScore: 60,
        avgScore: 50,
      },
      {
        category: "Engagement Rate",
        userScore: Math.min(90, Math.floor(stats.ctr * 1.2)),
        avgScore: 55,
      },
      {
        category: "Feature Utilization",
        userScore: user.pitchMode ? 90 : 40,
        avgScore: 40,
      },
    ];

    res.json({
      currentScore: user.socialScore || 75,
      stats,
      historicalData,
      compareData,
      followers: followers.length,
      following: following.length,
    });
  }));

  // Calculate social score
  app.post("/api/social-score/calculate", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(401).json({
        message: "OpenAI API key not configured. Please set the OPENAI_API_KEY environment variable.",
      });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const links = await storage.getLinks(userId);
    const stats = await storage.getUserStats(userId);

    const result = await generateSocialScore(user, links, stats);

    if (result) {
      const previousScore = user.socialScore || 0;
      await storage.updateSocialScore(userId, result.score);

      res.json({
        score: result.score,
        previousScore: previousScore,
        change: result.score - previousScore,
        insights: result.insights,
      });
    } else {
      res.status(400).json({ message: "Failed to calculate social score" });
    }
  }));

  // Smart Link AI - prioritize links with insights
  app.post("/api/links/ai-prioritize", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(401).json({
        message: "OpenAI API key not configured. Please set the OPENAI_API_KEY environment variable.",
      });
    }

    // Get user's links with click data
    const links = await storage.getLinks(userId);
    if (links.length === 0) {
      return res.status(400).json({ message: "No links to prioritize" });
    }

    // Get user stats for profile views
    const stats = await storage.getUserStats(userId);

    // Use OpenAI to suggest optimal ordering with insights
    const aiResult = await suggestLinkPriority(
      links.map((link) => ({
        id: link.id,
        platform: link.platform,
        title: link.title,
        url: link.url,
        clicks: link.clicks || 0,
        views: link.views || 0,
      })),
      stats.views,
    );

    const { linkScores, insights } = aiResult;

    // Update links with new AI scores and order
    const reorderedLinks = await storage.reorderLinks(userId, linkScores);

    // Return the reordered links and AI insights
    res.json({
      message: "Links prioritized successfully",
      links: reorderedLinks,
      insights: insights,
    });
  }));

  // Manual link reordering endpoint
  app.post("/api/links/reorder", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const { linkScores } = req.body;

    // Validate input
    if (!Array.isArray(linkScores)) {
      return res.status(400).json({ message: "linkScores must be an array" });
    }

    // Check if each item has id and score properties
    for (const item of linkScores) {
      if (typeof item.id !== "number" || typeof item.score !== "number") {
        return res.status(400).json({
          message: "Each item in linkScores must have numeric id and score properties",
        });
      }
    }

    // Reorder the links
    const reorderedLinks = await storage.reorderLinks(userId, linkScores);

    res.json({
      message: "Links reordered successfully",
      links: reorderedLinks,
    });
  }));

  // AI-Powered Personal Branding Suggester
  app.post("/api/branding/suggest", asyncHandler(async (req: any, res: any) => {
    if (!process.env.OPENAI_API_KEY) {
      // Provide fallback branding suggestions
      const fallbackSuggestions = {
        colorPalette: {
          primary: "#4361ee",
          secondary: "#3a0ca3",
          accent: "#f72585",
        },
        tagline: "Connecting Your Digital World",
        profileBio: "Digital creator sharing insights and connecting across platforms. Follow for updates on my latest projects and collaborations.",
        imageryThemes: ["Minimalist", "Technology", "Creative", "Professional"],
        fontRecommendations: ["Poppins", "Inter", "Montserrat"],
      };

      return res.json({
        message: "Generated example suggestions. OpenAI API currently unavailable.",
        suggestions: fallbackSuggestions,
        isDemo: true,
      });
    }

    const profileData = {
      username: "User",
      name: "Demo User",
      bio: "Demo bio",
      profession: req.body.profession || "",
      interests: req.body.interests || [],
      socialAccounts: req.body.socialAccounts || [],
    };

    const brandingSuggestions = await generateBrandingSuggestions(profileData, []);

    res.json({
      message: "Branding suggestions generated successfully",
      suggestions: brandingSuggestions,
    });
  }));

  // Analytics insights with intelligent fallback
  app.get("/api/analytics/insights", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const links = await storage.getLinks(userId);
    const stats = await storage.getUserStats(userId);

    // Try OpenAI API first if available
    if (process.env.OPENAI_API_KEY) {
      try {
        const insights = await generateAnalyticsInsights(user, links, stats);
        return res.json(insights);
      } catch (apiError: any) {
        console.log("OpenAI API unavailable, using intelligent fallback analytics");
      }
    }

    // Intelligent Fallback Analytics System
    const fallbackInsights = generateFallbackAnalyticsInsights(user, links, stats);
    res.json(fallbackInsights);
  }));

  // =============================================================================
  // SOCIAL FEATURES (FOLLOWING, FEED, POSTS)
  // =============================================================================

  // Welcome Message
  app.post("/api/welcome-message", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Welcome message is required" });
    }

    const updatedUser = await storage.updateUser(userId, {
      welcomeMessage: message,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  }));

  // Live Feed routes
  app.get("/api/feed", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const filter = req.query.filter as string;

    let posts;
    if (filter === "following") {
      posts = await storage.getFeedPosts(userId, true);
    } else {
      posts = await storage.getFeedPosts(userId, false);
    }
    res.json(posts);
  }));

  // Get following users
  app.get("/api/following", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const following = await storage.getFollowing(userId);
    const sanitizedFollowing = following.map(({ password, ...rest }) => rest);
    res.json(sanitizedFollowing);
  }));

  // Get suggested users
  app.get("/api/suggested-users", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const suggested = await storage.getSuggestedUsers(userId);
    res.json(suggested);
  }));

  // Social Posts
  app.get("/api/social-posts", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const posts = await storage.getSocialPosts(userId);
    res.json(posts);
  }));

  app.post("/api/social-posts", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const postData = insertSocialPostSchema.parse(req.body);

    // Add current timestamp if not provided
    if (!postData.postedAt) {
      postData.postedAt = new Date();
    }

    const newPost = await storage.addSocialPost(userId, postData);
    res.status(201).json(newPost);
  }));

  // Follow System
  app.post("/api/follow", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const { followingId } = req.body;

    if (!followingId || followingId === userId) {
      return res.status(400).json({ message: "Invalid follow request" });
    }

    const follow = await storage.followUser(userId, followingId);
    res.status(201).json(follow);
  }));

  app.post("/api/follow/:username", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const followerId = req.user.id;
    const { username } = req.params;

    const userToFollow = await storage.getUserByUsername(username);
    if (!userToFollow) {
      return res.status(404).json({ message: "User not found" });
    }

    // Don't allow following yourself
    if (userToFollow.id === followerId) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    const follow = await storage.followUser(followerId, userToFollow.id);
    res.status(201).json(follow);
  }));

  app.delete("/api/follow/:username", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const followerId = req.user.id;
    const { username } = req.params;

    const userToUnfollow = await storage.getUserByUsername(username);
    if (!userToUnfollow) {
      return res.status(404).json({ message: "User not found" });
    }

    const success = await storage.unfollowUser(followerId, userToUnfollow.id);
    if (success) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: "Not following this user" });
    }
  }));

  app.get("/api/followers", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const followers = await storage.getFollowers(userId);
    const sanitizedFollowers = followers.map(({ password, ...rest }) => rest);
    res.json(sanitizedFollowers);
  }));

  // =============================================================================
  // PASSWORD AND SECURITY ROUTES
  // =============================================================================

  // Change password endpoint
  app.post("/api/change-password", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Use storage layer to verify current password
    const isCurrentPasswordCorrect = await storage.comparePasswords(currentPassword, user.password);

    if (!isCurrentPasswordCorrect) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Update password using storage layer
    const updatedUser = await storage.updateUser(userId, { password: newPassword });

    if (!updatedUser) {
      return res.status(500).json({ message: "Failed to update password" });
    }

    res.json({ message: "Password changed successfully" });
  }));

  // =============================================================================
  // SKILLS MANAGEMENT
  // =============================================================================

  app.post("/api/add-skill", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const { skill, level = 3 } = req.body;

    if (!skill) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Use storage method if available, otherwise fallback to direct query
    if (typeof storage.addUserSkill === 'function') {
      const newSkill = await storage.addUserSkill(userId, skill.trim());
      res.status(201).json(newSkill);
    } else {
      // Fallback to direct database query
      const result = await pool.query(
        "INSERT INTO user_skills (user_id, skill, level) VALUES ($1, $2, $3) ON CONFLICT (user_id, skill) DO UPDATE SET level = $3 RETURNING *",
        [userId, skill.trim(), level],
      );
      res.status(201).json(result.rows[0]);
    }
  }));

  app.put("/api/add-skill", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const { id: skillId, skill, level = 3 } = req.body;

    if (!skillId || !skill) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (typeof storage.updateUserSkill === 'function') {
      const updatedSkill = await storage.updateUserSkill(skillId, { skill: skill.trim() });
      if (!updatedSkill) {
        return res.status(404).json({ message: "Skill not found or you don't have permission to update it" });
      }
      res.json(updatedSkill);
    } else {
      // Fallback to direct database query
      const result = await pool.query(
        "UPDATE user_skills SET skill = $1, level = $2 WHERE id = $3 AND user_id = $4 RETURNING *",
        [skill.trim(), level, skillId, userId],
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Skill not found or you don't have permission to update it" });
      }
      res.json(result.rows[0]);
    }
  }));

  app.delete("/api/add-skill", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const { id: skillId } = req.body;

    if (!skillId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const result = await storage.deleteUserSkill(skillId);

    if (!result) {
      return res.status(404).json({ message: "Skill not found or you don't have permission to delete it" });
    }

    res.json({ message: "Skill deleted successfully", id: skillId });
  }));

  // =============================================================================
  // CONTENT PREVIEW ROUTES
  // =============================================================================

  // Universal content preview endpoint for all platforms
  app.get("/api/content-preview/:platform", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const { platform } = req.params;

    let accessToken: string | null = null;

    // Handle Instagram separately (uses environment token)
    if (platform === "instagram") {
      accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || null;
    } else {
      // For other platforms, get connection from database
      const connection = await storage.getSocialConnection(userId, platform);

      if (!connection) {
        return res.json({
          connected: false,
          platform,
          message: `${platform.charAt(0).toUpperCase() + platform.slice(1)} account not connected. Please connect your account first.`,
        });
      }

      accessToken = connection.accessToken;
    }

    if (!accessToken) {
      return res.json({
        connected: false,
        platform,
        message: `${platform.charAt(0).toUpperCase() + platform.slice(1)} account not connected. Please connect your account first.`,
      });
    }

    const { createContentAPI } = await import("./content-preview-api");
    const contentAPI = createContentAPI(platform, accessToken);

    // Validate token first
    const isValidToken = await contentAPI.validateToken();

    if (!isValidToken) {
      return res.json({
        connected: false,
        platform,
        message: `${platform.charAt(0).toUpperCase() + platform.slice(1)} access token has expired. Please reconnect your account.`,
        tokenExpired: true,
      });
    }

    const [userProfile, latestPost] = await Promise.all([
      contentAPI.getUserProfile(),
      contentAPI.getLatestPost(),
    ]);

    // Handle Instagram separately since it doesn't use database connections
    if (platform === "instagram") {
      res.json({
        connected: true,
        platform,
        profile: userProfile,
        latestPost: latestPost,
        lastSync: new Date().toISOString(),
        connectionInfo: {
          connectedAt: new Date().toISOString(),
          platformUsername: userProfile.username,
        },
      });
    } else {
      const connection = await storage.getSocialConnection(userId, platform);
      res.json({
        connected: true,
        platform,
        profile: userProfile,
        latestPost: latestPost,
        lastSync: connection?.lastSyncAt || new Date().toISOString(),
        connectionInfo: {
          connectedAt: connection?.connectedAt,
          platformUsername: connection?.platformUsername,
        },
      });
    }
  }));

  // Instagram preview endpoint
  app.get("/api/instagram/preview", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

    if (!accessToken) {
      return res.status(401).json({
        error: "Instagram access token not configured",
        connected: false,
      });
    }

    const instagram = new InstagramAPI(accessToken);

    // Get user profile and latest post
    const [profile, latestPost] = await Promise.all([
      instagram.getUserProfile(),
      instagram.getLatestPost(),
    ]);

    res.json({
      profile,
      latestPost,
      connected: true,
    });
  }));

  app.post("/api/instagram/sync", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;

    // Simplified sync for demo
    const success = false; // Placeholder

    if (success) {
      const preview = await storage.getInstagramPreview(userId);
      res.json({ success: true, preview });
    } else {
      res.status(400).json({
        message: "Failed to sync Instagram content. Make sure your Instagram account is connected.",
      });
    }
  }));

  app.patch("/api/instagram/preview/toggle", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const { enabled } = req.body;

    const preview = await storage.toggleInstagramPreview(userId, enabled === true);

    if (!preview) {
      return res.status(404).json({ message: "Instagram preview not found" });
    }

    res.json(preview);
  }));

  app.delete("/api/instagram/preview", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const success = await storage.deleteInstagramPreview(userId);
    res.json({ success });
  }));

  // =============================================================================
  // NOTIFICATIONS AND REQUESTS
  // =============================================================================

  // Notifications API
  app.get("/api/notifications", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const notifications = await storage.getNotifications(userId);
    res.json(notifications);
  }));

  app.patch("/api/notifications/:id/read", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const notificationId = validateId(req.params.id);
    const userId = req.user.id;

    await storage.markNotificationAsRead(notificationId, userId);
    res.json({ success: true });
  }));

  app.delete("/api/notifications/:id", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const notificationId = req.params.id;
    const userId = req.user.id;

    await storage.deleteNotification(notificationId, userId);
    res.json({ success: true });
  }));

  // Referral request endpoints
  app.post("/api/referral-request", asyncHandler(async (req: any, res: any) => {
    const { targetUserId, ...requestData } = req.body;

    if (!targetUserId || !requestData.name || !requestData.email) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if target user exists
    const targetUser = await storage.getUser(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "Target user not found" });
    }

    // Create the referral request
    const referralRequest = await storage.createReferralRequest({
      targetUserId,
      ...requestData,
      status: "pending",
    });

    res.json(referralRequest);
  }));

  app.get("/api/referral-requests", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const requests = await storage.getReferralRequests(userId);
    res.json(requests);
  }));

  app.get("/api/referral-requests/count", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const count = await storage.getPendingReferralRequestsCount(userId);
    res.json({ count });
  }));

  app.patch("/api/referral-requests/:id", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const requestId = validateId(req.params.id);

    const request = await storage.getReferralRequestById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Referral request not found" });
    }

    // Check if user is authorized to update this request
    if (request.targetUserId !== userId) {
      return res.status(403).json({ message: "Not authorized to update this request" });
    }

    const updatedRequest = await storage.updateReferralRequest(requestId, req.body);
    res.json(updatedRequest);
  }));

  app.delete("/api/referral-requests/:id", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const requestId = validateId(req.params.id);

    const request = await storage.getReferralRequestById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Referral request not found" });
    }

    if (request.targetUserId !== userId) {
      return res.status(403).json({ message: "Not authorized to delete this request" });
    }

    const deleted = await storage.deleteReferralRequest(requestId);
    if (deleted) {
      res.json({ message: "Referral request deleted successfully" });
    } else {
      res.status(500).json({ message: "Failed to delete referral request" });
    }
  }));

  app.patch("/api/referral-requests/:id/status", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const requestId = validateId(req.params.id);
    const { status } = req.body;

    // First, verify that this request belongs to the authenticated user
    const request = await storage.getReferralRequestById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Referral request not found" });
    }

    if (request.targetUserId !== userId) {
      return res.status(403).json({ message: "Not authorized to update this request" });
    }

    await storage.updateReferralRequestStatus(requestId, status);
    res.json({ success: true });
  }));

  // Visitor endpoints for requests
  app.post("/api/referral-requests", asyncHandler(async (req: any, res: any) => {
    const {
      requesterName,
      requesterEmail,
      requesterPhone,
      requesterWebsite,
      fieldOfWork,
      description,
      linkTitle,
      linkUrl,
      targetUserId,
    } = req.body;

    // Validate required fields
    if (!requesterName || !requesterEmail || !fieldOfWork || !description || 
        !linkTitle || !linkUrl || !targetUserId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check for duplicate requests within 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const existingRequest = await db.query.referralRequests.findFirst({
      where: and(
        eq(referralRequests.requesterEmail, requesterEmail),
        eq(referralRequests.targetUserId, targetUserId),
        eq(referralRequests.linkUrl, linkUrl),
        gt(referralRequests.createdAt, tenMinutesAgo),
      ),
    });

    if (existingRequest) {
      return res.status(429).json({
        message: "You have already submitted a similar request recently. Please wait 10 minutes before submitting again.",
      });
    }

    // Create the referral request in the database
    const referralRequest = await storage.createReferralRequest({
      targetUserId,
      requesterName,
      requesterEmail,
      requesterPhone,
      requesterWebsite,
      fieldOfWork,
      description,
      linkTitle,
      linkUrl,
    });

    res.status(201).json({
      message: "Referral request sent successfully",
      id: referralRequest.id,
    });
  }));

  // =============================================================================
  // USER REPORTS
  // =============================================================================

  app.post("/api/user-reports", asyncHandler(async (req: any, res: any) => {
    const { insertUserReportSchema } = await import("../shared/schema");
    const validation = insertUserReportSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid report data",
        errors: validation.error.errors,
      });
    }

    // Check for duplicate reports (same reporter email + reported user within last 24 hours)
    const existingReports = await storage.getReportsByUser(validation.data.reportedUserId);
    const recentReport = existingReports.find(
      (report) =>
        report.reporterEmail === validation.data.reporterEmail &&
        report.createdAt &&
        new Date().getTime() - new Date(report.createdAt).getTime() < 24 * 60 * 60 * 1000,
    );

    if (recentReport) {
      return res.status(429).json({
        message: "You have already reported this user within the last 24 hours. Please contact support if this is urgent.",
      });
    }

    const report = await storage.createUserReport(validation.data);

    res.json({
      message: "Report submitted successfully",
      reportId: report.id,
    });
  }));

  // =============================================================================
  // ADMIN ROUTES
  // =============================================================================

  app.get("/api/admin/users", asyncHandler(async (req: any, res: any) => {
    const users = await storage.getAllUsers();
    res.json(users);
  }));

  app.get("/api/admin/analytics", asyncHandler(async (req: any, res: any) => {
    const totalUsers = await storage.getAllUsers();
    const totalProfileViews = await storage.getTotalProfileViews();
    const allLinks = await storage.getAllLinks();
    const totalLinkClicks = allLinks.reduce((sum, link) => sum + (link.clicks || 0), 0);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newUsersThisWeek = totalUsers.filter(
      (user) => user.createdAt && new Date(user.createdAt) > oneWeekAgo,
    ).length;

    const analytics = {
      totalUsers: totalUsers.length,
      newUsersThisWeek,
      activeUsers: totalUsers.length,
      totalProfileViews,
      totalLinkClicks,
    };

    res.json(analytics);
  }));

  app.patch("/api/admin/users/:userId/promote", asyncHandler(async (req: any, res: any) => {
    const userId = validateId(req.params.userId);
    const updatedUser = await storage.updateUser(userId, { isAdmin: true });
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(updatedUser);
  }));

  app.patch("/api/admin/users/:userId/deactivate", asyncHandler(async (req: any, res: any) => {
    const userId = validateId(req.params.userId);
    const updatedUser = await storage.updateUser(userId, { isAdmin: false });
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(updatedUser);
  }));

  app.get("/api/admin/user-reports", asyncHandler(async (req: any, res: any) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const reports = await storage.getUserReports();
    res.json(reports);
  }));

  app.put("/api/admin/user-reports/:id", asyncHandler(async (req: any, res: any) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const reportId = validateId(req.params.id);
    const { status, adminNotes } = req.body;

    if (!["pending", "resolved", "dismissed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updatedReport = await storage.updateUserReport(reportId, {
      status,
      adminNotes,
      reviewedBy: req.user.id,
    });

    if (!updatedReport) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json(updatedReport);
  }));

  // =============================================================================
  // OAUTH CONFIGURATION AND DEBUG ROUTES
  // =============================================================================

  app.get("/api/oauth/status", getOAuthStatus);

  app.get("/api/debug/facebook-app", asyncHandler(async (req: any, res: any) => {
    const appId = process.env.FACEBOOK_CLIENT_ID;
    const appSecret = process.env.FACEBOOK_CLIENT_SECRET;

    if (!appId || !appSecret) {
      return res.status(500).json({
        error: "Facebook credentials not configured",
        hasAppId: !!appId,
        hasAppSecret: !!appSecret,
      });
    }

    // Get app access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&grant_type=client_credentials`,
    );
    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return res.status(500).json({
        error: "Failed to get app access token",
        response: tokenData,
      });
    }

    // Get app details
    const appResponse = await fetch(
      `https://graph.facebook.com/${appId}?fields=name,category,link,restrictions,login_secret&access_token=${tokenData.access_token}`,
    );
    const appData = await appResponse.json();

    res.json({
      appId,
      appData,
      tokenValid: !!tokenData.access_token,
      currentDomain: req.get("host"),
      redirectUri: `${req.protocol}://${req.get("host")}/api/auth/facebook/callback`,
      timestamp: new Date().toISOString(),
    });
  }));

  // OAuth setup guide
  app.get("/oauth-setup", asyncHandler(async (req: any, res: any) => {
    const baseUrl = process.env.BASE_URL || "http://localhost:5000/";
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>OAuth Configuration Guide</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 900px; margin: 20px auto; padding: 20px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 40px; }
        .platform { background: #f8f9fa; border: 1px solid #ddd; margin: 20px 0; padding: 25px; border-radius: 8px; }
        .platform h3 { margin-top: 0; color: #333; }
        .redirect-uri { background: #e3f2fd; padding: 15px; border-radius: 5px; font-family: monospace; word-break: break-all; margin: 10px 0; }
        .steps { background: #fff; border-left: 4px solid #007bff; padding: 15px; margin: 15px 0; }
        .steps ol { margin: 0; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .btn { background: #007bff; color: white; padding: 12px 24px; border: none; border-radius: 5px; text-decoration: none; display: inline-block; margin: 10px 0; }
        .status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .status.good { background: #d4edda; color: #155724; }
        .status.bad { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="header">
        <h1>OAuth Platform Configuration</h1>
        <p>Configure your social media apps to work with MyLinked</p>
    </div>

    <div class="warning">
        <h4>Important: Your Current Base URL</h4>
        <div class="redirect-uri">${baseUrl}</div>
        <p>All redirect URIs below use this base URL. If you deploy to a different domain, you'll need to update the redirect URIs in each platform's developer console.</p>
    </div>

    <div class="platform">
        <h3>Facebook Login 
            <span class="status ${process.env.FACEBOOK_CLIENT_ID ? "good" : "bad"}">
                ${process.env.FACEBOOK_CLIENT_ID ? "✓ Configured" : "✗ Missing Credentials"}
            </span>
        </h3>
        <div class="redirect-uri">${baseUrl}api/auth/facebook/callback</div>
        <div class="steps">
            <h4>Setup Steps:</h4>
            <ol>
                <li>Go to <a href="https://developers.facebook.com/apps/" target="_blank">Facebook Developers Console</a></li>
                <li>Create a new app or select existing app</li>
                <li>Add "Facebook Login" product</li>
                <li>Go to Facebook Login > Settings</li>
                <li>Add the redirect URI above to "Valid OAuth Redirect URIs"</li>
                <li>Copy App ID and App Secret to your environment variables</li>
            </ol>
        </div>
    </div>

    <div class="platform">
        <h3>Twitter API v2 
            <span class="status ${process.env.TWITTER_CLIENT_ID ? "good" : "bad"}">
                ${process.env.TWITTER_CLIENT_ID ? "✓ Configured" : "✗ Missing Credentials"}
            </span>
        </h3>
        <div class="redirect-uri">${baseUrl}api/auth/twitter/callback</div>
        <div class="steps">
            <h4>Setup Steps:</h4>
            <ol>
                <li>Go to <a href="https://developer.twitter.com/en/portal/dashboard" target="_blank">Twitter Developer Portal</a></li>
                <li>Create a project and app</li>
                <li>Go to your app settings</li>
                <li>Enable OAuth 2.0</li>
                <li>Set the callback URI above</li>
                <li>Copy Client ID and Client Secret to your environment variables</li>
            </ol>
        </div>
    </div>

    <div class="success">
        <h4>Environment Variables Required:</h4>
        <pre>
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
        </pre>
    </div>

    <div style="text-align: center; margin: 40px 0;">
        <a href="/" class="btn">Back to Dashboard</a>
        <a href="/test-oauth" class="btn">Test OAuth Flows</a>
    </div>
</body>
</html>
    `);
  }));

  // Test pages
  app.get("/test-page", (req: any, res: any) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>MyLinked Test Page</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; }
            h1 { color: #4a89dc; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>MyLinked Test Page</h1>
            <p>If you can see this page, the server is working correctly.</p>
          </div>
        </body>
      </html>
    `);
  });

  // Test route
  app.get("/api/healthcheck", (req: any, res: any) => {
    res.json({ status: "ok", message: "Application is running correctly" });
  });

  // =============================================================================
  // MOUNT EXTERNAL ROUTERS
  // =============================================================================

  // Mount spotlight project routes
  app.use("/api/spotlight", spotlightRouter);

  // Mount industry discovery routes
  app.use("/api", industryRouter);

  // Mount referral links routes
  app.use("/api", referralRouter);

  // Mount social media OAuth routes
  app.use("/api/social", socialOAuthRouter);

  // Add Twitter OAuth routes
  app.use("/api/twitter", twitterOAuthRouter);
  app.use("/api/twitter", twitterDebugRouter);

  // OAuth setup router
  app.use("/api/oauth", oauthSetupRouter);

  // Facebook compliance endpoints
  app.use("/api/social", facebookComplianceRouter);

  // Add AI Support routes
  app.use("/api/ai-support", aiSupportRouter);

  // Add Admin routes
  app.use("/api/admin-legacy", adminRouter);
  app.use("/api/admin", professionalAdminRouter);

  // Add Monitoring routes
  app.use("/api/monitoring", monitoringRouter);

  // Add Security routes
  app.use("/api/security", securityRouter);

  // Add Email routes
  app.use("/api/email", emailRouter);
  app.use("/api/support", supportRouter);

  // =============================================================================
  // COLLABORATION REQUESTS ROUTES
  // =============================================================================

  // POST /api/collaboration-requests - Create a new collaboration request
  app.post("/api/collaboration-requests", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    try {
      const validatedData = insertCollaborationRequestSchema.parse({
        ...req.body,
        senderId: req.user.id
      });

      // Check if users exist
      const sender = await storage.getUser(validatedData.senderId);
      const receiver = await storage.getUser(validatedData.receiverId);

      if (!sender || !receiver) {
        return res.status(404).json({ error: "User not found" });
      }

      // Prevent sending request to self
      if (validatedData.senderId === validatedData.receiverId) {
        return res.status(400).json({ error: "Cannot send collaboration request to yourself" });
      }

      const newRequest = await storage.createCollaborationRequest(validatedData);
      res.status(201).json({ success: true, request: newRequest });
    } catch (error) {
      console.error("Error creating collaboration request:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create collaboration request" });
    }
  }));

  // GET /api/collaboration-requests/received - Get all requests where current user is receiver
  app.get("/api/collaboration-requests/received", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    try {
      const requests = await storage.getCollaborationRequestsReceived(req.user.id);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching collaboration requests:", error);
      res.status(500).json({ error: "Failed to fetch collaboration requests" });
    }
  }));

  // PATCH /api/collaboration-requests/:id - Update request status (accept/reject)
  app.patch("/api/collaboration-requests/:id", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    try {
      const requestId = validateId(req.params.id);
      const validatedData = updateCollaborationRequestSchema.parse(req.body);

      // Get the request to verify user is the receiver
      const request = await storage.getCollaborationRequestById(requestId);
      if (!request) {
        return res.status(404).json({ error: "Collaboration request not found" });
      }

      // Only the receiver can update the request status
      if (request.receiverId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to update this request" });
      }

      // Only allow updating status to accepted or rejected
      if (validatedData.status && !["accepted", "rejected"].includes(validatedData.status)) {
        return res.status(400).json({ error: "Status must be 'accepted' or 'rejected'" });
      }

      const updatedRequest = await storage.updateCollaborationRequest(requestId, validatedData);
      res.json({ success: true, request: updatedRequest });
    } catch (error) {
      console.error("Error updating collaboration request:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update collaboration request" });
    }
  }));

  // =============================================================================
  // WEBSOCKET SETUP
  // =============================================================================

  // Create HTTP server
  const httpServer = createServer(app);

  // Set up WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");

    // Send initial message
    ws.send(
      JSON.stringify({
        type: "connected",
        message: "Connected to WebSocket server",
      }),
    );

    // Handle incoming messages
    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString());

        // Handle authentication
        if (data.type === "auth" && data.sessionId) {
          ws.send(JSON.stringify({ type: "auth_success" }));
        }

        // Handle profile view for real-time analytics
        if (data.type === "profile_view" && data.username) {
          const user = await storage.getUserByUsername(data.username);
          if (user) {
            await storage.recordProfileView(user.id);

            // Broadcast to all clients
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(
                  JSON.stringify({
                    type: "profile_view_update",
                    username: data.username,
                  }),
                );
              }
            });
          }
        }

        // Handle link click for real-time analytics
        if (data.type === "link_click" && data.linkId) {
          const linkId = Number(data.linkId);
          if (!isNaN(linkId)) {
            const link = await storage.getLinkById(linkId);

            if (link) {
              await storage.incrementLinkClicks(linkId);
              await storage.incrementLinkViews(linkId);

              // Broadcast to all clients
              wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(
                    JSON.stringify({
                      type: "link_click_update",
                      linkId: data.linkId,
                    }),
                  );
                }
              });
            }
          }
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    });

    // Handle disconnection
    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });

    // Handle errors
    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  // Cleanup function for WebSocket connections
  const cleanupConnections = () => {
    wss.clients.forEach((client) => {
      if (client.readyState !== WebSocket.OPEN) {
        client.terminate();
      }
    });
  };

  // Run cleanup every 30 seconds
  setInterval(cleanupConnections, 30000);

  // =============================================================================
  // FALLBACK ANALYTICS HELPER FUNCTION
  // =============================================================================

  function generateFallbackAnalyticsInsights(user: any, links: any[], stats: any) {
    const totalClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0);
    const totalViews = stats.profileViews || 0;
    const linkCount = links.length;
    const platformCounts = links.reduce((acc: Record<string, number>, link) => {
      acc[link.platform] = (acc[link.platform] || 0) + 1;
      return acc;
    }, {});

    // Performance Insights based on actual data
    const performanceInsights = [];
    if (totalClicks > 0) {
      const topLink = links.reduce(
        (max, link) => ((link.clicks || 0) > (max.clicks || 0) ? link : max),
        links[0],
      );
      performanceInsights.push(
        `Your "${topLink.title}" link is your top performer with ${topLink.clicks || 0} clicks.`,
      );
    }
    if (totalViews > 100) {
      performanceInsights.push(
        `Your profile has received ${totalViews} views, showing strong visibility.`,
      );
    } else {
      performanceInsights.push(
        `Your profile needs more visibility. Consider sharing your profile link more frequently.`,
      );
    }
    performanceInsights.push(
      `You have ${linkCount} active links. The optimal range is 5-8 links for better engagement.`,
    );

    // Audience Insights
    const audienceInsights = [
      "Most profile visits occur during weekday evenings (6-9 PM).",
      totalViews > 50
        ? "Your audience shows consistent engagement patterns."
        : "Building audience engagement requires regular content updates.",
      "Mobile users account for approximately 70% of profile visits.",
    ];

    // Growth Opportunities
    const growthOpportunities = [];
    if (linkCount < 5) {
      growthOpportunities.push(
        "Add more social platform links to increase discovery opportunities.",
      );
    }
    if (!user.bio || user.bio.length < 50) {
      growthOpportunities.push(
        "Enhance your bio with more descriptive content to improve engagement.",
      );
    }
    growthOpportunities.push(
      "Regular profile updates can increase visitor retention by up to 40%.",
    );
    growthOpportunities.push(
      "Consider using featured links to highlight your most important content.",
    );

    // Content Recommendations
    const contentRecommendations = [
      "Update your profile image to a high-quality, professional photo.",
      "Use action-oriented language in your link titles to increase click-through rates.",
      "Add descriptions to your links to provide context for visitors.",
      "Consider grouping similar links together for better organization.",
    ];

    // Platform-specific tips based on user's actual platforms
    const platformSpecificTips: Record<string, string[]> = {};
    Object.keys(platformCounts).forEach((platform) => {
      switch (platform.toLowerCase()) {
        case "linkedin":
          platformSpecificTips[platform] = [
            "Share professional achievements and industry insights.",
            "Post consistently 2-3 times per week for optimal engagement.",
          ];
          break;
        case "instagram":
          platformSpecificTips[platform] = [
            "Use high-quality visuals and relevant hashtags.",
            "Post Stories regularly to maintain audience engagement.",
          ];
          break;
        case "twitter":
          platformSpecificTips[platform] = [
            "Engage with trending topics in your industry.",
            "Share quick tips and insights in thread format.",
          ];
          break;
        case "youtube":
          platformSpecificTips[platform] = [
            "Create compelling thumbnails for higher click-through rates.",
            "Maintain consistent upload schedules for subscriber growth.",
          ];
          break;
        default:
          platformSpecificTips[platform] = [
            "Keep your content fresh and regularly updated.",
            "Engage authentically with your audience for better results.",
          ];
      }
    });

    return {
      performanceInsights: performanceInsights.slice(0, 4),
      audienceInsights: audienceInsights.slice(0, 3),
      growthOpportunities: growthOpportunities.slice(0, 4),
      contentRecommendations: contentRecommendations.slice(0, 4),
      platformSpecificTips,
    };
  }

  // =============================================================================
  // ERROR HANDLING MIDDLEWARE
  // =============================================================================

  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Global error handler:", err);

    // Handle Zod validation errors
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: err.errors,
      });
    }

    // Handle specific error types
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid input data",
        details: err.message,
      });
    }

    if (err.name === "UnauthorizedError") {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // Default error response
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || "Internal server error";

    res.status(statusCode).json({
      message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  });

  // Handle 404 for API routes
  app.use("/api/*", (req: any, res: any) => {
    res.status(404).json({ message: "API endpoint not found" });
  });

  console.log("✅ Routes registered successfully");
  console.log("🚀 Server ready to handle requests");

  return httpServer;
}