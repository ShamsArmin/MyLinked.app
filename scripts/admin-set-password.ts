/**
 * Examples:
 *   TARGET_USERNAME=Armintest NEW_PASSWORD='Strong.P@ssw0rd' npm run admin:set-password
 *   npm run admin:set-password -- --username Armintest --password 'Strong.P@ssw0rd'
 */
import { Pool } from 'pg';
import { hashPassword } from '../server/auth/password';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function parseArgs() {
  const args = process.argv.slice(2);
  let username = process.env.TARGET_USERNAME;
  let password = process.env.NEW_PASSWORD;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--username' || arg === '--user') {
      username = args[++i];
    } else if (arg === '--password' || arg === '--pass') {
      password = args[++i];
    }
  }
  return { username, password };
}

async function hasColumn(table: string, column: string): Promise<boolean> {
  const res = await pool.query(
    'SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name=$2',
    [table, column]
  );
  return res.rowCount > 0;
}

async function main() {
  const { username, password } = parseArgs();
  if (!username || !password) {
    console.error('Username and password are required');
    process.exit(1);
  }
  try {
    const usernameColumn = (await hasColumn('users', 'username')) ? 'username' : 'email';
    const passwordColumn = (await hasColumn('users', 'password')) ? 'password' : 'password_hash';
    const hashed = await hashPassword(password);
    const query = `UPDATE users SET ${passwordColumn} = $1 WHERE ${usernameColumn} = $2`;
    const { rowCount } = await pool.query(query, [hashed, username]);
    if (rowCount === 0) {
      console.error('User not found');
      process.exit(1);
    }
    console.log(`Password updated for ${username}`);
  } catch (err) {
    console.error('Failed to set password:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

void main();
