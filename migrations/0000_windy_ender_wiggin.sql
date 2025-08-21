CREATE TABLE "collaboration_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" integer NOT NULL,
	"receiver_id" integer NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"field_of_work" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "collaboration_requests_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"target_user_id" integer NOT NULL,
	"requester_name" varchar(100) NOT NULL,
	"requester_email" varchar(255) NOT NULL,
	"requester_company" varchar(255),
	"requester_skills" varchar(500),
	"project_type" varchar(100),
	"timeline" varchar(100),
	"budget" varchar(100),
	"description" text,
	"status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"employee_id" varchar(20),
	"department" varchar(100),
	"position" varchar(100),
	"salary" integer,
	"hire_date" timestamp,
	"manager" integer,
	"work_location" varchar(100),
	"work_type" varchar(50),
	"status" varchar(50) DEFAULT 'active',
	"performance_rating" integer,
	"last_review" timestamp,
	"next_review" timestamp,
	"benefits" text[],
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "employee_profiles_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
CREATE TABLE "feature_toggles" (
	"id" serial PRIMARY KEY NOT NULL,
	"feature_name" text NOT NULL,
	"is_enabled" boolean DEFAULT true,
	"description" text,
	"updated_by" integer,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "feature_toggles_feature_name_unique" UNIQUE("feature_name")
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"id" serial PRIMARY KEY NOT NULL,
	"follower_id" integer NOT NULL,
	"following_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "industries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "industries_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "instagram_previews" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"post_id" text NOT NULL,
	"image_url" text NOT NULL,
	"thumbnail_url" text,
	"post_url" text NOT NULL,
	"caption" text,
	"is_enabled" boolean DEFAULT true,
	"posted_at" timestamp NOT NULL,
	"fetched_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "instagram_previews_post_id_unique" UNIQUE("post_id")
);
--> statement-breakpoint
CREATE TABLE "links" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"platform" text NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"description" text,
	"color" text,
	"clicks" integer DEFAULT 0,
	"views" integer DEFAULT 0,
	"featured" boolean DEFAULT false,
	"order" integer DEFAULT 0,
	"ai_score" integer,
	"last_clicked_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "oauth_states" (
	"id" serial PRIMARY KEY NOT NULL,
	"state" text NOT NULL,
	"user_id" integer NOT NULL,
	"platform" text NOT NULL,
	"code_verifier" text,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "oauth_states_state_unique" UNIQUE("state")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"description" text,
	"category" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "profile_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"viewed_at" timestamp DEFAULT now(),
	"referrer" text,
	"user_agent" text,
	"ip_address" text
);
--> statement-breakpoint
CREATE TABLE "referral_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"description" text,
	"image" text,
	"link_type" text DEFAULT 'friend' NOT NULL,
	"reference_user_id" integer,
	"reference_company" text,
	"clicks" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "referral_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"target_user_id" integer NOT NULL,
	"requester_name" varchar(100) NOT NULL,
	"requester_email" varchar(255) NOT NULL,
	"requester_phone" varchar(50),
	"requester_website" varchar(500),
	"field_of_work" varchar(100),
	"description" text,
	"link_title" varchar(100),
	"link_url" varchar(500),
	"status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"description" text,
	"permissions" text[] NOT NULL,
	"is_system" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"platform" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"expires_at" timestamp,
	"platform_user_id" text,
	"platform_username" text,
	"connected_at" timestamp DEFAULT now(),
	"last_sync_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "social_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"platform" text NOT NULL,
	"post_url" text NOT NULL,
	"thumbnail_url" text,
	"caption" text,
	"posted_at" timestamp NOT NULL,
	"fetched_at" timestamp DEFAULT now(),
	"connection_id" integer
);
--> statement-breakpoint
CREATE TABLE "spotlight_contributors" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"user_id" integer,
	"name" varchar(100) NOT NULL,
	"email" varchar(255),
	"role" varchar(50),
	"is_registered_user" boolean DEFAULT false,
	"added_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "spotlight_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(100) NOT NULL,
	"url" varchar(1000) NOT NULL,
	"description" text,
	"thumbnail" text,
	"is_pinned" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"view_count" integer DEFAULT 0,
	"click_count" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "spotlight_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"label" varchar(50) NOT NULL,
	"icon" varchar(50),
	"type" varchar(20) DEFAULT 'tag'
);
--> statement-breakpoint
CREATE TABLE "system_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"level" text NOT NULL,
	"message" text NOT NULL,
	"source" text,
	"user_id" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"reporter_name" text,
	"reporter_email" text,
	"reported_user_id" integer NOT NULL,
	"reported_username" text,
	"reason" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'pending',
	"reviewed_by" integer,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now(),
	"reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"role_id" integer NOT NULL,
	"assigned_by" integer,
	"assigned_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_themes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"theme_id" text NOT NULL,
	"name" text NOT NULL,
	"colors" jsonb NOT NULL,
	"gradient" text,
	"is_custom" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"bio" text,
	"profile_image" text,
	"profile_background" text,
	"font" text DEFAULT 'inter',
	"theme" text DEFAULT 'default',
	"view_mode" text DEFAULT 'list',
	"dark_mode" boolean DEFAULT false,
	"welcome_message" text,
	"social_score" integer DEFAULT 50,
	"show_social_score" boolean DEFAULT false,
	"is_collaborative" boolean DEFAULT false,
	"collaborators" text[],
	"pitch_mode" boolean DEFAULT false,
	"pitch_mode_type" text DEFAULT 'professional',
	"pitch_description" text,
	"pitch_focus_areas" text[],
	"profession" text,
	"industry_id" integer,
	"location" text,
	"interests" text[],
	"tags" text[],
	"is_admin" boolean DEFAULT false,
	"role" varchar(50) DEFAULT 'user',
	"permissions" text[],
	"department" varchar(100),
	"position" varchar(100),
	"salary" integer,
	"hire_date" timestamp,
	"last_login_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "collaboration_requests" ADD CONSTRAINT "collaboration_requests_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_requests" ADD CONSTRAINT "collaboration_requests_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_requests_notifications" ADD CONSTRAINT "collaboration_requests_notifications_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_manager_users_id_fk" FOREIGN KEY ("manager") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_toggles" ADD CONSTRAINT "feature_toggles_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_users_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_previews" ADD CONSTRAINT "instagram_previews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_links" ADD CONSTRAINT "referral_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_links" ADD CONSTRAINT "referral_links_reference_user_id_users_id_fk" FOREIGN KEY ("reference_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_requests" ADD CONSTRAINT "referral_requests_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_connections" ADD CONSTRAINT "social_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_connection_id_social_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."social_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spotlight_contributors" ADD CONSTRAINT "spotlight_contributors_project_id_spotlight_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."spotlight_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spotlight_contributors" ADD CONSTRAINT "spotlight_contributors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spotlight_projects" ADD CONSTRAINT "spotlight_projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spotlight_tags" ADD CONSTRAINT "spotlight_tags_project_id_spotlight_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."spotlight_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reported_user_id_users_id_fk" FOREIGN KEY ("reported_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_themes" ADD CONSTRAINT "user_themes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE no action ON UPDATE no action;