import { Router } from "express";
import { db } from "../db";
import { isAuthenticated } from "../auth";
import { funnels, auditLogs } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { UpsertFunnelZ } from "./validators/funnels";

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

function serializeFunnel(row: typeof funnels.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    ownerUserId: row.ownerUserId,
    tags: row.tags ?? [],
    windowSeconds: row.windowSeconds,
    scope: row.scope,
    dedupe: row.dedupe,
    segmentId: row.segmentId,
    experimentKey: row.experimentKey,
    steps: row.stepsJSON?.steps ?? [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

router.use(isAuthenticated, requireAdmin);

router.get("/", async (_req, res) => {
  const rows = await db.select().from(funnels);
  res.json({ funnels: rows.map(serializeFunnel) });
});

router.post("/", async (req, res) => {
  try {
    const body = UpsertFunnelZ.parse(req.body);
    const [row] = await db
      .insert(funnels)
      .values({
        name: body.name,
        description: body.description ?? null,
        ownerUserId: body.ownerUserId ?? (req.user as any).id,
        tags: body.tags ?? [],
        windowSeconds: body.windowSeconds,
        scope: body.scope,
        dedupe: body.dedupe,
        segmentId: body.segmentId ?? null,
        experimentKey: body.experimentKey ?? null,
        stepsJSON: body.stepsJSON,
      })
      .returning();
    await logAction((req.user as any).id, "funnel_create", { id: row.id });
    res.status(201).json(serializeFunnel(row));
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Failed to create funnel" });
  }
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;
  const [row] = await db.select().from(funnels).where(eq(funnels.id, id));
  if (!row) return res.status(404).json({ message: "Funnel not found" });
  res.json(serializeFunnel(row));
});

router.patch("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const body = UpsertFunnelZ.partial().parse(req.body);
    const update: any = {
      ...(body.name && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.ownerUserId !== undefined && { ownerUserId: body.ownerUserId }),
      ...(body.tags && { tags: body.tags }),
      ...(body.windowSeconds && { windowSeconds: body.windowSeconds }),
      ...(body.scope && { scope: body.scope }),
      ...(body.dedupe && { dedupe: body.dedupe }),
      ...(body.segmentId !== undefined && { segmentId: body.segmentId }),
      ...(body.experimentKey !== undefined && { experimentKey: body.experimentKey }),
      ...(body.stepsJSON && { stepsJSON: body.stepsJSON }),
      updatedAt: new Date(),
    };
    const [row] = await db
      .update(funnels)
      .set(update)
      .where(eq(funnels.id, id))
      .returning();
    if (!row) return res.status(404).json({ message: "Funnel not found" });
    await logAction((req.user as any).id, "funnel_update", { id });
    res.json(serializeFunnel(row));
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
