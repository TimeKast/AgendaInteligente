/**
 * Daily cron: migrate 14-day-gentle users to `standard` — ISSUE-054.
 *
 * New users default to `gentle` for 14 days (onboarding sets
 * `intensity_default_until = signup + 14d`). After the deadline this
 * cron flips them to `standard` and sends a one-line push (handled in
 * ISSUE-054b).
 *
 * Only users who NEVER manually chose a mode get migrated — the
 * setIntensityMode action clears `intensity_default_until`, so an
 * explicit choice opts out of the migration.
 *
 * Linked: OPS-4, FT-052, BR-3.
 */

import { and, eq, isNotNull, lt } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema/users';
import { getInngest } from '../client';

interface StepLike {
  run<T>(id: string, fn: () => Promise<T> | T): Promise<T>;
}
interface LoggerLike {
  info: (msg: string, ...rest: unknown[]) => void;
  error: (msg: string, ...rest: unknown[]) => void;
}

export async function runGentleDefaultExpired({
  step,
  logger,
  now = new Date(),
}: {
  step: StepLike;
  logger: LoggerLike;
  now?: Date;
}): Promise<{ migrated: number }> {
  const expired = await step.run('list-expired-gentle-users', async () => {
    return db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.intensityMode, 'gentle'),
          isNotNull(users.intensityDefaultUntil),
          lt(users.intensityDefaultUntil, now)
        )
      );
  });

  if (expired.length === 0) {
    logger.info('[gentle.default.expired] none to migrate');
    return { migrated: 0 };
  }

  await step.run('migrate-batch', async () => {
    return db
      .update(users)
      .set({
        intensityMode: 'standard',
        intensityDefaultUntil: null,
      })
      .where(
        and(
          eq(users.intensityMode, 'gentle'),
          isNotNull(users.intensityDefaultUntil),
          lt(users.intensityDefaultUntil, now)
        )
      );
  });

  logger.info(`[gentle.default.expired] migrated=${expired.length}`);
  return { migrated: expired.length };
}

export const gentleDefaultExpired = getInngest().createFunction(
  { id: 'gentle-default-expired', triggers: [{ cron: '5 3 * * *' }] },
  runGentleDefaultExpired
);
