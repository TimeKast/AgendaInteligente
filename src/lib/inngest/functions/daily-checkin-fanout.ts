/**
 * Daily check-in fan-out cron — ISSUE-080b.
 *
 * Ticks every 5 min UTC. Each tick:
 *   1. SELECT every active user with their `notification_prefs` + TZ.
 *   2. For each user × each slot (morning/midday/evening), ask
 *      `shouldFireDailyCheckIn` whether NOW falls in the slot window.
 *   3. Publish `<slot>.check_in.due` events for every match, using a
 *      deterministic event id so Inngest dedupes retries.
 *
 * Idempotency: event id = `<userId>-<isoDate>-<slot>`. If the cron
 * fires twice within the 5-min window (clock skew, Inngest retry),
 * the second emit is dropped server-side by event idempotency.
 *
 * Why fan-out > per-user orchestrator: stateless, pref changes reflect
 * on the next tick at zero cost, same pattern reused by weekly + system
 * crons. See ISSUE-080b for the α/β decision write-up.
 *
 * Linked: FT-085, BR-15..20.
 */

import { eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema/users';
import { notificationPrefs } from '@/lib/db/schema/notification-prefs';
import {
  shouldFireDailyCheckIn,
  type DailySlot,
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

interface UserWithPrefs {
  id: string;
  timezone: string;
  prefs: CheckInPrefs;
}

const SLOTS: DailySlot[] = ['morning', 'midday', 'evening'];

export async function runDailyCheckinFanout({
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
    logger.info('[daily.checkin.fanout] no active users');
    return { users: 0, emitted: 0 };
  }

  let emitted = 0;
  const tasks: Promise<unknown>[] = [];
  for (const row of rows) {
    const user: UserWithPrefs = {
      id: row.id,
      timezone: row.timezone,
      prefs: {
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
      },
    };

    for (const slot of SLOTS) {
      const decision = shouldFireDailyCheckIn(slot, user.prefs, user.timezone, now);
      if (!decision) continue;

      const eventName = `${slot}.check_in.due` as const;
      // Inngest idempotency: same id within the event-retention window
      // is dropped server-side. Deterministic from (user, date, slot)
      // so duplicate cron ticks across a 5-min window collapse.
      const dedupeId = `${user.id}-${decision.isoDate}-${slot}`;
      tasks.push(
        step.run(`publish-${dedupeId}`, () =>
          publish(eventName, { userId: user.id, date: decision.isoDate })
        )
      );
      emitted++;
    }
  }

  await Promise.allSettled(tasks);

  logger.info(`[daily.checkin.fanout] users=${rows.length} emitted=${emitted}`);
  return { users: rows.length, emitted };
}

export const dailyCheckinFanout = getInngest().createFunction(
  { id: 'daily-checkin-fanout', triggers: [{ cron: '*/5 * * * *' }] },
  runDailyCheckinFanout
);
