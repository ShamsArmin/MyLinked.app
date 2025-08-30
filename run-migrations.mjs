// run-migrations.mjs
import pg from 'pg';
const { Pool } = pg;
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
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const appliedRes = await pool.query('SELECT filename FROM schema_migrations');
    const applied = new Set(appliedRes.rows.map((r) => r.filename));

    const toRun = files.filter((f) => !applied.has(f));

    if (toRun.length === 0) {
      console.log('No new migration files found.');
      return;
    }

    console.log('Running migrations:');
    for (const f of toRun) console.log(' -', f);
    console.log('-'.repeat(80));

    for (const file of toRun) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log(`Applying ${file} ...`);
      try {
        await pool.query('BEGIN');
        await pool.query(sql);
        await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await pool.query('COMMIT');
      } catch (err) {
        await pool.query('ROLLBACK');
        if (err.code === '42P07' || err.code === '42710') {
          console.log(`Skipping ${file}; already applied.`);
          await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING', [file]);
        } else {
          throw err;
        }
      }
    }

    console.log('-'.repeat(80));
    console.log('Migrations complete!');
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
