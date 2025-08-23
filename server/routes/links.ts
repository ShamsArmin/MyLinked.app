import { Router } from "express";
import { isAuthenticated } from "../auth";
import { storage } from "../storage";
import { z } from "zod";

export const linksRouter = Router();

const createLinkSchema = z.object({
  platform: z.string().min(1),
  title: z.string().min(1),
  url: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
  featured: z.boolean().optional(),
});

// GET current user's links with legacy self-heal
linksRouter.get("/", isAuthenticated, async (req, res) => {
  try {
    const userId = Number((req as any).user.id);

    await storage.backfillLinksForUser(userId);

    const list = await storage.getLinks(userId);
    return res.json(list);
  } catch (e) {
    console.error("GET /api/links error:", e);
    return res.status(500).json({ message: "Failed to load links" });
  }
});

// CREATE a new link enforcing ownership
linksRouter.post("/", isAuthenticated, async (req, res) => {
  try {
    const userId = Number((req as any).user.id);
    const data = createLinkSchema.parse(req.body);

    const created = await storage.createLink(userId, {
      ...data,
      userId,
    } as any);

    return res.status(201).json(created);
  } catch (e: any) {
    if (e?.issues) {
      return res
        .status(400)
        .json({ message: "Invalid payload", errors: e.issues });
    }
    console.error("POST /api/links error:", e);
    return res.status(500).json({ message: "Failed to create link" });
  }
});

// DELETE a link with safe legacy handling
linksRouter.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    const userId = Number((req as any).user.id);
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Invalid link id" });
    }

    const link = await storage.getLinkById(id);
    if (!link) {
      return res.status(404).json({ message: "Link not found" });
    }

    if (link.userId != null && Number(link.userId) !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this link" });
    }

    const ok = await storage.deleteLinkOwned(id, userId);
    if (!ok) {
      return res.status(500).json({ message: "Delete failed" });
    }
    return res.status(204).send();
  } catch (e) {
    console.error("DELETE /api/links/:id error:", e);
    return res.status(500).json({ message: "Failed to delete link" });
  }
});

export default linksRouter;
