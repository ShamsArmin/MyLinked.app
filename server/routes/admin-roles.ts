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
import { eq, sql, inArray } from "drizzle-orm";
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
  permissions: z.array(z.string()).default([]),
});

const UpdateRoleZ = CreateRoleZ.partial().extend({
  permissions: z.array(z.string()).optional(),
});

function coercePermissions(raw: any): string[] {
  if (!raw) return [];
  let arr: any[] = [];
  if (!Array.isArray(raw) && typeof raw === "object") {
    arr = Object.entries(raw)
      .filter(([, v]) => v === true)
      .map(([k]) => k);
  } else if (Array.isArray(raw)) {
    arr = raw;
  } else {
    arr = [raw];
  }
  return arr.map((v) => {
    if (typeof v === "string") return v;
    if (typeof v === "number") return `__IDX:${v}`;
    return String(v);
  });
}

async function normalizeToRealKeys(keys: string[]) {
  if (!keys.length) return [] as string[];
  const all = await db
    .select()
    .from(permissions)
    .orderBy(permissions.group, permissions.key);
  const byIndex = (i: number) => all[i]?.key;
  const normalized = keys.map((k) => {
    const m = k.match(/^__IDX:(\d+)$/);
    if (m) return byIndex(parseInt(m[1], 10)) ?? "__INVALID__";
    return k;
  });
  const uniq = Array.from(new Set(normalized));
  const found = await db
    .select({ key: permissions.key })
    .from(permissions)
    .where(inArray(permissions.key, uniq));
  const foundSet = new Set(found.map((r) => r.key));
  const unknown = uniq.filter((k) => !foundSet.has(k));
  if (unknown.length) {
    const err: any = new Error(`Unknown permission key(s): ${unknown.join(", ")}`);
    err.status = 422;
    err.code = "INVALID_PERMISSION";
    throw err;
  }
  return normalized;
}

const router = Router();

router.use(isAuthenticated, requireAdmin("role_manage"));

router.use((_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
router.get("/roles", async (_req, res) => {
  const rs = await db.select().from(roles);
  const full = await Promise.all(rs.map((r) => serializeRole(r.id)));
  res.json(full.filter(Boolean));
});

router.post("/roles", async (req, res) => {
  const raw = req.body || {};
  if (typeof raw.name === "string") raw.name = toSlug(raw.name);
  const coerced = coercePermissions(raw.permissions);
  const parsed = CreateRoleZ.safeParse({ ...raw, permissions: coerced });
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(", ");
    return res.status(422).json({ message: msg, issues: parsed.error.issues });
  }
  const body = parsed.data;
  try {
    const permKeys = await normalizeToRealKeys(body.permissions);
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
      if (permKeys.length) {
        await tx.insert(rolePermissions).values(
          permKeys.map((p) => ({ roleId: r.id, permissionKey: p }))
        );
      }
      return r;
    });
    await logAction((req.user as any).id, "role_create", { roleId: result.id });
    const full = await serializeRole(result.id);
    return res.status(201).json(full);
  } catch (err: any) {
    console.error("[CreateRole] bad payload →", req.body, err);
    if (err.status === 422)
      return res.status(422).json({ message: err.message, code: err.code });
    if (err.code === "23505") {
      return res
        .status(409)
        .json({ message: "Role name already exists", code: "DUPLICATE_ROLE" });
    }
    return res.status(500).json({ message: "Failed to create role" });
  }
});

router.patch("/roles/:id", async (req, res) => {
  const id = Number(req.params.id);
  const raw = req.body || {};
  if (typeof raw.name === "string") raw.name = toSlug(raw.name);
  let coerced: string[] | undefined;
  if (raw.permissions !== undefined) {
    coerced = coercePermissions(raw.permissions);
  }
  const parsed = UpdateRoleZ.safeParse({
    ...raw,
    ...(coerced !== undefined ? { permissions: coerced } : {}),
  });
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
    const permKeys = body.permissions
      ? await normalizeToRealKeys(body.permissions)
      : undefined;
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
      if (permKeys !== undefined) {
        await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
        if (permKeys.length) {
          await tx.insert(rolePermissions).values(
            permKeys.map((p) => ({ roleId: id, permissionKey: p }))
          );
        }
      }
      return await serializeRole(id, tx);
    });
    await logAction((req.user as any).id, "role_update", { roleId: id });
    return res.json(updated);
  } catch (err: any) {
    if (err.status === 422)
      return res.status(422).json({ message: err.message, code: err.code });
    if (err.code === "23505")
      return res
        .status(409)
        .json({ message: "Role name already exists", code: "DUPLICATE_ROLE" });
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

async function serializeRole(id: number, tx = db) {
  const [r] = await tx.select().from(roles).where(eq(roles.id, id));
  if (!r) return null;
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
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export default router;

