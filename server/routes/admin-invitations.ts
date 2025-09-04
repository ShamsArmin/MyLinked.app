import { Router } from "express";
import { isAuthenticated } from "../auth";
import { requireAdmin } from "../security-middleware";
import { db } from "../db";
import { roleInvitations } from "../../shared/schema";

const r = Router();
r.use(isAuthenticated, requireAdmin);

r.get("/", async (_req, res) => {
  try {
    const rows = await db.select().from(roleInvitations).orderBy(roleInvitations.createdAt);
    return res.status(200).json(rows);
  } catch (err: any) {
    if (err.code === "42P01") return res.status(200).json([]);
    console.error("Error fetching invitations:", err);
    return res.status(500).json({ message: "Failed to fetch invitations" });
  }
});

r.post("/", async (_req, res) => {
  return res.status(501).json({ message: "Not implemented" });
});

r.post("/:id/revoke", async (_req, res) => {
  return res.status(501).json({ message: "Not implemented" });
});

export default r;
