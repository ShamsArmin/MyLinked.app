import { Router } from "express";
import { isAuthenticated as requireAuth } from "../auth";
import { ensureRbac } from "../bootstrap/rbac";

const router = Router();

router.post("/api/admin/rbac/repair", requireAuth, async (_req, res) => {
  await ensureRbac();
  res.json({ ok: true });
});

export default router;
