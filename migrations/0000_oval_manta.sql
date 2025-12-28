CREATE TABLE "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'admin' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "admins_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "api_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"service" text,
	"endpoint" text,
	"method" text,
	"status_code" integer,
	"response_time_ms" integer,
	"user_agent" text,
	"ip_address" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text NOT NULL,
	"content" text NOT NULL,
	"cover_image" text,
	"tags" text[],
	"read_time" integer DEFAULT 5,
	"views" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"message" text NOT NULL,
	"is_user" boolean NOT NULL,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_agent" text,
	"ip_address" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "chat_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text,
	"title" text,
	"content" text,
	"target_channel" text,
	"status" text DEFAULT 'pending',
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"accused_name" text NOT NULL,
	"phone_number" text NOT NULL,
	"account_number" text,
	"bank" text,
	"amount" integer NOT NULL,
	"description" text NOT NULL,
	"is_anonymous" boolean DEFAULT false,
	"reporter_name" text,
	"reporter_phone" text,
	"receipt_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "scam_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"keyword" text NOT NULL,
	"source" text NOT NULL,
	"data" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"hit_count" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "scam_searches" (
	"id" serial PRIMARY KEY NOT NULL,
	"keyword" text NOT NULL,
	"source" text,
	"user_id" integer,
	"zalo_user_id" text,
	"results_count" integer,
	"search_time" timestamp DEFAULT now(),
	"response_time_ms" integer
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "zalo_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"zalo_user_id" text NOT NULL,
	"message_type" text,
	"message_content" text,
	"is_from_user" boolean,
	"sent_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "zalo_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"zalo_user_id" text NOT NULL,
	"display_name" text,
	"avatar" text,
	"followed_at" timestamp DEFAULT now(),
	"last_interaction" timestamp,
	"is_active" boolean DEFAULT true,
	"preferences" text,
	CONSTRAINT "zalo_users_zalo_user_id_unique" UNIQUE("zalo_user_id")
);
