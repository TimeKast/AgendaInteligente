ALTER TABLE "notification_prefs" ADD COLUMN "nag_interval_minutes" integer DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_prefs" ADD COLUMN "last_active_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notification_prefs" ADD COLUMN "last_check_in_at" timestamp with time zone;