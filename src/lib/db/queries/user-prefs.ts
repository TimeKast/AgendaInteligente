/**
 * User preferences loader for /settings/* pages.
 *
 * Bundles the per-page reads (intensity, language/timezone,
 * notification schedule) into one helper each so the settings pages
 * keep their server components small. Lives under /lib/db/queries
 * (BR-1 allowlist) — these queries hit `users` (auth-root table) and
 * `notification_prefs` (singleton per user) with explicit userId
 * scoping on the WHERE clause.
 */

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema/users';
import { notificationPrefs } from '@/lib/db/schema/notification-prefs';

export interface IntensityPrefs {
  mode: 'sharp' | 'standard' | 'gentle' | 'listening';
  expiresAt: Date | null;
}

export async function loadIntensityPrefs(userId: string): Promise<IntensityPrefs> {
  const rows = await db
    .select({
      intensityMode: users.intensityMode,
      intensityExpiresAt: users.intensityExpiresAt,
    })
    .from(users)
    .where(eq(users.id, userId));
  const r = rows[0];
  return {
    mode: ((r?.intensityMode as IntensityPrefs['mode']) ?? 'gentle') as IntensityPrefs['mode'],
    expiresAt: r?.intensityExpiresAt ?? null,
  };
}

export interface LanguagePrefs {
  preferredLanguage: 'es' | 'en';
  timezone: string;
}

export async function loadLanguagePrefs(userId: string): Promise<LanguagePrefs> {
  const rows = await db
    .select({
      preferredLanguage: users.preferredLanguage,
      timezone: users.timezone,
    })
    .from(users)
    .where(eq(users.id, userId));
  const r = rows[0];
  return {
    preferredLanguage: ((r?.preferredLanguage as 'es' | 'en') ?? 'es') as 'es' | 'en',
    timezone: r?.timezone ?? 'UTC',
  };
}

export interface NotificationsPrefs {
  morningTime: string; // HH:mm:ss
  middayTime: string;
  eveningTime: string;
  weeklyKickoffDow: number;
  weeklyKickoffTime: string;
  weeklyReviewDow: number;
  weeklyReviewTime: string;
  weekendSkip: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  contactChannels: string[];
  /** Custom check-in copy. NULL on each = use the default. */
  morningTitle: string | null;
  morningBody: string | null;
  middayTitle: string | null;
  middayBody: string | null;
  eveningTitle: string | null;
  eveningBody: string | null;
  /** Minutes between nag re-fires after morning. 0 = nag disabled. */
  nagIntervalMinutes: number;
  /**
   * User-local YYYY-MM-DD strings on which no check-in fires
   * (vacations, travel days, etc.). Read-only here; mutations go
   * through `updateNotificationPrefs`.
   */
  daysOff: string[];
}

export async function loadNotificationsPrefs(userId: string): Promise<NotificationsPrefs> {
  const [prefsRows, userRows] = await Promise.all([
    db
      .select({
        morningTime: notificationPrefs.morningTime,
        middayTime: notificationPrefs.middayTime,
        eveningTime: notificationPrefs.eveningTime,
        weeklyKickoffDow: notificationPrefs.weeklyKickoffDow,
        weeklyKickoffTime: notificationPrefs.weeklyKickoffTime,
        weeklyReviewDow: notificationPrefs.weeklyReviewDow,
        weeklyReviewTime: notificationPrefs.weeklyReviewTime,
        weekendSkip: notificationPrefs.weekendSkip,
        pushEnabled: notificationPrefs.pushEnabled,
        emailEnabled: notificationPrefs.emailEnabled,
        morningTitle: notificationPrefs.morningTitle,
        morningBody: notificationPrefs.morningBody,
        middayTitle: notificationPrefs.middayTitle,
        middayBody: notificationPrefs.middayBody,
        eveningTitle: notificationPrefs.eveningTitle,
        eveningBody: notificationPrefs.eveningBody,
        nagIntervalMinutes: notificationPrefs.nagIntervalMinutes,
        daysOff: notificationPrefs.daysOff,
      })
      .from(notificationPrefs)
      .where(eq(notificationPrefs.userId, userId)),
    db.select({ contactChannels: users.contactChannels }).from(users).where(eq(users.id, userId)),
  ]);
  const p = prefsRows[0];
  return {
    morningTime: p?.morningTime ?? '08:00:00',
    middayTime: p?.middayTime ?? '13:00:00',
    eveningTime: p?.eveningTime ?? '21:00:00',
    weeklyKickoffDow: p?.weeklyKickoffDow ?? 0,
    weeklyKickoffTime: p?.weeklyKickoffTime ?? '18:00:00',
    weeklyReviewDow: p?.weeklyReviewDow ?? 6,
    weeklyReviewTime: p?.weeklyReviewTime ?? '20:00:00',
    weekendSkip: p?.weekendSkip ?? false,
    pushEnabled: p?.pushEnabled ?? false,
    emailEnabled: p?.emailEnabled ?? false,
    contactChannels: userRows[0]?.contactChannels ?? ['email'],
    morningTitle: p?.morningTitle ?? null,
    morningBody: p?.morningBody ?? null,
    middayTitle: p?.middayTitle ?? null,
    middayBody: p?.middayBody ?? null,
    eveningTitle: p?.eveningTitle ?? null,
    eveningBody: p?.eveningBody ?? null,
    nagIntervalMinutes: p?.nagIntervalMinutes ?? 60,
    daysOff: p?.daysOff ?? [],
  };
}
