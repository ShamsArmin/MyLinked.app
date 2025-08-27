import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { pool } from './db';
import { and, eq, asc, desc, count, sql } from "drizzle-orm";
import { 
  users, 
  links, 
  profileViews, 
  follows, 
  socialPosts,
  spotlightProjects,
  spotlightContributors,
  spotlightTags
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
  SpotlightProject,
  InsertSpotlightProject,
  SpotlightContributor,
  InsertContributor,
  SpotlightTag,
  InsertTag
} from "../shared/schema";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { IStorage } from "./storage";

// Set up scrypt for password hashing
const scryptAsync = promisify(scrypt);

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
    const salt = randomBytes(16).toString('hex');
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString('hex')}.${salt}`;
  }

  async comparePasswords(supplied: string, stored: string): Promise<boolean> {
    const [hashed, salt] = stored.split('.');
    const hashedBuf = Buffer.from(hashed, 'hex');
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
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
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: UpdateUser): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }

  async updateSocialScore(userId: number, score: number): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set({
        socialScore: score
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
      .set(updates)
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
        clicks: sql`${links.clicks} + 1`
      })
      .where(eq(links.id, id))
      .returning();
    
    return updatedLink;
  }

  async incrementLinkViews(id: number): Promise<Link | undefined> {
    const [updatedLink] = await db.update(links)
      .set({
        views: sql`${links.views} + 1`
      })
      .where(eq(links.id, id))
      .returning();
    
    return updatedLink;
  }

  async updateLinkAiScore(id: number, score: number): Promise<Link | undefined> {
    const [updatedLink] = await db.update(links)
      .set({
        aiScore: score
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
    // In this simplified version, we use the collaborators array in the user record
    const user = await this.getUser(userId);
    if (!user || !user.isCollaborative || !user.collaborators || user.collaborators.length === 0) {
      return [];
    }
    
    // Get all collaborators by their usernames
    const collaborators: User[] = [];
    for (const username of user.collaborators) {
      const collaborator = await this.getUserByUsername(username);
      if (collaborator) {
        collaborators.push(collaborator);
      }
    }
    
    return collaborators;
  }

  async addCollaborator(userId: number, collaboratorId: number): Promise<boolean> {
    try {
      // Get both users
      const user = await this.getUser(userId);
      const collaborator = await this.getUser(collaboratorId);
      
      if (!user || !collaborator) {
        return false;
      }
      
      // Get current collaborators array or create if it doesn't exist
      const collaborators = user.collaborators || [];
      
      // Check if already a collaborator
      if (collaborators.includes(collaborator.username)) {
        return true;
      }
      
      // Add to collaborators
      collaborators.push(collaborator.username);
      
      // Update user
      await this.updateUser(userId, {
        isCollaborative: true,
        collaborators
      });
      
      return true;
    } catch (error) {
      console.error("Error adding collaborator:", error);
      return false;
    }
  }

  async removeCollaborator(userId: number, collaboratorId: number): Promise<boolean> {
    try {
      // Get both users
      const user = await this.getUser(userId);
      const collaborator = await this.getUser(collaboratorId);
      
      if (!user || !collaborator || !user.collaborators) {
        return false;
      }
      
      // Remove from collaborators
      const updatedCollaborators = user.collaborators.filter(
        username => username !== collaborator.username
      );
      
      // Update user
      await this.updateUser(userId, {
        isCollaborative: updatedCollaborators.length > 0,
        collaborators: updatedCollaborators
      });
      
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

  // Spotlight Projects
  async getSpotlightProjects(userId: number): Promise<SpotlightProject[]> {
    try {
      const projects = await db
        .select()
        .from(spotlightProjects)
        .where(eq(spotlightProjects.userId, userId))
        .orderBy(
          desc(spotlightProjects.isPinned),
          desc(spotlightProjects.createdAt)
        );

      return projects;
    } catch (error) {
      console.error("Error fetching spotlight projects:", error);
      return [];
    }
  }

  async getSpotlightProjectById(projectId: number): Promise<SpotlightProject | undefined> {
    try {
      const [project] = await db
        .select()
        .from(spotlightProjects)
        .where(eq(spotlightProjects.id, projectId));
      
      return project;
    } catch (error) {
      console.error("Error fetching spotlight project:", error);
      return undefined;
    }
  }

  async createSpotlightProject(project: InsertSpotlightProject, userId: number): Promise<SpotlightProject> {
    try {
      const [newProject] = await db
        .insert(spotlightProjects)
        .values({
          ...project,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      return newProject;
    } catch (error) {
      console.error("Error creating spotlight project:", error);
      throw new Error("Failed to create spotlight project");
    }
  }

  async updateSpotlightProject(projectId: number, updates: Partial<SpotlightProject>): Promise<SpotlightProject | undefined> {
    try {
      const [updatedProject] = await db
        .update(spotlightProjects)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(spotlightProjects.id, projectId))
        .returning();
      
      return updatedProject;
    } catch (error) {
      console.error("Error updating spotlight project:", error);
      return undefined;
    }
  }

  async deleteSpotlightProject(projectId: number): Promise<boolean> {
    try {
      await db
        .delete(spotlightProjects)
        .where(eq(spotlightProjects.id, projectId));
      
      return true;
    } catch (error) {
      console.error("Error deleting spotlight project:", error);
      return false;
    }
  }

  async incrementProjectViews(projectId: number): Promise<void> {
    try {
      await db
        .update(spotlightProjects)
        .set({
          viewCount: sql`${spotlightProjects.viewCount} + 1`,
          updatedAt: new Date()
        })
        .where(eq(spotlightProjects.id, projectId));
    } catch (error) {
      console.error("Error incrementing project views:", error);
    }
  }

  async incrementProjectClicks(projectId: number): Promise<void> {
    try {
      await db
        .update(spotlightProjects)
        .set({
          clickCount: sql`${spotlightProjects.clickCount} + 1`,
          updatedAt: new Date()
        })
        .where(eq(spotlightProjects.id, projectId));
    } catch (error) {
      console.error("Error incrementing project clicks:", error);
    }
  }

  async setPinnedStatus(projectId: number, isPinned: boolean): Promise<SpotlightProject | undefined> {
    try {
      // If pinning, first check if the user already has the maximum number of pinned projects
      if (isPinned) {
        const project = await this.getSpotlightProjectById(projectId);
        if (!project) return undefined;
        
        const userPinnedProjects = await db
          .select()
          .from(spotlightProjects)
          .where(
            and(
              eq(spotlightProjects.userId, project.userId),
              eq(spotlightProjects.isPinned, true)
            )
          );
        
        if (userPinnedProjects.length >= 2) {
          throw new Error("Maximum of 2 pinned projects allowed");
        }
      }
      
      const [updatedProject] = await db
        .update(spotlightProjects)
        .set({
          isPinned,
          updatedAt: new Date()
        })
        .where(eq(spotlightProjects.id, projectId))
        .returning();
      
      return updatedProject;
    } catch (error) {
      console.error("Error setting pinned status:", error);
      return undefined;
    }
  }

  // Contributors
  async getProjectContributors(projectId: number): Promise<SpotlightContributor[]> {
    try {
      const contributors = await db
        .select()
        .from(spotlightContributors)
        .where(eq(spotlightContributors.projectId, projectId));
      
      // Enrich with user data if available
      const contributorsWithUserInfo = await Promise.all(
        contributors.map(async (contributor) => {
          let user = undefined;
          
          if (contributor.userId) {
            user = await this.getUser(contributor.userId);
          }
          
          return {
            ...contributor,
            user
          };
        })
      );
      
      return contributorsWithUserInfo;
    } catch (error) {
      console.error("Error fetching project contributors:", error);
      return [];
    }
  }

  async addContributor(projectId: number, contributor: Omit<InsertContributor, 'projectId'>): Promise<SpotlightContributor> {
    try {
      // Check if email is provided and exists in our system
      let userId = undefined;
      let isRegisteredUser = false;
      
      if (contributor.email) {
        const user = await this.getUserByEmail(contributor.email);
        if (user) {
          userId = user.id;
          isRegisteredUser = true;
        }
      }
      
      const [newContributor] = await db
        .insert(spotlightContributors)
        .values({
          projectId,
          ...contributor,
          userId,
          isRegisteredUser,
          addedAt: new Date()
        })
        .returning();
      
      // Add user info if it's a registered user
      let user = undefined;
      if (userId) {
        user = await this.getUser(userId);
      }
      
      return {
        ...newContributor,
        user
      };
    } catch (error) {
      console.error("Error adding contributor:", error);
      throw new Error("Failed to add contributor");
    }
  }

  async removeContributor(contributorId: number): Promise<boolean> {
    try {
      await db
        .delete(spotlightContributors)
        .where(eq(spotlightContributors.id, contributorId));
      
      return true;
    } catch (error) {
      console.error("Error removing contributor:", error);
      return false;
    }
  }

  // Tags
  async getProjectTags(projectId: number): Promise<SpotlightTag[]> {
    try {
      const tags = await db
        .select()
        .from(spotlightTags)
        .where(eq(spotlightTags.projectId, projectId));
      
      return tags;
    } catch (error) {
      console.error("Error fetching project tags:", error);
      return [];
    }
  }

  async addTag(projectId: number, tag: Omit<InsertTag, 'projectId'>): Promise<SpotlightTag> {
    try {
      const [newTag] = await db
        .insert(spotlightTags)
        .values({
          projectId,
          ...tag,
        })
        .returning();
      
      return newTag;
    } catch (error) {
      console.error("Error adding tag:", error);
      throw new Error("Failed to add tag");
    }
  }

  async removeTag(tagId: number): Promise<boolean> {
    try {
      await db
        .delete(spotlightTags)
        .where(eq(spotlightTags.id, tagId));
      
      return true;
    } catch (error) {
      console.error("Error removing tag:", error);
      return false;
    }
  }

  // Additional methods for users
  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      
      return user;
    } catch (error) {
      console.error("Error fetching user by email:", error);
      return undefined;
    }
  }
}