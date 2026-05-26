/**
 * Handler: `recurrence.materialize.due` daily cron — ISSUE-080 (Slice A).
 *
 * Wakes every day at 02:00 UTC (pre-amanecer en LatAm), iterates active
 * users, and calls `materializeUserRecurrences(userId)` per user. Pure
 * fan-out: the heavy lifting lives in `src/lib/cron/recurrence.ts`
 * (ISSUE-024) — this handler is the scheduler that fires it.
 *
 * Failure isolation: `Promise.allSettled` ensures one user's failure
 * doesn't tumble the batch. Each per-user error is logged with userId.
 *
 * Idempotency: `materializeUserRecurrences` already dedupes against
 * existing instances, so re-runs (e.g. a retry after a partial cron
 * timeout) are free.
 *
 * Schedule: `0 2 * * *` (02:00 UTC daily). Inngest cron strings are
 * parsed in UTC unless prefixed `TZ=...`. Window is 14d forward so we
 * always have at least 13 days of buffer if a run is missed.
 *
 * Testing seam: the handler body is exported as `runRecurrenceMaterialize`
 * so unit tests can call it directly with a mock `step` + mock `logger`
 * without going through Inngest's executor.
 *
 * Linked: FT-080, OPS-5, BR-11.
 */

import { isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema/users';
import { materializeUserRecurrences } from '@/lib/cron/recurrence';
import { getInngest } from '../client';

// Minimal shape we use off the Inngest context. Subset of the real types
// so the unit test can hand-roll a fake step + logger without pulling in
// the entire SDK type surface.
interface StepLike {
  run<T>(id: string, fn: () => Promise<T> | T): Promise<T>;
}
interface LoggerLike {
  info: (msg: string, ...rest: unknown[]) => void;
  error: (msg: string, ...rest: unknown[]) => void;
}

export async function runRecurrenceMaterialize({
  step,
  logger,
}: {
  step: StepLike;
  logger: LoggerLike;
}): Promise<{ users: number; ok: number; failed: number }> {
  // Step 1 — snapshot the list of active users. Wrapping in `step.run`
  // makes the result memoized: an Inngest retry after a partial run
  // doesn't re-query the DB.
  const activeUsers = await step.run('list-active-users', async () => {
    return db.select({ id: users.id }).from(users).where(isNull(users.deletedAt));
  });

  if (activeUsers.length === 0) {
    logger.info('[recurrence.materialize.due] no active users');
    return { users: 0, ok: 0, failed: 0 };
  }

  // Step 2 — fan-out per user with failure isolation. Each materialize
  // call is its own `step.run` so Inngest records per-user attempts and
  // can replay only the failed ones.
  const results = await Promise.allSettled(
    activeUsers.map((u) => step.run(`materialize-${u.id}`, () => materializeUserRecurrences(u.id)))
  );

  let ok = 0;
  let failed = 0;
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === 'fulfilled') {
      ok++;
    } else {
      failed++;
      logger.error(`[recurrence.materialize.due] failed for userId=${activeUsers[i].id}`, r.reason);
    }
  }

  logger.info(`[recurrence.materialize.due] users=${activeUsers.length} ok=${ok} failed=${failed}`);
  return { users: activeUsers.length, ok, failed };
}

export const recurrenceMaterialize = getInngest().createFunction(
  { id: 'recurrence-materialize-daily', triggers: [{ cron: '0 2 * * *' }] },
  runRecurrenceMaterialize
);
