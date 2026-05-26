/**
 * Recurrence materializer (ISSUE-024, OPS-5).
 *
 * For each user, walk every parent activity with a non-null
 * `recurrence_rule` and INSERT the missing instances inside a 14-day
 * forward window. Each instance is a NEW activity row with:
 *   - `recurrence_parent_id = parent.id`
 *   - `scheduled_dates = [<materialized_date>]`
 *   - Everything else copied from the parent (title, project, priority,
 *     scheduled_time, duration_minutes, quadrant, tags, etc).
 *
 * Idempotency: we query existing instances of the parent that already
 * sit inside the window and skip those dates. Re-runs are free.
 *
 * Allowlist note: this file uses `db` directly (not scopedDb) because:
 *   1. The cron runs as a system task — no session userId.
 *   2. We DO scope every read/write by `eq(activities.userId, userId)`
 *      using the userId looked up from the parent activity owner.
 *
 * Future-wiring: ISSUE-080 will register this as an Inngest function.
 * For v1.0 the entry point is `materializeUserRecurrences(userId)` —
 * invocable from a script, a server action, or eventually a cron.
 *
 * Linked: BR-11, OPS-5, FT-026.
 */

import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema/users';
import { activities } from '@/lib/db/schema/activities';
import { expandFromString } from '@/lib/domain/recurrence';
import { logger } from '@/lib/logger';

/** Default forward window per OPS-5. */
const WINDOW_DAYS = 14;

/**
 * Materialize all recurring activities for a single user up to
 * `windowDays` ahead. Idempotent.
 *
 * @returns `{ created, skipped, parentCount }` for ops visibility.
 */
export async function materializeUserRecurrences(
  userId: string,
  options: { fromDate?: Date; windowDays?: number } = {}
): Promise<{ created: number; skipped: number; parentCount: number }> {
  const fromDate = options.fromDate ?? new Date();
  const windowDays = options.windowDays ?? WINDOW_DAYS;

  // Resolve the user's TZ once — it controls weekday + day-of-month math.
  const userRow = await db
    .select({ timezone: users.timezone })
    .from(users)
    .where(eq(users.id, userId));
  if (userRow.length === 0) {
    logger.warn(`[recurrence] user not found: ${userId}`);
    return { created: 0, skipped: 0, parentCount: 0 };
  }
  const tz = userRow[0].timezone;

  // Find every parent recurring activity for this user.
  // "Parent" = row that defines the rule (recurrence_parent_id IS NULL)
  // and is still active (deleted_at IS NULL).
  const parents = await db
    .select()
    .from(activities)
    .where(
      and(
        eq(activities.userId, userId),
        isNotNull(activities.recurrenceRule),
        isNull(activities.recurrenceParentId),
        isNull(activities.deletedAt)
      )
    );

  if (parents.length === 0) {
    return { created: 0, skipped: 0, parentCount: 0 };
  }

  let created = 0;
  let skipped = 0;

  for (const parent of parents) {
    if (!parent.recurrenceRule) continue;

    const targetDates = expandFromString(parent.recurrenceRule, fromDate, windowDays, tz);
    if (targetDates.length === 0) continue;

    // What's already materialized for this parent inside the window?
    // We compare scheduled_dates ARRAY against the target dates.
    const existing = await db
      .select({ scheduledDates: activities.scheduledDates })
      .from(activities)
      .where(
        and(
          eq(activities.userId, userId),
          eq(activities.recurrenceParentId, parent.id),
          isNull(activities.deletedAt)
        )
      );

    const taken = new Set<string>();
    for (const row of existing) {
      for (const d of row.scheduledDates) taken.add(d);
    }

    const toCreate = targetDates.filter((d) => !taken.has(d));
    if (toCreate.length === 0) {
      skipped += targetDates.length;
      continue;
    }

    // Bulk insert one row per missing date, copying the parent's shape.
    const rows = toCreate.map((date) => ({
      userId: parent.userId,
      projectId: parent.projectId,
      title: parent.title,
      description: parent.description,
      scheduledDates: [date],
      scheduledTime: parent.scheduledTime,
      durationMinutes: parent.durationMinutes,
      deadline: null, // parent deadline doesn't propagate to instances
      estimatedMinutes: parent.estimatedMinutes,
      priority: parent.priority,
      quadrant: parent.quadrant,
      progressPercent: null,
      recurrenceRule: null, // instances aren't recursive
      recurrenceParentId: parent.id,
      status: 'pending' as const,
      reasonNotDone: null,
      reasonCategory: null,
      tags: parent.tags,
    }));

    await db.insert(activities).values(rows);
    created += toCreate.length;
    skipped += targetDates.length - toCreate.length;
  }

  logger.info(
    `[recurrence] materialize userId=${userId} parents=${parents.length} created=${created} skipped=${skipped}`
  );
  return { created, skipped, parentCount: parents.length };
}
