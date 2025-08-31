ALTER TABLE users ADD COLUMN IF NOT EXISTS role varchar(50) DEFAULT 'user';
UPDATE users SET role='admin' WHERE role IS NULL AND is_admin = true;
UPDATE users SET role='user' WHERE role IS NULL;
