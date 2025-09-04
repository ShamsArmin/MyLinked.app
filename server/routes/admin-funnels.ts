import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { isAuthenticated } from "../auth";
import { funnels, insertFunnelSchema, updateFunnelSchema, auditLogs } from "../../shared/schema";
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
  const all = await db.select().from(funnels);
  res.json({ funnels: all });
});

router.post("/", async (req, res) => {
  try {
    const data = insertFunnelSchema.parse(req.body);
    const [funnel] = await db
      .insert(funnels)
      .values({ ...data, ownerUserId: (req.user as any).id })
      .returning();
    await logAction((req.user as any).id, "funnel_create", { id: funnel.id });
    res.status(201).json(funnel);
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Failed to create funnel" });
  }
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;
  const [funnel] = await db.select().from(funnels).where(eq(funnels.id, id));
  if (!funnel) return res.status(404).json({ message: "Funnel not found" });
  res.json(funnel);
});

router.patch("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const data = updateFunnelSchema.parse(req.body);
    const [funnel] = await db
      .update(funnels)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(funnels.id, id))
      .returning();
    if (!funnel) return res.status(404).json({ message: "Funnel not found" });
    await logAction((req.user as any).id, "funnel_update", { id });
    res.json(funnel);
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Failed to update funnel" });
  }
});

router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  await db.delete(funnels).where(eq(funnels.id, id));
  await logAction((req.user as any).id, "funnel_delete", { id });
  res.json({ success: true });
});

export default router;
