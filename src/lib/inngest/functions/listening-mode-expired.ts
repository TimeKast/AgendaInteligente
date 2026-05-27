/**
 * Hourly cron: revert expired `listening` intensities to `standard` — ISSUE-054.
 *
 * OPS-4: users in listening mode auto-revert 48h after entering it.
 * `intensity_expires_at` carries the deadline. This cron sweeps users
 * past the deadline and bumps them back, sending a one-line push
 * notification (handled in ISSUE-054b — for now we just log).
 *
 * Linked: OPS-4, FT-053.
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

export async function runListeningModeExpired({
  step,
  logger,
  now = new Date(),
}: {
  step: StepLike;
  logger: LoggerLike;
  now?: Date;
}): Promise<{ reverted: number }> {
  const expired = await step.run('list-expired-listening-users', async () => {
    return db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.intensityMode, 'listening'),
          isNotNull(users.intensityExpiresAt),
          lt(users.intensityExpiresAt, now)
        )
      );
  });

  if (expired.length === 0) {
    logger.info('[listening.mode.expired] none to revert');
    return { reverted: 0 };
  }

  await step.run('revert-batch', async () => {
    return db
      .update(users)
      .set({
        intensityMode: 'standard',
        intensityExpiresAt: null,
      })
      .where(
        and(
          eq(users.intensityMode, 'listening'),
          isNotNull(users.intensityExpiresAt),
          lt(users.intensityExpiresAt, now)
        )
      );
  });

  logger.info(`[listening.mode.expired] reverted=${expired.length}`);
  return { reverted: expired.length };
}

export const listeningModeExpired = getInngest().createFunction(
  { id: 'listening-mode-expired', triggers: [{ cron: '0 * * * *' }] },
  runListeningModeExpired
);
