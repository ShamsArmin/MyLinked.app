/**
 * Example:
 *   npm run admins:list
 */
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function hasColumn(table: string, column: string): Promise<boolean> {
  const res = await pool.query(
    'SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name=$2',
    [table, column]
  );
  return res.rowCount > 0;
}

async function main() {
  try {
    const roleExists = await hasColumn('users', 'role');
    const isAdminExists = await hasColumn('users', 'is_admin');
    const usernameColumn = (await hasColumn('users', 'username')) ? 'username' : 'email';

    const conditions: string[] = [];
    const params: any[] = [];
    if (roleExists) {
      params.push('admin');
      conditions.push(`role = $${params.length}`);
    }
    if (isAdminExists) {
      params.push(true);
      conditions.push(`is_admin = $${params.length}`);
    }

    if (conditions.length === 0) {
      console.log('No admin columns found');
      return;
    }

    const query = `SELECT id, ${usernameColumn} AS username, email, created_at FROM users WHERE ${conditions.join(' OR ')} LIMIT 100`;
    const { rows } = await pool.query(query, params);

    for (const row of rows) {
      const created = row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at;
      console.log(`${row.id}\t${row.username}\t${row.email}\t${created}`);
    }
  } catch (err) {
    console.error('Failed to list admins:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

void main();
