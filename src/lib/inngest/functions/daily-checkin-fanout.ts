/**
 * Daily check-in fan-out cron — ISSUE-080b.
 *
 * Ticks every 5 min UTC. Each tick:
 *   1. SELECT every active user with their `notification_prefs` + TZ.
 *   2. Morning + evening: fixed time slots — `shouldFireDailyCheckIn`
 *      asks whether NOW falls in the slot window.
 *   3. Midday: NOT a fixed slot. After morning fires, if the user
 *      hasn't been recorded as active, `shouldFireNag` re-fires it
 *      every `nag_interval_minutes` until either the user opens the
 *      app OR evening_time arrives. The nag pushes through the same
 *      `midday.check_in.due` event so the existing handler + copy
 *      override apply unchanged.
 *   4. Publish events with deterministic dedupe ids.
 *
 * Idempotency:
 *   - morning/evening: `<userId>-<isoDate>-<slot>` (one per day).
 *   - midday/nag: `<userId>-<isoDate>-midday-<bucket>` where bucket is
 *     `floor(minutes_since_last_check_in / nag_interval)` — so a single
 *     cron run inside the nag window emits at most one event, and
 *     overlapping retries collapse on the same id.
 *
 * Linked: FT-085, BR-15..20.
 */

import { eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema/users';
import { notificationPrefs } from '@/lib/db/schema/notification-prefs';
import {
  shouldFireDailyCheckIn,
  shouldFireNag,
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
  lastCheckInAt: Date | null;
  lastActiveAt: Date | null;
}

// Fixed-time slots the fanout still iterates on. Midday is handled
// separately by `shouldFireNag` (interval-based, not time-based).
const FIXED_SLOTS: DailySlot[] = ['morning', 'evening'];

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
        nagIntervalMinutes: notificationPrefs.nagIntervalMinutes,
        lastCheckInAt: notificationPrefs.lastCheckInAt,
        lastActiveAt: notificationPrefs.lastActiveAt,
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
        nagIntervalMinutes: row.nagIntervalMinutes,
      },
      lastCheckInAt: row.lastCheckInAt,
      lastActiveAt: row.lastActiveAt,
    };

    // Morning + evening: fixed time-of-day slots.
    for (const slot of FIXED_SLOTS) {
      const decision = shouldFireDailyCheckIn(slot, user.prefs, user.timezone, now);
      if (!decision) continue;
      const eventName = `${slot}.check_in.due` as const;
      const dedupeId = `${user.id}-${decision.isoDate}-${slot}`;
      tasks.push(
        step.run(`publish-${dedupeId}`, () =>
          publish(eventName, { userId: user.id, date: decision.isoDate })
        )
      );
      emitted++;
    }

    // Midday: nag — fires after morning when the user hasn't visited.
    const nagDecision = shouldFireNag(
      user.prefs,
      user.timezone,
      now,
      user.lastCheckInAt,
      user.lastActiveAt
    );
    if (nagDecision && user.lastCheckInAt) {
      // Bucket the nag by interval count from `lastCheckInAt`. Two
      // cron ticks inside the same nag window collapse to the same
      // dedupe id, but a fresh window after the next push lands in
      // a new bucket and is allowed to emit again.
      const elapsedMin = (now.getTime() - user.lastCheckInAt.getTime()) / 60_000;
      const bucket = Math.floor(elapsedMin / user.prefs.nagIntervalMinutes);
      const dedupeId = `${user.id}-${nagDecision.isoDate}-midday-nag-${bucket}`;
      tasks.push(
        step.run(`publish-${dedupeId}`, () =>
          publish('midday.check_in.due', { userId: user.id, date: nagDecision.isoDate })
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
