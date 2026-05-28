-- Auto-populate users.human_id on INSERT.
--
-- The column was added NOT NULL with a sequence-based backfill in
-- migration 0003, but no DB-level DEFAULT was ever set on the column
-- itself. Inserts from the kit's seed + admin path explicitly compute
-- the value, but NextAuth's DrizzleAdapter (Google OAuth signin) does
-- not — so every fresh OAuth signup throws:
--
--   null value in column "human_id" violates not-null constraint
--
-- Add the sequence-backed default so the adapter (and any future
-- code path that doesn't know about human IDs) gets a valid value
-- automatically.
--
-- Idempotent: ALTER COLUMN ... SET DEFAULT is a no-op if already set
-- to the same expression.
--
-- Linked: fix(auth) — Google OAuth signup AdapterError in production.

ALTER TABLE "users"
  ALTER COLUMN "human_id"
  SET DEFAULT 'USR-' || LPAD(nextval('user_human_id_seq')::TEXT, 4, '0');
