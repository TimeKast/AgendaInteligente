/**
 * Per-day activity loader for /week.
 *
 * Returns the user's non-deleted, non-done activities split into 7 daily
 * buckets (Sun..Sat for the week starting `weekStartingYmd`) plus a
 * "no day" backlog for items without a scheduled date in this week.
 *
 * Recurring "parent templates" (recurrence_rule set + recurrence_parent_id
 * null) are filtered out — only materialized instances surface, matching
 * the rule in `src/lib/actions/activity.ts` listActivities.
 */

import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { activities, type Activity } from '@/lib/db/schema/activities';
import { projects } from '@/lib/db/schema/projects';
import { addDaysIsoYmd } from '@/lib/domain/day-calc';

export interface WeekActivitySummary {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done' | 'skipped' | 'blocked';
  priority: number;
  scheduledTime: string | null;
  deadline: string | null;
  description: string | null;
  projectId: string;
  projectName: string;
  recurrenceRule: string | null;
}

export interface WeekActivitiesResult {
  /** 7 YYYY-MM-DD strings, weekStartingYmd → +6 days. */
  days: string[];
  /** Activities grouped per day. Keys are the day strings above. */
  byDay: Record<string, WeekActivitySummary[]>;
  /**
   * Activities that have NO date that falls within this week.
   * Includes pure backlog (no dates at all) AND activities scheduled
   * outside the visible window.
   */
  noDay: WeekActivitySummary[];
}

function uiStatus(s: string): WeekActivitySummary['status'] {
  if (s === 'in_progress') return 'in_progress';
  if (s === 'done' || s === 'skipped' || s === 'blocked') return s;
  return 'todo';
}

function toSummary(a: Activity, projectName: string): WeekActivitySummary {
  return {
    id: a.id,
    title: a.title,
    status: uiStatus(a.status),
    priority: a.priority,
    scheduledTime: a.scheduledTime ? a.scheduledTime.slice(0, 5) : null,
    deadline: a.deadline ? a.deadline.toISOString().slice(0, 10) : null,
    description: a.description ?? null,
    projectId: a.projectId,
    projectName,
    recurrenceRule: a.recurrenceRule ?? null,
  };
}

export async function loadWeekActivities(
  userId: string,
  weekStartingYmd: string
): Promise<WeekActivitiesResult> {
  const days: string[] = [];
  for (let i = 0; i < 7; i++) days.push(addDaysIsoYmd(weekStartingYmd, i));

  const rows = await db
    .select({
      a: activities,
      projectName: projects.name,
    })
    .from(activities)
    .innerJoin(projects, eq(projects.id, activities.projectId))
    .where(and(eq(activities.userId, userId), isNull(activities.deletedAt)));

  const byDay: Record<string, WeekActivitySummary[]> = {};
  for (const d of days) byDay[d] = [];
  const noDay: WeekActivitySummary[] = [];

  const dayLookup = new Set(days);

  for (const row of rows) {
    const a = row.a;
    // Hide recurring parent templates — only materialized children show.
    const isParent = a.recurrenceRule !== null && a.recurrenceParentId === null;
    if (isParent) continue;
    // Hide done — /week is planning surface.
    if (a.status === 'done') continue;

    const summary = toSummary(a, row.projectName ?? '');
    const dates = a.scheduledDates ?? [];

    const matchedDays = dates.filter((d) => dayLookup.has(d));
    if (matchedDays.length > 0) {
      for (const d of matchedDays) byDay[d].push(summary);
    } else {
      noDay.push(summary);
    }
  }

  // Sort each day's activities by scheduled time (nulls last) then priority.
  for (const d of days) {
    byDay[d].sort((x, y) => {
      const tx = x.scheduledTime ?? '99:99';
      const ty = y.scheduledTime ?? '99:99';
      if (tx !== ty) return tx.localeCompare(ty);
      return y.priority - x.priority;
    });
  }
  noDay.sort((x, y) => y.priority - x.priority);

  return { days, byDay, noDay };
}
