import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load all .sql files from the current directory in lexical order
const migrationFiles = fs
  .readdirSync(__dirname)
  .filter((file) => file.endsWith('.sql'))
  .sort();

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Run all migrations inside a single transaction
    await pool.query('BEGIN');

    for (const file of migrationFiles) {
      const migrationPath = path.join(__dirname, file);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      console.log(`Running migration: ${file}`);
      await pool.query(migrationSQL);
    }

    await pool.query('COMMIT');
    console.log('All migrations applied successfully!');
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error running migration:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});