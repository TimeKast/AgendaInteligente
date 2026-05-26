/**
 * Handler: `weekly.materialize.next` Friday cron — ISSUE-034 (OPS-7).
 *
 * Pre-creates an empty WeekSheet for next Sunday (in each user's TZ) so
 * the Sunday kickoff (FLW-006) opens onto an existing row instead of
 * racing against `getOrCreateWeekSheet` on the first save.
 *
 * Schedule: `0 0 * * 5` — Friday 00:00 UTC. For Americas (UTC-6/-8) this
 * runs Thursday evening local, giving Friday daytime + Saturday full day
 * before the Sunday kickoff. For Asia/Pacific TZs it runs Friday afternoon
 * local, still well before next Sunday.
 *
 * Pattern (mirrors `recurrence.materialize.due`):
 *   1. `step.run('list-active-users')` snapshots `{ id, timezone }` for
 *      every non-deleted user.
 *   2. Per-user `step.run('materialize-<id>')` computes
 *      `getNextWeekStarting(now, tz)` and calls `tryCreateWeekSheet`.
 *   3. `Promise.allSettled` isolates per-user failures.
 *
 * Idempotency: `tryCreateWeekSheet` uses INSERT ... ON CONFLICT DO NOTHING
 * keyed on BR-7 UNIQUE (user_id, week_starting). Re-runs are free.
 *
 * Mute is NOT a filter here — materializing the row is cheap and
 * idempotent, and `muted_until` controls notifications, not whether the
 * sheet should exist. A muted user still needs a row when they unmute.
 *
 * Testing seam: handler body exported as `runWeeksheetMaterialize` so
 * unit tests exercise it directly with a fake `step` + logger.
 *
 * Linked: FT-034, BR-7, OPS-7.
 */

import { isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema/users';
import { getNextWeekStarting } from '@/lib/domain/week-calc';
import { tryCreateWeekSheet } from '@/lib/db/queries/sheets';
import { getInngest } from '../client';

interface StepLike {
  run<T>(id: string, fn: () => Promise<T> | T): Promise<T>;
}
interface LoggerLike {
  info: (msg: string, ...rest: unknown[]) => void;
  error: (msg: string, ...rest: unknown[]) => void;
}

export async function runWeeksheetMaterialize({
  step,
  logger,
  now = new Date(),
}: {
  step: StepLike;
  logger: LoggerLike;
  now?: Date;
}): Promise<{ users: number; created: number; skipped: number; failed: number }> {
  // Step 1 — snapshot active users with their TZ for the per-user math.
  const activeUsers = await step.run('list-active-users', async () => {
    return db
      .select({ id: users.id, timezone: users.timezone })
      .from(users)
      .where(isNull(users.deletedAt));
  });

  if (activeUsers.length === 0) {
    logger.info('[weekly.materialize.next] no active users');
    return { users: 0, created: 0, skipped: 0, failed: 0 };
  }

  // Step 2 — fan-out per user. Each gets its own `step.run` so Inngest
  // retries replay only the failed users.
  const results = await Promise.allSettled(
    activeUsers.map((u) =>
      step.run(`materialize-${u.id}`, async () => {
        const weekStarting = getNextWeekStarting(now, u.timezone);
        return tryCreateWeekSheet(u.id, weekStarting);
      })
    )
  );

  let created = 0;
  let skipped = 0;
  let failed = 0;
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === 'fulfilled') {
      if (r.value.created) created++;
      else skipped++;
    } else {
      failed++;
      logger.error(`[weekly.materialize.next] failed for userId=${activeUsers[i].id}`, r.reason);
    }
  }

  logger.info(
    `[weekly.materialize.next] users=${activeUsers.length} created=${created} skipped=${skipped} failed=${failed}`
  );
  return { users: activeUsers.length, created, skipped, failed };
}

export const weeksheetMaterialize = getInngest().createFunction(
  { id: 'weeksheet-materialize-friday', triggers: [{ cron: '0 0 * * 5' }] },
  runWeeksheetMaterialize
);
