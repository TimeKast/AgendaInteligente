CREATE TABLE "calendar_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"external_account_id" text NOT NULL,
	"access_token" "bytea" NOT NULL,
	"refresh_token" "bytea" NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"calendar_ids" text[] DEFAULT '{}' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"account_label" text,
	"connected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_synced_at" timestamp with time zone,
	"last_sync_error" text
);
--> statement-breakpoint
ALTER TABLE "calendar_connections" ADD CONSTRAINT "calendar_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "calendar_connections_user_provider_account_unique" ON "calendar_connections" USING btree ("user_id","provider","external_account_id");--> statement-breakpoint
CREATE INDEX "calendar_connections_user_enabled_idx" ON "calendar_connections" USING btree ("user_id","enabled");--> statement-breakpoint
ALTER TABLE "calendar_connections" ADD CONSTRAINT "calendar_connections_provider_check" CHECK ("provider" IN ('google','apple','outlook'));