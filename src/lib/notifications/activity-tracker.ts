/**
 * User activity tracker — feeds the "nag" check-in logic.
 *
 * `recordActivity(userId)` stamps `notification_prefs.last_active_at`
 * with the current time IF more than `THROTTLE_MS` have passed since
 * the last stamp. The conditional WHERE makes it a single round-trip
 * upsert — no read-then-write race.
 *
 * Throttled because the (agendaInteligente) layout calls this on every
 * authenticated page render; without the gate a Cmd-R spam would write
 * to Postgres every keystroke. 60s is enough resolution for the
 * 5-min cron fanout's nag decision.
 *
 * The fanout reads `last_active_at` and pauses nags for the day once
 * the user comes in. Tomorrow morning fires fresh.
 */

import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { notificationPrefs } from '@/lib/db/schema/notification-prefs';
import { logger } from '@/lib/logger';

/** Minimum elapsed time before a fresh write. */
const THROTTLE_MS = 60_000;

/**
 * Stamp `last_active_at = now()` for `userId`, but only if either the
 * column is NULL or more than `THROTTLE_MS` have elapsed since the
 * last stamp. No-op (no row written) otherwise.
 *
 * Returns silently on every failure — activity tracking is best-effort
 * and never blocks page rendering. Errors are logged for debugging.
 */
export async function recordActivity(userId: string, now: Date = new Date()): Promise<void> {
  try {
    const cutoff = new Date(now.getTime() - THROTTLE_MS);
    await db
      .update(notificationPrefs)
      .set({ lastActiveAt: now })
      .where(
        sql`${notificationPrefs.userId} = ${userId} and (${notificationPrefs.lastActiveAt} is null or ${notificationPrefs.lastActiveAt} < ${cutoff})`
      );
  } catch (err) {
    logger.error('[recordActivity] update failed', err);
  }
}
