import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { pool } from './db';
import { and, eq, asc, desc, count, sql, not, isNull } from "drizzle-orm";
import { 
  users, 
  links, 
  profileViews, 
  follows, 
  socialPosts
} from "../shared/schema";
import type { 
  User, 
  InsertUser, 
  UpdateUser, 
  Link, 
  InsertLink, 
  UpdateLink, 
  SocialPost, 
  InsertSocialPost, 
  Follow, 
  InsertFollow, 
  ProfileStats,
  CollaborativeProfile
} from "../shared/schema";
import { IStorage } from "./storage";
import { hashPassword as hashPasswordUtil, verifyPassword } from "./auth/password";

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: 'sessions'
    });
  }

  // Password methods
  async hashPassword(password: string): Promise<string> {
    return hashPasswordUtil(password);
  }

  async comparePasswords(supplied: string, stored: string): Promise<boolean> {
    return verifyPassword(supplied, stored);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash the password before storing
    const hashedPassword = await this.hashPassword(insertUser.password);
    
    const [user] = await db.insert(users).values({
      ...insertUser,
      password: hashedPassword
    }).returning();
    
    return user;
  }

  async updateUser(id: number, updates: UpdateUser): Promise<User | undefined> {
    // If updating password, hash it first
    if (updates.password) {
      updates.password = await this.hashPassword(updates.password);
    }
    
    const [updatedUser] = await db.update(users)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }

  async updateSocialScore(userId: number, score: number): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set({
        socialScore: score,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }

  // Link methods
  async getLinks(userId: number): Promise<Link[]> {
    const results = await db.select()
      .from(links)
      .where(eq(links.userId, userId))
      .orderBy(desc(links.featured), asc(links.order));
    
    return results;
  }

  async getLinkById(id: number): Promise<Link | undefined> {
    const result = await db.select()
      .from(links)
      .where(eq(links.id, id))
      .limit(1);
    
    return result[0];
  }

  async createLink(userId: number, insertLink: InsertLink): Promise<Link> {
    const [link] = await db.insert(links)
      .values({
        ...insertLink,
        userId
      })
      .returning();
    
    return link;
  }

  async updateLink(id: number, updates: UpdateLink): Promise<Link | undefined> {
    const [updatedLink] = await db.update(links)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(links.id, id))
      .returning();
    
    return updatedLink;
  }

  async deleteLink(id: number): Promise<boolean> {
    const result = await db.delete(links)
      .where(eq(links.id, id))
      .returning({ id: links.id });
    
    return result.length > 0;
  }

  async incrementLinkClicks(id: number): Promise<Link | undefined> {
    const [updatedLink] = await db.update(links)
      .set({
        clicks: sql`${links.clicks} + 1`,
        lastClickedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(links.id, id))
      .returning();
    
    return updatedLink;
  }

  async incrementLinkViews(id: number): Promise<Link | undefined> {
    const [updatedLink] = await db.update(links)
      .set({
        views: sql`${links.views} + 1`,
        updatedAt: new Date()
      })
      .where(eq(links.id, id))
      .returning();
    
    return updatedLink;
  }

  async updateLinkAiScore(id: number, score: number): Promise<Link | undefined> {
    const [updatedLink] = await db.update(links)
      .set({
        aiScore: score,
        updatedAt: new Date()
      })
      .where(eq(links.id, id))
      .returning();
    
    return updatedLink;
  }

  async reorderLinks(userId: number, linkScores: {id: number, score: number}[]): Promise<Link[]> {
    // Update each link's AI score
    for (const { id, score } of linkScores) {
      await this.updateLinkAiScore(id, score);
    }
    
    // Update order based on scores
    const userLinks = await this.getLinks(userId);
    
    // Sort by score
    const sortedLinks = [...userLinks].sort((a, b) => {
      const scoreA = linkScores.find(s => s.id === a.id)?.score || 0;
      const scoreB = linkScores.find(s => s.id === b.id)?.score || 0;
      return scoreB - scoreA;  // Higher score first
    });
    
    // Update order values
    for (let i = 0; i < sortedLinks.length; i++) {
      await this.updateLink(sortedLinks[i].id, { order: i });
    }
    
    // Return updated links
    return this.getLinks(userId);
  }

  // Profile views
  async recordProfileView(userId: number): Promise<void> {
    await db.insert(profileViews)
      .values({
        userId
      });
  }

  // Social posts
  async getSocialPosts(userId: number): Promise<SocialPost[]> {
    const results = await db.select()
      .from(socialPosts)
      .where(eq(socialPosts.userId, userId))
      .orderBy(desc(socialPosts.postedAt));
    
    return results;
  }

  async addSocialPost(userId: number, post: InsertSocialPost): Promise<SocialPost> {
    const [socialPost] = await db.insert(socialPosts)
      .values({
        ...post,
        userId
      })
      .returning();
    
    return socialPost;
  }

  // Follow system
  async followUser(followerId: number, followingId: number): Promise<Follow> {
    // Check if already following
    const existingFollow = await db.select()
      .from(follows)
      .where(and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      ))
      .limit(1);
    
    if (existingFollow.length > 0) {
      return existingFollow[0];
    }
    
    // Create new follow relationship
    const [follow] = await db.insert(follows)
      .values({
        followerId,
        followingId
      })
      .returning();
    
    return follow;
  }

  async unfollowUser(followerId: number, followingId: number): Promise<boolean> {
    const result = await db.delete(follows)
      .where(and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      ))
      .returning({ id: follows.id });
    
    return result.length > 0;
  }

  async getFollowers(userId: number): Promise<User[]> {
    const results = await db.select({
      user: users
    })
    .from(follows)
    .innerJoin(users, eq(follows.followerId, users.id))
    .where(eq(follows.followingId, userId));
    
    return results.map(r => r.user);
  }

  async getFollowing(userId: number): Promise<User[]> {
    const results = await db.select({
      user: users
    })
    .from(follows)
    .innerJoin(users, eq(follows.followingId, users.id))
    .where(eq(follows.followerId, userId));
    
    return results.map(r => r.user);
  }

  async getFollowCounts(userId: number): Promise<{followers: number, following: number}> {
    const followersCount = await db.select({ count: count() })
      .from(follows)
      .where(eq(follows.followingId, userId));
    
    const followingCount = await db.select({ count: count() })
      .from(follows)
      .where(eq(follows.followerId, userId));
    
    return {
      followers: followersCount[0]?.count || 0,
      following: followingCount[0]?.count || 0
    };
  }

  // Collaborative profiles
  async getCollaborators(userId: number): Promise<User[]> {
    // Get users who are collaborators on projects owned by the specified user
    const results = await db.select({
      user: users
    })
    .from(projectCollaborators)
    .innerJoin(
      collaborativeProjects,
      eq(projectCollaborators.projectId, collaborativeProjects.id)
    )
    .innerJoin(
      users,
      eq(projectCollaborators.userId, users.id)
    )
    .where(eq(collaborativeProjects.ownerId, userId));
    
    return results.map(r => r.user);
  }

  async addCollaborator(userId: number, collaboratorId: number): Promise<boolean> {
    try {
      // Create a default collaborative project if none exists
      const userProjects = await db.select()
        .from(collaborativeProjects)
        .where(eq(collaborativeProjects.ownerId, userId));
      
      let projectId: number;
      
      if (userProjects.length === 0) {
        // Create a default project
        const [project] = await db.insert(collaborativeProjects)
          .values({
            name: "My Collaborative Profile",
            description: "A shared profile space",
            ownerId: userId,
            isPublic: true
          })
          .returning();
        
        projectId = project.id;
      } else {
        // Use the first project
        projectId = userProjects[0].id;
      }
      
      // Add collaborator to the project
      await db.insert(projectCollaborators)
        .values({
          projectId,
          userId: collaboratorId,
          role: "editor"
        })
        .onConflictDoUpdate({
          target: [projectCollaborators.projectId, projectCollaborators.userId],
          set: { role: "editor" }
        });
      
      return true;
    } catch (error) {
      console.error("Error adding collaborator:", error);
      return false;
    }
  }

  async removeCollaborator(userId: number, collaboratorId: number): Promise<boolean> {
    try {
      // Get projects owned by the user
      const userProjects = await db.select()
        .from(collaborativeProjects)
        .where(eq(collaborativeProjects.ownerId, userId));
      
      // Remove collaborator from all of user's projects
      for (const project of userProjects) {
        await db.delete(projectCollaborators)
          .where(and(
            eq(projectCollaborators.projectId, project.id),
            eq(projectCollaborators.userId, collaboratorId)
          ));
      }
      
      return true;
    } catch (error) {
      console.error("Error removing collaborator:", error);
      return false;
    }
  }

  // User stats
  async getUserStats(userId: number): Promise<ProfileStats> {
    // Count profile views
    const viewsResult = await db.select({ count: count() })
      .from(profileViews)
      .where(eq(profileViews.userId, userId));
    
    const views = viewsResult[0]?.count || 0;
    
    // Sum link clicks
    const clicksResult = await db.select({
      totalClicks: sql<number>`SUM(${links.clicks})`
    })
    .from(links)
    .where(eq(links.userId, userId));
    
    const clicks = clicksResult[0]?.totalClicks || 0;
    
    // Calculate CTR
    const ctr = views > 0 ? (clicks / views) * 100 : 0;
    
    // Get follow counts
    const { followers, following } = await this.getFollowCounts(userId);
    
    // Get user's social score
    const user = await this.getUser(userId);
    const score = user?.socialScore || 50;
    
    return {
      views,
      clicks,
      ctr,
      score,
      followers,
      following
    };
  }
}