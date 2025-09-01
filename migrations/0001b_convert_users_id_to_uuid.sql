-- 0001b_convert_users_id_to_uuid.sql
-- Convert users.id from integer/identity to UUID with default gen_random_uuid()
-- Idempotent and safe to re-run on an empty DB.

BEGIN;

-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- If users table doesn't exist, do nothing (early exit style checks)
-- (Assumes earlier migrations created the users table.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    RAISE NOTICE 'users table not found, skipping UUID PK migration';
    RETURN;
  END IF;
END
$$;

-- Add a temporary UUID column if it doesn't exist yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id_uuid'
  ) THEN
    ALTER TABLE public.users
      ADD COLUMN id_uuid uuid DEFAULT gen_random_uuid() NOT NULL;
  END IF;
END
$$;

-- Drop current primary key on users (whatever its name is)
DO $$
DECLARE
  pk_name text;
BEGIN
  SELECT conname INTO pk_name
  FROM   pg_constraint
  WHERE  conrelid = 'public.users'::regclass
  AND    contype = 'p';

  IF pk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT %I', pk_name);
  END IF;
END
$$;

-- Add new PK on id_uuid if no PK exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.users'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_pkey PRIMARY KEY (id_uuid);
  END IF;
END
$$;

-- Swap columns: rename old id -> id_int_old, id_uuid -> id (only if not already swapped)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id'
  )
  AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id_uuid'
  )
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id_int_old'
  )
  THEN
    ALTER TABLE public.users RENAME COLUMN id TO id_int_old;
    ALTER TABLE public.users RENAME COLUMN id_uuid TO id;
  END IF;
END
$$;

-- Ensure default on new id column
ALTER TABLE public.users
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Drop the old integer sequence if it exists and drop the old column
DO $$
DECLARE
  seq_name text;
BEGIN
  -- Drop old column if it still exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id_int_old'
  ) THEN
    -- Try to drop any serial/identity sequence tied to id_int_old
    SELECT pg_get_serial_sequence('public.users','id_int_old') INTO seq_name;
    IF seq_name IS NOT NULL THEN
      EXECUTE format('DROP SEQUENCE IF EXISTS %s', seq_name);
    END IF;

    ALTER TABLE public.users DROP COLUMN id_int_old;
  END IF;
END
$$;

COMMIT;
