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
  permissions: PermissionKey[];
  members: number;
}
