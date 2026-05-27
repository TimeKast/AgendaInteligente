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
import { enqueueAndSend } from '@/lib/notifications/proactive';
import { getInngest } from '../client';

interface StepLike {
  run<T>(id: string, fn: () => Promise<T> | T): Promise<T>;
}

type Lang = 'es' | 'en';

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
    const lang = await loadLang(userId);
    const result = await enqueueAndSend({
      userId,
      type: 'morning_open',
      title: lang === 'en' ? 'Good morning' : 'Buenos días',
      body: lang === 'en' ? "What's today's intention?" : '¿Cuál es la intención de hoy?',
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

// ─── midday (conditional) ─────────────────────────────────────────────

/** Whether the midday check-in should fire for this user+date. */
export async function shouldFireMidday(
  userId: string,
  date: string
): Promise<{ fire: boolean; pendingWin?: string }> {
  // 1. Read the morning sheet (winsPlanned).
  const sheetRows = await db
    .select({ winsPlanned: daySheets.winsPlanned })
    .from(daySheets)
    .where(and(eq(daySheets.userId, userId), eq(daySheets.date, date)));
  const wins = sheetRows[0]?.winsPlanned ?? [];
  if (wins.length === 0) {
    return { fire: false };
  }

  // 2. Find the matching activities — wins are free-text matched against
  // activity titles. For v1 we keep it simple: fire if there's at least
  // ONE pending activity (the agent will reference it). The full
  // "all wins matched to done" check requires fuzzy matching, deferred.
  const pending = await db
    .select({ title: activities.title })
    .from(activities)
    .where(
      and(
        eq(activities.userId, userId),
        eq(activities.status, 'pending'),
        gt(activities.scheduledTime, '00:00') // any scheduled-time activity
      )
    )
    .limit(1);

  if (pending.length === 0) {
    return { fire: false };
  }
  // Default to surfacing the first planned win as the prompt anchor.
  return { fire: true, pendingWin: wins[0] };
}

export async function runMiddayCheckIn({
  step,
  event,
}: {
  step: StepLike;
  event: { data: { userId: string; date: string } };
}): Promise<{ status: string; skipped?: boolean }> {
  const { userId, date } = event.data;
  const decision = await step.run('check-conditional', () => shouldFireMidday(userId, date));
  if (!decision.fire) {
    return { status: 'skipped', skipped: true };
  }
  return await step.run('enqueue-midday', async () => {
    const lang = await loadLang(userId);
    const anchor = decision.pendingWin ?? '';
    const body =
      lang === 'en'
        ? `You said you'd ${anchor}. How's it going?`
        : `Dijiste que ibas a ${anchor}. ¿Cómo va?`;
    const result = await enqueueAndSend({
      userId,
      type: 'midday_check',
      title: lang === 'en' ? 'Quick check' : 'Mediodía',
      body,
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
    const lang = await loadLang(userId);
    const result = await enqueueAndSend({
      userId,
      type: 'evening_close',
      title: lang === 'en' ? 'Closing the day' : 'Cerramos el día',
      body: lang === 'en' ? 'One sentence to close?' : 'Una frase para cerrar?',
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
