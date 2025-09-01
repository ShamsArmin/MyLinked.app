-- 0001c_fix_links_user_id_uuid.sql
-- Make links.user_id a UUID to match users.id, then add FK.

BEGIN;

-- Ensure links table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'links'
  ) THEN
    RAISE NOTICE 'links table not found; skipping migration.';
    RETURN;
  END IF;
END
$$;

-- Drop existing FK if present (from prior attempts)
DO $$
DECLARE
  fk_name text;
BEGIN
  SELECT conname INTO fk_name
  FROM pg_constraint
  WHERE conrelid = 'public.links'::regclass
    AND contype  = 'f'
    AND conname  = 'links_user_id_users_id_fk';

  IF fk_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.links DROP CONSTRAINT ' || quote_ident(fk_name);
  END IF;
END
$$;

-- Ensure the user_id column exists, and convert it to UUID if needed.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='links' AND column_name='user_id'
  ) THEN
    -- if missing entirely, create as uuid (nullable, no default)
    ALTER TABLE public.links ADD COLUMN user_id uuid;
  ELSE
    -- if it exists but is not uuid, convert to uuid; since there is no data we safely set NULLs
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='links' AND column_name='user_id' AND data_type <> 'uuid'
    ) THEN
      ALTER TABLE public.links
        ALTER COLUMN user_id DROP DEFAULT,
        ALTER COLUMN user_id TYPE uuid USING NULL,
        ALTER COLUMN user_id DROP NOT NULL;
    END IF;
  END IF;
END
$$;

-- Add the FK (NOT VALID first, then validate)
ALTER TABLE public.links
  ADD CONSTRAINT links_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES public.users(id) NOT VALID;

ALTER TABLE public.links VALIDATE CONSTRAINT links_user_id_users_id_fk;

COMMIT;
