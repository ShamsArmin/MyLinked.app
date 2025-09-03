/**
 * One-off factory reset for admin accounts.
 *
 * Usage examples:
 *   NEW_ADMIN_USERNAME=admin NEW_ADMIN_PASSWORD='Strong.P@ssw0rd!' ADMIN_FACTORY_RESET_CONFIRM=YES npm run admin:factory-reset
 *   npm run admin:factory-reset -- --username admin --password 'Strong.P@ssw0rd!' --email admin@example.com
 *
 * Run once on Render with Start Command:
 *   npm run admin:factory-reset && npm run migrate && npm run start
 * Then remove the env vars and this script.
 */

import crypto from 'crypto';
import { pool } from '../server/db';
import { hashPassword } from '../server/auth/password';

function getFlag(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  const confirm = process.env.ADMIN_FACTORY_RESET_CONFIRM;
  if (confirm !== 'YES') {
    console.error('Refusing to run: set ADMIN_FACTORY_RESET_CONFIRM=YES');
    process.exit(1);
  }

  const username = process.env.NEW_ADMIN_USERNAME || getFlag('--username');
  const password = process.env.NEW_ADMIN_PASSWORD || getFlag('--password');
  const email = process.env.NEW_ADMIN_EMAIL || getFlag('--email') || null;

  if (!username || !password) {
    console.error('Missing NEW_ADMIN_USERNAME/--username or NEW_ADMIN_PASSWORD/--password');
    process.exit(1);
  }

  const client = await pool.connect();

  // Schema column names
  const USERS_TABLE = 'users';
  const COL_ID = 'id';
  const COL_USERNAME = 'username';
  const COL_EMAIL = 'email';
  const COL_PASS = 'password';
  const COL_ROLE = 'role';
  const COL_IS_ADMIN = 'is_admin';
  const COL_NAME = 'name';
  const COL_IS_ACTIVE = 'is_active';
  const COL_UPDATED_AT = 'updated_at';
  const COL_CREATED_AT = 'created_at';
  const adminWhere = `(${COL_ROLE} = 'admin' OR ${COL_IS_ADMIN} = true)`;

  try {
    await client.query('BEGIN');

    const ts = Date.now().toString();
    const junkHash = await hashPassword(crypto.randomUUID() + ts);

    const demoteSql = `UPDATE ${USERS_TABLE}
      SET ${COL_ROLE} = 'user',
          ${COL_IS_ADMIN} = false,
          ${COL_USERNAME} = ${COL_USERNAME} || '-old-' || $1,
          ${COL_PASS} = $2,
          ${COL_EMAIL} = CASE WHEN ${COL_EMAIL} IS NOT NULL THEN split_part(${COL_EMAIL}, '@', 1) || '+old-' || $1 || '@invalid.local' ELSE NULL END,
          ${COL_IS_ACTIVE} = false,
          ${COL_UPDATED_AT} = NOW()
      WHERE ${adminWhere}`;
    await client.query(demoteSql, [ts, junkHash]);

    const hashed = await hashPassword(password);

    const updateRes = await client.query(
      `UPDATE ${USERS_TABLE}
         SET ${COL_PASS} = $2,
             ${COL_ROLE} = 'admin',
             ${COL_IS_ADMIN} = true,
             ${COL_EMAIL} = COALESCE($3, ${COL_EMAIL}),
             ${COL_IS_ACTIVE} = true,
             ${COL_UPDATED_AT} = NOW()
       WHERE ${COL_USERNAME} = $1
       RETURNING ${COL_ID}`,
      [username, hashed, email]
    );

    if (updateRes.rowCount === 0) {
      const newId = crypto.randomUUID();
      const cols = [COL_ID, COL_USERNAME, COL_PASS, COL_NAME];
      const vals = ['$1', '$2', '$3', '$4'];
      const params: any[] = [newId, username, hashed, username];
      if (email) {
        cols.push(COL_EMAIL);
        vals.push('$5');
        params.push(email);
      }
      cols.push(COL_ROLE, COL_IS_ADMIN, COL_IS_ACTIVE, COL_CREATED_AT, COL_UPDATED_AT);
      vals.push("'admin'", 'true', 'true', 'NOW()', 'NOW()');
      const insertSql = `INSERT INTO ${USERS_TABLE} (${cols.join(', ')}) VALUES (${vals.join(', ')})`;
      await client.query(insertSql, params);
    }

    await client.query('COMMIT');
    console.log(`✅ Admin factory reset complete. New admin username: "${username}"`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Admin factory reset failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
