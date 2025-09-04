import { Router, Request, Response, NextFunction } from "express";
import { eq, count, desc, sql, and, or } from "drizzle-orm";
import { 
  users, 
  roles, 
  permissions, 
  userRoles, 
  employeeProfiles, 
  systemLogs
} from "../shared/schema";
import { db } from "./db";
import { isAuthenticated, comparePasswords } from "./auth";
import { sendEmail } from "./email-service";
import crypto from "crypto";

export const professionalAdminRouter = Router();

// Admin login route
professionalAdminRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    // Find user by username
    const [user] = await db.select().from(users).where(eq(users.username, username));
    
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    const passwordMatch = await comparePasswords(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user is admin (database column is is_admin, but TypeScript interface uses isAdmin)
    const isAdmin = user.isAdmin || (user as any).is_admin;
    if (!isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Log the user in (set session)
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ message: "Login failed" });
      }
      res.json({ 
        message: "Admin login successful",
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          isAdmin: user.isAdmin
        }
      });
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Admin logout route
professionalAdminRouter.post("/logout", (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.json({ message: "Admin logout successful" });
  });
});

// Middleware to check admin privileges
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = req.user as any;
  const role = user?.role;
  if (!user || (!user.isAdmin && role !== 'admin' && role !== 'super_admin')) {
    return res.status(403).json({ message: "Administrator privileges required" });
  }
  next();
}

// Enhanced Users with Roles endpoint
professionalAdminRouter.get("/users-with-roles", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
  try {
    const usersWithRoles = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        profileImage: users.profileImage,
        role: users.role,
        department: users.department,
        position: users.position,
        isAdmin: users.isAdmin,
        isActive: users.isActive,
        status: users.status,
        maxLinks: users.maxLinks,
        dailyClickQuota: users.dailyClickQuota,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    res.json(usersWithRoles);
  } catch (error) {
    console.error("Error fetching users with roles:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Update user details
professionalAdminRouter.put("/users/:id", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, department, isActive } = req.body;

    const updates: any = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (department !== undefined) updates.department = department;
    if (isActive !== undefined) updates.isActive = isActive;

    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        profileImage: users.profileImage,
        role: users.role,
        department: users.department,
        position: users.position,
        isAdmin: users.isAdmin,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
});

// Roles management endpoints
professionalAdminRouter.get("/roles", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
  try {
    let allRoles = await db.select().from(roles).orderBy(roles.name);

    // If no roles exist yet, seed the table with default system roles so the
    // admin UI has options to display in the "Assign Role" dialog.
    if (allRoles.length === 0) {
      const defaultRoles = [
        {
          name: "super_admin",
          displayName: "Super Administrator",
          description: "Full system access with all permissions",
          permissions: [
            "user_read",
            "user_write",
            "user_delete",
            "role_manage",
            "system_admin",
            "analytics_view",
            "employee_manage",
          ],
          isSystem: true,
        },
        {
          name: "admin",
          displayName: "Administrator",
          description: "Administrative access with user management",
          permissions: ["user_read", "user_write", "analytics_view", "employee_manage"],
          isSystem: true,
        },
        {
          name: "developer",
          displayName: "Developer",
          description: "Development team member",
          permissions: ["user_read", "analytics_view"],
          isSystem: true,
        },
        {
          name: "employee",
          displayName: "Employee",
          description: "Standard employee access",
          permissions: ["user_read"],
          isSystem: true,
        },
        {
          name: "moderator",
          displayName: "Moderator",
          description: "Content moderation privileges",
          permissions: ["user_read", "user_write"],
          isSystem: true,
        },
      ];

      for (const role of defaultRoles) {
        await db.insert(roles).values(role).onConflictDoNothing();
      }

      allRoles = await db.select().from(roles).orderBy(roles.name);
    }

    res.json(allRoles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ message: "Failed to fetch roles" });
  }
});

professionalAdminRouter.post("/roles", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, displayName, description, permissions: rolePermissions } = req.body;
    
    const [newRole] = await db
      .insert(roles)
      .values({
        name,
        displayName,
        description,
        permissions: rolePermissions || [],
        isSystem: false,
      })
      .returning();

    res.status(201).json(newRole);
  } catch (error) {
    console.error("Error creating role:", error);
    res.status(500).json({ message: "Failed to create role" });
  }
});

// Update role
professionalAdminRouter.put("/roles/:id", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, displayName, description, permissions: rolePermissions } = req.body;
    
    // Check if role exists and is not a system role
    const [existingRole] = await db.select().from(roles).where(eq(roles.id, parseInt(id)));
    if (!existingRole) {
      return res.status(404).json({ message: "Role not found" });
    }
    
    if (existingRole.isSystem) {
      return res.status(400).json({ message: "Cannot modify system roles" });
    }

    const [updatedRole] = await db
      .update(roles)
      .set({
        name,
        displayName,
        description,
        permissions: rolePermissions || [],
        updatedAt: new Date(),
      })
      .where(eq(roles.id, parseInt(id)))
      .returning();

    res.json(updatedRole);
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({ message: "Failed to update role" });
  }
});

// Delete role
professionalAdminRouter.delete("/roles/:id", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if role exists and is not a system role
    const [existingRole] = await db.select().from(roles).where(eq(roles.id, parseInt(id)));
    if (!existingRole) {
      return res.status(404).json({ message: "Role not found" });
    }
    
    if (existingRole.isSystem) {
      return res.status(400).json({ message: "Cannot delete system roles" });
    }

    // Check if role is assigned to any users
    const [roleUsage] = await db
      .select({ count: count() })
      .from(userRoles)
      .where(eq(userRoles.roleId, parseInt(id)));

    if (roleUsage.count > 0) {
      return res.status(400).json({ 
        message: `Cannot delete role. It is assigned to ${roleUsage.count} user(s)` 
      });
    }

    await db.delete(roles).where(eq(roles.id, parseInt(id)));

    res.json({ message: "Role deleted successfully" });
  } catch (error) {
    console.error("Error deleting role:", error);
    res.status(500).json({ message: "Failed to delete role" });
  }
});

// Permissions management
professionalAdminRouter.get(
  "/permissions",
  isAuthenticated,
  requireAdmin,
  async (_req: Request, res: Response) => {
    try {
      const allPermissions = await db
        .select()
        .from(permissions)
        .orderBy(permissions.category, permissions.name);
      res.json(allPermissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(200).json([]);
    }
  }
);

professionalAdminRouter.get(
  "/professional/analytics",
  isAuthenticated,
  requireAdmin,
  async (req: Request, res: Response) => {
    const { from = null, to = null } = req.query;
    res.json({
      conversionRate: 0,
      revenue: 0,
      avgOrderValue: 0,
      ltv: 0,
      range: { from, to },
    });
  }
);

// Send role invitation via email
professionalAdminRouter.post("/invite-user", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { email, roleId, recipientName } = req.body;
    
    if (!email || !roleId) {
      return res.status(400).json({ message: "Email and role ID are required" });
    }

    // Get role details
    const [role] = await db.select().from(roles).where(eq(roles.id, roleId));
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    // Check if user already exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, email));
    if (existingUser) {
      return res.status(400).json({ message: "User already exists in the system" });
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Store invitation in database
    await db.execute(sql`
      INSERT INTO role_invitations (email, role_id, invited_by_user_id, token, expires_at)
      VALUES (${email}, ${roleId}, ${req.user!.id}, ${token}, ${expiresAt})
    `);

    // Send invitation email
    const emailSent = await sendRoleInvitationEmail({
      email,
      recipientName: recipientName || email.split('@')[0],
      role: role.name,
      roleDisplayName: role.displayName,
      inviterName: req.user!.name || 'System Administrator',
      organizationName: 'MyLinked',
      inviteToken: token,
      baseUrl: process.env.BASE_URL || req.protocol + '://' + req.get('host'),
    });

    if (!emailSent) {
      return res.status(500).json({ message: "Failed to send invitation email" });
    }

    res.json({ 
      message: "Invitation sent successfully", 
      inviteToken: token,
      expiresAt 
    });
  } catch (error) {
    console.error("Error sending invitation:", error);
    res.status(500).json({ message: "Failed to send invitation" });
  }
});

// Assign role to existing user
professionalAdminRouter.post("/assign-role", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId, roleId, sendNotification = true } = req.body;
    
    // Get role details
    const [role] = await db.select().from(roles).where(eq(roles.id, roleId));
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    // Get user details
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const oldRole = user.role;

    // Update user role
    await db
      .update(users)
      .set({ 
        role: role.name,
        permissions: role.permissions,
      })
      .where(eq(users.id, userId));

    // Record role assignment
    await db.insert(userRoles).values({
      userId,
      roleId,
      assignedBy: req.user!.id,
    });

    // Send notification email if requested
    if (sendNotification && user.email) {
      await sendRoleUpdateNotification({
        email: user.email,
        recipientName: user.name || 'User',
        oldRole: oldRole || 'user',
        newRole: role.name,
        roleDisplayName: role.displayName,
        updatedBy: req.user!.name || 'Administrator',
        organizationName: 'MyLinked',
      });
    }

    res.json({ message: "Role assigned successfully" });
  } catch (error) {
    console.error("Error assigning role:", error);
    res.status(500).json({ message: "Failed to assign role" });
  }
});

// Get pending invitations
professionalAdminRouter.get("/invitations", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
  try {
    const invitations = await db.execute(sql`
      SELECT 
        ri.id,
        ri.email,
        ri.status,
        ri.created_at,
        ri.expires_at,
        r.display_name as role_name,
        u.name as invited_by_name
      FROM role_invitations ri
      JOIN roles r ON ri.role_id = r.id
      JOIN users u ON ri.invited_by_user_id = u.id
      ORDER BY ri.created_at DESC
    `);

    res.json(invitations.rows);
  } catch (error) {
    console.error("Error fetching invitations:", error);
    res.status(500).json({ message: "Failed to fetch invitations" });
  }
});

// Cancel invitation
professionalAdminRouter.delete("/invitations/:id", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await db.execute(sql`
      UPDATE role_invitations 
      SET status = 'cancelled' 
      WHERE id = ${parseInt(id)}
    `);

    res.json({ message: "Invitation cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling invitation:", error);
    res.status(500).json({ message: "Failed to cancel invitation" });
  }
});

// Employee management endpoints
professionalAdminRouter.get("/employees", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
  try {
    const employees = await db
      .select({
        id: employeeProfiles.id,
        employeeId: employeeProfiles.employeeId,
        department: employeeProfiles.department,
        position: employeeProfiles.position,
        salary: employeeProfiles.salary,
        hireDate: employeeProfiles.hireDate,
        workLocation: employeeProfiles.workLocation,
        workType: employeeProfiles.workType,
        status: employeeProfiles.status,
        performanceRating: employeeProfiles.performanceRating,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          profileImage: users.profileImage,
        },
        manager: {
          id: sql`manager_user.id`,
          name: sql`manager_user.name`,
        },
      })
      .from(employeeProfiles)
      .leftJoin(users, eq(employeeProfiles.userId, users.id))
      .leftJoin(sql`users as manager_user`, sql`employee_profiles.manager = manager_user.id`)
      .orderBy(desc(employeeProfiles.createdAt));

    res.json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ message: "Failed to fetch employees" });
  }
});

professionalAdminRouter.post("/employees", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      userId,
      employeeId,
      department,
      position,
      salary,
      hireDate,
      manager,
      workLocation,
      workType,
      status = "active",
      performanceRating,
    } = req.body;

    const [newEmployee] = await db
      .insert(employeeProfiles)
      .values({
        userId,
        employeeId,
        department,
        position,
        salary,
        hireDate: hireDate ? new Date(hireDate) : undefined,
        manager,
        workLocation,
        workType,
        status,
        performanceRating,
      })
      .returning();

    res.status(201).json(newEmployee);
  } catch (error) {
    console.error("Error creating employee profile:", error);
    res.status(500).json({ message: "Failed to create employee profile" });
  }
});

// Professional analytics endpoint
professionalAdminRouter.get("/professional/analytics/:timeRange", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { timeRange } = req.params;
    const days = timeRange === "1d" ? 1 : timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get user counts by role
    const roleStats = await db
      .select({
        role: users.role,
        count: count(),
      })
      .from(users)
      .where(eq(users.isActive, true))
      .groupBy(users.role);

    // Get department stats
    const departmentStats = await db
      .select({
        department: employeeProfiles.department,
        count: count(),
        avgSalary: sql<number>`AVG(${employeeProfiles.salary})`,
        avgPerformance: sql<number>`AVG(${employeeProfiles.performanceRating})`,
      })
      .from(employeeProfiles)
      .leftJoin(users, eq(employeeProfiles.userId, users.id))
      .where(eq(users.isActive, true))
      .groupBy(employeeProfiles.department);

    // Get recent activity
    const recentUsers = await db
      .select({ count: count() })
      .from(users)
      .where(and(
        eq(users.isActive, true),
        sql`${users.createdAt} >= ${startDate}`
      ));

    // Active users (those who logged in recently)
    const activeUsers = await db
      .select({ count: count() })
      .from(users)
      .where(and(
        eq(users.isActive, true),
        sql`${users.lastLoginAt} >= ${startDate}`
      ));

    const analytics = {
      activeUsers: activeUsers[0]?.count || 0,
      newUsers: recentUsers[0]?.count || 0,
      roleDistribution: roleStats,
      departmentStats,
      timeRange,
      generated: new Date().toISOString(),
    };

    res.json(analytics);
  } catch (error) {
    console.error("Error fetching professional analytics:", error);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
});

// System metrics endpoint
professionalAdminRouter.get("/system/metrics", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
  try {
    // Get system health metrics
    const totalUsers = await db.select({ count: count() }).from(users);
    const activeUsers = await db.select({ count: count() }).from(users).where(eq(users.isActive, true));
    const totalEmployees = await db.select({ count: count() }).from(employeeProfiles);
    const totalRoles = await db.select({ count: count() }).from(roles);

    // Recent system logs
    const recentLogs = await db
      .select()
      .from(systemLogs)
      .orderBy(desc(systemLogs.createdAt))
      .limit(10);

    const metrics = {
      health: "Healthy",
      uptime: 99.8,
      totalUsers: totalUsers[0]?.count || 0,
      activeUsers: activeUsers[0]?.count || 0,
      totalEmployees: totalEmployees[0]?.count || 0,
      totalRoles: totalRoles[0]?.count || 0,
      recentLogs,
      timestamp: new Date().toISOString(),
    };

    res.json(metrics);
  } catch (error) {
    console.error("Error fetching system metrics:", error);
    res.status(500).json({ message: "Failed to fetch system metrics" });
  }
});

// Initialize default roles and permissions
professionalAdminRouter.post("/initialize-system", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
  try {
    // Create default permissions
    const defaultPermissions = [
      { name: "user_read", displayName: "Read Users", description: "View user information", category: "user_management" },
      { name: "user_write", displayName: "Write Users", description: "Create and update users", category: "user_management" },
      { name: "user_delete", displayName: "Delete Users", description: "Delete user accounts", category: "user_management" },
      { name: "role_manage", displayName: "Manage Roles", description: "Create and assign roles", category: "system_admin" },
      { name: "system_admin", displayName: "System Administration", description: "Full system access", category: "system_admin" },
      { name: "analytics_view", displayName: "View Analytics", description: "Access system analytics", category: "analytics" },
      { name: "employee_manage", displayName: "Manage Employees", description: "Manage employee profiles", category: "employee_management" },
    ];

    for (const perm of defaultPermissions) {
      await db.insert(permissions).values(perm).onConflictDoNothing();
    }

    // Create default roles
    const defaultRoles = [
      {
        name: "super_admin",
        displayName: "Super Administrator",
        description: "Full system access with all permissions",
        permissions: ["user_read", "user_write", "user_delete", "role_manage", "system_admin", "analytics_view", "employee_manage"],
        isSystem: true,
      },
      {
        name: "admin",
        displayName: "Administrator",
        description: "Administrative access with user management",
        permissions: ["user_read", "user_write", "analytics_view", "employee_manage"],
        isSystem: true,
      },
      {
        name: "developer",
        displayName: "Developer",
        description: "Development team member",
        permissions: ["user_read", "analytics_view"],
        isSystem: true,
      },
      {
        name: "employee",
        displayName: "Employee",
        description: "Standard employee access",
        permissions: ["user_read"],
        isSystem: true,
      },
      {
        name: "moderator",
        displayName: "Moderator",
        description: "Content moderation privileges",
        permissions: ["user_read", "user_write"],
        isSystem: true,
      },
    ];

    for (const role of defaultRoles) {
      await db.insert(roles).values(role).onConflictDoNothing();
    }

    res.json({ message: "System initialized with default roles and permissions" });
  } catch (error) {
    console.error("Error initializing system:", error);
    res.status(500).json({ message: "Failed to initialize system" });
  }
});

// Bulk user actions
professionalAdminRouter.post("/users/bulk-action", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userIds, action, value } = req.body;

    switch (action) {
      case "activate":
        await db.update(users).set({ isActive: true }).where(sql`id = ANY(${userIds})`);
        break;
      case "deactivate":
        await db.update(users).set({ isActive: false }).where(sql`id = ANY(${userIds})`);
        break;
      case "assign_role":
        await db.update(users).set({ role: value }).where(sql`id = ANY(${userIds})`);
        break;
      case "set_department":
        await db.update(users).set({ department: value }).where(sql`id = ANY(${userIds})`);
        break;
      default:
        return res.status(400).json({ message: "Invalid bulk action" });
    }

    res.json({ message: `Bulk ${action} completed successfully` });
  } catch (error) {
    console.error("Error performing bulk action:", error);
    res.status(500).json({ message: "Failed to perform bulk action" });
  }
});

// Export user data
professionalAdminRouter.get("/users/:userId/export", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const [user] = await db.select().from(users).where(eq(users.id, parseInt(userId)));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const [employee] = await db.select().from(employeeProfiles).where(eq(employeeProfiles.userId, parseInt(userId)));

    const exportData = {
      user,
      employee,
      exportedAt: new Date().toISOString(),
      exportedBy: req.user!.id,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user-${userId}-export.json"`);
    res.json(exportData);
  } catch (error) {
    console.error("Error exporting user data:", error);
    res.status(500).json({ message: "Failed to export user data" });
  }
});

// Get invitation details by token (public endpoint)
professionalAdminRouter.get("/invitation/:token", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    
    const result = await db.execute(sql`
      SELECT 
        ri.id,
        ri.email,
        ri.status,
        ri.expires_at,
        r.name as role,
        r.display_name as role_display_name,
        u.name as inviter_name
      FROM role_invitations ri
      JOIN roles r ON ri.role_id = r.id
      JOIN users u ON ri.invited_by_user_id = u.id
      WHERE ri.token = ${token}
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    const invitation = result.rows[0];
    res.json({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      roleDisplayName: invitation.role_display_name,
      inviterName: invitation.inviter_name,
      organizationName: 'MyLinked',
      expiresAt: invitation.expires_at,
      status: invitation.status,
    });
  } catch (error) {
    console.error("Error fetching invitation details:", error);
    res.status(500).json({ message: "Failed to fetch invitation details" });
  }
});

// Accept invitation and create account
professionalAdminRouter.post("/accept-invitation", async (req: Request, res: Response) => {
  try {
    const { token, username, password, name } = req.body;
    
    if (!token || !username || !password || !name) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Get invitation details
    const invitationResult = await db.execute(sql`
      SELECT 
        ri.id,
        ri.email,
        ri.role_id,
        ri.status,
        ri.expires_at,
        r.name as role_name,
        r.permissions
      FROM role_invitations ri
      JOIN roles r ON ri.role_id = r.id
      WHERE ri.token = ${token}
    `);

    if (invitationResult.rows.length === 0) {
      return res.status(404).json({ message: "Invalid invitation token" });
    }

    const invitation = invitationResult.rows[0];

    // Check invitation status and expiry
    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: "Invitation is no longer valid" });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return res.status(400).json({ message: "Invitation has expired" });
    }

    // Check if user already exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, invitation.email));
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Check if username is taken
    const [existingUsername] = await db.select().from(users).where(eq(users.username, username));
    if (existingUsername) {
      return res.status(400).json({ message: "Username is already taken" });
    }

    // Hash password (using the same method as registration)
    const { hashPassword } = await import("./auth");
    const hashedPassword = await hashPassword(password);

    // Create user account
    const [newUser] = await db
      .insert(users)
      .values({
        username,
        password: hashedPassword,
        name,
        email: invitation.email,
        role: invitation.role_name,
        permissions: invitation.permissions,
        isActive: true,
      })
      .returning();

    // Mark invitation as accepted
    await db.execute(sql`
      UPDATE role_invitations 
      SET status = 'accepted', accepted_at = NOW(), accepted_by = ${newUser.id}
      WHERE id = ${invitation.id}
    `);

    // Record role assignment
    await db.insert(userRoles).values({
      userId: newUser.id,
      roleId: invitation.role_id,
      assignedBy: invitation.id,
    });

    res.json({ 
      message: "Account created successfully",
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      }
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    res.status(500).json({ message: "Failed to create account" });
  }
});