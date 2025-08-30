import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db'; // your drizzle instance
import { sql } from 'drizzle-orm';

const router = Router();

// Validation: required + correct shapes
const Schema = z.object({
  targetUserId: z.string().min(1),           // UUID string
  requesterName: z.string().min(1),
  requesterEmail: z.string().email(),
  requesterPhone: z.string().nullable().optional(),
  requesterWebsite: z.string().url().nullable().optional(),
  fieldOfWork: z.string().min(1),
  description: z.string().nullable().optional(),
  linkTitle: z.string().min(1),
  linkUrl: z.string().min(1)
});

router.post('/api/referral-requests', async (req, res, next) => {
  try {
    // If you have auth middleware attaching req.user, keep this check.
    // You can temporarily disable it for manual tests if needed.
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // TEMP instrumentation
    console.log('[referral submit][server] raw body ->', req.body);

    const parsed = Schema.safeParse(req.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map(i => ({
        path: i.path.join('.'),
        message: i.message
      }));
      console.warn('[referral submit][server] validation failed', details);
      return res.status(400).json({
        message: 'Missing or invalid fields',
        details
      });
    }

    const p = parsed.data;

    // camelCase -> snake_case
    const row = {
      target_user_id: p.targetUserId,
      requester_name: p.requesterName,
      requester_email: p.requesterEmail,
      requester_phone: p.requesterPhone ?? null,
      requester_website: p.requesterWebsite ?? null,
      field_of_work: p.fieldOfWork,
      description: p.description ?? null,
      link_title: p.linkTitle,
      link_url: p.linkUrl,
      status: 'pending'
    };

    await db.execute(sql`
      INSERT INTO referral_requests (
        target_user_id, requester_name, requester_email, requester_phone,
        requester_website, field_of_work, description, link_title, link_url, status
      ) VALUES (
        ${row.target_user_id}, ${row.requester_name}, ${row.requester_email}, ${row.requester_phone},
        ${row.requester_website}, ${row.field_of_work}, ${row.description}, ${row.link_title}, ${row.link_url}, ${row.status}
      )
    `);

    return res.status(201).json({ message: 'Referral request submitted' });
  } catch (err) {
    return next(err);
  }
});

export default router;
