CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"scheduled_dates" date[] DEFAULT '{}' NOT NULL,
	"scheduled_time" time,
	"duration_minutes" integer,
	"deadline" timestamp with time zone,
	"estimated_minutes" integer,
	"priority" smallint DEFAULT 3 NOT NULL,
	"quadrant" smallint,
	"progress_percent" smallint,
	"recurrence_rule" text,
	"recurrence_parent_id" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"completed_at" timestamp with time zone,
	"reason_not_done" text,
	"reason_category" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_recurrence_parent_id_activities_id_fk" FOREIGN KEY ("recurrence_parent_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_user_status_deadline_idx" ON "activities" USING btree ("user_id","status","deadline");--> statement-breakpoint
CREATE INDEX "activities_user_project_idx" ON "activities" USING btree ("user_id","project_id");--> statement-breakpoint
CREATE INDEX "activities_recurrence_parent_idx" ON "activities" USING btree ("recurrence_parent_id");--> statement-breakpoint

--
-- E-005 constraints (not natively expressed by Drizzle)
--
ALTER TABLE "activities" ADD CONSTRAINT "activities_status_check"
    CHECK ("status" IN ('pending','in_progress','done','skipped','blocked'));--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_priority_check"
    CHECK ("priority" BETWEEN 1 AND 5);--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_quadrant_check"
    CHECK ("quadrant" IS NULL OR "quadrant" BETWEEN 1 AND 4);--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_progress_percent_check"
    CHECK ("progress_percent" IS NULL OR "progress_percent" BETWEEN 0 AND 100);--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_duration_positive_check"
    CHECK ("duration_minutes" IS NULL OR "duration_minutes" > 0);--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_duration_requires_time_check"
    CHECK ("duration_minutes" IS NULL OR "scheduled_time" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_reason_category_check"
    CHECK ("reason_category" IS NULL OR "reason_category" IN ('time','priority','blocked','didnt_want','other'));--> statement-breakpoint

-- E-005 GIN indexes for array containment queries.
CREATE INDEX "activities_scheduled_dates_gin_idx"
    ON "activities" USING gin ("scheduled_dates");--> statement-breakpoint
CREATE INDEX "activities_tags_gin_idx"
    ON "activities" USING gin ("tags");--> statement-breakpoint

-- (user_id, quadrant) for matrix view filter — partial index over rows that
-- actually have a quadrant set (most pool/backlog rows have NULL).
CREATE INDEX "activities_user_quadrant_idx"
    ON "activities" ("user_id", "quadrant")
    WHERE "quadrant" IS NOT NULL;