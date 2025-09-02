import { Router } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./auth";
import { Request, Response, NextFunction } from "express";
import { db, isDbAvailable, setDbEnabled } from "./db";
import { users, featureToggles, systemLogs, socialConnections, links, profileViews } from "../shared/schema";
import { eq, desc, count, sql, and, gte, isNotNull } from "drizzle-orm";

export const adminRouter = Router();

// Admin middleware - check if user is admin
function isAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || (!user.isAdmin && user.role !== 'admin')) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

// Apply authentication and admin check to all admin routes
adminRouter.use(isAuthenticated);
adminRouter.use(isAdmin);

// Get all users with basic stats
adminRouter.get("/users", async (req: Request, res: Response) => {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        name: users.name,
        email: users.email,
        bio: users.bio,
        location: users.location,
        isAdmin: users.isAdmin,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        isCollaborative: users.isCollaborative
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    // Get connection counts for each user
    const userStats = await Promise.all(
      allUsers.map(async (user) => {
        const [connectionsResult, linksResult] = await Promise.all([
          db.select({ count: count() }).from(socialConnections).where(eq(socialConnections.userId, user.id)),
          db.select({ count: count() }).from(links).where(eq(links.userId, user.id))
        ]);

        return {
          ...user,
          connectionsCount: connectionsResult[0]?.count || 0,
          linksCount: linksResult[0]?.count || 0
        };
      })
    );

    res.json({ users: userStats });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Get analytics data
adminRouter.get("/analytics", async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Total users
    const [totalUsersResult] = await db.select({ count: count() }).from(users);
    
    // New users this week
    const [newUsersResult] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, oneWeekAgo));

    // Active users (users with login in last 7 days)
    const [activeUsersResult] = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          isNotNull(users.lastLoginAt),
          gte(users.lastLoginAt, oneWeekAgo)
        )
      );

    // Total profile visits
    const [profileVisitsResult] = await db.select({ count: count() }).from(profileViews);

    // Total link clicks
    const linkClicksResult = await db
      .select({ 
        totalClicks: sql<number>`sum(${links.clicks})` 
      })
      .from(links);

    res.json({
      totalUsers: totalUsersResult.count,
      newUsersThisWeek: newUsersResult.count,
      activeUsers: activeUsersResult.count,
      totalProfileVisits: profileVisitsResult.count,
      totalLinkClicks: linkClicksResult[0]?.totalClicks || 0
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
});

// Get feature toggles
adminRouter.get("/features", async (req: Request, res: Response) => {
  try {
    const features = await db
      .select()
      .from(featureToggles)
      .orderBy(featureToggles.featureName);

    res.json(features);
  } catch (error) {
    console.error("Error fetching features:", error);
    res.status(500).json({ message: "Failed to fetch features" });
  }
});

// Update feature toggle
adminRouter.patch("/features/:featureName", async (req: Request, res: Response) => {
  try {
    const { featureName } = req.params;
    const { isEnabled } = req.body;
    const userId = (req as any).user.id;

    await db
      .update(featureToggles)
      .set({ 
        isEnabled, 
        updatedBy: userId, 
        updatedAt: new Date() 
      })
      .where(eq(featureToggles.featureName, featureName));

    // Log the change
    await db.insert(systemLogs).values({
      level: 'info',
      message: `Feature toggle ${featureName} ${isEnabled ? 'enabled' : 'disabled'}`,
      source: 'admin',
      userId: userId
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating feature:", error);
    res.status(500).json({ message: "Failed to update feature" });
  }
});

// Get social media API status
adminRouter.get("/social-status", async (req: Request, res: Response) => {
  try {
    // Get connection counts by platform
    const platformStats = await db
      .select({
        platform: socialConnections.platform,
        count: count(),
        lastConnected: sql<Date>`max(${socialConnections.connectedAt})`
      })
      .from(socialConnections)
      .groupBy(socialConnections.platform);

    const platforms = [
      { name: 'Instagram', key: 'instagram' },
      { name: 'Facebook', key: 'facebook' },
      { name: 'Twitter', key: 'twitter' },
      { name: 'TikTok', key: 'tiktok' }
    ];

    const platformsWithStatus = platforms.map(platform => {
      const stats = platformStats.find(p => p.platform === platform.key);
      return {
        name: platform.name,
        status: stats ? 'connected' : 'disconnected',
        connectedUsers: stats?.count || 0,
        lastChecked: stats?.lastConnected || null
      };
    });

    res.json({ platforms: platformsWithStatus });
  } catch (error) {
    console.error("Error fetching social status:", error);
    res.status(500).json({ message: "Failed to fetch social status" });
  }
});

// Get recent system logs
adminRouter.get("/logs", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    
    const logs = await db
      .select()
      .from(systemLogs)
      .orderBy(desc(systemLogs.createdAt))
      .limit(limit);

    res.json({ logs });
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ message: "Failed to fetch logs" });
  }
});

// Deactivate user
adminRouter.patch("/users/:userId/deactivate", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const adminUserId = (req as any).user.id;

    // Don't allow deactivating other admins
    const [targetUser] = await db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, parseInt(userId)));

    if (targetUser?.isAdmin) {
      return res.status(400).json({ message: "Cannot deactivate admin users" });
    }

    await db
      .update(users)
      .set({ isActive: false })
      .where(eq(users.id, parseInt(userId)));

    // Log the action
    await db.insert(systemLogs).values({
      level: 'warning',
      message: `User ${userId} deactivated by admin`,
      source: 'admin',
      userId: adminUserId,
      metadata: { targetUserId: parseInt(userId) }
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deactivating user:", error);
    res.status(500).json({ message: "Failed to deactivate user" });
  }
});

// Test social media API connection
adminRouter.post("/test-social/:platform", async (req: Request, res: Response) => {
  try {
    const { platform } = req.params;
    const adminUserId = (req as any).user.id;

    // Basic test - check if we have valid credentials
    const hasCredentials = {
      instagram: !!process.env.INSTAGRAM_CLIENT_ID && !!process.env.INSTAGRAM_CLIENT_SECRET,
      facebook: !!process.env.FACEBOOK_CLIENT_ID && !!process.env.FACEBOOK_CLIENT_SECRET,
      twitter: !!process.env.TWITTER_CLIENT_ID && !!process.env.TWITTER_CLIENT_SECRET,
      tiktok: !!process.env.TIKTOK_CLIENT_ID && !!process.env.TIKTOK_CLIENT_SECRET
    };

    const isConfigured = hasCredentials[platform as keyof typeof hasCredentials] || false;

    // Log the test
    await db.insert(systemLogs).values({
      level: 'info',
      message: `Admin tested ${platform} API connection - ${isConfigured ? 'configured' : 'not configured'}`,
      source: 'admin',
      userId: adminUserId,
      metadata: { platform, configured: isConfigured }
    });

    res.json({ 
      platform, 
      configured: isConfigured,
      status: isConfigured ? 'ready' : 'missing_credentials'
    });
  } catch (error) {
    console.error("Error testing social API:", error);
    res.status(500).json({ message: "Failed to test social API" });
  }
});

// Create system log (for testing)
adminRouter.post("/logs", async (req: Request, res: Response) => {
  try {
    const { level, message, source } = req.body;
    const adminUserId = (req as any).user.id;

    await db.insert(systemLogs).values({
      level,
      message,
      source: source || 'admin',
      userId: adminUserId
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error creating log:", error);
    res.status(500).json({ message: "Failed to create log" });
  }
});

// Promote user to admin
adminRouter.patch("/users/:userId/promote", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const adminUserId = (req as any).user.id;

    await db
      .update(users)
      .set({ isAdmin: true })
      .where(eq(users.id, parseInt(userId)));

    // Log the action
    await db.insert(systemLogs).values({
      level: 'warning',
      message: `User ${userId} promoted to admin`,
      source: 'admin',
      userId: adminUserId,
      metadata: { targetUserId: parseInt(userId), action: 'promote' }
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error promoting user:", error);
    res.status(500).json({ message: "Failed to promote user" });
  }
});

// Reactivate user
adminRouter.patch("/users/:userId/reactivate", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const adminUserId = (req as any).user.id;

    await db
      .update(users)
      .set({ isActive: true })
      .where(eq(users.id, parseInt(userId)));

    // Log the action
    await db.insert(systemLogs).values({
      level: 'info',
      message: `User ${userId} reactivated by admin`,
      source: 'admin',
      userId: adminUserId,
      metadata: { targetUserId: parseInt(userId), action: 'reactivate' }
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error reactivating user:", error);
    res.status(500).json({ message: "Failed to reactivate user" });
  }
});

// Get detailed user info
adminRouter.get("/users/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(userId)));

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user's links and connections
    const [userLinks, userConnections, userViews] = await Promise.all([
      db.select({ count: count() }).from(links).where(eq(links.userId, parseInt(userId))),
      db.select({ count: count() }).from(socialConnections).where(eq(socialConnections.userId, parseInt(userId))),
      db.select({ count: count() }).from(profileViews).where(eq(profileViews.userId, parseInt(userId)))
    ]);

    res.json({
      ...user,
      stats: {
        linksCount: userLinks[0]?.count || 0,
        connectionsCount: userConnections[0]?.count || 0,
        profileViews: userViews[0]?.count || 0
      }
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Failed to fetch user details" });
  }
});

// Bulk user actions
adminRouter.post("/users/bulk-action", async (req: Request, res: Response) => {
  try {
    const { userIds, action } = req.body;
    const adminUserId = (req as any).user.id;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "Invalid user IDs" });
    }

    let updateData: any = {};
    let logMessage = '';

    switch (action) {
      case 'deactivate':
        updateData = { isActive: false };
        logMessage = `Bulk deactivated ${userIds.length} users`;
        break;
      case 'reactivate':
        updateData = { isActive: true };
        logMessage = `Bulk reactivated ${userIds.length} users`;
        break;
      default:
        return res.status(400).json({ message: "Invalid action" });
    }

    // Perform bulk update
    await db
      .update(users)
      .set(updateData)
      .where(
        and(
          sql`id = ANY(${userIds})`,
          eq(users.isAdmin, false) // Don't allow bulk actions on admins
        )
      );

    // Log the action
    await db.insert(systemLogs).values({
      level: 'warning',
      message: logMessage,
      source: 'admin',
      userId: adminUserId,
      metadata: { userIds, action }
    });

    res.json({ success: true, affectedUsers: userIds.length });
  } catch (error) {
    console.error("Error performing bulk action:", error);
    res.status(500).json({ message: "Failed to perform bulk action" });
  }
});

// System maintenance endpoint
adminRouter.post("/maintenance", async (req: Request, res: Response) => {
  try {
    const { action } = req.body;
    const adminUserId = (req as any).user.id;

    switch (action) {
      case 'clear_old_logs':
        // Clear logs older than 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        await db
          .delete(systemLogs)
          .where(sql`created_at < ${thirtyDaysAgo}`);
        
        await db.insert(systemLogs).values({
          level: 'info',
          message: 'Old system logs cleared (30+ days)',
          source: 'admin',
          userId: adminUserId
        });
        break;

      case 'cleanup_inactive_sessions':
        // Clean up old sessions (this would be platform-specific)
        await db.insert(systemLogs).values({
          level: 'info',
          message: 'Session cleanup initiated',
          source: 'admin',
          userId: adminUserId
        });
        break;

      default:
        return res.status(400).json({ message: "Invalid maintenance action" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error performing maintenance:", error);
    res.status(500).json({ message: "Failed to perform maintenance" });
  }
});

// Export user data (for compliance)
adminRouter.get("/users/:userId/export", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const adminUserId = (req as any).user.id;

    // Get complete user data
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(userId)));

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user's links, connections, and other data
    const [userLinks, userConnections, userLogs] = await Promise.all([
      db.select().from(links).where(eq(links.userId, parseInt(userId))),
      db.select().from(socialConnections).where(eq(socialConnections.userId, parseInt(userId))),
      db.select().from(systemLogs).where(eq(systemLogs.userId, parseInt(userId))).limit(100)
    ]);

    const exportData = {
      user: {
        ...user,
        password: '[REDACTED]' // Don't export password
      },
      links: userLinks,
      socialConnections: userConnections,
      recentLogs: userLogs,
      exportedAt: new Date().toISOString(),
      exportedBy: adminUserId
    };

    // Log the export
    await db.insert(systemLogs).values({
      level: 'warning',
      message: `User data exported for user ${userId}`,
      source: 'admin',
      userId: adminUserId,
      metadata: { targetUserId: parseInt(userId), action: 'data_export' }
    });

    res.json(exportData);
  } catch (error) {
    console.error("Error exporting user data:", error);
    res.status(500).json({ message: "Failed to export user data" });
  }
});

// Helper function to log system events
export async function logSystemEvent(level: 'info' | 'warning' | 'error', message: string, source: string, userId?: number, metadata?: any) {
  if (!(await isDbAvailable())) {
    return;
  }
  try {
    await db.insert(systemLogs).values({
      level,
      message,
      source,
      userId,
      metadata
    });
  } catch (error) {
    console.error("Failed to log system event:", error);
    if ((error as any)?.message?.includes('endpoint has been disabled')) {
      const err: any = error;
      setDbEnabled(false, err.message, err.code);
    }
  }
}