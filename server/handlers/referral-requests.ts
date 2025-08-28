import { Request, Response } from "express";
import { z } from "zod";
import { and, eq, gt } from "drizzle-orm";
import { db } from "../db";
import { storage } from "../storage";
import { referralRequests } from "../../shared/schema";

const referralRequestSchema = z.object({
  requesterName: z.string().min(1),
  requesterEmail: z.string().email(),
  requesterPhone: z.string().optional(),
  requesterWebsite: z.string().optional(),
  fieldOfWork: z.string().min(1),
  description: z.string().min(1),
  linkTitle: z.string().min(1),
  linkUrl: z.string().min(1),
  targetUserId: z.string().uuid(),
  note: z.string().optional(),
});

export async function createReferralRequestHandler(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const data = referralRequestSchema.parse(req.body ?? {});

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const existingRequest = await db.query.referralRequests.findFirst({
      where: and(
        eq(referralRequests.requesterEmail, data.requesterEmail),
        eq(referralRequests.targetUserId, data.targetUserId),
        eq(referralRequests.linkUrl, data.linkUrl),
        gt(referralRequests.createdAt, tenMinutesAgo),
      ),
    });

    if (existingRequest) {
      return res.status(429).json({
        message:
          "You have already submitted a similar request recently. Please wait 10 minutes before submitting again.",
      });
    }

    const referralRequest = await storage.createReferralRequest({ ...data });
    return res.status(201).json({
      message: "Referral request sent successfully",
      id: referralRequest.id,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(422).json({
        message: "Validation error",
        errors: err.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
      });
    }
    console.error("createReferralRequest error", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
