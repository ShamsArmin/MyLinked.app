import { db } from "../server/db";
import { roles } from "../shared/schema";
import { PERMISSIONS } from "./01_permissions";

export async function seedSystemRoles() {
  const systemRoles = [
    { name: "super_admin", displayName: "Super Administrator", description: "Full system access", isSystem: true, permissions: PERMISSIONS.map(p => p.key) },
    { name: "admin", displayName: "Administrator", description: "Manage users and roles", isSystem: true, permissions: ["user_read", "user_write", "role_manage"] },
    { name: "moderator", displayName: "Moderator", description: "Content moderation", isSystem: true, permissions: ["user_read", "user_write"] },
    { name: "employee", displayName: "Employee", description: "Standard access", isSystem: true, permissions: ["user_read"] },
    { name: "developer", displayName: "Developer", description: "Developer role", isSystem: true, permissions: ["user_read", "analytics_view"] },
  ];

  for (const r of systemRoles) {
    await db.insert(roles).values(r).onConflictDoNothing();
  }
}

if (require.main === module) {
  seedSystemRoles().then(() => process.exit(0));
}
