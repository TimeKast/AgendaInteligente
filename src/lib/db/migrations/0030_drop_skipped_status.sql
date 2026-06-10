-- Drop the activity status 'skipped'. It collapses into 'cancelled' —
-- conceptually the user "decided not to do it", which is exactly
-- cancellation. Skipped existed as a separate state so the agent could
-- nag for a reason; that distinction is no longer worth the UI weight
-- (status_options × forms × filter chips × transition matrix).
--
-- Migration order matters: collapse existing rows BEFORE relaxing the
-- CHECK constraint to the new set (which no longer contains 'skipped').

UPDATE "activities" SET "status" = 'cancelled' WHERE "status" = 'skipped';
--> statement-breakpoint
ALTER TABLE "activities" DROP CONSTRAINT IF EXISTS "activities_status_check";
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_status_check"
    CHECK ("status" IN ('pending','in_progress','done','blocked','cancelled'));
