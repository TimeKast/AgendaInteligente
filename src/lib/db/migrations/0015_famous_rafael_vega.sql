CREATE TABLE "goal_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"goal_id" uuid NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "goal_links" ADD CONSTRAINT "goal_links_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "goal_links_goal_target_unique" ON "goal_links" USING btree ("goal_id","target_type","target_id");--> statement-breakpoint
CREATE INDEX "goal_links_target_idx" ON "goal_links" USING btree ("target_type","target_id");--> statement-breakpoint
ALTER TABLE "goal_links" ADD CONSTRAINT "goal_links_target_type_check" CHECK ("target_type" IN ('project','activity'));