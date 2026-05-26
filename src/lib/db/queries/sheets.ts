/**
 * DaySheet + WeekSheet queries — ISSUE-030, ISSUE-032.
 *
 * `getOrCreateDaySheet` / `getOrCreateWeekSheet` are the canonical
 * entry points for reading a sheet for a given (user, date|week).
 * Atomic upsert keyed on the BR-7 UNIQUE index — under concurrent
 * calls exactly one row is created, both callers receive the same row.
 *
 * Operates `db` directly (allowlisted via `src/lib/db/queries/**`)
 * because these are DB primitives consumed by server actions that
 * already validate ownership at their own layer. The
 * `eq(*.userId, userId)` scoping is explicit on every statement.
 *
 * Linked: BR-7, FT-030, FT-034.
 */

import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { daySheets, type DaySheet } from '@/lib/db/schema/day-sheets';
import { weekSheets, type WeekSheet } from '@/lib/db/schema/week-sheets';

/**
 * Get the existing DaySheet for (userId, dateStr) or create an empty one.
 *
 * Race-safe via INSERT ... ON CONFLICT DO NOTHING RETURNING; if the
 * INSERT was a no-op (conflict), we fall back to a SELECT to fetch the
 * row inserted by the concurrent caller.
 *
 * @param userId  user UUID (must belong to the calling session)
 * @param dateStr ISO date "YYYY-MM-DD" in the user's TZ
 */
export async function getOrCreateDaySheet(userId: string, dateStr: string): Promise<DaySheet> {
  const inserted = await db
    .insert(daySheets)
    .values({ userId, date: dateStr })
    .onConflictDoNothing({ target: [daySheets.userId, daySheets.date] })
    .returning();

  if (inserted.length > 0) {
    return inserted[0];
  }

  // Conflict — the row already exists. Fetch it.
  const existing = await db
    .select()
    .from(daySheets)
    .where(and(eq(daySheets.userId, userId), eq(daySheets.date, dateStr)));

  if (existing.length === 0) {
    // Extremely unlikely race: the row was inserted then deleted before
    // our SELECT. Caller surfaces this as a generic "no encontrada".
    throw new Error(`DaySheet vanished after upsert (${userId}, ${dateStr})`);
  }
  return existing[0];
}

/**
 * Mirror of `getOrCreateDaySheet` for WeekSheet (ISSUE-032). Same atomic
 * upsert + fallback SELECT pattern keyed on the BR-7 UNIQUE index over
 * `(user_id, week_starting)`.
 *
 * @param userId           user UUID
 * @param weekStartingStr  ISO date YYYY-MM-DD of the Sunday in user TZ
 *                         (caller resolves via `weekStartingFor`)
 */
export async function getOrCreateWeekSheet(
  userId: string,
  weekStartingStr: string
): Promise<WeekSheet> {
  const inserted = await db
    .insert(weekSheets)
    .values({ userId, weekStarting: weekStartingStr })
    .onConflictDoNothing({ target: [weekSheets.userId, weekSheets.weekStarting] })
    .returning();

  if (inserted.length > 0) return inserted[0];

  const existing = await db
    .select()
    .from(weekSheets)
    .where(and(eq(weekSheets.userId, userId), eq(weekSheets.weekStarting, weekStartingStr)));

  if (existing.length === 0) {
    throw new Error(`WeekSheet vanished after upsert (${userId}, ${weekStartingStr})`);
  }
  return existing[0];
}

/**
 * Pre-create an empty WeekSheet for (userId, weekStartingStr) if one
 * doesn't already exist. Returns `{ created: true }` on insert, `false`
 * on conflict (already existed). Used by the Friday cron (ISSUE-034) for
 * cheap idempotent materialization without the cost of reading the row
 * back when there's nothing to do with it.
 *
 * Race-safe via the same INSERT ... ON CONFLICT DO NOTHING contract as
 * `getOrCreateWeekSheet`.
 */
export async function tryCreateWeekSheet(
  userId: string,
  weekStartingStr: string
): Promise<{ created: boolean }> {
  const inserted = await db
    .insert(weekSheets)
    .values({ userId, weekStarting: weekStartingStr })
    .onConflictDoNothing({ target: [weekSheets.userId, weekSheets.weekStarting] })
    .returning({ id: weekSheets.id });

  return { created: inserted.length > 0 };
}
