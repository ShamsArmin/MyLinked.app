/**
 * WARNING: This internal route is disabled by default.
 * Enable only for emergency admin password recovery when ADMIN_RECOVERY_TOKEN is set.
 * The route self-disables after a single successful request.
 */

import { Router } from "express";
import { db } from "../db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../auth";
import { getUserColumnSet } from "../user-columns";
import { randomUUID } from "crypto";

const router = Router();
let enabled = Boolean(process.env.ADMIN_RECOVERY_TOKEN);

router.post("/internal/admin-reset", async (req, res) => {
  if (!enabled) return res.status(404).end();

  const token = req.get("x-admin-recovery-token");
  if (!process.env.ADMIN_RECOVERY_TOKEN || token !== process.env.ADMIN_RECOVERY_TOKEN) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { username, password, email } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: "username and password required" });
  }

  const columnSet = await getUserColumnSet(db);
  if (!columnSet.has("password")) {
    return res.status(500).json({ message: "users table missing password column" });
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
  }

  enabled = false; // self-disable after one use
  return res.json({ message: `Admin password reset for '${username}'` });
});

export default router;
