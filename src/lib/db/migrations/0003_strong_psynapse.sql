-- Create sequence for user human IDs
CREATE SEQUENCE IF NOT EXISTS user_human_id_seq;

-- Add column as nullable first (for backfill)
ALTER TABLE "users" ADD COLUMN "human_id" text;

-- Backfill existing rows in creation order
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS rn
  FROM "users"
)
UPDATE "users"
SET human_id = 'USR-' || LPAD(numbered.rn::TEXT, 4, '0')
FROM numbered
WHERE "users".id = numbered.id;

-- Advance the sequence to match the current count
SELECT setval('user_human_id_seq', GREATEST(1, COALESCE((SELECT COUNT(*) FROM "users"), 0)));

-- Now make it NOT NULL + UNIQUE
ALTER TABLE "users" ALTER COLUMN "human_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_human_id_unique" UNIQUE("human_id");
