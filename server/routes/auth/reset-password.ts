import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../../db';
import { sql } from 'drizzle-orm';
import { hashPassword } from '../../auth/password';

const router = Router();

router.post('/api/auth/reset-password', async (req, res, next) => {
  try {
    const { uid, token, newPassword } = req.body || {};
    if (!uid || !token || !newPassword) {
      return res.status(400).json({ message: 'uid, token, and newPassword are required' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find a valid, unused token
    const tokRes = await db.execute(sql`
      SELECT id, expires_at, used_at
      FROM password_reset_tokens
      WHERE user_id = ${uid} AND token_hash = ${tokenHash}
      LIMIT 1
    `);
    const row = tokRes.rows?.[0];
    if (!row) return res.status(400).json({ message: 'Invalid token' });

    // Check expiry / used
    const isUsed = row.used_at != null;
    const isExpired = new Date(row.expires_at) < new Date();
    if (isUsed || isExpired) {
      return res.status(400).json({ message: 'Token expired or already used' });
    }

    // Update password
    const hashed = await hashPassword(newPassword);
    // NOTE: adjust COL_PASS to your actual column ('password' or 'password_hash')
    await db.execute(sql`UPDATE users SET password = ${hashed}, updated_at = NOW() WHERE id = ${uid}`);

    // Mark token used
    await db.execute(sql`UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ${row.id}`);

    // (optional) Invalidate sessions here if you store them in DB

    return res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    return next(err);
  }
});

export default router;
