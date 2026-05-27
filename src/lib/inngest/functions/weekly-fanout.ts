/**
 * Weekly check-in fan-out cron — ISSUE-080b.
 *
 * Ticks every hour. Mirror of daily-checkin-fanout but for
 * `weekly.kickoff.due` and `weekly.review.due`. The 60-min cron
 * cadence matches the 60-min window inside `shouldFireWeeklyCheckIn`.
 *
 * Linked: FT-085.
 */

import { eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema/users';
import { notificationPrefs } from '@/lib/db/schema/notification-prefs';
import {
  shouldFireWeeklyCheckIn,
  type WeeklyKind,
  type CheckInPrefs,
} from '@/lib/domain/checkin-schedule';
import { publish } from '../publish';
import { getInngest } from '../client';

interface StepLike {
  run<T>(id: string, fn: () => Promise<T> | T): Promise<T>;
}
interface LoggerLike {
  info: (msg: string, ...rest: unknown[]) => void;
  error: (msg: string, ...rest: unknown[]) => void;
}

const KINDS: WeeklyKind[] = ['kickoff', 'review'];

export async function runWeeklyFanout({
  step,
  logger,
  now = new Date(),
}: {
  step: StepLike;
  logger: LoggerLike;
  now?: Date;
}): Promise<{ users: number; emitted: number }> {
  const rows = await step.run('list-active-users-with-prefs', async () => {
    return db
      .select({
        id: users.id,
        timezone: users.timezone,
        morningTime: notificationPrefs.morningTime,
        middayTime: notificationPrefs.middayTime,
        eveningTime: notificationPrefs.eveningTime,
        weeklyKickoffDow: notificationPrefs.weeklyKickoffDow,
        weeklyKickoffTime: notificationPrefs.weeklyKickoffTime,
        weeklyReviewDow: notificationPrefs.weeklyReviewDow,
        weeklyReviewTime: notificationPrefs.weeklyReviewTime,
        weekendSkip: notificationPrefs.weekendSkip,
        daysOff: notificationPrefs.daysOff,
        mutedUntil: notificationPrefs.mutedUntil,
      })
      .from(users)
      .innerJoin(notificationPrefs, eq(notificationPrefs.userId, users.id))
      .where(isNull(users.deletedAt));
  });

  if (rows.length === 0) {
    logger.info('[weekly.fanout] no active users');
    return { users: 0, emitted: 0 };
  }

  let emitted = 0;
  const tasks: Promise<unknown>[] = [];
  for (const row of rows) {
    const prefs: CheckInPrefs = {
      morningTime: row.morningTime,
      middayTime: row.middayTime,
      eveningTime: row.eveningTime,
      weeklyKickoffDow: row.weeklyKickoffDow,
      weeklyKickoffTime: row.weeklyKickoffTime,
      weeklyReviewDow: row.weeklyReviewDow,
      weeklyReviewTime: row.weeklyReviewTime,
      weekendSkip: row.weekendSkip,
      daysOff: row.daysOff,
      mutedUntil: row.mutedUntil,
    };

    for (const kind of KINDS) {
      const decision = shouldFireWeeklyCheckIn(kind, prefs, row.timezone, now);
      if (!decision) continue;

      const eventName = `weekly.${kind}.due` as const;
      const dedupeId = `${row.id}-${decision.weekStarting}-${kind}`;
      tasks.push(
        step.run(`publish-${dedupeId}`, () =>
          publish(eventName, { userId: row.id, weekStarting: decision.weekStarting })
        )
      );
      emitted++;
    }
  }

  await Promise.allSettled(tasks);

  logger.info(`[weekly.fanout] users=${rows.length} emitted=${emitted}`);
  return { users: rows.length, emitted };
}

export const weeklyFanout = getInngest().createFunction(
  { id: 'weekly-fanout', triggers: [{ cron: '0 * * * *' }] },
  runWeeklyFanout
);
