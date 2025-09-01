-- 0001b_fix_links_user_id_integer.sql
-- Align links.user_id to users.id (integer) and add FK.

BEGIN;

-- Ensure links table & user_id column exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='links'
  ) THEN
    RAISE NOTICE 'links table not found; skipping migration.';
    RETURN;
  END IF;
END$$;

-- Drop old FK if present (from previous attempts)
DO $$
DECLARE
  fk_name text;
BEGIN
  SELECT conname INTO fk_name
  FROM pg_constraint
  WHERE conrelid='public.links'::regclass AND contype='f' AND conname='links_user_id_users_id_fk';
  IF fk_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.links DROP CONSTRAINT ' || quote_ident(fk_name);
  END IF;
END$$;

-- If links.user_id is uuid, convert to integer (assuming no data yet)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='links' AND column_name='user_id' AND data_type='uuid'
  ) THEN
    ALTER TABLE public.links
      ALTER COLUMN user_id DROP DEFAULT,
      ALTER COLUMN user_id TYPE integer USING NULL, -- set to NULL on convert (no data assumed)
      ALTER COLUMN user_id DROP NOT NULL; -- allow nulls to avoid failures
  END IF;
END$$;

-- Ensure the column exists and is integer
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='links' AND column_name='user_id'
  ) THEN
    ALTER TABLE public.links ADD COLUMN user_id integer;
  ELSE
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='links' AND column_name='user_id' AND data_type <> 'integer'
    ) THEN
      ALTER TABLE public.links
        ALTER COLUMN user_id TYPE integer USING user_id::integer;
    END IF;
  END IF;
END$$;

-- Add the FK (NOT VALID first, then validate to avoid long locks)
ALTER TABLE public.links
  ADD CONSTRAINT links_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES public.users(id) NOT VALID;

ALTER TABLE public.links VALIDATE CONSTRAINT links_user_id_users_id_fk;

COMMIT;
