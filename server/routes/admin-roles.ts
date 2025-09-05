import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import {
  roles,
  permissions as permsTbl,
  rolePermissions,
  userRoles,
} from "../../shared/schema";
import { eq, inArray } from "drizzle-orm";
import { isAuthenticated } from "../auth";
import { requireAdmin } from "../require-admin";

const router = Router();
router.use(isAuthenticated, requireAdmin("role_manage"));

// Disable caching so edits reflect immediately
router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.removeHeader("ETag");
  next();
});

const RoleUpsertZ = z.object({
  name: z.string().regex(/^[a-z0-9_]+$/).min(3),
  displayName: z.string().min(2),
  description: z.string().optional(),
  permissions: z.array(z.string()).default([]),
});

// Normalize any incoming permission payloads to an array of strings
function coercePermissionInput(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((v) => String(v));
  if (raw && typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>)
      .filter(([, v]) => v === true)
      .map(([k]) => k);
  }
  return raw ? [String(raw)] : [];
}

async function validatePermissionKeys(keys: string[]) {
  if (!keys.length) return [];
  const rows = await db
    .select({ key: permsTbl.key })
    .from(permsTbl)
    .where(inArray(permsTbl.key, keys));
  const ok = new Set(rows.map((r) => r.key));
  const unknown = Array.from(new Set(keys)).filter((k) => !ok.has(k));
  if (unknown.length) {
    const err: any = new Error(`Unknown permission key(s): ${unknown.join(", ")}`);
    err.status = 422;
    err.code = "INVALID_PERMISSION";
    throw err;
  }
  return keys;
}

async function loadRoleDTO(id: number) {
  const [r0] = await db.select().from(roles).where(eq(roles.id, id));
  if (!r0) return null;
  const permRows = await db
    .select({ key: rolePermissions.permissionKey })
    .from(rolePermissions)
    .where(eq(rolePermissions.roleId, id));
  const [{ count }] = (await db.execute(
    "select count(*)::int as count from user_roles where role_id = $1",
    [id]
  )).rows as any[];
  return {
    id: r0.id,
    name: r0.name,
    displayName: r0.displayName,
    description: r0.description,
    isSystem: r0.isSystem,
    permissions: permRows.map((p) => p.key),
    members: Number(count ?? 0),
    createdAt: r0.createdAt,
    updatedAt: r0.updatedAt,
  };
}

router.get("/roles", async (_req, res) => {
  const rows = await db.select().from(roles);
  const result = await Promise.all(rows.map((r) => loadRoleDTO(r.id)));
  res.json(result.filter(Boolean));
});

router.get("/roles/:id", async (req, res) => {
  const dto = await loadRoleDTO(Number(req.params.id));
  if (!dto) return res.status(404).json({ message: "Role not found" });
  res.json(dto);
});

router.post("/roles", async (req, res) => {
  console.info("[roles:create] raw body:", JSON.stringify(req.body));
  let body: z.infer<typeof RoleUpsertZ>;
  try {
    const permissions = await validatePermissionKeys(
      coercePermissionInput((req.body || {}).permissions)
    );
    body = RoleUpsertZ.parse({ ...req.body, permissions });
  } catch (e: any) {
    if (e.status === 422) {
      return res
        .status(422)
        .json({ message: e.message, code: e.code ?? "INVALID_PERMISSION" });
    }
    return res.status(422).json({ message: "Invalid payload" });
  }
  try {
    const id = await db.transaction(async (tx) => {
      const [r0] = await tx
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
          body.permissions.map((k) => ({ roleId: r0.id, permissionKey: k }))
        );
      }
      const [{ c }] = (await tx.execute(
        "select count(*)::int as c from role_permissions where role_id = $1",
        [r0.id]
      )).rows as any[];
      console.log(`[roles:create] role_id=${r0.id} perms_written=${c}`);
      return r0.id;
    });

    const dto = await loadRoleDTO(id);
    console.info("[roles:create] ok role_id=", id, "perms=", dto?.permissions);
    return res.status(201).json(dto);
  } catch (e: any) {
    console.error("[roles:create] failed:", e);
    if (e.code === "23505") {
      return res
        .status(409)
        .json({ message: "Role name already exists", code: "DUPLICATE_ROLE" });
    }
    if (e.status === 422) {
      return res
        .status(422)
        .json({ message: e.message, code: e.code ?? "INVALID_PERMISSION" });
    }
    return res.status(500).json({ message: "Failed to create role" });
  }
});

router.patch("/roles/:id", async (req, res) => {
  const id = Number(req.params.id);
  let body: Partial<z.infer<typeof RoleUpsertZ>>;
  try {
    const permissions =
      req.body.permissions === undefined
        ? undefined
        : await validatePermissionKeys(
            coercePermissionInput(req.body.permissions)
          );
    body = RoleUpsertZ.partial().parse({ ...req.body, permissions });
  } catch (e: any) {
    if (e.status === 422) {
      return res
        .status(422)
        .json({ message: e.message, code: e.code ?? "INVALID_PERMISSION" });
    }
    return res.status(422).json({ message: "Invalid payload" });
  }
  try {
    await db.transaction(async (tx) => {
      if (body.name || body.displayName || body.description !== undefined) {
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
            body.permissions.map((k) => ({ roleId: id, permissionKey: k }))
          );
        }
        const [{ c }] = (await tx.execute(
          "select count(*)::int as c from role_permissions where role_id = $1",
          [id]
        )).rows as any[];
        console.log(`[roles:update] role_id=${id} perms_written=${c}`);
      }
    });
    const dto = await loadRoleDTO(id);
    console.info("[roles:update] ok role_id=", id, "perms=", dto?.permissions);
    return res.json(dto);
  } catch (e: any) {
    console.error("[roles:update] failed:", e);
    if (e.code === "23505")
      return res
        .status(409)
        .json({ message: "Role name already exists", code: "DUPLICATE_ROLE" });
    if (e.status === 422)
      return res
        .status(422)
        .json({ message: e.message, code: e.code ?? "INVALID_PERMISSION" });
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
    return res.json({ ok: true });
  } catch (e) {
    console.error("[roles:delete] error=", e);
    return res.status(500).json({ message: "Failed to delete role" });
  }
});

export default router;
