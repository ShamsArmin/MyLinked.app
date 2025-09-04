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
import { requireAdmin } from "../require-admin";

async function logAction(actorId: string, action: string, payload?: any) {
  await db.insert(auditLogs).values({ actorId, action, payload });
}

function toSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const CreateRoleZ = z.object({
  name: z
    .string()
    .min(3)
    .regex(/^[a-z0-9_]+$/, {
      message: "Name must use lowercase letters, numbers, or underscores",
    }),
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
router.get("/roles", async (_req, res) => {
  const rs = await db.select().from(roles);
  const full = await Promise.all(rs.map((r) => loadRoleWithPermissions(r.id)));
  res.json(full);
});

router.post("/roles", async (req, res) => {
  const raw = req.body || {};
  if (typeof raw.name === "string") raw.name = toSlug(raw.name);
  // Accept permission objects and convert them to key arrays
  if (raw.permissions && !Array.isArray(raw.permissions)) {
    raw.permissions = Object.entries(raw.permissions)
      .filter(([, v]) => v)
      .map(([k]) => k);
  }
  if (!raw.permissions) raw.permissions = [];
  const parsed = CreateRoleZ.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(", ");
    return res.status(422).json({ message: msg, issues: parsed.error.issues });
  }
  const body = parsed.data;
  const validKeys = new Set((await db.select().from(permissions)).map(p => p.key));
  const invalid = body.permissions.filter(p => !validKeys.has(p));
  if (invalid.length) {
    return res.status(422).json({ message: `Unknown permission key: ${invalid.join(",")}`, code: "INVALID_PERMISSION" });
  }
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
    console.error("Create role failed:", err);
    return res.status(500).json({ message: "Failed to create role" });
  }
});

router.patch("/roles/:id", async (req, res) => {
  const id = Number(req.params.id);
  const raw = req.body || {};
  if (typeof raw.name === "string") raw.name = toSlug(raw.name);
  if (raw.permissions && !Array.isArray(raw.permissions)) {
    raw.permissions = Object.entries(raw.permissions)
      .filter(([, v]) => v)
      .map(([k]) => k);
  }
  const parsed = UpdateRoleZ.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(", ");
    return res.status(422).json({ message: msg, issues: parsed.error.issues });
  }
  const body = parsed.data;
  try {
    const exists = await db.select().from(roles).where(eq(roles.id, id));
    if (!exists.length) return res.status(404).json({ message: "Role not found" });
    if (exists[0].isSystem && body.name) {
      return res.status(403).json({ message: "Cannot rename a system role" });
    }
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
        const validKeys = new Set((await db.select().from(permissions)).map(p => p.key));
        const invalid = body.permissions.filter(p => !validKeys.has(p));
        if (invalid.length) {
          throw { code: "INVALID_PERMISSION", keys: invalid };
        }
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
    if (err.code === "INVALID_PERMISSION")
      return res
        .status(422)
        .json({ message: `Unknown permission key: ${err.keys.join(",")}`, code: "INVALID_PERMISSION" });
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

