/**
 * Per-week activity loader for /month.
 *
 * Buckets non-deleted, non-done activities into the 4-5 weeks that
 * overlap the given month plus a "no day in this month" pool. The pool
 * is grouped by deadline tier (vence este mes / próximo mes / sin
 * deadline) so the user can prioritise what to plan.
 *
 * Recurring parent templates (recurrence_rule + null parent_id) are
 * hidden — only materialised instances surface, matching listActivities.
 */

import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { activities, type Activity } from '@/lib/db/schema/activities';
import { projects } from '@/lib/db/schema/projects';
import { addDaysIsoYmd } from '@/lib/domain/day-calc';

export interface MonthActivitySummary {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done' | 'skipped' | 'blocked';
  priority: number;
  scheduledTime: string | null;
  scheduledDates: string[];
  deadline: string | null;
  description: string | null;
  projectId: string;
  projectName: string;
  recurrenceRule: string | null;
}

export interface MonthWeek {
  /** Sunday-anchored week start, YYYY-MM-DD. May fall before the 1st of the month. */
  weekStarting: string;
  /** Each day of the week as YYYY-MM-DD (7 entries). */
  days: string[];
  /** Activities scheduled on any of the 7 days. */
  items: MonthActivitySummary[];
}

export interface MonthActivitiesResult {
  monthStarting: string; // YYYY-MM-01
  monthEnd: string; // YYYY-MM-<last day>
  weeks: MonthWeek[];
  /** Pool: deadline in this month, no day yet. */
  dueThisMonth: MonthActivitySummary[];
  /** Pool: deadline AFTER this month, no day in this month. */
  dueLater: MonthActivitySummary[];
  /** Pool: no deadline, no day in this month (true backlog). */
  noDeadline: MonthActivitySummary[];
}

function uiStatus(s: string): MonthActivitySummary['status'] {
  if (s === 'in_progress') return 'in_progress';
  if (s === 'done' || s === 'skipped' || s === 'blocked') return s;
  return 'todo';
}

function toSummary(a: Activity, projectName: string): MonthActivitySummary {
  return {
    id: a.id,
    title: a.title,
    status: uiStatus(a.status),
    priority: a.priority,
    scheduledTime: a.scheduledTime ? a.scheduledTime.slice(0, 5) : null,
    scheduledDates: a.scheduledDates ?? [],
    deadline: a.deadline ? a.deadline.toISOString().slice(0, 10) : null,
    description: a.description ?? null,
    projectId: a.projectId,
    projectName,
    recurrenceRule: a.recurrenceRule ?? null,
  };
}

/** Walk back from `ymd` until we hit Sunday (Intl-free, UTC arithmetic). */
function sundayOf(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const weekday = date.getUTCDay(); // 0 = Sunday
  if (weekday === 0) return ymd;
  return addDaysIsoYmd(ymd, -weekday);
}

export async function loadMonthActivities(
  userId: string,
  monthStarting: string
): Promise<MonthActivitiesResult> {
  const [y, m] = monthStarting.split('-').map(Number);
  // Last day of the month via day-0 of next month.
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const monthEnd = `${monthStarting.slice(0, 7)}-${String(lastDay).padStart(2, '0')}`;

  // Build the weeks covering the month. Anchor to Sunday before the 1st;
  // keep adding 7-day blocks until the start of a week exceeds monthEnd.
  const weekStarts: string[] = [];
  let cursor = sundayOf(monthStarting);
  // Cap at 7 weeks defensively (a 31-day month spans at most 6).
  for (let i = 0; i < 7; i++) {
    weekStarts.push(cursor);
    const nextStart = addDaysIsoYmd(cursor, 7);
    if (nextStart > monthEnd) break;
    cursor = nextStart;
  }

  const weeks: MonthWeek[] = weekStarts.map((ws) => {
    const days: string[] = [];
    for (let i = 0; i < 7; i++) days.push(addDaysIsoYmd(ws, i));
    return { weekStarting: ws, days, items: [] };
  });
  const dayToWeek = new Map<string, MonthWeek>();
  for (const w of weeks) {
    for (const d of w.days) dayToWeek.set(d, w);
  }

  // One query: all non-deleted activities for the user.
  const rows = await db
    .select({ a: activities, projectName: projects.name })
    .from(activities)
    .innerJoin(projects, eq(projects.id, activities.projectId))
    .where(and(eq(activities.userId, userId), isNull(activities.deletedAt)));

  const dueThisMonth: MonthActivitySummary[] = [];
  const dueLater: MonthActivitySummary[] = [];
  const noDeadline: MonthActivitySummary[] = [];

  for (const row of rows) {
    const a = row.a;
    if (a.recurrenceRule !== null && a.recurrenceParentId === null) continue;
    if (a.status === 'done') continue;

    const summary = toSummary(a, row.projectName ?? '');
    const dates = a.scheduledDates ?? [];

    let placed = false;
    for (const d of dates) {
      const week = dayToWeek.get(d);
      if (week) {
        week.items.push(summary);
        placed = true;
      }
    }
    if (placed) continue;

    // Pool routing by deadline tier.
    if (summary.deadline && summary.deadline >= monthStarting && summary.deadline <= monthEnd) {
      dueThisMonth.push(summary);
    } else if (summary.deadline && summary.deadline > monthEnd) {
      dueLater.push(summary);
    } else if (!summary.deadline && dates.length === 0) {
      noDeadline.push(summary);
    }
    // Items scheduled OUTSIDE the visible month are skipped entirely.
  }

  // Sort week items by date+time+priority.
  for (const w of weeks) {
    w.items.sort((x, y) => {
      const dx = x.scheduledDates.find((d) => w.days.includes(d)) ?? '';
      const dy = y.scheduledDates.find((d) => w.days.includes(d)) ?? '';
      if (dx !== dy) return dx.localeCompare(dy);
      const tx = x.scheduledTime ?? '99:99';
      const ty = y.scheduledTime ?? '99:99';
      if (tx !== ty) return tx.localeCompare(ty);
      return y.priority - x.priority;
    });
  }
  const cmp = (x: MonthActivitySummary, y: MonthActivitySummary) => {
    const dx = x.deadline ?? '9999-99-99';
    const dy = y.deadline ?? '9999-99-99';
    if (dx !== dy) return dx.localeCompare(dy);
    return y.priority - x.priority;
  };
  dueThisMonth.sort(cmp);
  dueLater.sort(cmp);
  noDeadline.sort((x, y) => y.priority - x.priority);

  return {
    monthStarting,
    monthEnd,
    weeks,
    dueThisMonth,
    dueLater,
    noDeadline,
  };
}
