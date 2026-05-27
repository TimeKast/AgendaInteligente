CREATE TABLE "proactive_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"payload" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp with time zone,
	"responded_at" timestamp with time zone,
	"quote_reference" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "proactive_tasks" ADD CONSTRAINT "proactive_tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "proactive_tasks_user_scheduled_idx" ON "proactive_tasks" USING btree ("user_id","scheduled_for");--> statement-breakpoint
CREATE INDEX "proactive_tasks_user_sent_idx" ON "proactive_tasks" USING btree ("user_id","sent_at");--> statement-breakpoint
CREATE INDEX "proactive_tasks_user_type_sent_idx" ON "proactive_tasks" USING btree ("user_id","type","sent_at");--> statement-breakpoint
ALTER TABLE "proactive_tasks" ADD CONSTRAINT "proactive_tasks_type_check" CHECK ("type" IN ('morning_open','midday_check','evening_close','weekly_kickoff','weekly_review','pattern_challenge','risk_alert','project_kill_suggestion','silence_re_entry'));--> statement-breakpoint
ALTER TABLE "proactive_tasks" ADD CONSTRAINT "proactive_tasks_status_check" CHECK ("status" IN ('pending','sent','responded','dismissed','cancelled','cancelled_anti_spam','cancelled_muted','cancelled_listening'));