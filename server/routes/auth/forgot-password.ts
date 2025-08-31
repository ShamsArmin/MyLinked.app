import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../../db';
import { sql } from 'drizzle-orm';
import { initMailer, sendPasswordResetEmail } from '../../lib/mailer';

const router = Router();

// simple in-memory rate-limit per IP (best-effort)
const lastReq = new Map<string, number>();
function rateLimited(ip: string, ms: number) {
  const now = Date.now();
  const prev = lastReq.get(ip) || 0;
  if (now - prev < ms) return true;
  lastReq.set(ip, now);
  return false;
}

router.post('/api/auth/forgot-password', async (req, res, next) => {
  try {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '';
    if (rateLimited(ip, 30_000)) return res.status(429).json({ message: 'Too many requests' });

    const { email, username } = req.body || {};
    if (!email && !username) return res.status(400).json({ message: 'email or username is required' });

    // find user by email or username
    const userResult = await db.execute(sql`
      SELECT id, email FROM users
      WHERE ${email ? sql`email = ${email}` : sql`username = ${username}`}
      LIMIT 1
    `);
    const user = userResult.rows?.[0];
    // Don't reveal existence; always reply 200
    if (!user) return res.json({ message: 'If your account exists, you will receive an email shortly.' });

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = sql`NOW() + INTERVAL '30 minutes'`;

    await db.execute(sql`
      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, ip, user_agent)
      VALUES (${user.id}, ${tokenHash}, ${expiresAt}, ${ip}, ${req.headers['user-agent'] || null})
    `);

    const base = process.env.APP_BASE_URL || 'http://localhost:3000';
    const resetUrl = `${base}/reset-password?token=${token}&uid=${user.id}`;

    initMailer();
    await sendPasswordResetEmail(user.email || email, resetUrl);

    return res.json({ message: 'If your account exists, you will receive an email shortly.' });
  } catch (err) {
    return next(err);
  }
});

export default router;
