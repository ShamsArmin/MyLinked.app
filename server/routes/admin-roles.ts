import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import {
  roles,
  permissions,
  rolePermissions,
  userRoles,
  auditLogs,
  users,
} from "../../shared/schema";
import { eq, sql } from "drizzle-orm";
import { isAuthenticated } from "../auth";

const PERMISSIONS: Array<{ key: string; group: string; description: string }> = [
  { key: "user_read", group: "users", description: "View users" },
  { key: "user_write", group: "users", description: "Edit users" },
  { key: "user_delete", group: "users", description: "Delete users" },
  { key: "segment_manage", group: "segments", description: "Create/edit segments" },
  { key: "ab_manage", group: "experiments", description: "Manage A/B tests" },
  { key: "analytics_view", group: "analytics", description: "View analytics" },
  { key: "funnel_manage", group: "analytics", description: "Create/edit funnels" },
  { key: "invitation_manage", group: "admin", description: "Manage invitations" },
  { key: "role_manage", group: "admin", description: "Create/edit roles" },
  { key: "settings_manage", group: "settings", description: "Manage app settings" },
  { key: "platform_manage", group: "platforms", description: "Manage integrations" },
  { key: "email_broadcast", group: "email", description: "Send email campaigns" },
  { key: "billing_view", group: "billing", description: "View billing" },
  { key: "billing_manage", group: "billing", description: "Manage billing" },
];

function requireAdmin(permission: string) {
  return (req: any, res: any, next: any) => {
    const user = req.user as any;
    const role = user?.role;
    const perms: string[] = user?.permissions || [];
    if (
      !user ||
      (!user.isAdmin &&
        role !== "admin" &&
        role !== "super_admin" &&
        !perms.includes(permission))
    ) {
      return res.status(403).json({ message: "Administrator privileges required" });
    }
    next();
  };
}

async function logAction(actorId: string, action: string, payload?: any) {
  await db.insert(auditLogs).values({ actorId, action, payload });
}

const CreateRoleZ = z.object({
  name: z.string().regex(/^[a-z0-9_]+$/).min(3),
  displayName: z.string().min(3),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(0),
});

const UpdateRoleZ = CreateRoleZ.partial().extend({
  permissions: z.array(z.string()).optional(),
});

const router = Router();

router.use(isAuthenticated, requireAdmin("role_manage"));

router.use((_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

router.get("/permissions", async (_req, res) => {
  let all = await db.select().from(permissions);
  if (all.length === 0) {
    await db.insert(permissions).values(PERMISSIONS).onConflictDoNothing();
    all = await db.select().from(permissions);
  }
  res.json(all);
});

router.get("/roles", async (_req, res) => {
  const rs = await db.select().from(roles);
  const full = await Promise.all(rs.map((r) => loadRoleWithPermissions(r.id)));
  res.json(full);
});

router.post("/roles", async (req, res) => {
  const body = CreateRoleZ.parse(req.body);
  try {
    const result = await db.transaction(async (tx) => {
      const [r] = await tx
        .insert(roles)
        .values({
          name: body.name,
          displayName: body.displayName,
          description: body.description ?? null,
          isSystem: false,
        })
        .returning();
      if (body.permissions.length) {
        await tx.insert(rolePermissions).values(
          body.permissions.map((p) => ({ roleId: r.id, permissionKey: p }))
        );
      }
      return r;
    });
    await logAction((req.user as any).id, "role_create", { roleId: result.id });
    const full = await loadRoleWithPermissions(result.id);
    return res.status(201).json(full);
  } catch (err: any) {
    if (err.code === "23505") {
      return res
        .status(409)
        .json({ message: "Role name already exists", code: "DUPLICATE_ROLE" });
    }
    if (err.code === "23503") {
      return res
        .status(422)
        .json({ message: "Unknown permission key", code: "INVALID_PERMISSION" });
    }
    console.error("Create role failed:", err);
    return res.status(500).json({ message: "Failed to create role" });
  }
});

router.patch("/roles/:id", async (req, res) => {
  const id = Number(req.params.id);
  const body = UpdateRoleZ.parse(req.body);
  try {
    const exists = await db.select().from(roles).where(eq(roles.id, id));
    if (!exists.length) return res.status(404).json({ message: "Role not found" });
    const updated = await db.transaction(async (tx) => {
      if (
        body.name ||
        body.displayName ||
        body.description !== undefined
      ) {
        await tx
          .update(roles)
          .set({
            ...(body.name && { name: body.name }),
            ...(body.displayName && { displayName: body.displayName }),
            ...(body.description !== undefined && {
              description: body.description ?? null,
            }),
            updatedAt: new Date(),
          })
          .where(eq(roles.id, id));
      }
      if (body.permissions) {
        await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
        if (body.permissions.length) {
          await tx.insert(rolePermissions).values(
            body.permissions.map((p) => ({ roleId: id, permissionKey: p }))
          );
        }
      }
      return await loadRoleWithPermissions(id, tx);
    });
    await logAction((req.user as any).id, "role_update", { roleId: id });
    return res.json(updated);
  } catch (err: any) {
    if (err.code === "23505")
      return res
        .status(409)
        .json({ message: "Role name already exists", code: "DUPLICATE_ROLE" });
    if (err.code === "23503")
      return res
        .status(422)
        .json({ message: "Unknown permission key", code: "INVALID_PERMISSION" });
    console.error("Update role failed:", err);
    return res.status(500).json({ message: "Failed to update role" });
  }
});

router.delete("/roles/:id", async (req, res) => {
  const id = Number(req.params.id);
  const force = req.query.force === "true";
  const reassignTo = req.query.reassignTo ? Number(req.query.reassignTo) : null;

  const r = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
  if (!r.length) return res.status(404).json({ message: "Role not found" });
  if (r[0].isSystem)
    return res.status(403).json({ message: "Cannot delete a system role" });

  const members = await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.roleId, id));
  if (members.length && (!force || !reassignTo)) {
    return res
      .status(409)
      .json({ code: "ROLE_IN_USE", members: members.length });
  }

  try {
    await db.transaction(async (tx) => {
      if (members.length && reassignTo) {
        await tx
          .update(userRoles)
          .set({ roleId: reassignTo })
          .where(eq(userRoles.roleId, id));
      }
      await tx.delete(roles).where(eq(roles.id, id));
    });
    await logAction((req.user as any).id, "role_delete", { roleId: id });
    return res.json({ ok: true });
  } catch (err: any) {
    console.error("Delete role failed:", err);
    return res.status(500).json({ message: "Failed to delete role" });
  }
});

router.get("/roles/:id/members", async (req, res) => {
  const id = Number(req.params.id);
  const limit = Number((req.query.limit as string) || 20);
  const offset = Number((req.query.offset as string) || 0);
  const members = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(userRoles)
    .innerJoin(users, eq(userRoles.userId, users.id))
    .where(eq(userRoles.roleId, id))
    .limit(limit)
    .offset(offset);
  res.json(members);
});

async function loadRoleWithPermissions(id: number, tx = db) {
  const [r] = await tx.select().from(roles).where(eq(roles.id, id));
  const perms = await tx
    .select({ key: rolePermissions.permissionKey })
    .from(rolePermissions)
    .where(eq(rolePermissions.roleId, id));
  const members = await tx
    .select({ count: sql<number>`count(*)` })
    .from(userRoles)
    .where(eq(userRoles.roleId, id));
  return {
    id: r.id,
    name: r.name,
    displayName: r.displayName,
    description: r.description,
    isSystem: r.isSystem,
    permissions: perms.map((p) => p.key),
    members: Number(members[0]?.count ?? 0),
  };
}

export default router;

