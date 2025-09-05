export type PermissionKey = string;
export interface PermissionDef {
  key: PermissionKey;
  group: string;
  description?: string;
  label?: string;
}

export interface CreateRolePayload {
  name: string;
  displayName: string;
  description?: string;
  permissions: PermissionKey[];
}

export interface RoleSummary {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
  isSystem: boolean;
  /**
   * Permission keys granted to this role.  Some older API responses used
   * `permissionKeys` instead of `permissions`, so keep both shapes optional
   * to remain backward compatible while the backend deploy rolls out.
   */
  permissions?: PermissionKey[];
  permissionKeys?: PermissionKey[];
  members: number;
}
