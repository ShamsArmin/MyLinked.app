import { Router } from "express";
import { db } from "../db";
import { permissions as permTbl } from "../../shared/schema";
import { isAuthenticated as requireAuth } from "../auth";
import { ensureRbac } from "../bootstrap/rbac";

const router = Router();

router.use(requireAuth);
router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

router.get("/", async (_req, res) => {
  try {
    await ensureRbac();
    const list = await db.select().from(permTbl).orderBy(permTbl.group, permTbl.key);
    return res.json(list);
  } catch (e: any) {
    console.error("[permissions:list] failed:", e);
    return res.json([]);
  }
});

export default router;
