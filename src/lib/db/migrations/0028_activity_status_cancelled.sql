-- Extend the activities.status CHECK constraint to allow 'cancelled'.
-- The original constraint was added in 0009 with five values; we now
-- have six (pending | in_progress | done | skipped | blocked | cancelled).
-- Drizzle doesn't auto-generate CHECK constraint diffs, so this
-- migration is hand-rolled.

ALTER TABLE "activities" DROP CONSTRAINT IF EXISTS "activities_status_check";
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_status_check"
    CHECK ("status" IN ('pending','in_progress','done','skipped','blocked','cancelled'));
