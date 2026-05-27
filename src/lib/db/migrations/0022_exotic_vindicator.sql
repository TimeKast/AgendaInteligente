CREATE TABLE "month_sheets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"month_starting" date NOT NULL,
	"goals" text,
	"themes" text[] DEFAULT '{}' NOT NULL,
	"close_summary" text,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "month_sheets" ADD CONSTRAINT "month_sheets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "month_sheets_user_month_unique" ON "month_sheets" USING btree ("user_id","month_starting");--> statement-breakpoint
CREATE INDEX "month_sheets_user_month_desc_idx" ON "month_sheets" USING btree ("user_id","month_starting" DESC);--> statement-breakpoint
ALTER TABLE "month_sheets" ADD CONSTRAINT "month_sheets_month_starting_day1_check" CHECK (EXTRACT(DAY FROM "month_starting") = 1);