import { db } from "../server/db";
import { permissions } from "../shared/schema";

export const PERMISSIONS = [
  { key: "user_read", group: "users", description: "View users" },
  { key: "user_write", group: "users", description: "Edit users" },
  { key: "user_delete", group: "users", description: "Delete users" },
  { key: "analytics_view", group: "analytics", description: "View analytics" },
  { key: "funnel_manage", group: "analytics", description: "Manage funnels" },
  { key: "segment_manage", group: "segments", description: "Manage segments" },
  { key: "ab_manage", group: "experiments", description: "Manage A/B tests" },
  { key: "invitation_manage", group: "admin", description: "Manage invitations" },
  { key: "role_manage", group: "admin", description: "Manage roles & permissions" },
  { key: "settings_manage", group: "settings", description: "App settings" },
];

export async function seedPermissions() {
  for (const p of PERMISSIONS) {
    await db
      .insert(permissions)
      .values({
        name: p.key,
        displayName: p.key,
        description: p.description,
        category: p.group,
      })
      .onConflictDoNothing();
  }
}

if (require.main === module) {
  seedPermissions().then(() => process.exit(0));
}
