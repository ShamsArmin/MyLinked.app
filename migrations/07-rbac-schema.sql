-- RBAC schema migration
BEGIN;

-- drop existing mapping table if any
DROP TABLE IF EXISTS role_permissions;

-- adjust roles table: remove old permissions array column
ALTER TABLE IF EXISTS roles DROP COLUMN IF EXISTS permissions;

-- drop and recreate permissions table to match new structure
DROP TABLE IF EXISTS permissions;
CREATE TABLE permissions (
  key text PRIMARY KEY,
  "group" text NOT NULL,
  description text
);

-- create role_permissions table
CREATE TABLE role_permissions (
  role_id integer NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_key text NOT NULL REFERENCES permissions(key) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_key)
);

-- drop and recreate user_roles table
DROP TABLE IF EXISTS user_roles;
CREATE TABLE user_roles (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id integer NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  PRIMARY KEY (user_id)
);
CREATE INDEX user_roles_role_idx ON user_roles(role_id);

COMMIT;
