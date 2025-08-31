// run-migrations.mjs
import pg from 'pg';
const { Pool } = pg;
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Duplicate/idempotent error codes we safely ignore and mark as applied
const DUPLICATE_CODES = new Set([
  '42701', // duplicate_column
  '42P07', // duplicate_table
  '42710'  // duplicate_object (index/constraint)
]);

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

async function ensureMigrationsTable(pool) {
  // Create table if missing (minimal shape), then bring it up to date
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY
    );
  `);

  // Add columns if they don't exist (handles older tables gracefully)
  await pool.query(`ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS checksum TEXT;`);
  await pool.query(`
    ALTER TABLE schema_migrations
    ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);
}

async function getAppliedSet(pool) {
  const { rows } = await pool.query(`SELECT filename FROM schema_migrations`);
  return new Set(rows.map(r => r.filename));
}

async function markApplied(pool, filename, checksum) {
  // After ensureMigrationsTable, checksum exists; insert defensively
  await pool.query(
    `INSERT INTO schema_migrations (filename, checksum)
     VALUES ($1, $2)
     ON CONFLICT (filename) DO NOTHING`,
    [filename, checksum]
  );
}

async function runMigration() {
  if (!process.env.DATABASE_URL && !(process.env.PGHOST && process.env.PGUSER)) {
    console.error('DATABASE_URL or PG* variables must be set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    host: process.env.PGHOST,
    port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
  });

  try {
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    if (files.length === 0) {
      console.log('No migration files found in /migrations.');
      return;
    }

    await ensureMigrationsTable(pool);
    const applied = await getAppliedSet(pool);

    console.log('Running migrations:');
    for (const f of files) console.log(' -', f);
    console.log('-'.repeat(80));

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`Skipping ${file}; already applied.`);
        continue;
      }

      const fullPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(fullPath, 'utf8');
      const checksum = sha256(sql);

      console.log(`Applying ${file} ...`);
      await pool.query('BEGIN');

      try {
        await pool.query(sql);
        await markApplied(pool, file, checksum);
        await pool.query('COMMIT');
      } catch (err) {
        if (err && err.code && DUPLICATE_CODES.has(err.code)) {
          console.warn(`Warning: ${file} raised ${err.code} (already exists). Marking as applied and continuing.`);
          try {
            await markApplied(pool, file, checksum);
            await pool.query('COMMIT');
          } catch (markErr) {
            try { await pool.query('ROLLBACK'); } catch {}
            throw markErr;
          }
          continue;
        }

        try { await pool.query('ROLLBACK'); } catch {}
        throw err;
      }
    }

    console.log('-'.repeat(80));
    console.log('All migrations applied successfully!');
  } catch (err) {
    console.error('Error running migrations:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});

