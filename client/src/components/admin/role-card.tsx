import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RoleSummary } from "@/types/roles";

function humanizePermission(key: string) {
  const map: Record<string, string> = {
    user_read: "View users",
    user_write: "Edit users",
    user_delete: "Delete users",
    analytics_view: "View analytics",
    funnel_manage: "Manage funnels",
    segment_manage: "Manage segments",
    ab_manage: "Manage A/B tests",
    invitation_manage: "Manage invitations",
    role_manage: "Create/edit roles",
    settings_manage: "Manage settings",
    billing_view: "View billing",
    billing_manage: "Manage billing",
  };
  return map[key] ?? key;
}

export default function RoleCard({
  role,
  onEdit,
  onDelete,
}: {
  role: RoleSummary;
  onEdit: () => void;
  onDelete: () => void;
}) {
  // Support both `permissions` and legacy `permissionKeys` arrays so the UI
  // remains stable while the backend deploy propagates.
  const perms = Array.isArray(role.permissions)
    ? role.permissions
    : Array.isArray((role as any).permissionKeys)
    ? ((role as any).permissionKeys as string[])
    : [];
  const shown = perms.slice(0, 4);
  const more = perms.length - shown.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{role.displayName || role.name}</CardTitle>
            {role.description && <CardDescription>{role.description}</CardDescription>}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{role.members} users</Badge>
            {role.isSystem && <Badge variant="secondary">System</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">Permissions:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {shown.map((k) => (
                <Badge key={k} variant="outline" className="text-xs">
                  {humanizePermission(k)}
                </Badge>
              ))}
              {more > 0 && (
                <Badge variant="outline" className="text-xs">
                  +{more} more
                </Badge>
              )}
              {perms.length === 0 && (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button className="btn" onClick={onEdit}>
              Edit
            </button>
            <button className="btn btn-danger" onClick={onDelete}>
              Delete
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
