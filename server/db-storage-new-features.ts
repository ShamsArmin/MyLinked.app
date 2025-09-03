import { DatabaseStorage as BaseStorage } from './db-storage-updated';
import { db } from './db';
import { industries, users, referralLinks, follows } from '../shared/schema';
import { eq, and, not, sql, desc, or, ilike, inArray, isNotNull } from 'drizzle-orm';
import { InsertIndustry, Industry, InsertReferralLink, ReferralLink, User } from '../shared/schema';

export class EnhancedDatabaseStorage extends BaseStorage {
  // Industry Discovery Feature

  // Get all industries
  async getAllIndustries(): Promise<Industry[]> {
    return await db.select().from(industries).orderBy(industries.name);
  }

  // Create a new industry
  async createIndustry(industry: InsertIndustry): Promise<Industry> {
    const [newIndustry] = await db
      .insert(industries)
      .values(industry)
      .returning();
    return newIndustry;
  }

  // Get similar users based on industry
  async getSimilarUsers(userId: number, industryId: number, limit: number = 10): Promise<User[]> {
    // Get similar users that are not the current user
    const similarUsers = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.industryId, industryId),
          not(eq(users.id, userId))
        )
      )
      .limit(limit);

    return similarUsers;
  }

  // Discover users based on filters
  async discoverUsers(userId: number, filters: any): Promise<User[]> {
    const conditions = [not(eq(users.id, userId))];
    
    // Add filter conditions
    if (filters.industryId) {
      conditions.push(eq(users.industryId, filters.industryId));
    }
    
    if (filters.location) {
      conditions.push(ilike(users.location, `%${filters.location}%`));
    }
    
    if (filters.tags && filters.tags.length > 0) {
      // This is a simplified version since PostgreSQL array operators are complex
      // In a production app, we'd use a more sophisticated query
      conditions.push(isNotNull(users.tags));
    }
    
    // Execute query with all conditions
    return await db
      .select()
      .from(users)
      .where(and(...conditions))
      .limit(20);
  }

  // Check if user is following another user
  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId)
        )
      );
    
    return !!follow;
  }

  // Referral Links Feature

  // Get all referral links for a user
  async getReferralLinks(userId: number): Promise<ReferralLink[]> {
    return await db
      .select()
      .from(referralLinks)
      .where(eq(referralLinks.userId, userId))
      .orderBy(desc(referralLinks.createdAt));
  }

  // Get a specific referral link by ID
  async getReferralLinkById(id: number): Promise<ReferralLink | undefined> {
    const [link] = await db
      .select()
      .from(referralLinks)
      .where(eq(referralLinks.id, id));
    return link;
  }

  // Create a new referral link
  async createReferralLink(userId: number, link: InsertReferralLink): Promise<ReferralLink> {
    const [newLink] = await db
      .insert(referralLinks)
      .values({
        ...link,
        userId,
        updatedAt: new Date()
      })
      .returning();
    return newLink;
  }

  // Update a referral link
  async updateReferralLink(id: number, updates: Partial<InsertReferralLink>): Promise<ReferralLink | undefined> {
    const [updatedLink] = await db
      .update(referralLinks)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(referralLinks.id, id))
      .returning();
    return updatedLink;
  }

  // Delete a referral link
  async deleteReferralLink(id: number): Promise<boolean> {
    const result = await db
      .delete(referralLinks)
      .where(eq(referralLinks.id, id));
    
    return result.rowCount > 0;
  }

  // Increment the clicks on a referral link
  async incrementReferralLinkClicks(id: number): Promise<ReferralLink | undefined> {
    const [updatedLink] = await db
      .update(referralLinks)
      .set({
        clicks: sql`${referralLinks.clicks} + 1`,
        updatedAt: new Date()
      })
      .where(eq(referralLinks.id, id))
      .returning();
    return updatedLink;
  }
}