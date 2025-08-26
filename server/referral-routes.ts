import { Router, Request, Response } from 'express';
import { storage } from './storage';
import { insertReferralLinkSchema } from '../shared/schema';

export const referralRouter = Router();

// Middleware to check if user is authenticated
function isAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Not authenticated' });
}

// Get all referral links for the authenticated user
referralRouter.get("/referral-links", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string | undefined;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const referralLinks = await storage.getReferralLinks(userId);
    res.json(referralLinks);
  } catch (error) {
    console.error('Error fetching referral links:', error);
    res.status(500).json({ message: 'Failed to fetch referral links' });
  }
});

// Get a specific referral link
referralRouter.get("/referral-links/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string | undefined;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const referralLink = await storage.getReferralLinkById(Number(id));
    
    if (!referralLink) {
      return res.status(404).json({ message: 'Referral link not found' });
    }

    if (referralLink.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to access this referral link' });
    }

    res.json(referralLink);
  } catch (error) {
    console.error('Error fetching referral link:', error);
    res.status(500).json({ message: 'Failed to fetch referral link' });
  }
});

// Create a new referral link
referralRouter.post("/referral-links", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string | undefined;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const validatedData = insertReferralLinkSchema.parse(req.body);
    const referralLink = await storage.createReferralLink(userId, validatedData);
    
    res.status(201).json(referralLink);
  } catch (error) {
    console.error('Error creating referral link:', error);
    res.status(400).json({ message: 'Failed to create referral link' });
  }
});

// Update a referral link
referralRouter.patch("/referral-links/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string | undefined;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // First check if the link exists and belongs to the user
    const existingLink = await storage.getReferralLinkById(Number(id));
    
    if (!existingLink) {
      return res.status(404).json({ message: 'Referral link not found' });
    }

    if (existingLink.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this referral link' });
    }

    const updatedLink = await storage.updateReferralLink(Number(id), req.body);
    res.json(updatedLink);
  } catch (error) {
    console.error('Error updating referral link:', error);
    res.status(400).json({ message: 'Failed to update referral link' });
  }
});

// Delete a referral link
referralRouter.delete("/referral-links/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string | undefined;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // First check if the link exists and belongs to the user
    const existingLink = await storage.getReferralLinkById(Number(id));
    
    if (!existingLink) {
      return res.status(404).json({ message: 'Referral link not found' });
    }

    if (existingLink.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this referral link' });
    }

    const success = await storage.deleteReferralLink(Number(id));
    
    if (success) {
      res.status(200).json({ message: 'Successfully deleted referral link' });
    } else {
      res.status(500).json({ message: 'Failed to delete referral link' });
    }
  } catch (error) {
    console.error('Error deleting referral link:', error);
    res.status(400).json({ message: 'Failed to delete referral link' });
  }
});

// Track referral link click (for analytics)
referralRouter.post("/referral-links/:id/click", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const referralLink = await storage.getReferralLinkById(Number(id));
    
    if (!referralLink) {
      return res.status(404).json({ message: 'Referral link not found' });
    }

    // Increment the click count
    const updatedLink = await storage.incrementReferralLinkClicks(Number(id));
    res.json(updatedLink);
  } catch (error) {
    console.error('Error tracking referral link click:', error);
    res.status(500).json({ message: 'Failed to track referral link click' });
  }
});

// Track referral link click (for redirects)
referralRouter.get("/r/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const referralLink = await storage.getReferralLinkById(Number(id));
    
    if (!referralLink) {
      return res.status(404).json({ message: 'Referral link not found' });
    }

    // Increment the click count
    await storage.incrementReferralLinkClicks(Number(id));
    
    // Redirect to the target URL
    res.redirect(referralLink.url);
  } catch (error) {
    console.error('Error tracking referral link click:', error);
    res.status(500).json({ message: 'Failed to process referral link' });
  }
});