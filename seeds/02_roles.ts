import { db } from "../server/db";
import { roles, rolePermissions, permissions } from "../shared/schema";

export async function seedSystemRoles() {
  const systemRoles = [
    { name: "super_admin", displayName: "Super Administrator", description: "Full system access", isSystem: true },
    { name: "admin", displayName: "Administrator", description: "Manage users and roles", isSystem: true },
    { name: "moderator", displayName: "Moderator", description: "Content moderation", isSystem: true },
    { name: "employee", displayName: "Employee", description: "Standard access", isSystem: true },
    { name: "developer", displayName: "Developer", description: "Developer role", isSystem: true },
  ];

  for (const r of systemRoles) {
    const [row] = await db.insert(roles).values(r).onConflictDoNothing().returning();
    if (row) {
      if (row.name === "super_admin") {
        const allPerms = await db.select().from(permissions);
        await db.insert(rolePermissions).values(
          allPerms.map((p) => ({ roleId: row.id, permissionKey: p.key }))
        ).onConflictDoNothing();
      }
      if (row.name === "admin") {
        await db.insert(rolePermissions).values([
          { roleId: row.id, permissionKey: "user_read" },
          { roleId: row.id, permissionKey: "user_write" },
          { roleId: row.id, permissionKey: "role_manage" },
        ]).onConflictDoNothing();
      }
    }
  }
}

