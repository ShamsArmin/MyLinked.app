import { Router } from "express";
import { db } from "../db";
import { permissions } from "../../shared/schema";
import { isAuthenticated } from "../auth";
import { requireAdmin } from "../require-admin";

const router = Router();
router.use(isAuthenticated, requireAdmin("role_manage"));

router.get("/", async (_req, res) => {
  const list = await db.select().from(permissions).orderBy(permissions.group);
  return res.json(list);
});

export default router;
