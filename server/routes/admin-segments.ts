import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { isAuthenticated } from "../auth";
import { segments, insertSegmentSchema, updateSegmentSchema, auditLogs } from "../../shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

function requireAdmin(req: any, res: any, next: any) {
  const user = req.user as any;
  const role = user?.role;
  if (!user || (!user.isAdmin && role !== "admin" && role !== "super_admin")) {
    return res.status(403).json({ message: "Administrator privileges required" });
  }
  next();
}

async function logAction(actorId: string, action: string, payload?: any) {
  await db.insert(auditLogs).values({ actorId, action, payload });
}

router.use(isAuthenticated, requireAdmin);

router.get("/", async (_req, res) => {
  const all = await db.select().from(segments);
  res.json({ segments: all });
});

router.post("/", async (req, res) => {
  try {
    const data = insertSegmentSchema.parse(req.body);
    const [segment] = await db
      .insert(segments)
      .values({ ...data, ownerUserId: (req.user as any).id })
      .returning();
    await logAction((req.user as any).id, "segment_create", { id: segment.id });
    res.status(201).json(segment);
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Failed to create segment" });
  }
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;
  const [segment] = await db.select().from(segments).where(eq(segments.id, id));
  if (!segment) return res.status(404).json({ message: "Segment not found" });
  res.json(segment);
});

router.patch("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const data = updateSegmentSchema.parse(req.body);
    const [segment] = await db
      .update(segments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(segments.id, id))
      .returning();
    if (!segment) return res.status(404).json({ message: "Segment not found" });
    await logAction((req.user as any).id, "segment_update", { id });
    res.json(segment);
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Failed to update segment" });
  }
});

router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  await db.delete(segments).where(eq(segments.id, id));
  await logAction((req.user as any).id, "segment_delete", { id });
  res.json({ success: true });
});

export default router;
