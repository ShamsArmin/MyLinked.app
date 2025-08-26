import { db, isDbAvailable, setDbEnabled } from './db';
import { 
  users, links, profileViews, follows, socialPosts, socialConnections,
  spotlightProjects, spotlightContributors, spotlightTags,
  industries, referralLinks, instagramPreviews,
  systemLogs, featureToggles, referralRequests,
  userReports, passwordResetTokens, collaborationRequests,
  collaborationRequestsNotifications,
  type User, type InsertUser, type UpdateUser,
  type Link, type UpdateLink,
  type SocialPost, type InsertSocialPost,
  type SocialConnection, type InsertSocialConnection,
  type Follow, type InsertFollow,
  type ProfileStats,
  type SpotlightProject, type InsertSpotlightProject,
  type SpotlightContributor, type InsertContributor,
  type SpotlightTag, type InsertTag,
  type Industry, type InsertIndustry,
  type ReferralLink, type InsertReferralLink,
  type InstagramPreview, type InsertInstagramPreview, type UpdateInstagramPreview,

  type ReferralRequest, type InsertReferralRequest, type UpdateReferralRequest,

  type UserReport, type InsertUserReport, type UpdateUserReport,
  type PasswordResetToken, type InsertPasswordResetToken,
  type CollaborationRequest, type InsertCollaborationRequest, type UpdateCollaborationRequest
} from "../shared/schema";

import {
  emailTemplates, emailLogs, emailCampaigns,
  type EmailTemplate, type InsertEmailTemplate,
  type EmailLog, type InsertEmailLog,
  type EmailCampaign, type InsertEmailCampaign
} from "../shared/email-schema";
import {
  supportMessages,
  type SupportMessage, type InsertSupportMessage, type UpdateSupportMessage
} from "../shared/support-schema";
import { eq, and, not, sql, desc, or, ilike, isNotNull, isNull, count, notInArray } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import type { IStorage } from "./storage";

const scryptAsync = promisify(scrypt);

export class EnhancedDatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    // Use built-in memory store to avoid database connection issues
    this.sessionStore = new session.MemoryStore();
    console.log('Using memory session store to avoid database connection issues');
  }

  async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  }

  async comparePasswords(supplied: string, stored: string): Promise<boolean> {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  }

  // Password reset methods
  async createPasswordResetToken(email: string): Promise<PasswordResetToken> {
    // Generate secure random token
    const token = randomBytes(32).toString('hex');

    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Clean up any existing tokens for this email first
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.email, email));

    const [resetToken] = await db
      .insert(passwordResetTokens)
      .values({
        email,
        token,
        expiresAt,
        used: false
      })
      .returning();

    return resetToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));

    return resetToken;
  }

  async markTokenAsUsed(token: string): Promise<boolean> {
    const result = await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token))
      .returning();

    return result.length > 0;
  }

  async cleanupExpiredTokens(): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(or(
        sql`${passwordResetTokens.expiresAt} < NOW()`,
        eq(passwordResetTokens.used, true)
      ));
  }

  async resetPassword(token: string, newPassword: string): Promise<User | undefined> {
    console.log('=== PASSWORD RESET PROCESS ===');
    console.log('Token received:', token.substring(0, 10) + '...');

    // Get the reset token
    const resetToken = await this.getPasswordResetToken(token);
    console.log('Reset token found:', resetToken ? 'yes' : 'no');

    if (!resetToken || resetToken.used || new Date() > new Date(resetToken.expiresAt)) {
      console.log('Token validation failed:', {
        exists: !!resetToken,
        used: resetToken?.used,
        expired: resetToken ? new Date() > new Date(resetToken.expiresAt) : 'N/A'
      });
      return undefined;
    }

    // Find user by email
    const user = await this.getUserByEmail(resetToken.email);
    console.log('User found for email:', user ? user.username : 'no');
    if (!user) {
      return undefined;
    }

    // Hash the new password
    const hashedPassword = await this.hashPassword(newPassword);
    console.log('New password hashed successfully');

    // Update user password and mark token as used
    // IMPORTANT: Use direct SQL update to bypass the updateUser method's double-hashing
    await db.transaction(async (tx) => {
      console.log('Starting database transaction...');

      // Direct update to avoid double-hashing in updateUser method
      await tx
        .update(users)
        .set({ 
          password: hashedPassword, // Already hashed, don't hash again
          updatedAt: new Date() 
        })
        .where(eq(users.id, user.id));
      console.log('User password updated in database');

      await tx
        .update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.token, token));
      console.log('Reset token marked as used');
    });

    console.log('Password reset transaction completed successfully');

    // Return updated user
    const updatedUser = await this.getUser(user.id);
    console.log('Updated user retrieved:', updatedUser ? updatedUser.username : 'no');
    return updatedUser;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash the password before inserting
    const password = await this.hashPassword(insertUser.password);

    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        password
      })
      .returning();
    return user;
  }

  async updateUser(id: number, updates: UpdateUser): Promise<User | undefined> {
    // If password is being updated, hash it
    if (updates.password) {
      updates.password = await this.hashPassword(updates.password);
    }

    console.log('Updating user with data:', { id, updates });

    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: sql`NOW()`
      })
      .where(eq(users.id, id))
      .returning();

    console.log('User updated successfully:', user?.theme);
    return user;
  }

  async updateSocialScore(userId: number, score: number): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        socialScore: score,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updatePitchMode(userId: number, enabled: boolean, type?: string, description?: string, focusAreas?: string[]): Promise<User | undefined> {
    console.log('updatePitchMode called with:', { userId, enabled, type, description, focusAreas });

    const updateData: any = {
      pitchMode: enabled,
      updatedAt: new Date()
    };

    if (type) {
      updateData.pitchModeType = type;
    }

    if (description !== undefined) {
      updateData.pitchDescription = description;
    }

    if (focusAreas !== undefined) {
      updateData.pitchFocusAreas = focusAreas;
    }

    console.log('Update data:', updateData);

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    console.log('Updated user result:', user ? {
      id: user.id,
      username: user.username,
      pitchMode: user.pitchMode,
      pitchModeType: user.pitchModeType,
      pitchDescription: user.pitchDescription,
      pitchFocusAreas: user.pitchFocusAreas
    } : 'null');

    return user;
  }

  async deleteUser(id: number): Promise<boolean> {
    console.log('Starting user deletion process for user ID:', id);
    const tables = [
      { name: 'links', table: links, column: links.userId },
      { name: 'profileViews', table: profileViews, column: profileViews.userId },
      { name: 'follows as follower', table: follows, column: follows.followerId },
      { name: 'follows as following', table: follows, column: follows.followingId },
      { name: 'socialPosts', table: socialPosts, column: socialPosts.userId },
      { name: 'socialConnections', table: socialConnections, column: socialConnections.userId },
      { name: 'instagramPreviews', table: instagramPreviews, column: instagramPreviews.userId },
      { name: 'spotlightProjects', table: spotlightProjects, column: spotlightProjects.userId },
      { name: 'collaborationRequests as sender', table: collaborationRequests, column: collaborationRequests.senderId },
      { name: 'collaborationRequests as receiver', table: collaborationRequests, column: collaborationRequests.receiverId },
      { name: 'referralLinks', table: referralLinks, column: referralLinks.userId },
      // userSkills table removed - not properly defined in schema
      { name: 'referralRequests as target', table: referralRequests, column: referralRequests.targetUserId },
      { name: 'collaborationRequestsNotifications as target', table: collaborationRequestsNotifications, column: collaborationRequestsNotifications.targetUserId },
      { name: 'systemLogs', table: systemLogs, column: systemLogs.userId },
      { name: 'featureToggles', table: featureToggles, column: featureToggles.updatedBy },
    ];
    // Handle additional tables not in the schema with SQL queries FIRST
    try {
      await db.execute(sql`DELETE FROM user_skills WHERE user_id = ${id}`);
      console.log('Deleted records from user_skills using SQL');
    } catch (e) {
      console.warn('Non-critical deletion failed for user_skills:', e);
    }

    // Handle tables with foreign key references to users.id FIRST
    const additionalTables = ['role_invitations', 'user_roles', 'employee_profiles'];
    for (const tableName of additionalTables) {
      try {
        await db.execute(sql`DELETE FROM ${sql.identifier(tableName)} WHERE user_id = ${id}`);
        console.log(`Deleted records from ${tableName} using SQL`);
      } catch (e) {
        console.warn(`Non-critical deletion failed for ${tableName}:`, e);
      }
    }

    // Handle special foreign key references FIRST
    try {
      await db.execute(sql`DELETE FROM role_invitations WHERE invited_by = ${id}`);
      console.log('Deleted records from role_invitations (invited_by) using SQL');
    } catch (e) {
      console.warn('Non-critical deletion failed for role_invitations (invited_by):', e);
    }

    for (const t of tables) {
      try {
        const result = await db.delete(t.table).where(eq(t.column, id));
        console.log(`Deleted records from ${t.name}: ${result.rowCount || 0}`);
      } catch (e) {
        console.warn(`Non-critical deletion failed for ${t.name}:`, e);
      }
    }

    // Finally delete the user record
    try {
      const result = await db.delete(users).where(eq(users.id, id));
      console.log(`User deletion result: ${result.rowCount || 0} user(s) deleted`);
      return (result.rowCount || 0) > 0;
    } catch (e) {
      console.error('Critical: failed to delete user:', e);
      throw e;
    }
  }

  // Link methods
  async getLinks(userId: string): Promise<Link[]> {
    return db
      .select()
      .from(links)
      .where(eq(links.userId, userId))
      .orderBy(links.order);
  }

  async getLinkById(id: number): Promise<Link | undefined> {
    const rows = await db
      .select()
      .from(links)
      .where(eq(links.id, id))
      .limit(1);
    return rows?.[0] || undefined;
  }

  // Backfill links that have null owner to the provided user
  async createLink(userId: string, linkData: any): Promise<Link> {
    // Get the count of existing links to set the order
    const [result] = await db
      .select({ count: count() })
      .from(links)
      .where(eq(links.userId, userId));

    const order = result ? (result.count || 0) : 0;

    const [link] = await db
      .insert(links)
      .values({
        userId,
        platform: linkData.platform,
        title: linkData.title,
        url: linkData.url,
        description: linkData.description ?? null,
        color: linkData.color ?? null,
        featured: !!linkData.featured,
        order,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return link;
  }

  async updateLink(id: number, updates: UpdateLink): Promise<Link | undefined> {
    const [link] = await db
      .update(links)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(links.id, id))
      .returning();
    return link;
  }

  async deleteLink(id: number, userId?: string): Promise<boolean> {
    if (userId) {
      const result = await db
        .delete(links)
        .where(and(eq(links.id, id), eq(links.userId, userId)));
      return result?.rowCount ? result.rowCount > 0 : (result as any)?.length > 0;
    } else {
      const result = await db.delete(links).where(eq(links.id, id));
      return result?.rowCount ? result.rowCount > 0 : (result as any)?.length > 0;
    }
  }

  // Delete link enforcing ownership but allowing legacy null owners
  async deleteLinkOwned(id: number, userId: string): Promise<boolean> {
    const res = await db
      .delete(links)
      .where(and(eq(links.id, id), eq(links.userId, userId)));
    const rowCount = (res as any)?.rowCount ?? (Array.isArray(res) ? res.length : 0);
    return rowCount > 0;
  }

  async incrementLinkClicks(id: number): Promise<Link | undefined> {
    const [link] = await db
      .update(links)
      .set({
        clicks: sql`${links.clicks} + 1`,
        lastClickedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(links.id, id))
      .returning();
    return link;
  }

  async incrementLinkViews(id: number): Promise<Link | undefined> {
    const [link] = await db
      .update(links)
      .set({
        views: sql`${links.views} + 1`,
        updatedAt: new Date()
      })
      .where(eq(links.id, id))
      .returning();
    return link;
  }

  async updateLinkAiScore(id: number, score: number): Promise<Link | undefined> {
    const [link] = await db
      .update(links)
      .set({
        aiScore: score,
        updatedAt: new Date()
      })
      .where(eq(links.id, id))
      .returning();
    return link;
  }

  async reorderLinks(userId: number, linkScores: {id: number, score: number}[]): Promise<Link[]> {
    // Update AI scores for each link
    const promises = linkScores.map(({ id, score }) => 
      this.updateLinkAiScore(id, score)
    );

    await Promise.all(promises);

    // Sort links by AI score (descending) and update their order
    const userLinks = await this.getLinks(userId);
    userLinks.sort((a, b) => {
      // Sort by AI score if present, otherwise keep original order
      if (a.aiScore !== null && b.aiScore !== null) {
        return b.aiScore - a.aiScore;
      }
      return (a.order ?? 0) - (b.order ?? 0);
    });

    // Update the order for each link
    const updatePromises = userLinks.map((link, index) => 
      db
        .update(links)
        .set({ order: index })
        .where(eq(links.id, link.id))
    );

    await Promise.all(updatePromises);

    // Return the reordered links
    return this.getLinks(userId);
  }

  // Instagram Content Preview methods
  async getInstagramPreview(userId: number): Promise<InstagramPreview | undefined> {
    const [preview] = await db
      .select()
      .from(instagramPreviews)
      .where(eq(instagramPreviews.userId, userId))
      .orderBy(desc(instagramPreviews.fetchedAt))
      .limit(1);
    return preview;
  }

  async saveInstagramPreview(userId: number, preview: InsertInstagramPreview): Promise<InstagramPreview> {
    // Delete existing preview first
    await db.delete(instagramPreviews).where(eq(instagramPreviews.userId, userId));

    // Insert new preview
    const [newPreview] = await db
      .insert(instagramPreviews)
      .values({
        ...preview,
        userId,
        fetchedAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newPreview;
  }

  async updateInstagramPreview(userId: number, updates: UpdateInstagramPreview): Promise<InstagramPreview | undefined> {
    const [preview] = await db
      .update(instagramPreviews)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(instagramPreviews.userId, userId))
      .returning();
    return preview;
  }

  async deleteInstagramPreview(userId: number): Promise<boolean> {
    const result = await db
      .delete(instagramPreviews)
      .where(eq(instagramPreviews.userId, userId));
    return result.rowCount! > 0;
  }

  async toggleInstagramPreview(userId: number, enabled: boolean): Promise<InstagramPreview | undefined> {
    const [preview] = await db
      .update(instagramPreviews)
      .set({
        isEnabled: enabled,
        updatedAt: new Date()
      })
      .where(eq(instagramPreviews.userId, userId))
      .returning();
    return preview;
  }

  // Social posts methods (for other platforms)
  async getSocialPosts(userId: number): Promise<SocialPost[]> {
    return db
      .select()
      .from(socialPosts)
      .where(eq(socialPosts.userId, userId))
      .orderBy(desc(socialPosts.postedAt));
  }

  async addSocialPost(userId: number, post: InsertSocialPost): Promise<SocialPost> {
    const [socialPost] = await db
      .insert(socialPosts)
      .values({
        ...post,
        userId,
        fetchedAt: new Date()
      })
      .returning();
    return socialPost;
  }

  async getFeedPosts(userId: number, followingOnly: boolean): Promise<(SocialPost & { user: User })[]> {
    if (followingOnly) {
      // Get posts from users the current user follows
      const posts = await db
        .select({
          id: socialPosts.id,
          userId: socialPosts.userId,
          platform: socialPosts.platform,
          postUrl: socialPosts.postUrl,
          thumbnailUrl: socialPosts.thumbnailUrl,
          caption: socialPosts.caption,
          postedAt: socialPosts.postedAt,
          fetchedAt: socialPosts.fetchedAt,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            email: users.email,
            bio: users.bio,
            profileImage: users.profileImage,
            profession: users.profession,
            socialScore: users.socialScore,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt
          }
        })
        .from(socialPosts)
        .innerJoin(users, eq(socialPosts.userId, users.id))
        .innerJoin(follows, eq(follows.followingId, socialPosts.userId))
        .where(eq(follows.followerId, userId))
        .orderBy(desc(socialPosts.postedAt))
        .limit(50);

      return posts.map(post => ({
        ...post,
        user: {
          ...post.user,
          password: '',
          profileBackground: null,
          font: null,
          theme: null,
          viewMode: null,
          darkMode: null,
          welcomeMessage: null,
          isCollaborative: null,
          collaborators: null,
          pitchMode: null,
          pitchDescription: null,
          industryId: null,
          location: null,
          interests: null,
          tags: null
        }
      }));
    } else {
      // Get all posts (public feed)
      const posts = await db
        .select({
          id: socialPosts.id,
          userId: socialPosts.userId,
          platform: socialPosts.platform,
          postUrl: socialPosts.postUrl,
          thumbnailUrl: socialPosts.thumbnailUrl,
          caption: socialPosts.caption,
          postedAt: socialPosts.postedAt,
          fetchedAt: socialPosts.fetchedAt,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            email: users.email,
            bio: users.bio,
            profileImage: users.profileImage,
            profession: users.profession,
            socialScore: users.socialScore,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt
          }
        })
        .from(socialPosts)
        .innerJoin(users, eq(socialPosts.userId, users.id))
        .orderBy(desc(socialPosts.postedAt))
        .limit(50);

      return posts.map(post => ({
        ...post,
        user: {
          ...post.user,
          password: '',
          profileBackground: null,
          font: null,
          theme: null,
          viewMode: null,
          darkMode: null,
          welcomeMessage: null,
          isCollaborative: null,
          collaborators: null,
          pitchMode: null,
          pitchDescription: null,
          industryId: null,
          location: null,
          interests: null,
          tags: null
        }
      }));
    }
  }

  // Follow system methods
  async followUser(followerId: number, followingId: number): Promise<Follow> {
    const [follow] = await db
      .insert(follows)
      .values({
        followerId,
        followingId
      })
      .returning();
    return follow;
  }

  async unfollowUser(followerId: number, followingId: number): Promise<boolean> {
    const result = await db
      .delete(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId)
        )
      );
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getFollowers(userId: number): Promise<User[]> {
    const result = await db
      .select({
        user: users
      })
      .from(follows)
      .where(eq(follows.followingId, userId))
      .innerJoin(users, eq(users.id, follows.followerId));

    return result.map(r => r.user);
  }

  async getFollowing(userId: number): Promise<User[]> {
    const result = await db
      .select({
        user: users
      })
      .from(follows)
      .where(eq(follows.followerId, userId))
      .innerJoin(users, eq(users.id, follows.followingId));

    return result.map(r => r.user);
  }

  async getFollowCounts(userId: number): Promise<{followers: number, following: number}> {
    const [followersResult] = await db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.followingId, userId));

    const [followingResult] = await db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.followerId, userId));

    return {
      followers: followersResult ? (followersResult.count || 0) : 0,
      following: followingResult ? (followingResult.count || 0) : 0
    };
  }

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

  async getSuggestedUsers(userId: number): Promise<User[]> {
    // Get users the current user is not following, excluding themselves
    const currentFollowing = await db
      .select({ id: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, userId));

    const followingIds = currentFollowing.map(f => f.id);
    followingIds.push(userId); // Exclude self

    const suggestedUsers = await db
      .select()
      .from(users)
      .where(not(sql`${users.id} = ANY(${followingIds})`))
      .orderBy(desc(users.socialScore))
      .limit(10);

    return suggestedUsers.map(user => ({
      ...user,
      password: '' // Don't include password in results
    }));
  }

  // Collaborators
  async getCollaborators(userId: number): Promise<User[]> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user || !user.collaborators || user.collaborators.length === 0) {
      return [];
    }

    // Convert string array to numbers
    const collaboratorIds = user.collaborators.map(id => parseInt(id));

    const result = await db
      .select()
      .from(users)
      .where(
        sql`${users.id} = ANY(${collaboratorIds})`
      );

    return result;
  }

  async addCollaborator(userId: number, collaboratorId: number): Promise<boolean> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return false;
    }

    const collaborators = user.collaborators || [];
    const collaboratorIdStr = collaboratorId.toString();

    // Check if already a collaborator
    if (collaborators.includes(collaboratorIdStr)) {
      return true;
    }

    // Add to collaborators
    await db
      .update(users)
      .set({
        collaborators: [...collaborators, collaboratorIdStr],
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    return true;
  }

  async removeCollaborator(userId: number, collaboratorId: number): Promise<boolean> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user || !user.collaborators) {
      return false;
    }

    const collaboratorIdStr = collaboratorId.toString();
    const updatedCollaborators = user.collaborators.filter(id => id !== collaboratorIdStr);

    // No change needed
    if (updatedCollaborators.length === user.collaborators.length) {
      return false;
    }

    // Update collaborators
    await db
      .update(users)
      .set({
        collaborators: updatedCollaborators,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    return true;
  }

  // Profile views and stats
  async recordProfileView(userId: number): Promise<void> {
    await db
      .insert(profileViews)
      .values({
        userId,
        viewedAt: new Date()
      });
  }

  async getUserStats(userId: number, dateFilter?: Date): Promise<ProfileStats> {
    // Build date filter condition
    const dateCondition = dateFilter ? sql`${profileViews.viewedAt} >= ${dateFilter}` : sql`1 = 1`;

    // Get view count with date filter
    const [viewsResult] = await db
      .select({ count: count() })
      .from(profileViews)
      .where(and(eq(profileViews.userId, userId), dateCondition));

    const views = viewsResult ? (viewsResult.count || 0) : 0;

    // Get total clicks across all links (note: link clicks don't have timestamps, so we'll use all-time data)
    const [clicksResult] = await db
      .select({ total: sql<number>`SUM(${links.clicks})` })
      .from(links)
      .where(eq(links.userId, userId));

    const clicks = clicksResult && clicksResult.total ? clicksResult.total : 0;

    // Calculate CTR (Click-Through Rate)
    const ctr = views > 0 ? Math.round((clicks / views) * 100) : 0;

    // Calculate a basic score (can be refined later)
    const score = Math.min(100, Math.round((views * 0.2) + (clicks * 0.5) + (ctr * 0.3)));

    // Get follow counts
    const { followers, following } = await this.getFollowCounts(userId);

    return {
      views,
      clicks,
      ctr,
      score,
      followers,
      following
    };
  }

  // Spotlight Project methods
  async getSpotlightProjects(userId: number): Promise<SpotlightProject[]> {
    const projects = await db
      .select()
      .from(spotlightProjects)
      .where(eq(spotlightProjects.userId, userId))
      .orderBy(desc(spotlightProjects.createdAt));
    return projects;
  }

  async deleteSpotlightProject(projectId: number): Promise<boolean> {
    const result = await db
      .delete(spotlightProjects)
      .where(eq(spotlightProjects.id, projectId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async incrementProjectViews(projectId: number): Promise<void> {
    await db
      .update(spotlightProjects)
      .set({
        viewCount: sql`${spotlightProjects.viewCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(spotlightProjects.id, projectId));
  }

  async incrementProjectClicks(projectId: number): Promise<void> {
    await db
      .update(spotlightProjects)
      .set({
        clickCount: sql`${spotlightProjects.clickCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(spotlightProjects.id, projectId));
  }

  async setPinnedStatus(projectId: number, isPinned: boolean): Promise<SpotlightProject | undefined> {
    const [project] = await db
      .update(spotlightProjects)
      .set({
        isPinned,
        updatedAt: new Date()
      })
      .where(eq(spotlightProjects.id, projectId))
      .returning();
    return project;
  }

  // Contributors methods (first implementation)
  async getSpotlightContributors(projectId: number): Promise<SpotlightContributor[]> {
    return db
      .select()
      .from(spotlightContributors)
      .where(eq(spotlightContributors.projectId, projectId));
  }

  // Interface required method alias
  async getProjectContributors(projectId: number): Promise<SpotlightContributor[]> {
    return this.getSpotlightContributors(projectId);
  }

  async addContributor(projectId: number, contributor: Omit<InsertContributor, 'projectId'>): Promise<SpotlightContributor> {
    const [newContributor] = await db
      .insert(spotlightContributors)
      .values({
        ...contributor,
        projectId
      })
      .returning();
    return newContributor;
  }

  async removeContributor(contributorId: number): Promise<boolean> {
    const result = await db
      .delete(spotlightContributors)
      .where(eq(spotlightContributors.id, contributorId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Tags methods (first implementation)
  async getSpotlightTags(projectId: number): Promise<SpotlightTag[]> {
    return db
      .select()
      .from(spotlightTags)
      .where(eq(spotlightTags.projectId, projectId));
  }

  // Interface required method alias
  async getProjectTags(projectId: number): Promise<SpotlightTag[]> {
    return this.getSpotlightTags(projectId);
  }

  async addTag(projectId: number, tag: Omit<InsertTag, 'projectId'>): Promise<SpotlightTag> {
    const [newTag] = await db
      .insert(spotlightTags)
      .values({
        ...tag,
        projectId
      })
      .returning();
    return newTag;
  }

  async removeTag(tagId: number): Promise<boolean> {
    const result = await db
      .delete(spotlightTags)
      .where(eq(spotlightTags.id, tagId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Skills Management
  async getSkills(userId: number): Promise<any[]> {
    try {
      const rows = await db.execute(
        sql`select skill from user_skills where user_id = ${userId} order by level desc`
      );
      const skills = (rows?.rows ?? []).map((r: any) => r.skill).filter(Boolean);
      return skills;
    } catch (error) {
      console.error("Error fetching skills:", error);
      return [];
    }
  }

  // Industry Discovery Feature
  async getAllIndustries(): Promise<Industry[]> {
    return await db.select().from(industries).orderBy(industries.name);
  }

  async createIndustry(industry: InsertIndustry): Promise<Industry> {
    const [newIndustry] = await db
      .insert(industries)
      .values(industry)
      .returning();
    return newIndustry;
  }

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

  // Referral Links Feature
  async getReferralLinks(userId: string): Promise<ReferralLink[]> {
    return await db
      .select()
      .from(referralLinks)
      .where(eq(referralLinks.userId, userId))
      .orderBy(desc(referralLinks.createdAt));
  }

  async getReferralLinkById(id: number): Promise<ReferralLink | undefined> {
    const [link] = await db
      .select()
      .from(referralLinks)
      .where(eq(referralLinks.id, id));
    return link;
  }

  async createReferralLink(userId: string, link: InsertReferralLink): Promise<ReferralLink> {
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

  async deleteReferralLink(id: number): Promise<boolean> {
    const result = await db
      .delete(referralLinks)
      .where(eq(referralLinks.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

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

  // Social Media Integration methods
  async getSocialConnections(userId: number): Promise<SocialConnection[]> {
    return db
      .select()
      .from(socialConnections)
      .where(eq(socialConnections.userId, userId));
  }

  async getSocialConnection(userId: number, platform: string): Promise<SocialConnection | undefined> {
    const [connection] = await db
      .select()
      .from(socialConnections)
      .where(and(
        eq(socialConnections.userId, userId),
        eq(socialConnections.platform, platform)
      ));
    return connection;
  }

  async saveSocialConnection(connection: InsertSocialConnection): Promise<SocialConnection> {
    const [savedConnection] = await db
      .insert(socialConnections)
      .values(connection)
      .onConflictDoUpdate({
        target: [socialConnections.userId, socialConnections.platform],
        set: {
          accessToken: connection.accessToken,
          refreshToken: connection.refreshToken,
          expiresAt: connection.expiresAt,
          platformUserId: connection.platformUserId,
          platformUsername: connection.platformUsername,
          connectedAt: new Date()
        }
      })
      .returning();
    return savedConnection;
  }

  async removeSocialConnection(userId: number, platform: string): Promise<boolean> {
    const result = await db
      .delete(socialConnections)
      .where(and(
        eq(socialConnections.userId, userId),
        eq(socialConnections.platform, platform)
      ));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Alias for removeSocialConnection to maintain consistency with TikTok OAuth implementation
  async deleteSocialConnection(userId: number, platform: string): Promise<boolean> {
    return this.removeSocialConnection(userId, platform);
  }

  async updateSocialConnectionSyncTime(userId: number, platform: string): Promise<void> {
    await db
      .update(socialConnections)
      .set({ lastSyncAt: new Date() })
      .where(and(
        eq(socialConnections.userId, userId),
        eq(socialConnections.platform, platform)
      ));
  }

  async saveSocialPost(post: InsertSocialPost): Promise<SocialPost> {
    const [savedPost] = await db
      .insert(socialPosts)
      .values(post)
      .onConflictDoNothing()
      .returning();
    return savedPost;
  }

  async getSocialPostsByConnection(connectionId: number): Promise<SocialPost[]> {
    // Return empty array for now since connectionId column doesn't exist
    // This method would need proper implementation when social connections are fully integrated
    return [];
  }

  // Referral Request methods
  async createReferralRequest(request: InsertReferralRequest): Promise<ReferralRequest> {
    const [newRequest] = await db
      .insert(referralRequests)
      .values({
        ...request,
        updatedAt: new Date()
      })
      .returning();
    return newRequest;
  }

  async getReferralRequests(userId: number): Promise<ReferralRequest[]> {
    return await db
      .select()
      .from(referralRequests)
      .where(eq(referralRequests.targetUserId, userId))
      .orderBy(desc(referralRequests.createdAt));
  }

  async getReferralRequestById(id: number): Promise<ReferralRequest | undefined> {
    const [request] = await db
      .select()
      .from(referralRequests)
      .where(eq(referralRequests.id, id));
    return request;
  }

  async updateReferralRequest(id: number, updates: UpdateReferralRequest): Promise<ReferralRequest | undefined> {
    const [updatedRequest] = await db
      .update(referralRequests)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(referralRequests.id, id))
      .returning();
    return updatedRequest;
  }

  async deleteReferralRequest(id: number): Promise<boolean> {
    const result = await db
      .delete(referralRequests)
      .where(eq(referralRequests.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getPendingReferralRequestsCount(userId: number): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(referralRequests)
      .where(and(
        eq(referralRequests.targetUserId, userId),
        eq(referralRequests.status, "pending")
      ));
    return result.count;
  }

  // Professional admin panel methods
  async getAllUsers(): Promise<User[]> {
    const allUsers = await db.select().from(users);
    return allUsers;
  }

  async getAllLinks(): Promise<Link[]> {
    const allLinks = await db.select().from(links);
    return allLinks;
  }

  async getTotalProfileViews(): Promise<number> {
    const result = await db.select({ count: count() }).from(profileViews);
    return result[0]?.count || 0;
  }

  async getAuditLogs(): Promise<any[]> {
    try {
      const logs = await db.select().from(systemLogs).orderBy(desc(systemLogs.createdAt)).limit(100);
      return logs.map(log => ({
        id: log.id,
        userId: log.userId || 0,
        userName: 'System',
        action: log.level.toUpperCase(),
        resource: log.source,
        details: log.message,
        timestamp: log.createdAt?.toISOString() || new Date().toISOString(),
        ipAddress: '127.0.0.1',
        userAgent: 'Admin Panel'
      }));
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  }

  async getAllFeatures(): Promise<any[]> {
    const features = await db.select().from(featureToggles);
    return features.map(f => ({
      id: f.id,
      featureName: f.featureName,
      enabled: f.isEnabled,
      description: f.description || ''
    }));
  }

  async updateFeature(featureId: number, updates: any): Promise<any> {
    const [updated] = await db
      .update(featureToggles)
      .set({ isEnabled: updates.enabled, updatedAt: new Date() })
      .where(eq(featureToggles.id, featureId))
      .returning();
    return updated;
  }

  async logSystemEvent(level: string, message: string, source: string, userId?: number, metadata?: any): Promise<void> {
    if (!(await isDbAvailable())) {
      return;
    }
    try {
      await db.insert(systemLogs).values({
        level: level as 'info' | 'warning' | 'error',
        message,
        source,
        userId,
        metadata
      });
    } catch (error) {
      console.error('Failed to log system event:', error);
      if ((error as any)?.message?.includes('endpoint has been disabled')) {
        const err: any = error;
        setDbEnabled(false, err.message, err.code);
      }
    }
  }

  // Notification methods for dashboard
  async getNotifications(userId: number): Promise<any[]> {
    const notifications = [];

    try {
      // Get referral requests (pending only)
      const referralRequestsData = await db
        .select()
        .from(referralRequests)
        .where(and(
          eq(referralRequests.targetUserId, userId),
          eq(referralRequests.status, 'pending')
        ))
        .orderBy(desc(referralRequests.createdAt));

      // Format referral requests as notifications
      referralRequestsData.forEach(req => {
        notifications.push({
          id: `referral-${req.id}`,
          type: 'referral_request',
          title: 'New Referral Link Request',
          message: `${req.requesterName} wants to add their link to your profile`,
          data: {
            requestId: req.id,
            requesterName: req.requesterName,
            requesterEmail: req.requesterEmail,
            linkTitle: req.linkTitle,
            linkUrl: req.linkUrl,
            status: req.status
          },
          status: req.status,
          createdAt: req.createdAt,
          actionUrl: '/referral-links',
          icon: 'ExternalLink'
        });
      });

      // Get collaboration requests (pending only)
      const collaborationRequestsData = await db
        .select()
        .from(collaborationRequests)
        .where(and(
          eq(collaborationRequests.receiverId, userId),
          eq(collaborationRequests.status, 'pending')
        ))
        .orderBy(desc(collaborationRequests.createdAt));

      // Format collaboration requests as notifications
      collaborationRequestsData.forEach(req => {
        notifications.push({
          id: `collaboration-${req.id}`,
          type: 'collaboration_request',
          title: 'New Collaboration Request',
          message: `${req.name} wants to collaborate with you`,
          data: {
            requestId: req.id,
            name: req.name,
            email: req.email,
            phone: req.phone,
            fieldOfWork: req.fieldOfWork,
            message: req.message,
            status: req.status
          },
          status: req.status,
          createdAt: req.createdAt,
          actionUrl: '/collaboration',
          icon: 'Users'
        });
      });

      // Add system notifications (admin messages, updates, etc.)
      const systemNotifications = await this.getSystemNotifications(userId);
      notifications.push(...systemNotifications);

      // Sort all notifications by creation date
      notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return notifications.filter(n => n.status === 'pending');
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // Get system notifications (admin messages, updates, etc.)
  async getSystemNotifications(userId: number): Promise<any[]> {
    const notifications = [];

    try {
      // Add sample system notifications (you can implement actual system notifications table)
      const systemMessages = [
        // Admin messages
        {
          id: 'system-welcome',
          type: 'system_message',
          title: 'Welcome to MyLinked!',
          message: 'Complete your profile to get started and maximize your networking potential.',
          status: 'info',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          actionUrl: '/settings',
          icon: 'Info'
        },
        // Feature updates
        {
          id: 'feature-update',
          type: 'feature_update',
          title: 'New Feature: AI Branding Boost',
          message: 'Try our new AI-powered branding suggestions to optimize your profile.',
          status: 'info',
          createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
          actionUrl: '/ai-branding',
          icon: 'Sparkles'
        }
      ];

      // Only show system notifications to new users or for important updates
      const userProfile = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (userProfile.length > 0) {
        const user = userProfile[0];
        const accountAge = new Date().getTime() - new Date(user.createdAt).getTime();
        const isNewUser = accountAge < 7 * 24 * 60 * 60 * 1000; // 7 days

        if (isNewUser) {
          notifications.push(...systemMessages);
        }
      }

      return notifications;
    } catch (error) {
      console.error('Error fetching system notifications:', error);
      return [];
    }
  }

  async markNotificationAsRead(notificationId: number, userId: number): Promise<void> {
    // This would mark a notification as read if we had a notifications table
    // For now, we'll just return success since we're aggregating from other tables
    return;
  }

  async deleteNotification(notificationId: string, userId: number): Promise<void> {
    // Parse the notification ID to determine type and actual ID
    const [type, actualId] = notificationId.split('-');

    console.log(`Deleting notification ${notificationId} for user ${userId}`);

    if (type === 'referral') {
      // Don't delete the referral request, just mark it as handled by updating status if it's still pending
      // This allows the request to remain in the database for the user to see in their referral links page
      const request = await db
        .select()
        .from(referralRequests)
        .where(
          and(
            eq(referralRequests.id, parseInt(actualId)),
            eq(referralRequests.targetUserId, userId)
          )
        );

      if (request.length > 0) {
        console.log(`Referral request ${actualId} exists, notification will be considered handled`);
        // The request should remain in the database with its current status
        // The notification system just needs to know this notification was processed
      }
    } else if (type === 'collaboration') {
      // Don't delete the collaboration request, just mark notification as handled
      // The request should remain in the database for the user to see in their collaboration page
      const request = await db
        .select()
        .from(collaborationRequests)
        .where(
          and(
            eq(collaborationRequests.id, parseInt(actualId)),
            eq(collaborationRequests.receiverId, userId)
          )
        );

      if (request.length > 0) {
        console.log(`Collaboration request ${actualId} exists, notification will be considered handled`);
        // The request should remain in the database with its current status
        // The notification system just needs to know this notification was processed
      }
    }
  }

  async updateReferralRequestStatus(requestId: number, status: string): Promise<void> {
    await db
      .update(referralRequests)
      .set({ status, updatedAt: new Date() })
      .where(eq(referralRequests.id, requestId));
  }

  async updateCollaborationRequestStatus(requestId: number, status: string): Promise<void> {
    console.log(`Updating collaboration request ${requestId} status to ${status} in database`);

    const result = await db
      .update(collaborationRequests)
      .set({ status, updatedAt: new Date() })
      .where(eq(collaborationRequests.id, requestId))
      .returning();

    console.log(`Database update result:`, result);
  }

  // Email Templates
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return await db
      .select()
      .from(emailTemplates)
      .orderBy(desc(emailTemplates.createdAt));
  }

  async getEmailTemplate(id: number): Promise<EmailTemplate | undefined> {
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, id));
    return template;
  }

  async getEmailTemplateByType(type: string): Promise<EmailTemplate | undefined> {
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(and(
        eq(emailTemplates.type, type),
        eq(emailTemplates.isActive, true)
      ));
    return template;
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [newTemplate] = await db
      .insert(emailTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  async updateEmailTemplate(id: number, updates: Partial<EmailTemplate>): Promise<EmailTemplate | undefined> {
    const [updated] = await db
      .update(emailTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteEmailTemplate(id: number): Promise<boolean> {
    const result = await db
      .delete(emailTemplates)
      .where(eq(emailTemplates.id, id));
    return result.rowCount > 0;
  }

  // Email Logs
  async getEmailLogs(limit: number = 100, offset: number = 0): Promise<EmailLog[]> {
    return await db
      .select()
      .from(emailLogs)
      .orderBy(desc(emailLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createEmailLog(log: InsertEmailLog): Promise<EmailLog> {
    const [newLog] = await db
      .insert(emailLogs)
      .values(log)
      .returning();
    return newLog;
  }

  async getEmailLogsByTemplate(templateId: number): Promise<EmailLog[]> {
    return await db
      .select()
      .from(emailLogs)
      .where(eq(emailLogs.templateId, templateId))
      .orderBy(desc(emailLogs.createdAt));
  }

  // Email Campaigns
  async getEmailCampaigns(): Promise<EmailCampaign[]> {
    return await db
      .select()
      .from(emailCampaigns)
      .orderBy(desc(emailCampaigns.createdAt));
  }

  async getEmailCampaign(id: number): Promise<EmailCampaign | undefined> {
    const [campaign] = await db
      .select()
      .from(emailCampaigns)
      .where(eq(emailCampaigns.id, id));
    return campaign;
  }

  async createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign> {
    const [newCampaign] = await db
      .insert(emailCampaigns)
      .values(campaign)
      .returning();
    return newCampaign;
  }

  async updateEmailCampaign(id: number, updates: Partial<EmailCampaign>): Promise<EmailCampaign | undefined> {
    const [updated] = await db
      .update(emailCampaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailCampaigns.id, id))
      .returning();
    return updated;
  }

  async deleteEmailCampaign(id: number): Promise<boolean> {
    const result = await db
      .delete(emailCampaigns)
      .where(eq(emailCampaigns.id, id));
    return result.rowCount > 0;
  }

  // Support Messages
  async getAllSupportMessages(): Promise<SupportMessage[]> {
    return await db
      .select()
      .from(supportMessages)
      .orderBy(desc(supportMessages.createdAt));
  }

  async getSupportMessage(id: number): Promise<SupportMessage | undefined> {
    const [message] = await db
      .select()
      .from(supportMessages)
      .where(eq(supportMessages.id, id));
    return message;
  }

  async createSupportMessage(message: InsertSupportMessage): Promise<SupportMessage> {
    const [newMessage] = await db
      .insert(supportMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async updateSupportMessage(id: number, updates: UpdateSupportMessage): Promise<SupportMessage | undefined> {
    const [updated] = await db
      .update(supportMessages)
      .set(updates)
      .where(eq(supportMessages.id, id))
      .returning();
    return updated;
  }

  async deleteSupportMessage(id: number): Promise<boolean> {
    const result = await db
      .delete(supportMessages)
      .where(eq(supportMessages.id, id));
    return result.rowCount > 0;
  }

  // User Reports
  async getUserReports(): Promise<UserReport[]> {
    return await db
      .select()
      .from(userReports)
      .orderBy(desc(userReports.createdAt));
  }

  async getUserReport(id: number): Promise<UserReport | undefined> {
    const [report] = await db
      .select()
      .from(userReports)
      .where(eq(userReports.id, id));
    return report;
  }

  async createUserReport(report: InsertUserReport): Promise<UserReport> {
    const [newReport] = await db
      .insert(userReports)
      .values(report)
      .returning();
    return newReport;
  }

  async updateUserReport(id: number, updates: UpdateUserReport): Promise<UserReport | undefined> {
    const updateData = {
      ...updates,
      reviewedAt: updates.status && updates.status !== 'pending' ? new Date() : undefined
    };

    const [updated] = await db
      .update(userReports)
      .set(updateData)
      .where(eq(userReports.id, id))
      .returning();
    return updated;
  }

  async deleteUserReport(id: number): Promise<boolean> {
    const result = await db
      .delete(userReports)
      .where(eq(userReports.id, id));
    return result.rowCount > 0;
  }

  async getReportsByStatus(status: string): Promise<UserReport[]> {
    return await db
      .select()
      .from(userReports)
      .where(eq(userReports.status, status))
      .orderBy(desc(userReports.createdAt));
  }

  async getReportsByUser(userId: number): Promise<UserReport[]> {
    return await db
      .select()
      .from(userReports)
      .where(eq(userReports.reportedUserId, userId))
      .orderBy(desc(userReports.createdAt));
  }

  // Spotlight Projects methods
  async getSpotlightProjectsByUserId(userId: number): Promise<SpotlightProject[]> {
    const projects = await db
      .select()
      .from(spotlightProjects)
      .where(eq(spotlightProjects.userId, userId))
      .orderBy(spotlightProjects.isPinned, desc(spotlightProjects.createdAt));

    // Fetch related data for each project
    const projectsWithRelatedData = await Promise.all(
      projects.map(async (project) => {
        // Get contributors
        const contributors = await this.getProjectContributors(project.id);

        // Get tags
        const tags = await this.getProjectTags(project.id);

        return {
          ...project,
          contributors,
          tags
        };
      })
    );

    return projectsWithRelatedData;
  }

  async getSpotlightProjectById(projectId: number): Promise<SpotlightProject | undefined> {
    const [project] = await db
      .select()
      .from(spotlightProjects)
      .where(eq(spotlightProjects.id, projectId));
    return project;
  }

  async createSpotlightProject(project: InsertSpotlightProject, userId: number): Promise<SpotlightProject> {
    const [newProject] = await db
      .insert(spotlightProjects)
      .values({
        ...project,
        userId,
        updatedAt: new Date()
      })
      .returning();
    return newProject;
  }

  async updateSpotlightProject(projectId: number, updates: Partial<SpotlightProject>): Promise<SpotlightProject | undefined> {
    const [project] = await db
      .update(spotlightProjects)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(spotlightProjects.id, projectId))
      .returning();
    return project;
  }

  // Skills methods that are missing
  async addUserSkill(userId: number, skill: string): Promise<any> {
    const [newSkill] = await db
      .insert(userSkills)
      .values({
        userId,
        skill,
        createdAt: new Date()
      })
      .returning();
    return newSkill;
  }

  async updateUserSkill(skillId: number, updates: any): Promise<any> {
    const [updatedSkill] = await db
      .update(userSkills)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(userSkills.id, skillId))
      .returning();
    return updatedSkill;
  }

  async deleteUserSkill(skillId: number): Promise<boolean> {
    const result = await db
      .delete(userSkills)
      .where(eq(userSkills.id, skillId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Collaboration Requests methods
  async createCollaborationRequest(request: InsertCollaborationRequest): Promise<CollaborationRequest> {
    const [newRequest] = await db
      .insert(collaborationRequests)
      .values({
        ...request,
        updatedAt: new Date()
      })
      .returning();
    return newRequest;
  }

  async getCollaborationRequestsReceived(userId: number): Promise<(CollaborationRequest & { sender: User })[]> {
    const requests = await db
      .select({
        id: collaborationRequests.id,
        senderId: collaborationRequests.senderId,
        receiverId: collaborationRequests.receiverId,
        message: collaborationRequests.message,
        status: collaborationRequests.status,
        createdAt: collaborationRequests.createdAt,
        updatedAt: collaborationRequests.updatedAt,
        name: collaborationRequests.name,
        email: collaborationRequests.email,
        phone: collaborationRequests.phone,
        fieldOfWork: collaborationRequests.fieldOfWork,
        sender: {
          id: users.id,
          username: users.username,
          name: users.name,
          profileImage: users.profileImage,
        }
      })
      .from(collaborationRequests)
      .innerJoin(users, eq(collaborationRequests.senderId, users.id))
      .where(eq(collaborationRequests.receiverId, userId))
      .orderBy(desc(collaborationRequests.createdAt));

    return requests.map(request => ({
      ...request,
      sender: request.sender as User
    }));
  }

  async getCollaborationRequestById(id: number): Promise<CollaborationRequest | undefined> {
    const [request] = await db
      .select()
      .from(collaborationRequests)
      .where(eq(collaborationRequests.id, id));
    return request;
  }

  async updateCollaborationRequest(id: number, updates: UpdateCollaborationRequest): Promise<CollaborationRequest | undefined> {
    const [updatedRequest] = await db
      .update(collaborationRequests)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(collaborationRequests.id, id))
      .returning();
    return updatedRequest;
  }

  async deleteCollaborationRequest(id: number): Promise<boolean> {
    const result = await db
      .delete(collaborationRequests)
      .where(eq(collaborationRequests.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getPendingCollaborationRequestsCount(userId: number): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(collaborationRequests)
      .where(and(
        eq(collaborationRequests.receiverId, userId),
        eq(collaborationRequests.status, "pending")
      ));
    return result.count;
  }
}

export const storage = new EnhancedDatabaseStorage();