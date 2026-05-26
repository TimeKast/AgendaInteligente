CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"deadline" date,
	"outcome_expected" text,
	"is_inbox" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "projects_user_category_idx" ON "projects" USING btree ("user_id","category_id");--> statement-breakpoint
CREATE INDEX "projects_user_status_idx" ON "projects" USING btree ("user_id","status");--> statement-breakpoint

--
-- E-004 constraints not natively expressed by Drizzle
--
ALTER TABLE "projects" ADD CONSTRAINT "projects_status_check"
    CHECK ("status" IN ('active','paused','completed','killed'));--> statement-breakpoint

-- One Inbox project per user (sits inside the Inbox category).
CREATE UNIQUE INDEX "projects_user_inbox_unique"
    ON "projects" ("user_id")
    WHERE "is_inbox" = true;--> statement-breakpoint

-- Unique project name within (user, category), ignoring soft-deleted rows.
CREATE UNIQUE INDEX "projects_user_category_name_active_unique"
    ON "projects" ("user_id", "category_id", "name")
    WHERE "deleted_at" IS NULL;