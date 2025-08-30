// run-migrations.mjs
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    if (files.length === 0) {
      console.log('No migration files found in /migrations.');
      return;
    }

    console.log('Running migrations:');
    for (const f of files) console.log(' -', f);
    console.log('-'.repeat(80));

    await pool.query('BEGIN');
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log(`Applying ${file} ...`);
      await pool.query(sql);
    }
    await pool.query('COMMIT');
    console.log('-'.repeat(80));
    console.log('All migrations applied successfully!');
  } catch (err) {
    try { await pool.query('ROLLBACK'); } catch {}
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
