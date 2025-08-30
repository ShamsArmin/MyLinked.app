import { Router } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';

const router = Router();

router.get('/api/referral-requests/inbox', async (req, res, next) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' });

    const targetUserId = req.user.id as string;
    const status = (req.query.status as string) || 'pending';
    const limit = Math.max(1, Math.min(parseInt((req.query.limit as string) || '10', 10) || 10, 50));

    const countResult = await db.execute(sql`
      SELECT COUNT(*)::int AS count
      FROM referral_requests
      WHERE target_user_id = ${targetUserId} AND status = ${status}
    `);
    const count = countResult.rows?.[0]?.count ?? 0;

    const itemsResult = await db.execute(sql`
      SELECT
        id,
        requester_name,
        requester_email,
        link_title,
        created_at
      FROM referral_requests
      WHERE target_user_id = ${targetUserId} AND status = ${status}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `);

    return res.json({
      count,
      items: itemsResult.rows ?? []
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
