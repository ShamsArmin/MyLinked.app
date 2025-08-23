import { Router } from "express";
import { isAuthenticated } from "../auth";
import { storage } from "../storage";
import { z } from "zod";

export const linksRouter = Router();

// GET current user's links
linksRouter.get("/", isAuthenticated, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const list = await storage.getLinks(userId);
    return res.json(list);
  } catch (e) {
    console.error("GET /api/links error:", e);
    return res.status(500).json({ message: "Failed to load links" });
  }
});

// DELETE a link (must belong to current user)
linksRouter.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Invalid link id" });
    }

    // Fetch link to verify ownership
    const link = await storage.getLinkById(id);
    if (!link) {
      return res.status(404).json({ message: "Link not found" });
    }
    if (link.userId !== userId) {
      console.warn("DELETE /api/links unauthorized", { userId, linkOwner: link.userId, id });
      return res.status(403).json({ message: "Not authorized to delete this link" });
    }

    // Delete with user filter to be safe
    const ok = await storage.deleteLink(id, userId);
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
