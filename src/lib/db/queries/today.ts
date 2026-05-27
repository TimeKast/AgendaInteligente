/**
 * Today page data loader (ISSUE-025 Phase 1 wire).
 *
 * Two reads the Today server component needs that don't fit
 * `scopedDb`:
 *   - `users` row by id (identity, not tenant data — has no
 *     `user_id` column on itself).
 *   - `projects` map for the close-day modal's "title · project" labels.
 *
 * Both lookups are explicit-userId scoped on the WHERE clause; the
 * BR-1 enforcer ignores `src/lib/db/queries/**` per ESLint config
 * because primitives in this directory exist precisely to be the
 * controlled-bypass surface.
 *
 * Linked: ISSUE-025, BR-1.
 */

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema/users';
import { projects } from '@/lib/db/schema/projects';

export interface TodayUserProfile {
  timezone: string;
  name: string | null;
  email: string | null;
}

/**
 * Load the user's TZ + display fields. Returns `null` if the row is
 * missing (first-login race — middleware lets the user through before
 * the seed completes; caller falls back to safe defaults).
 */
export async function loadTodayUserProfile(userId: string): Promise<TodayUserProfile | null> {
  const rows = await db
    .select({
      timezone: users.timezone,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, userId));
  return rows[0] ?? null;
}

/** id → name map for every project the user owns. */
export async function loadProjectLabelMap(userId: string): Promise<Map<string, string>> {
  const rows = await db
    .select({ id: projects.id, name: projects.name })
    .from(projects)
    .where(eq(projects.userId, userId));
  return new Map(rows.map((p) => [p.id, p.name]));
}
