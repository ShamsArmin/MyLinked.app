import { Router } from "express";
import { db } from "../db";
import { permissions as permTbl } from "../../shared/schema";
import { isAuthenticated } from "../auth";
import { ensureRbacSeed } from "../bootstrap/rbacBootstrap";

const router = Router();

router.use(isAuthenticated);
router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

router.get("/", async (_req, res) => {
  try {
    await ensureRbacSeed();
    const list = await db.select().from(permTbl).orderBy(permTbl.group, permTbl.key);
    return res.json(list);
  } catch (e: any) {
    console.error("[permissions:list] failed:", e);
    return res.json([]);
  }
});

export default router;
