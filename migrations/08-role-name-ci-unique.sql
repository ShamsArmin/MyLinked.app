-- Ensure case-insensitive uniqueness for role names
CREATE UNIQUE INDEX IF NOT EXISTS roles_name_ci_unique ON roles (LOWER(name));
