import { 
  users, links, profileViews, follows, socialPosts, socialConnections,
  spotlightProjects, spotlightContributors, spotlightTags,
  industries, referralLinks, instagramPreviews, userReports,
  type User, type InsertUser, type UpdateUser,
  type Link, type InsertLink, type UpdateLink,
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
  type UserReport, type InsertUserReport, type UpdateUserReport,
  type PasswordResetToken, type InsertPasswordResetToken
} from "../shared/schema";

import {
  type EmailTemplate, type InsertEmailTemplate,
  type EmailLog, type InsertEmailLog,
  type EmailCampaign, type InsertEmailCampaign
} from "../shared/email-schema";
import {
  type SupportMessage, type InsertSupportMessage, type UpdateSupportMessage
} from "../shared/support-schema";
import session from "express-session";
import { EnhancedDatabaseStorage } from "./db-storage-enhanced";

// Define the storage interface with all CRUD methods
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: UpdateUser): Promise<User | undefined>;
  updateSocialScore(userId: number, score: number): Promise<User | undefined>;
  updatePitchMode(userId: number, enabled: boolean, type?: string, description?: string, focusAreas?: string[]): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Password methods
  comparePasswords(supplied: string, stored: string): Promise<boolean>;
  hashPassword(password: string): Promise<string>;
  
  // Password reset methods
  createPasswordResetToken(email: string): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(token: string): Promise<boolean>;
  cleanupExpiredTokens(): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<User | undefined>;
  
  // Links
  getLinks(userId: number): Promise<Link[]>;
  getLinkById(id: number): Promise<Link | undefined>;
  backfillLinksForUser(userId: number): Promise<void>;
  createLink(userId: number, link: InsertLink): Promise<Link>;
  updateLink(id: number, updates: UpdateLink): Promise<Link | undefined>;
  deleteLink(id: number, userId?: number): Promise<boolean>;
  deleteLinkOwned(id: number, userId: number): Promise<boolean>;
  incrementLinkClicks(id: number): Promise<Link | undefined>;
  incrementLinkViews(id: number): Promise<Link | undefined>;
  updateLinkAiScore(id: number, score: number): Promise<Link | undefined>;
  reorderLinks(userId: number, linkScores: {id: number, score: number}[]): Promise<Link[]>;
  
  // Instagram Content Preview (replaces Live Profile Feed)
  getInstagramPreview(userId: number): Promise<InstagramPreview | undefined>;
  saveInstagramPreview(userId: number, preview: InsertInstagramPreview): Promise<InstagramPreview>;
  updateInstagramPreview(userId: number, updates: UpdateInstagramPreview): Promise<InstagramPreview | undefined>;
  deleteInstagramPreview(userId: number): Promise<boolean>;
  toggleInstagramPreview(userId: number, enabled: boolean): Promise<InstagramPreview | undefined>;
  
  // Social Feed (for other platforms)
  getSocialPosts(userId: number): Promise<SocialPost[]>;
  addSocialPost(userId: number, post: InsertSocialPost): Promise<SocialPost>;
  getFeedPosts(userId: number, followingOnly: boolean): Promise<(SocialPost & { user: User })[]>;
  
  // Follows System
  followUser(followerId: number, followingId: number): Promise<Follow>;
  unfollowUser(followerId: number, followingId: number): Promise<boolean>;
  getFollowers(userId: number): Promise<User[]>;
  getFollowing(userId: number): Promise<User[]>;
  getFollowCounts(userId: number): Promise<{followers: number, following: number}>;
  isFollowing(followerId: number, followingId: number): Promise<boolean>;
  getSuggestedUsers(userId: number): Promise<User[]>;
  
  // Spotlight Projects
  getSpotlightProjects(userId: number): Promise<SpotlightProject[]>;
  getSpotlightProjectById(projectId: number): Promise<SpotlightProject | undefined>;
  createSpotlightProject(project: InsertSpotlightProject, userId: number): Promise<SpotlightProject>;
  updateSpotlightProject(projectId: number, updates: Partial<SpotlightProject>): Promise<SpotlightProject | undefined>;
  deleteSpotlightProject(projectId: number): Promise<boolean>;
  incrementProjectViews(projectId: number): Promise<void>;
  incrementProjectClicks(projectId: number): Promise<void>;
  setPinnedStatus(projectId: number, isPinned: boolean): Promise<SpotlightProject | undefined>;
  
  // Contributors
  getProjectContributors(projectId: number): Promise<SpotlightContributor[]>;
  addContributor(projectId: number, contributor: Omit<InsertContributor, 'projectId'>): Promise<SpotlightContributor>;
  removeContributor(contributorId: number): Promise<boolean>;
  
  // Tags
  getProjectTags(projectId: number): Promise<SpotlightTag[]>;
  addTag(projectId: number, tag: Omit<InsertTag, 'projectId'>): Promise<SpotlightTag>;
  removeTag(tagId: number): Promise<boolean>;
  
  // Industry Discovery Feature
  getAllIndustries(): Promise<Industry[]>;
  createIndustry(industry: InsertIndustry): Promise<Industry>;
  getSimilarUsers(userId: number, industryId: number, limit?: number): Promise<User[]>;
  discoverUsers(userId: number, filters: any): Promise<User[]>;
  
  // Referral Links Feature
  getReferralLinks(userId: number): Promise<ReferralLink[]>;
  getReferralLinkById(id: number): Promise<ReferralLink | undefined>;
  createReferralLink(userId: number, link: InsertReferralLink): Promise<ReferralLink>;
  updateReferralLink(id: number, updates: Partial<InsertReferralLink>): Promise<ReferralLink | undefined>;
  deleteReferralLink(id: number): Promise<boolean>;
  incrementReferralLinkClicks(id: number): Promise<ReferralLink | undefined>;
  
  // Profile Stats
  recordProfileView(userId: number): Promise<void>;
  getUserStats(userId: number, dateFilter?: Date): Promise<ProfileStats>;

  // Social Media Integration
  getSocialConnections(userId: number): Promise<SocialConnection[]>;
  getSocialConnection(userId: number, platform: string): Promise<SocialConnection | undefined>;
  saveSocialConnection(connection: InsertSocialConnection): Promise<SocialConnection>;
  removeSocialConnection(userId: number, platform: string): Promise<boolean>;
  deleteSocialConnection(userId: number, platform: string): Promise<boolean>;
  updateSocialConnectionSyncTime(userId: number, platform: string): Promise<void>;
  saveSocialPost(post: InsertSocialPost): Promise<SocialPost>;
  getSocialPostsByConnection(connectionId: number): Promise<SocialPost[]>;

  // Email Templates
  getEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplate(id: number): Promise<EmailTemplate | undefined>;
  getEmailTemplateByType(type: string): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: number, updates: Partial<EmailTemplate>): Promise<EmailTemplate | undefined>;
  deleteEmailTemplate(id: number): Promise<boolean>;

  // Email Logs
  getEmailLogs(limit?: number, offset?: number): Promise<EmailLog[]>;
  createEmailLog(log: InsertEmailLog): Promise<EmailLog>;
  getEmailLogsByTemplate(templateId: number): Promise<EmailLog[]>;

  // Email Campaigns
  getEmailCampaigns(): Promise<EmailCampaign[]>;
  getEmailCampaign(id: number): Promise<EmailCampaign | undefined>;
  createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign>;
  updateEmailCampaign(id: number, updates: Partial<EmailCampaign>): Promise<EmailCampaign | undefined>;
  deleteEmailCampaign(id: number): Promise<boolean>;

  // Support Messages
  getAllSupportMessages(): Promise<SupportMessage[]>;
  getSupportMessage(id: number): Promise<SupportMessage | undefined>;
  createSupportMessage(message: InsertSupportMessage): Promise<SupportMessage>;
  updateSupportMessage(id: number, updates: UpdateSupportMessage): Promise<SupportMessage | undefined>;
  deleteSupportMessage(id: number): Promise<boolean>;

  // User Reports
  getUserReports(): Promise<UserReport[]>;
  getUserReport(id: number): Promise<UserReport | undefined>;
  createUserReport(report: InsertUserReport): Promise<UserReport>;
  updateUserReport(id: number, updates: UpdateUserReport): Promise<UserReport | undefined>;
  deleteUserReport(id: number): Promise<boolean>;
  getReportsByStatus(status: string): Promise<UserReport[]>;
  getReportsByUser(userId: number): Promise<UserReport[]>;

  // Collaboration requests methods
  getCollaborationRequests(userId: number, status?: string): Promise<any[]>;
  getCollaborationRequestById(id: number): Promise<any>;
  updateCollaborationRequest(id: number, updates: any): Promise<any>;
  deleteCollaborationRequest(id: number): Promise<boolean>;
  createCollaborationRequest(request: any): Promise<any>;

  // Admin methods
  getAllUsers(): Promise<User[]>;
  getTotalProfileViews(): Promise<number>;
  getAllLinks(): Promise<Link[]>;

  // Session store
  sessionStore: any; // Using 'any' to avoid type issues with express-session
}

// Export an enhanced database storage instance with new features
export const storage = new EnhancedDatabaseStorage();