CREATE TABLE "notification_prefs" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"morning_time" time DEFAULT '08:00' NOT NULL,
	"midday_time" time DEFAULT '13:00' NOT NULL,
	"evening_time" time DEFAULT '21:00' NOT NULL,
	"weekly_kickoff_dow" smallint DEFAULT 0 NOT NULL,
	"weekly_kickoff_time" time DEFAULT '18:00' NOT NULL,
	"weekly_review_dow" smallint DEFAULT 6 NOT NULL,
	"weekly_review_time" time DEFAULT '20:00' NOT NULL,
	"weekend_skip" boolean DEFAULT false NOT NULL,
	"days_off" date[] DEFAULT '{}' NOT NULL,
	"push_enabled" boolean DEFAULT true NOT NULL,
	"email_enabled" boolean DEFAULT false NOT NULL,
	"muted_until" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"features" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"limits" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"price_monthly" numeric(10, 2),
	"price_yearly" numeric(10, 2),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plans_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"stripe_subscription_id" text,
	"stripe_customer_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_meters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"ai_calls_count" integer DEFAULT 0 NOT NULL,
	"ai_tokens_input" bigint DEFAULT 0 NOT NULL,
	"ai_tokens_output" bigint DEFAULT 0 NOT NULL,
	"voice_minutes_count" numeric(10, 2) DEFAULT '0' NOT NULL,
	"whisper_seconds_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "google_oauth_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "preferred_language" text DEFAULT 'es' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "timezone" text DEFAULT 'America/Mexico_City' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "intensity_mode" text DEFAULT 'gentle' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "intensity_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "intensity_default_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_context" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_active_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "silence_re_entry_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notification_prefs" ADD CONSTRAINT "notification_prefs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_meters" ADD CONSTRAINT "usage_meters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notification_prefs_days_off_gin_idx" ON "notification_prefs" USING gin ("days_off");--> statement-breakpoint
CREATE INDEX "subscriptions_status_updated_idx" ON "subscriptions" USING btree ("status","updated_at");--> statement-breakpoint

--
-- Custom constraints not natively expressed by Drizzle
-- (E-001 enums, partial UNIQUEs, exclusive-active subscription, usage bucket uniqueness)
--
ALTER TABLE "users" ADD CONSTRAINT "users_intensity_mode_check"
    CHECK ("intensity_mode" IN ('sharp','standard','gentle','listening'));--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_preferred_language_check"
    CHECK ("preferred_language" IN ('es','en'));--> statement-breakpoint
CREATE UNIQUE INDEX "users_google_oauth_id_unique" ON "users" ("google_oauth_id")
    WHERE "google_oauth_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "users_last_active_at_idx" ON "users" ("last_active_at");--> statement-breakpoint
CREATE INDEX "users_deleted_at_idx" ON "users" ("deleted_at");--> statement-breakpoint

--
-- Subscriptions: exactly one active row per user (BR-10 grace period scaffold).
--
CREATE UNIQUE INDEX "subscriptions_user_id_active_unique" ON "subscriptions" ("user_id")
    WHERE "status" = 'active';--> statement-breakpoint

--
-- Usage meters: one bucket per user per month.
--
ALTER TABLE "usage_meters" ADD CONSTRAINT "usage_meters_user_period_unique"
    UNIQUE ("user_id", "period_start");