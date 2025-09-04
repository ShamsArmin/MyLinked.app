import { pgTable, text, serial, timestamp, integer, json, boolean, varchar, jsonb, decimal, uuid, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";

// Sessions table for authentication
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// OAuth state storage for PKCE flows
export const oauthStates = pgTable("oauth_states", {
  id: serial("id").primaryKey(),
  state: text("state").notNull().unique(),
  userId: uuid("user_id").notNull(),
  platform: text("platform").notNull(),
  codeVerifier: text("code_verifier"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Industries table
export const industries = pgTable("industries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  icon: text("icon"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Users table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").unique(),
  bio: text("bio"),
  profileImage: text("profile_image"),
  profileBackground: text("profile_background"),
  font: text("font").default("inter"),
  theme: text("theme").default("default"),
  viewMode: text("view_mode").default("list"),
  darkMode: boolean("dark_mode").default(false),
  // Enhanced features
  welcomeMessage: text("welcome_message"),
  socialScore: integer("social_score").default(50),
  showSocialScore: boolean("show_social_score").default(false), // Public profile visibility toggle
  isCollaborative: boolean("is_collaborative").default(false),
  collaborators: text("collaborators").array(),
  pitchMode: boolean("pitch_mode").default(false),
  pitchModeType: text("pitch_mode_type").default("professional"), // professional, creative, startup, speaker
  pitchDescription: text("pitch_description"),
  pitchFocusAreas: text("pitch_focus_areas").array(), // User-selected focus areas for pitch mode
  profession: text("profession"), // Professional title/role
  // New fields for industry discovery
  industryId: integer("industry_id").references(() => industries.id),
  location: text("location"),
  interests: text("interests").array(), // User's professional interests
  tags: text("tags").array(), // Tags like #freelancer, #3Ddesign
  isAdmin: boolean("is_admin").default(false),
  role: varchar("role", { length: 50 }).default("user"), // user, admin, developer, employee, moderator, super_admin
  permissions: text("permissions").array(), // Custom permissions array
  department: varchar("department", { length: 100 }),
  position: varchar("position", { length: 100 }),
  salary: integer("salary"),
  hireDate: timestamp("hire_date"),
  lastLoginAt: timestamp("last_login_at"),
  isActive: boolean("is_active").default(true),
  status: varchar("status", { length: 50 }).default("active"), // active, suspended
  maxLinks: integer("max_links"),
  dailyClickQuota: integer("daily_click_quota"),
  settings: jsonb("settings").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// User themes table for custom theme preferences
export const userThemes = pgTable("user_themes", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  themeId: text("theme_id").notNull(),
  name: text("name").notNull(),
  colors: jsonb("colors").notNull(),
  gradient: text("gradient"),
  isCustom: boolean("is_custom").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Feature toggles table for admin panel
export const featureToggles = pgTable("feature_toggles", {
  id: serial("id").primaryKey(),
  featureName: text("feature_name").notNull().unique(),
  isEnabled: boolean("is_enabled").default(true),
  description: text("description"),
  updatedBy: uuid("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System logs table for admin monitoring
export const systemLogs = pgTable("system_logs", {
  id: serial("id").primaryKey(),
  level: text("level").notNull(), // error, warning, info
  message: text("message").notNull(),
  source: text("source"), // oauth, api, auth, etc.
  userId: uuid("user_id").references(() => users.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit logs for admin actions
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  actorId: uuid("actor_id").references(() => users.id),
  targetUserId: uuid("target_user_id").references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Roles and permissions system
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  permissions: text("permissions").array().notNull(),
  isSystem: boolean("is_system").default(false), // System roles cannot be deleted
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(), // user_management, system_admin, content_moderation, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  roleId: integer("role_id").references(() => roles.id, { onDelete: "cascade" }).notNull(),
  assignedBy: uuid("assigned_by").references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

export const employeeProfiles = pgTable("employee_profiles", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  employeeId: varchar("employee_id", { length: 20 }).unique(),
  department: varchar("department", { length: 100 }),
  position: varchar("position", { length: 100 }),
  salary: integer("salary"),
  hireDate: timestamp("hire_date"),
  manager: uuid("manager").references(() => users.id),
  workLocation: varchar("work_location", { length: 100 }),
  workType: varchar("work_type", { length: 50 }), // full-time, part-time, contract, intern
  status: varchar("status", { length: 50 }).default("active"), // active, inactive, terminated
  performanceRating: integer("performance_rating"), // 1-5 scale
  lastReview: timestamp("last_review"),
  nextReview: timestamp("next_review"),
  benefits: text("benefits").array(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations for industries
export const industriesRelations = relations(industries, ({ many }) => ({
  users: many(users),
}));

// User themes relations
export const userThemesRelations = relations(userThemes, ({ one }) => ({
  user: one(users, {
    fields: [userThemes.userId],
    references: [users.id],
  }),
}));

// Referral Links table
export const referralLinks = pgTable("referral_links", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  image: text("image"), // Small logo or profile image
  linkType: text("link_type").notNull().default("friend"), // friend, sponsor, affiliate
  referenceUserId: uuid("reference_user_id").references(() => users.id),
  referenceCompany: text("reference_company"),
  clicks: integer("clicks").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Relations for referral links
export const referralLinksRelations = relations(referralLinks, ({ one }) => ({
  user: one(users, {
    fields: [referralLinks.userId],
    references: [users.id],
  }),
  referenceUser: one(users, {
    fields: [referralLinks.referenceUserId],
    references: [users.id],
  }),
}));

// Relations for users
export const usersRelations = relations(users, ({ many, one }) => ({
  links: many(links),
  profileViews: many(profileViews),
  followersRelation: many(follows, { relationName: "followers" }),
  followingRelation: many(follows, { relationName: "following" }),
  socialPosts: many(socialPosts),
  instagramPreviews: many(instagramPreviews),
  referralLinks: many(referralLinks),
  industry: one(industries, {
    fields: [users.industryId],
    references: [industries.id],
  }),
}));

// Links table
export const links = pgTable("links", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  platform: text("platform").notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  color: text("color"),
  clicks: integer("clicks").default(0),
  views: integer("views").default(0), // Track views for better analytics
  featured: boolean("featured").default(false),
  order: integer("order").default(0),
  aiScore: integer("ai_score"), // For Smart Link AI prioritization
  lastClickedAt: timestamp("last_clicked_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Relations for links
export const linksRelations = relations(links, ({ one }) => ({
  user: one(users, {
    fields: [links.userId],
    references: [users.id],
  }),
}));

// Profile views table
export const profileViews = pgTable("profile_views", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  viewedAt: timestamp("viewed_at").defaultNow(),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
});

// Relations for profile views
export const profileViewsRelations = relations(profileViews, ({ one }) => ({
  user: one(users, {
    fields: [profileViews.userId],
    references: [users.id],
  }),
}));

// Follows table
export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: uuid("follower_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  followingId: uuid("following_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations for follows
export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
    relationName: "following",
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id],
    relationName: "followers",
  }),
}));

// Social media connections table for OAuth tokens
export const socialConnections = pgTable("social_connections", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  platform: text("platform").notNull(), // instagram, facebook, linkedin, twitter, tiktok
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  platformUserId: text("platform_user_id"),
  platformUsername: text("platform_username"),
  connectedAt: timestamp("connected_at").defaultNow(),
  lastSyncAt: timestamp("last_sync_at"),
});

// Instagram content preview table - replaces Live Profile Feed
export const instagramPreviews = pgTable("instagram_previews", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: text("post_id").notNull().unique(), // Instagram media ID
  imageUrl: text("image_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  postUrl: text("post_url").notNull(), // Permalink to Instagram post
  caption: text("caption"),
  isEnabled: boolean("is_enabled").default(true), // User can opt in/out
  postedAt: timestamp("posted_at").notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Social posts table (kept for other platforms)
export const socialPosts = pgTable("social_posts", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  platform: text("platform").notNull(), // facebook, tiktok, youtube, etc.
  postUrl: text("post_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  caption: text("caption"),
  postedAt: timestamp("posted_at").notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow(),
  connectionId: integer("connection_id").references(() => socialConnections.id, { onDelete: 'cascade' }),
});

// Relations for social connections
export const socialConnectionsRelations = relations(socialConnections, ({ one, many }) => ({
  user: one(users, {
    fields: [socialConnections.userId],
    references: [users.id],
  }),
  posts: many(socialPosts),
}));

// Relations for Instagram previews
export const instagramPreviewsRelations = relations(instagramPreviews, ({ one }) => ({
  user: one(users, {
    fields: [instagramPreviews.userId],
    references: [users.id],
  }),
}));

// Relations for social posts
export const socialPostsRelations = relations(socialPosts, ({ one }) => ({
  user: one(users, {
    fields: [socialPosts.userId],
    references: [users.id],
  }),
  connection: one(socialConnections, {
    fields: [socialPosts.connectionId],
    references: [socialConnections.id],
  }),
}));

// Industry schema
export const insertIndustrySchema = createInsertSchema(industries).pick({
  name: true,
  icon: true,
});

// User schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  bio: true,
  profileImage: true,
}).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const updateUserSchema = createInsertSchema(users).pick({
  username: true,
  name: true,
  email: true,
  bio: true,
  profileImage: true,
  profileBackground: true,
  font: true,
  theme: true,
  viewMode: true,
  darkMode: true,
  password: true,
  // New feature fields
  welcomeMessage: true,

  showSocialScore: true,
  isCollaborative: true,
  collaborators: true,
  pitchMode: true,
  pitchModeType: true,
  pitchDescription: true,
  profession: true,
  // New fields for industry discovery
  industryId: true,
  location: true,
  interests: true,
  tags: true,
}).partial().extend({
  bio: z.string().max(160, "Bio must be 160 characters or less").optional(),
});

// Referral link schemas
export const insertReferralLinkSchema = createInsertSchema(referralLinks).pick({
  title: true,
  url: true,
  description: true,
  image: true,
  linkType: true,
  referenceUserId: true,
  referenceCompany: true,
}).partial({
  description: true,
  image: true,
  referenceUserId: true,
  referenceCompany: true,
});

// Link schemas
export const insertLinkSchema = createInsertSchema(links).pick({
  platform: true,
  title: true,
  url: true,
  description: true,
  color: true,
  featured: true,
});

export const updateLinkSchema = createInsertSchema(links).pick({
  platform: true,
  title: true,
  url: true,
  description: true,
  color: true,
  featured: true,
  order: true,
}).partial();

// Instagram preview schema
export const insertInstagramPreviewSchema = createInsertSchema(instagramPreviews).pick({
  postId: true,
  imageUrl: true,
  thumbnailUrl: true,
  postUrl: true,
  caption: true,
  isEnabled: true,
  postedAt: true,
});

export const updateInstagramPreviewSchema = createInsertSchema(instagramPreviews).pick({
  imageUrl: true,
  thumbnailUrl: true,
  postUrl: true,
  caption: true,
  isEnabled: true,
  postedAt: true,
}).partial();

// Social post schema
export const insertSocialPostSchema = createInsertSchema(socialPosts).pick({
  userId: true,
  platform: true,
  postUrl: true,
  thumbnailUrl: true,
  caption: true,
  postedAt: true,
});

// Follow schema
export const insertFollowSchema = createInsertSchema(follows).pick({
  followerId: true,
  followingId: true,
});

// Types
export type InsertIndustry = z.infer<typeof insertIndustrySchema>;
export type Industry = typeof industries.$inferSelect;

// Social connection types
export type SocialConnection = typeof socialConnections.$inferSelect;
export type InsertSocialConnection = typeof socialConnections.$inferInsert;

export type InsertLink = z.infer<typeof insertLinkSchema>;
export type UpdateLink = z.infer<typeof updateLinkSchema>;
export type Link = typeof links.$inferSelect;

export type InsertReferralLink = z.infer<typeof insertReferralLinkSchema>;
export type ReferralLink = typeof referralLinks.$inferSelect;

export type InsertInstagramPreview = z.infer<typeof insertInstagramPreviewSchema>;
export type UpdateInstagramPreview = z.infer<typeof updateInstagramPreviewSchema>;
export type InstagramPreview = typeof instagramPreviews.$inferSelect;

export type InsertSocialPost = z.infer<typeof insertSocialPostSchema>;
export type SocialPost = typeof socialPosts.$inferSelect;

export type InsertFollow = z.infer<typeof insertFollowSchema>;
export type Follow = typeof follows.$inferSelect;

export type InsertReferralRequest = z.infer<typeof insertReferralRequestSchema>;
export type UpdateReferralRequest = z.infer<typeof updateReferralRequestSchema>;
export type ReferralRequest = typeof referralRequests.$inferSelect;
export type InsertCollaborationRequestNotification = z.infer<typeof insertCollaborationRequestNotificationSchema>;
export type UpdateCollaborationRequestNotification = z.infer<typeof updateCollaborationRequestNotificationSchema>;
export type CollaborationRequestNotification = typeof collaborationRequestsNotifications.$inferSelect;

export type ProfileStats = {
  views: number;
  clicks: number;
  ctr: number;
  score: number;
  followers?: number;
  following?: number;
};

// Collaborative Spotlight Projects
export const spotlightProjects = pgTable("spotlight_projects", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 100 }).notNull(),
  url: varchar("url", { length: 1000 }).notNull(),
  description: text("description"),
  thumbnail: text("thumbnail"), // Changed from varchar to text to allow larger images
  isPinned: boolean("is_pinned").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  viewCount: integer("view_count").default(0),
  clickCount: integer("click_count").default(0),
});

export const spotlightProjectsRelations = relations(spotlightProjects, ({ many, one }) => ({
  contributors: many(spotlightContributors),
  tags: many(spotlightTags),
  owner: one(users, {
    fields: [spotlightProjects.userId],
    references: [users.id],
  }),
}));

export const spotlightContributors = pgTable("spotlight_contributors", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => spotlightProjects.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  role: varchar("role", { length: 50 }),
  isRegisteredUser: boolean("is_registered_user").default(false),
  addedAt: timestamp("added_at").defaultNow(),
});

export const spotlightContributorsRelations = relations(spotlightContributors, ({ one }) => ({
  project: one(spotlightProjects, {
    fields: [spotlightContributors.projectId],
    references: [spotlightProjects.id],
  }),
  user: one(users, {
    fields: [spotlightContributors.userId],
    references: [users.id],
  }),
}));

export const spotlightTags = pgTable("spotlight_tags", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => spotlightProjects.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 50 }).notNull(),
  icon: varchar("icon", { length: 50 }),
  type: varchar("type", { length: 20 }).default("tag"),
});

export const spotlightTagsRelations = relations(spotlightTags, ({ one }) => ({
  project: one(spotlightProjects, {
    fields: [spotlightTags.projectId],
    references: [spotlightProjects.id],
  }),
}));

// Referral requests table for notifications
export const referralRequests = pgTable("referral_requests", {
  id: serial("id").primaryKey(),
  targetUserId: uuid("target_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  requesterName: varchar("requester_name", { length: 100 }).notNull(),
  requesterEmail: varchar("requester_email", { length: 255 }).notNull(),
  requesterPhone: varchar("requester_phone", { length: 50 }),
  requesterWebsite: varchar("requester_website", { length: 500 }),
  fieldOfWork: varchar("field_of_work", { length: 100 }),
  description: text("description"),
  linkTitle: varchar("link_title", { length: 100 }),
  linkUrl: varchar("link_url", { length: 500 }),
  status: varchar("status", { length: 20 }).default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const referralRequestsRelations = relations(referralRequests, ({ one }) => ({
  targetUser: one(users, {
    fields: [referralRequests.targetUserId],
    references: [users.id],
  }),
}));

// Referral request schemas
export const insertReferralRequestSchema = createInsertSchema(referralRequests).pick({
  targetUserId: true,
  requesterName: true,
  requesterEmail: true,
  requesterPhone: true,
  requesterWebsite: true,
  fieldOfWork: true,
  description: true,
  linkTitle: true,
  linkUrl: true,
});

export const updateReferralRequestSchema = createInsertSchema(referralRequests).pick({
  status: true,
}).partial();

// Collaboration requests table for notifications - different from the existing collaboration system
export const collaborationRequestsNotifications = pgTable("collaboration_requests_notifications", {
  id: serial("id").primaryKey(),
  targetUserId: uuid("target_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  requesterName: varchar("requester_name", { length: 100 }).notNull(),
  requesterEmail: varchar("requester_email", { length: 255 }).notNull(),
  requesterCompany: varchar("requester_company", { length: 255 }),
  requesterSkills: varchar("requester_skills", { length: 500 }),
  projectType: varchar("project_type", { length: 100 }),
  timeline: varchar("timeline", { length: 100 }),
  budget: varchar("budget", { length: 100 }),
  description: text("description"),
  status: varchar("status", { length: 20 }).default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const collaborationRequestsNotificationsRelations = relations(collaborationRequestsNotifications, ({ one }) => ({
  targetUser: one(users, {
    fields: [collaborationRequestsNotifications.targetUserId],
    references: [users.id],
  }),
}));

// Collaboration request schemas
export const insertCollaborationRequestNotificationSchema = createInsertSchema(collaborationRequestsNotifications).pick({
  targetUserId: true,
  requesterName: true,
  requesterEmail: true,
  requesterCompany: true,
  requesterSkills: true,
  projectType: true,
  timeline: true,
  budget: true,
  description: true,
});

export const updateCollaborationRequestNotificationSchema = createInsertSchema(collaborationRequestsNotifications).pick({
  status: true,
}).partial();

// Types for input forms
export type ContributorInput = {
  name: string;
  email?: string;
  role?: string;
  isRegisteredUser?: boolean;
  userId?: string;
};

export type TagInput = {
  label: string;
  icon?: string;
  type?: string;
};

// Form schemas for Collaborative Spotlight features
export const createSpotlightProjectSchema = createInsertSchema(spotlightProjects)
  .pick({
    title: true,
    url: true,
    description: true,
    isPinned: true,
  })
  .extend({
    thumbnail: z.string().optional(), // Override the default validation for thumbnail
    contributors: z.array(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email().optional(),
        role: z.string().optional(),
        isRegisteredUser: z.boolean().optional().default(false),
        userId: z.string().optional(),
      })
    ).optional(),
    tags: z.array(
      z.object({
        label: z.string().min(1, "Label is required"),
        icon: z.string().optional(),
        type: z.string().optional().default("tag"),
      })
    ).max(3).optional(),
  });

export const contributorSchema = createInsertSchema(spotlightContributors)
  .pick({
    projectId: true,
    name: true,
    email: true,
    role: true,
  });

export const tagSchema = createInsertSchema(spotlightTags)
  .pick({
    projectId: true,
    label: true,
    icon: true,
    type: true,
  });

export type InsertSpotlightProject = z.infer<typeof createSpotlightProjectSchema>;
export type InsertContributor = z.infer<typeof contributorSchema>;
export type InsertTag = z.infer<typeof tagSchema>;

export type SpotlightProject = typeof spotlightProjects.$inferSelect;
export type SpotlightContributor = typeof spotlightContributors.$inferSelect & { user?: User };
export type SpotlightTag = typeof spotlightTags.$inferSelect;



// OAuth state types
export type OAuthState = typeof oauthStates.$inferSelect;
export type InsertOAuthState = typeof oauthStates.$inferInsert;



// Admin panel types
export type FeatureToggle = typeof featureToggles.$inferSelect;
export type InsertFeatureToggle = typeof featureToggles.$inferInsert;

export type SystemLog = typeof systemLogs.$inferSelect;
export type InsertSystemLog = typeof systemLogs.$inferInsert;

// Admin panel form schemas
export const insertFeatureToggleSchema = createInsertSchema(featureToggles)
  .pick({
    featureName: true,
    isEnabled: true,
    description: true,
  });

export const insertSystemLogSchema = createInsertSchema(systemLogs)
  .pick({
    level: true,
    message: true,
    source: true,
    userId: true,
    metadata: true,
  });

// User Reports table
export const userReports = pgTable("user_reports", {
  id: serial("id").primaryKey(),
  reporterName: text("reporter_name"),
  reporterEmail: text("reporter_email"),
  reportedUserId: uuid("reported_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  reportedUsername: text("reported_username"),
  reason: text("reason").notNull(), // harassment, inappropriate_content, spam, fake_account, copyright_violation, other
  description: text("description").notNull(),
  status: text("status").default("pending"), // pending, reviewed, resolved, dismissed
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

// Relations for user reports
export const userReportsRelations = relations(userReports, ({ one }) => ({
  reportedUser: one(users, {
    fields: [userReports.reportedUserId],
    references: [users.id],
    relationName: "reported",
  }),
  reviewer: one(users, {
    fields: [userReports.reviewedBy],
    references: [users.id],
    relationName: "reviewer",
  }),
}));

// User report schemas
export const insertUserReportSchema = createInsertSchema(userReports)
  .pick({
    reporterName: true,
    reporterEmail: true,
    reportedUserId: true,
    reportedUsername: true,
    reason: true,
    description: true,
  });

export const updateUserReportSchema = createInsertSchema(userReports)
  .pick({
    status: true,
    reviewedBy: true,
    adminNotes: true,
    reviewedAt: true,
  });

// Password reset token schemas
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens)
  .omit({ id: true, createdAt: true });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UpdateUser = Partial<InsertUser>;

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;

export type UserTheme = typeof userThemes.$inferSelect;
export type InsertUserTheme = typeof userThemes.$inferInsert;

export type UserReport = typeof userReports.$inferSelect;
export type InsertUserReport = z.infer<typeof insertUserReportSchema>;
export type UpdateUserReport = z.infer<typeof updateUserReportSchema>;

// Collaboration Requests table (new clean implementation)
export const collaborationRequests = pgTable("collaboration_requests", {
  id: serial("id").primaryKey(),
  senderId: uuid("sender_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  receiverId: uuid("receiver_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  fieldOfWork: text("field_of_work").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations for collaboration requests
export const collaborationRequestsRelations = relations(collaborationRequests, ({ one }) => ({
  sender: one(users, {
    fields: [collaborationRequests.senderId],
    references: [users.id],
    relationName: "sent_requests",
  }),
  receiver: one(users, {
    fields: [collaborationRequests.receiverId],
    references: [users.id],
    relationName: "received_requests",
  }),
}));

// Collaboration request schemas
export const insertCollaborationRequestSchema = createInsertSchema(collaborationRequests).pick({
  senderId: true,
  receiverId: true,
  name: true,
  email: true,
  phone: true,
  fieldOfWork: true,
  message: true,
});

export const updateCollaborationRequestSchema = createInsertSchema(collaborationRequests).pick({
  status: true,
}).partial();

// Collaboration request types
export type CollaborationRequest = typeof collaborationRequests.$inferSelect;
export type InsertCollaborationRequest = z.infer<typeof insertCollaborationRequestSchema>;
export type UpdateCollaborationRequest = z.infer<typeof updateCollaborationRequestSchema>;

// ---------------------------------------------------------------------------
// Segmentation tables
// ---------------------------------------------------------------------------

export const segments = pgTable("segments", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").default("dynamic"),
  rules: jsonb("rules_json"),
  ownerUserId: uuid("owner_user_id").references(() => users.id),
  isShared: boolean("is_shared").default(true),
  tags: text("tags").array().default(sql`'{}'::text[]`),
  lastRefreshedAt: timestamp("last_refreshed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  archivedAt: timestamp("archived_at"),
});

export const segmentMemberships = pgTable(
  "segment_memberships",
  {
    segmentId: uuid("segment_id").references(() => segments.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    snapshotAt: timestamp("snapshot_at"),
  },
  t => ({
    pk: primaryKey({ columns: [t.segmentId, t.userId, t.snapshotAt] }),
  })
);

export const segmentSnapshots = pgTable("segment_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  segmentId: uuid("segment_id").references(() => segments.id, { onDelete: "cascade" }).notNull(),
  memberCount: integer("member_count"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSegmentSchema = createInsertSchema(segments).pick({
  name: true,
  description: true,
  type: true,
  rules: true,
  tags: true,
  isShared: true,
});

export const updateSegmentSchema = insertSegmentSchema.partial();

export type Segment = typeof segments.$inferSelect;
export type InsertSegment = z.infer<typeof insertSegmentSchema>;
export type UpdateSegment = z.infer<typeof updateSegmentSchema>;

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id"),
  anonId: text("anon_id"),
  sessionId: text("session_id"),
  eventKey: text("event_key").notNull(),
  occurredAt: timestamp("occurred_at").notNull(),
  props: jsonb("props"),
});

export const abAssignments = pgTable("ab_assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id"),
  anonId: text("anon_id"),
  experimentKey: text("experiment_key").notNull(),
  variantLabel: text("variant_label").notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

export const funnels = pgTable("funnels", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ownerUserId: uuid("owner_user_id").references(() => users.id),
  tags: text("tags").array().default(sql`'{}'::text[]`),
  windowSeconds: integer("window_seconds").notNull(),
  scope: text("scope").default("user"),
  dedupe: text("dedupe").default("first_touch"),
  segmentId: uuid("segment_id").references(() => segments.id),
  experimentKey: text("experiment_key"),
  steps: jsonb("steps_json").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  archivedAt: timestamp("archived_at"),
});

export const funnelRuns = pgTable("funnel_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  funnelId: uuid("funnel_id").references(() => funnels.id, { onDelete: "cascade" }),
  rangeStart: timestamp("range_start").notNull(),
  rangeEnd: timestamp("range_end").notNull(),
  computedAt: timestamp("computed_at").defaultNow(),
  stats: jsonb("stats_json").notNull(),
});

export const insertFunnelSchema = createInsertSchema(funnels).pick({
  name: true,
  description: true,
  windowSeconds: true,
  scope: true,
  dedupe: true,
  segmentId: true,
  experimentKey: true,
  steps: true,
  tags: true,
});

export const updateFunnelSchema = insertFunnelSchema.partial();

export type Funnel = typeof funnels.$inferSelect;
export type InsertFunnel = z.infer<typeof insertFunnelSchema>;
export type UpdateFunnel = z.infer<typeof updateFunnelSchema>;

export const roleInvitations = pgTable("role_invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  roleId: integer("role_id").notNull(),
  invitedByUserId: uuid("invited_by_user_id").notNull(),
  token: text("token").notNull(),
  status: text("status").default("pending"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
});
