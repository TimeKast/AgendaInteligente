#!/usr/bin/env tsx
/**
 * One-shot: apply the human_id DB default to production.
 *
 * Mirrors migration 0023. Idempotent (ALTER ... SET DEFAULT is a no-op
 * if already set). Use this when the regular migration runner isn't
 * convenient (e.g. ad-hoc fix between deploys).
 */

import { sql } from 'drizzle-orm';
import { db } from '../../src/lib/db/drizzle';

async function main(): Promise<void> {
  console.log('Applying DEFAULT to users.human_id…');
  await db.execute(
    sql`ALTER TABLE "users" ALTER COLUMN "human_id" SET DEFAULT 'USR-' || LPAD(nextval('user_human_id_seq')::TEXT, 4, '0')`
  );
  console.log('✅ Done. DrizzleAdapter inserts should now populate human_id automatically.');
  process.exit(0);
}

main().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});
