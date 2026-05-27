CREATE TABLE "calendar_busy_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"connection_id" uuid NOT NULL,
	"calendar_id" text NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"event_title" text,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calendar_busy_slots" ADD CONSTRAINT "calendar_busy_slots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_busy_slots" ADD CONSTRAINT "calendar_busy_slots_connection_id_calendar_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."calendar_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "calendar_busy_slots_user_range_idx" ON "calendar_busy_slots" USING btree ("user_id","start_at","end_at");--> statement-breakpoint
CREATE INDEX "calendar_busy_slots_connection_start_idx" ON "calendar_busy_slots" USING btree ("connection_id","start_at");