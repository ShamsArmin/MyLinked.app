BEGIN;

-- If links.user_id is already uuid, this will be a no-op; otherwise convert safely.
ALTER TABLE links
  ALTER COLUMN user_id TYPE uuid USING (NULLIF(TRIM(user_id::text), '')::uuid);

-- Ensure not null if your app requires it for ownership (recommended)
-- If you still have legacy rows without owners, skip NOT NULL for now.
-- ALTER TABLE links ALTER COLUMN user_id SET NOT NULL;

-- Add/refresh FK to users(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name='links' AND constraint_type='FOREIGN KEY'
  ) THEN
    ALTER TABLE links
      ADD CONSTRAINT links_user_id_fkey FOREIGN KEY (user_id)
      REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

COMMIT;
