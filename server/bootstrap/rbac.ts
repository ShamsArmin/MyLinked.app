import { db } from "../db";
import { roles, permissions as permTbl, rolePermissions } from "../../shared/schema";
import { sql } from "drizzle-orm";

const LOCK_KEY = 776611231234n;

export async function ensureRbac(): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(${LOCK_KEY});`);
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS permissions (
        key TEXT PRIMARY KEY,
        "group" TEXT NOT NULL,
        description TEXT
      );
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        display_name TEXT NOT NULL,
        description TEXT,
        is_system BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_key TEXT NOT NULL REFERENCES permissions(key) ON DELETE CASCADE,
        PRIMARY KEY (role_id, permission_key)
      );
    `);

    const [{ count: pcount }] = (await db.execute(sql`SELECT COUNT(*)::int AS count FROM permissions`)).rows as any[];
    if (!Number(pcount)) {
      const PERMS: [string, string, string][] = [
        ["user_read", "users", "View users"],
        ["user_write", "users", "Edit users"],
        ["user_delete", "users", "Delete users"],
        ["analytics_view", "analytics", "View analytics"],
        ["funnel_manage", "analytics", "Manage funnels"],
        ["segment_manage", "segments", "Manage segments"],
        ["ab_manage", "experiments", "Manage A/B tests"],
        ["invitation_manage", "admin", "Manage invitations"],
        ["role_manage", "admin", "Manage roles & permissions"],
        ["platform_manage", "platforms", "Manage integrations"],
        ["email_broadcast", "email", "Send email campaigns"],
        ["settings_manage", "settings", "Manage app settings"],
        ["billing_view", "billing", "View billing"],
        ["billing_manage", "billing", "Manage billing"],
      ];
      for (const [key, group, description] of PERMS) {
        await db.insert(permTbl).values({ key, group, description }).onConflictDoNothing();
      }
    }

    const [{ count: rcount }] = (await db.execute(sql`SELECT COUNT(*)::int AS count FROM roles`)).rows as any[];
    if (!Number(rcount)) {
      const SYSTEM = [
        { name: "super_admin", display_name: "Super Administrator", description: "Full system access", is_system: true },
        { name: "admin", display_name: "Administrator", description: "Administrative access", is_system: true },
        { name: "moderator", display_name: "Moderator", description: "Content moderation privileges", is_system: true },
        { name: "employee", display_name: "Employee", description: "Standard employee access", is_system: true },
        { name: "developer", display_name: "Developer", description: "Development team member", is_system: true },
      ];
      for (const r of SYSTEM) {
        const [row] = await db.insert(roles).values({
          name: r.name,
          displayName: r.display_name,
          description: r.description,
          isSystem: r.is_system,
        }).onConflictDoNothing().returning();
        if (row && r.name === "super_admin") {
          const allPerms = await db.select().from(permTbl);
          await db.insert(rolePermissions).values(
            allPerms.map(p => ({ roleId: row.id, permissionKey: p.key }))
          ).onConflictDoNothing();
        }
        if (row && r.name === "admin") {
          for (const k of ["user_read","user_write","role_manage","analytics_view"]) {
            await db.insert(rolePermissions).values({ roleId: row.id, permissionKey: k }).onConflictDoNothing();
          }
        }
      }
    }
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(${LOCK_KEY});`);
  }
}

export default ensureRbac;

