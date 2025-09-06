-- Migration: Convert users.id from INTEGER to UUID
-- 1. Ensure gen_random_uuid() is available
-- 2. Drop foreign keys referencing users(id) and convert those columns to UUID
-- 3. Alter users.id column to UUID with default gen_random_uuid()
-- 4. Recreate primary key and foreign keys
-- 5. Drop old integer sequence
-- The migration is idempotent: if users.id is already UUID, it does nothing.

BEGIN;

-- Make sure pgcrypto extension is installed for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
    fk RECORD;
BEGIN
    -- Only run if users.id is still an integer
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'id' AND data_type = 'uuid'
    ) THEN
        -- Store metadata for foreign keys referencing users(id)
        CREATE TEMP TABLE _user_fk AS
        SELECT
            conrelid::regclass AS table_name,
            conname AS constraint_name,
            a.attname AS column_name,
            confdeltype,
            confupdtype
        FROM pg_constraint
        JOIN unnest(conkey) WITH ORDINALITY AS k(attnum, ord) ON TRUE
        JOIN pg_attribute a ON a.attrelid = conrelid AND a.attnum = k.attnum
        WHERE contype = 'f'
          AND confrelid = 'users'::regclass;

        -- Drop FK constraints and convert columns to UUID
        FOR fk IN SELECT * FROM _user_fk LOOP
            EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', fk.table_name, fk.constraint_name);
            EXECUTE format(
                'ALTER TABLE %s ALTER COLUMN %I TYPE uuid USING (NULLIF(TRIM(%I::text), '''')::uuid)',
                fk.table_name, fk.column_name, fk.column_name
            );
        END LOOP;

        -- Change users.id to UUID and set default
        ALTER TABLE users
            ALTER COLUMN id DROP DEFAULT,
            ALTER COLUMN id TYPE uuid USING gen_random_uuid(),
            ALTER COLUMN id SET DEFAULT gen_random_uuid();

        -- Recreate primary key
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;
        ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (id);

        -- Recreate FK constraints with original actions
        FOR fk IN SELECT * FROM _user_fk LOOP
            EXECUTE format(
                'ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES users(id) ON DELETE %s ON UPDATE %s',
                fk.table_name,
                fk.constraint_name,
                fk.column_name,
                CASE fk.confdeltype
                    WHEN 'c' THEN 'CASCADE'
                    WHEN 'n' THEN 'SET NULL'
                    WHEN 'd' THEN 'SET DEFAULT'
                    WHEN 'r' THEN 'RESTRICT'
                    ELSE 'NO ACTION'
                END,
                CASE fk.confupdtype
                    WHEN 'c' THEN 'CASCADE'
                    WHEN 'n' THEN 'SET NULL'
                    WHEN 'd' THEN 'SET DEFAULT'
                    WHEN 'r' THEN 'RESTRICT'
                    ELSE 'NO ACTION'
                END
            );
        END LOOP;

        DROP TABLE _user_fk;

        -- Drop the old serial sequence if it exists
        DROP SEQUENCE IF EXISTS users_id_seq;
    END IF;
END $$;

COMMIT;
