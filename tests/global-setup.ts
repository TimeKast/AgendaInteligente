/**
 * Playwright Global Setup
 *
 * Ensures the E2E database has all required sequences and schema objects
 * that may not be present in Neon branches (sequences created via raw SQL
 * in migrations are not always copied by Neon branching).
 */

import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';

async function globalSetup() {
  const hasDatabase = !!process.env.DATABASE_URL;

  if (!hasDatabase) {
    console.warn('[E2E] No DATABASE_URL set, some tests may be skipped');
    return;
  }

  // Ensure PostgreSQL sequences exist (Neon branches may not inherit them)
  await db.execute(sql`CREATE SEQUENCE IF NOT EXISTS user_human_id_seq`);
  await db.execute(
    sql`SELECT setval('user_human_id_seq', GREATEST((SELECT COUNT(*) FROM users), 1))`
  );

  console.warn('[E2E] Global setup complete. Sequences verified.');
}

export default globalSetup;
