/**
 * Event handlers for the per-user check-in cadence — ISSUE-083, 084, 085.
 *
 * Each handler listens to ONE event published by a fan-out cron
 * (`morning.check_in.due` / `midday.check_in.due` / `evening.check_in.due` /
 * `weekly.kickoff.due` / `weekly.review.due`) and converts it into a
 * proactive notification via `enqueueAndSend`. Anti-spam (OPS-1/2),
 * mute, and listening grace are all enforced by `enqueueAndSend`.
 *
 * Midday is CONDITIONAL: skips when the user's DaySheet either has
 * no `wins_planned` or all planned wins map to done activities. The
 * other handlers always attempt to send (anti-spam still applies).
 *
 * Linked: FT-080..082, FT-104, FT-085, US-080..082, US-085, AI-9.
 */

import { and, eq, gt } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema/users';
import { daySheets } from '@/lib/db/schema/day-sheets';
import { activities } from '@/lib/db/schema/activities';
import { notificationPrefs } from '@/lib/db/schema/notification-prefs';
import { enqueueAndSend } from '@/lib/notifications/proactive';
import {
  resolveCheckInCopy,
  type DailySlot,
  type Lang,
} from '@/lib/notifications/check-in-defaults';
import { getInngest } from '../client';

interface StepLike {
  run<T>(id: string, fn: () => Promise<T> | T): Promise<T>;
}

interface SlotContext {
  lang: Lang;
  overrides: {
    morningTitle: string | null;
    morningBody: string | null;
    middayTitle: string | null;
    middayBody: string | null;
    eveningTitle: string | null;
    eveningBody: string | null;
  };
}

async function loadSlotContext(userId: string): Promise<SlotContext> {
  const [userRow, prefsRow] = await Promise.all([
    db
      .select({ preferredLanguage: users.preferredLanguage })
      .from(users)
      .where(eq(users.id, userId)),
    db
      .select({
        morningTitle: notificationPrefs.morningTitle,
        morningBody: notificationPrefs.morningBody,
        middayTitle: notificationPrefs.middayTitle,
        middayBody: notificationPrefs.middayBody,
        eveningTitle: notificationPrefs.eveningTitle,
        eveningBody: notificationPrefs.eveningBody,
      })
      .from(notificationPrefs)
      .where(eq(notificationPrefs.userId, userId)),
  ]);
  const lang: Lang = userRow[0]?.preferredLanguage === 'en' ? 'en' : 'es';
  const p = prefsRow[0];
  return {
    lang,
    overrides: {
      morningTitle: p?.morningTitle ?? null,
      morningBody: p?.morningBody ?? null,
      middayTitle: p?.middayTitle ?? null,
      middayBody: p?.middayBody ?? null,
      eveningTitle: p?.eveningTitle ?? null,
      eveningBody: p?.eveningBody ?? null,
    },
  };
}

function resolveFor(
  slot: DailySlot,
  ctx: SlotContext,
  anchor?: string
): { title: string; body: string } {
  return resolveCheckInCopy(slot, ctx.lang, ctx.overrides, anchor);
}

/** Lighter helper used by weekly handlers (no copy overrides for those yet). */
async function loadLang(userId: string): Promise<Lang> {
  const row = await db
    .select({ preferredLanguage: users.preferredLanguage })
    .from(users)
    .where(eq(users.id, userId));
  return row[0]?.preferredLanguage === 'en' ? 'en' : 'es';
}

// ─── morning ──────────────────────────────────────────────────────────

export async function runMorningCheckIn({
  step,
  event,
}: {
  step: StepLike;
  event: { data: { userId: string; date: string } };
}): Promise<{ status: string }> {
  const { userId, date } = event.data;
  return await step.run('enqueue-morning', async () => {
    const ctx = await loadSlotContext(userId);
    const copy = resolveFor('morning', ctx);
    const result = await enqueueAndSend({
      userId,
      type: 'morning_open',
      title: copy.title,
      body: copy.body,
      url: `/chat?context=morning_check&date=${date}`,
      payload: { context: 'morning_check', date },
    });
    return { status: result.status };
  });
}

export const morningCheckInHandler = getInngest().createFunction(
  { id: 'morning-check-in-handler', triggers: [{ event: 'morning.check_in.due' }] },
  runMorningCheckIn
);

// ─── midday ───────────────────────────────────────────────────────────
// Always fires (same shape as morning + evening). Previously it was
// gated on `winsPlanned` because the default copy used the `{win}`
// anchor — without a planned win, the message read "Dijiste que ibas a
// . ¿Cómo va?". Since the user now controls the copy from settings and
// the resolver strips an empty `{win}` cleanly, the gate is gone. The
// win anchor is still fetched best-effort for users who keep it in
// their custom body.

/**
 * Best-effort win anchor for the midday `{win}` substitution. Returns
 * an empty string when the user hasn't recorded a planned win — the
 * resolver drops the token from the body without leaving "" debris.
 */
export async function resolveMiddayAnchor(userId: string, date: string): Promise<string> {
  const sheetRows = await db
    .select({ winsPlanned: daySheets.winsPlanned })
    .from(daySheets)
    .where(and(eq(daySheets.userId, userId), eq(daySheets.date, date)));
  const wins = sheetRows[0]?.winsPlanned ?? [];
  if (wins.length > 0) return wins[0];

  // No planned win → use the next pending scheduled activity title as
  // a softer fallback, so `{win}` still resolves to something concrete.
  const pending = await db
    .select({ title: activities.title })
    .from(activities)
    .where(
      and(
        eq(activities.userId, userId),
        eq(activities.status, 'pending'),
        gt(activities.scheduledTime, '00:00')
      )
    )
    .limit(1);
  return pending[0]?.title ?? '';
}

export async function runMiddayCheckIn({
  step,
  event,
}: {
  step: StepLike;
  event: { data: { userId: string; date: string } };
}): Promise<{ status: string; skipped?: boolean }> {
  const { userId, date } = event.data;
  const anchor = await step.run('resolve-anchor', () => resolveMiddayAnchor(userId, date));
  return await step.run('enqueue-midday', async () => {
    const ctx = await loadSlotContext(userId);
    const copy = resolveFor('midday', ctx, anchor);
    const result = await enqueueAndSend({
      userId,
      type: 'midday_check',
      title: copy.title,
      body: copy.body,
      url: `/chat?context=midday_check&date=${date}`,
      payload: { context: 'midday_check', date, anchor },
    });
    return { status: result.status };
  });
}

export const middayCheckInHandler = getInngest().createFunction(
  { id: 'midday-check-in-handler', triggers: [{ event: 'midday.check_in.due' }] },
  runMiddayCheckIn
);

// ─── evening ──────────────────────────────────────────────────────────

export async function runEveningCheckIn({
  step,
  event,
}: {
  step: StepLike;
  event: { data: { userId: string; date: string } };
}): Promise<{ status: string }> {
  const { userId, date } = event.data;
  return await step.run('enqueue-evening', async () => {
    const ctx = await loadSlotContext(userId);
    const copy = resolveFor('evening', ctx);
    const result = await enqueueAndSend({
      userId,
      type: 'evening_close',
      title: copy.title,
      body: copy.body,
      url: `/chat?context=evening_close&date=${date}`,
      payload: { context: 'evening_close', date },
    });
    return { status: result.status };
  });
}

export const eveningCheckInHandler = getInngest().createFunction(
  { id: 'evening-check-in-handler', triggers: [{ event: 'evening.check_in.due' }] },
  runEveningCheckIn
);

// ─── weekly kickoff + review (ISSUE-085) ──────────────────────────────

export async function runWeeklyKickoff({
  step,
  event,
}: {
  step: StepLike;
  event: { data: { userId: string; weekStarting: string } };
}): Promise<{ status: string }> {
  const { userId, weekStarting } = event.data;
  return await step.run('enqueue-weekly-kickoff', async () => {
    const lang = await loadLang(userId);
    const result = await enqueueAndSend({
      userId,
      type: 'weekly_kickoff',
      title: lang === 'en' ? 'Open the week' : 'Abrir la semana',
      body:
        lang === 'en'
          ? 'If only ONE thing happens this week, what?'
          : 'Si solo UNA cosa pasa esta semana, ¿cuál?',
      url: `/chat?context=weekly_kickoff&weekStarting=${weekStarting}`,
      payload: { context: 'weekly_kickoff', weekStarting },
    });
    return { status: result.status };
  });
}

export const weeklyKickoffHandler = getInngest().createFunction(
  { id: 'weekly-kickoff-handler', triggers: [{ event: 'weekly.kickoff.due' }] },
  runWeeklyKickoff
);

export async function runWeeklyReview({
  step,
  event,
}: {
  step: StepLike;
  event: { data: { userId: string; weekStarting: string } };
}): Promise<{ status: string }> {
  const { userId, weekStarting } = event.data;
  return await step.run('enqueue-weekly-review', async () => {
    const lang = await loadLang(userId);
    const result = await enqueueAndSend({
      userId,
      type: 'weekly_review',
      title: lang === 'en' ? 'Weekly review' : 'Review semanal',
      body: lang === 'en' ? 'Close the week — how did it go?' : 'Cerrar la semana — ¿cómo fue?',
      url: `/chat?context=weekly_review&weekStarting=${weekStarting}`,
      payload: { context: 'weekly_review', weekStarting },
    });
    return { status: result.status };
  });
}

export const weeklyReviewHandler = getInngest().createFunction(
  { id: 'weekly-review-handler', triggers: [{ event: 'weekly.review.due' }] },
  runWeeklyReview
);
