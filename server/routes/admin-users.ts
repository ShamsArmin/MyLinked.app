import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { isAuthenticated } from "../auth";
import { sessions, users, roles, userRoles, auditLogs } from "../../shared/schema";
import { eq, sql } from "drizzle-orm";
import { storage } from "../storage";
import { sendPasswordResetEmail } from "../email-service";

const router = Router();

function requireAdmin(req: any, res: any, next: any) {
  const user = req.user as any;
  const role = user?.role;
  const perms: string[] = user?.permissions || [];
  if (
    !user ||
    (!user.isAdmin &&
      role !== "admin" &&
      role !== "super_admin" &&
      !perms.includes("role_manage"))
  ) {
    return res.status(403).json({ message: "Administrator privileges required" });
  }
  next();
}

async function logAction(actorId: string, targetUserId: string, action: string, payload?: any) {
  await db.insert(auditLogs).values({ actorId, targetUserId, action, payload });
}

router.use(isAuthenticated, requireAdmin);

const roleSchema = z.object({ roleId: z.number() });
router.post("/:id/role", async (req, res) => {
  try {
    const userId = req.params.id;
    const { roleId } = roleSchema.parse(req.body);
    const [role] = await db.select().from(roles).where(eq(roles.id, roleId));
    if (!role) return res.status(404).json({ message: "Role not found" });

    await db.transaction(async (tx) => {
      await tx
        .insert(userRoles)
        .values({ userId, roleId })
        .onConflictDoUpdate({
          target: userRoles.userId,
          set: { roleId },
        });
      await tx.update(users).set({ role: role.name }).where(eq(users.id, userId));
    });

    await logAction((req.user as any).id, userId, "role_assign", { roleId });
    res.json({ roleId });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to assign role" });
  }
});

const statusSchema = z.object({ status: z.enum(["active", "suspended"]) });
router.patch("/:id/status", async (req, res) => {
  try {
    const userId = req.params.id;
    const { status } = statusSchema.parse(req.body);
    await db
      .update(users)
      .set({ status, isActive: status === "active" })
      .where(eq(users.id, userId));
    if (status === "suspended") {
      await db.delete(sessions).where(sql`sess->'passport'->>'user' = ${userId}`);
    }
    await logAction((req.user as any).id, userId, "set_status", { status });
    res.json({ status });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to update status" });
  }
});

const limitsSchema = z.object({
  maxLinks: z.number().nullable().optional(),
  dailyClickQuota: z.number().nullable().optional(),
});
router.patch("/:id/limits", async (req, res) => {
  try {
    const userId = req.params.id;
    const { maxLinks, dailyClickQuota } = limitsSchema.parse(req.body);
    await db
      .update(users)
      .set({ maxLinks, dailyClickQuota })
      .where(eq(users.id, userId));
    await logAction((req.user as any).id, userId, "set_limits", { maxLinks, dailyClickQuota });
    res.json({ maxLinks, dailyClickQuota });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to set limits" });
  }
});

router.post("/:id/force-logout", async (req, res) => {
  try {
    const userId = req.params.id;
    await db.delete(sessions).where(sql`sess->'passport'->>'user' = ${userId}`);
    await logAction((req.user as any).id, userId, "force_logout");
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to force logout" });
  }
});

router.post("/:id/reset-password", async (req, res) => {
  try {
    const userId = req.params.id;
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user || !user.email) return res.status(404).json({ message: "User not found" });
    const resetToken = await storage.createPasswordResetToken(user.email);
    await sendPasswordResetEmail(user.email, resetToken.token);
    await logAction((req.user as any).id, userId, "reset_password");
    res.json({ success: true });
  } catch (err: any) {
    res.status(501).json({ message: err.message || "Reset password not implemented" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    await logAction((req.user as any).id, userId, "delete_user");
    await db.delete(users).where(eq(users.id, userId));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to delete user" });
  }
});

export default router;
