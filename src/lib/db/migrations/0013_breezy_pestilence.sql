CREATE TABLE "week_sheets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"week_starting" date NOT NULL,
	"one_thing" text,
	"three_wins" text[],
	"calendar_blocks" jsonb,
	"people_to_connect" jsonb,
	"learn_one" text,
	"avoid_one" text,
	"self_care" jsonb,
	"kickoff_completed_at" timestamp with time zone,
	"review_wins" text[],
	"review_lessons" text[],
	"review_energy" smallint,
	"review_one_sentence" text,
	"review_post_mortem" jsonb,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "week_sheets" ADD CONSTRAINT "week_sheets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "week_sheets_user_week_unique" ON "week_sheets" USING btree ("user_id","week_starting");--> statement-breakpoint
CREATE INDEX "week_sheets_user_week_desc_idx" ON "week_sheets" USING btree ("user_id","week_starting" DESC);--> statement-breakpoint

-- E-021 constraints not natively expressed by Drizzle.
ALTER TABLE "week_sheets" ADD CONSTRAINT "week_sheets_review_energy_check"
    CHECK ("review_energy" IS NULL OR "review_energy" BETWEEN 1 AND 10);--> statement-breakpoint

ALTER TABLE "week_sheets" ADD CONSTRAINT "week_sheets_three_wins_max3_check"
    CHECK ("three_wins" IS NULL OR array_length("three_wins", 1) <= 3);