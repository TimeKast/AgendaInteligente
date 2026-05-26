/**
 * DaySheet queries — ISSUE-030.
 *
 * `getOrCreateDaySheet` is the canonical entry point for reading the
 * sheet for a given (user, date). Atomic upsert keyed on the BR-7
 * UNIQUE index — under concurrent calls exactly one row is created,
 * both callers receive the same row.
 *
 * Operates `db` directly (allowlisted) because it's a DB primitive
 * consumed by server actions that already validate ownership at their
 * own layer. The `eq(daySheets.userId, userId)` scoping is explicit.
 *
 * Linked: BR-7, FT-030.
 */

import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { daySheets, type DaySheet } from '@/lib/db/schema/day-sheets';

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
