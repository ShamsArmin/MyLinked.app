import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import {
  roles,
  permissions as permsTbl,
  rolePermissions,
  userRoles,
} from "../../shared/schema";
import { eq, inArray, sql } from "drizzle-orm";
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

function pgErrorPayload(e: any) {
  return {
    message: e?.message || "Database error",
    code: e?.code,
    detail: e?.detail,
    constraint: e?.constraint,
  };
}

const RoleUpsertZ = z.object({
  name: z.string().regex(/^[a-z0-9_]+$/).min(3),
  displayName: z.string().min(2),
  description: z.string().optional(),
  permissions: z.array(z.string()).default([]),
});

const RESERVED = new Set(["super_admin", "admin", "moderator", "employee", "developer"]);

const slugify = (s:string) =>
  String(s || "").toLowerCase().trim().replace(/[^a-z0-9_]+/g,"_").replace(/^_+|_+$/g,"");

async function uniqueName(preferred: string) {
  let base = slugify(preferred || "role");
  if (!base) base = "role";
  if (RESERVED.has(base)) base = `${base}_role`;

  const existsCI = async (n: string) => {
    const [{ exists }] = (await db.execute(
      sql`SELECT EXISTS(SELECT 1 FROM roles WHERE LOWER(name)=LOWER(${n})) AS exists`
    )).rows as any[];
    return !!exists;
  };

  if (!(await existsCI(base))) return base;
  for (let i = 2; i < 1000; i++) {
    const cand = `${base}_${i}`;
    if (!(await existsCI(cand))) return cand;
  }
  throw new Error("Could not generate unique role name");
}

// Normalize any incoming permission payloads to an array of strings
function coercePermissionInput(raw: unknown): string[] {
  if (!raw) return [];

  if (Array.isArray(raw)) return raw.map((v) => String(v).trim()).filter(Boolean);

  if (typeof raw === "object") {
    const entries = Object.entries(raw as Record<string, unknown>);
    if (entries.every(([, v]) => typeof v === "string")) {
      return entries.map(([, v]) => String(v));
    }
    if (entries.every(([, v]) => v === true)) {
      return entries.map(([k]) => k);
    }
  }

  if (typeof raw === "string") {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }

  return [];
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
    sql`select count(*)::int as count from user_roles where role_id = ${id}`
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

// Validate if a role name is available (not reserved or duplicate)
router.get("/roles/validate-name", async (req, res) => {
  const name = String(req.query.name ?? "").toLowerCase();
  if (!name) return res.status(400).json({ ok: false, reason: "empty" });
  if (RESERVED.has(name)) return res.json({ ok: false, reason: "reserved" });
  const [{ exists }] = (await db.execute(
    sql`SELECT EXISTS(SELECT 1 FROM roles WHERE LOWER(name)=LOWER(${name})) AS exists`
  )).rows as any[];
  return res.json({ ok: !exists, reason: exists ? "duplicate" : null });
});

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

router.get("/roles/debug/health", async (_req, res) => {
  try {
    const r = await db.select().from(roles);
    const p = await db.select({ key: permsTbl.key }).from(permsTbl);
    return res.json({ roles: r.length, permissions: p.length });
  } catch (e: any) {
    console.error("[roles:debug] failed:", e);
    return res.status(500).json(pgErrorPayload(e));
  }
});

router.post("/roles", async (req, res) => {
  console.info("[roles:create] raw body:", JSON.stringify(req.body));
  let body: z.infer<typeof RoleUpsertZ>;
  try {
    const permissions = await validatePermissionKeys(
      coercePermissionInput((req.body || {}).permissions)
    );
    // parse to get displayName/description; we override name with a safe one below
    body = RoleUpsertZ.parse({
      ...req.body,
      permissions,
      name: slugify(req.body?.name || req.body?.displayName || "role"),
    });
  } catch (e: any) {
    if (e.status === 422) {
      return res
        .status(422)
        .json({ message: e.message, code: e.code ?? "INVALID_PERMISSION" });
    }
    return res.status(422).json({ message: "Invalid payload" });
  }

  try {
    const safeName = await uniqueName(body.name);

    const id = await db.transaction(async (tx) => {
      // Use returning({ id: roles.id }) for a predictable shape
      const inserted = await tx
        .insert(roles)
        .values({
          name: safeName,
          displayName: body.displayName,
          description: body.description ?? null,
          isSystem: false,
        })
        .returning({ id: roles.id });

      if (!inserted?.length || !inserted[0]?.id) {
        const err: any = new Error("Insert failed: no id returned");
        err.code = "NO_RETURNING_ID";
        throw err;
      }

      const roleId = inserted[0].id;

      if (body.permissions.length) {
        await tx.insert(rolePermissions).values(
          body.permissions.map((k) => ({ roleId, permissionKey: k }))
        );
      }

      // sanity check how many perms written
      const [{ c }] = (await tx.execute(
        sql`select count(*)::int as c from role_permissions where role_id = ${roleId}`
      )).rows as any[];
      console.log(`[roles:create] role_id=${roleId} perms_written=${c}`);

      return roleId;
    });

    const dto = await loadRoleDTO(id);
    console.info("[roles:create] ok role_id=", id, "perms=", dto?.permissions);
    return res.status(201).json(dto);
  } catch (e: any) {
    // Log everything we can
    console.error("[roles:create] failed:", e);
    if (e?.stack) console.error(e.stack);

    // Promote common PG errors to helpful HTTP statuses
    if (e?.code === "23505") {
      // unique_violation
      return res
        .status(409)
        .json({ message: "Role name already exists", code: "DUPLICATE_ROLE" });
    }
    if (e?.code === "23503") {
      // foreign_key_violation (e.g., bad permission key)
      return res.status(422).json({
        ...pgErrorPayload(e),
        code: "FK_VIOLATION",
      });
    }
    if (e?.code === "22P02") {
      // invalid_text_representation
      return res.status(422).json({
        ...pgErrorPayload(e),
        code: "INVALID_INPUT",
      });
    }
    if (e?.code) {
      // Any other PG error
      return res.status(500).json(pgErrorPayload(e));
    }

    // Fallback
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
    if (body.name) {
      if (RESERVED.has(body.name)) {
        return res
          .status(409)
          .json({ message: "Cannot override a system role name", code: "RESERVED_ROLE" });
      }
      const [{ exists }] = (await db.execute(
        sql`SELECT EXISTS(SELECT 1 FROM roles WHERE LOWER(name)=LOWER(${body.name}) AND id<>${id}) AS exists`
      )).rows as any[];
      if (exists) {
        return res
          .status(409)
          .json({ message: "Role name already exists", code: "DUPLICATE_ROLE" });
      }
    }

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
          sql`select count(*)::int as c from role_permissions where role_id = ${id}`
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
