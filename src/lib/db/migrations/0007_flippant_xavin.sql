CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#5C5C5C' NOT NULL,
	"icon" text,
	"position" integer DEFAULT 0 NOT NULL,
	"is_inbox" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categories_user_position_idx" ON "categories" USING btree ("user_id","position");--> statement-breakpoint

--
-- E-003 constraints not natively expressed by Drizzle
--   - One Inbox per user (partial UNIQUE)
--   - Unique name per user, ignoring soft-deleted rows
--   - is_inbox = true ⇒ name = 'Inbox'
--
CREATE UNIQUE INDEX "categories_user_inbox_unique"
    ON "categories" ("user_id")
    WHERE "is_inbox" = true;--> statement-breakpoint

CREATE UNIQUE INDEX "categories_user_name_active_unique"
    ON "categories" ("user_id", "name")
    WHERE "deleted_at" IS NULL;--> statement-breakpoint

ALTER TABLE "categories" ADD CONSTRAINT "categories_inbox_name_check"
    CHECK ("is_inbox" = false OR "name" = 'Inbox');