CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"scope" text NOT NULL,
	"deadline" date,
	"outcome_expected" text,
	"notes_cost" text,
	"status" text DEFAULT 'active' NOT NULL,
	"review_score" smallint,
	"review_notes" text,
	"reviewed_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "goals_user_scope_status_idx" ON "goals" USING btree ("user_id","scope","status");--> statement-breakpoint
CREATE INDEX "goals_user_deadline_idx" ON "goals" USING btree ("user_id","deadline");--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_scope_check" CHECK ("scope" IN ('quarter','year','5year','life'));--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_status_check" CHECK ("status" IN ('active','achieved','partial','abandoned'));--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_review_score_check" CHECK ("review_score" IS NULL OR "review_score" BETWEEN 1 AND 10);