export type PermissionDef = { key: string; group?: string };
export interface CreateRolePayload {
  name: string;
  displayName: string;
  description?: string;
  permissions: string[]; // backend keys only
}
