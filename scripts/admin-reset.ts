/**
 * One-off admin password reset or creation script.
 *
 * Usage:
 *   ADMIN_USERNAME=admin ADMIN_NEW_PASSWORD='Strong.P@ssw0rd' npm run admin:reset
 *   npm run admin:reset -- --username admin --password 'Strong.P@ssw0rd' [--email admin@example.com]
 *
 * Deploy temporarily on Render with:
 *   ADMIN_USERNAME=admin ADMIN_NEW_PASSWORD=Strong.P@ssw0rd npm run admin:reset && npm run start
 * After confirming success, remove the env vars and this script.
 */

import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../server/auth";
import { getUserColumnSet } from "../server/user-columns";
import { randomUUID } from "crypto";

function parseArgs() {
  const args = process.argv.slice(2);
  const out: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if ((arg === "--username" || arg === "-u") && args[i + 1]) {
      out.username = args[++i];
    } else if ((arg === "--password" || arg === "-p") && args[i + 1]) {
      out.password = args[++i];
    } else if ((arg === "--email" || arg === "-e") && args[i + 1]) {
      out.email = args[++i];
    }
  }
  return out;
}

async function main() {
  const flags = parseArgs();
  const username = flags.username || process.env.ADMIN_USERNAME;
  const password = flags.password || process.env.ADMIN_NEW_PASSWORD;
  const email = flags.email || process.env.ADMIN_EMAIL;

  if (!username || !password) {
    console.error("ADMIN_USERNAME and ADMIN_NEW_PASSWORD (or --username/--password) are required");
    process.exit(1);
  }

  const columnSet = await getUserColumnSet(db);
  if (!columnSet.has("password")) {
    console.error("users table missing password column");
    process.exit(1);
  }

  const hashed = await hashPassword(password);

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (existing.length) {
    const user = existing[0];
    const updates: any = { password: hashed, updatedAt: new Date() };
    if (email && columnSet.has("email")) updates.email = email;
    if (columnSet.has("is_admin")) updates.isAdmin = true;
    if (columnSet.has("role")) updates.role = "admin";
    if (columnSet.has("is_active")) updates.isActive = true;

    await db.update(users).set(updates).where(eq(users.id, user.id));
    console.log(`Admin password updated for user '${username}'`);
  } else {
    const insert: any = {
      id: randomUUID(),
      username,
      name: username,
      password: hashed,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    if (email && columnSet.has("email")) insert.email = email;
    if (columnSet.has("is_admin")) insert.isAdmin = true;
    if (columnSet.has("role")) insert.role = "admin";
    if (columnSet.has("is_active")) insert.isActive = true;

    await db.insert(users).values(insert);
    console.log(`Admin user '${username}' created`);
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error("Failed to reset admin password:", err);
  process.exit(1);
});
