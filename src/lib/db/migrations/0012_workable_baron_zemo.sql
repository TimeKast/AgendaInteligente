CREATE TABLE "day_sheets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"identity_statement" text,
	"wins_planned" text[],
	"avoidance" text,
	"close_summary" text,
	"notes_dreams" text,
	"morning_completed_at" timestamp with time zone,
	"evening_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "day_sheets" ADD CONSTRAINT "day_sheets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "day_sheets_user_date_unique" ON "day_sheets" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "day_sheets_user_date_desc_idx" ON "day_sheets" USING btree ("user_id","date" DESC);--> statement-breakpoint

-- E-020: wins_planned máximo 3 elementos (NULL OK).
ALTER TABLE "day_sheets" ADD CONSTRAINT "day_sheets_wins_planned_max3_check"
    CHECK ("wins_planned" IS NULL OR array_length("wins_planned", 1) <= 3);