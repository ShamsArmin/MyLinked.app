import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../../db';
import { sql } from 'drizzle-orm';
import { hashPassword } from '../../auth/password';

const router = Router();

function verifyHmac(secret: string, payload: string, headerSig: string) {
  const h = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(h), Buffer.from(headerSig));
}

router.post('/api/auth/owner-recovery', async (req, res, next) => {
  try {
    const secret = process.env.OWNER_RECOVERY_SECRET;
    if (!secret) return res.status(503).json({ message: 'OWNER_RECOVERY_SECRET not set' });

    const sig = req.header('x-owner-recovery-sig') || '';
    const ts = req.header('x-owner-recovery-ts') || '';
    const now = Date.now();
    const tsNum = parseInt(ts, 10);
    if (!tsNum || Math.abs(now - tsNum) > 10 * 60 * 1000) {
      return res.status(400).json({ message: 'Invalid timestamp' });
    }

    const bodyStr = JSON.stringify(req.body || {});
    if (!verifyHmac(secret, ts + ':' + bodyStr, sig)) {
      return res.status(401).json({ message: 'Invalid signature' });
    }

    const { username, email, newPassword } = req.body || {};
    if (!newPassword || (!username && !email)) {
      return res.status(400).json({ message: 'newPassword and username or email are required' });
    }

    // Lookup user
    const usrRes = await db.execute(sql`
      SELECT id FROM users
      WHERE ${username ? sql`username = ${username}` : sql`email = ${email}`}
      LIMIT 1
    `);
    const usr = usrRes.rows?.[0];
    if (!usr) return res.status(404).json({ message: 'User not found' });

    const hashed = await hashPassword(newPassword);
    await db.execute(sql`UPDATE users SET password = ${hashed}, updated_at = NOW() WHERE id = ${usr.id}`);

    return res.json({ message: 'Password updated via owner recovery' });
  } catch (err) {
    return next(err);
  }
});

export default router;
