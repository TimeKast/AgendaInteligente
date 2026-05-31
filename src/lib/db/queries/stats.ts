/**
 * Stats loader for /stats.
 *
 * MVP scope:
 *   - This week's completion rate (activities done / total active).
 *   - Last 4 weeks: completion rate + energy + wins-done per week.
 *   - Top reasons skipped in last 30 days.
 *   - Project breakdown for this month (activities + completed %).
 *   - Day-sheet streak (consecutive recent days with evening_completed_at).
 *
 * Lives in /lib/db/queries (BR-1 allowlist). All queries explicit
 * userId-scoped on the WHERE clause.
 */

import { and, eq, gte, lte, isNull, sql, desc, isNotNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { activities } from '@/lib/db/schema/activities';
import { projects } from '@/lib/db/schema/projects';
import { weekSheets } from '@/lib/db/schema/week-sheets';
import { daySheets } from '@/lib/db/schema/day-sheets';

export interface WeekTrendPoint {
  weekStarting: string; // YYYY-MM-DD
  doneCount: number;
  totalCount: number;
  energy: number | null;
  winsDone: number;
  winsPlanned: number;
}

export interface ProjectBreakdownRow {
  projectId: string;
  projectName: string;
  total: number;
  done: number;
}

export interface ReasonRow {
  reasonCategory: string;
  count: number;
}

export interface StatsData {
  thisWeek: { done: number; total: number };
  weekTrend: WeekTrendPoint[]; // chronological asc, last 4 weeks
  topReasons: ReasonRow[]; // top 5 categories, last 30 days
  projectBreakdown: ProjectBreakdownRow[]; // this month
  streakDays: number; // consecutive recent days with evening_completed_at
}

function addDaysISO(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Compute streak: consecutive most-recent days with evening_completed_at,
 *  starting from `today` and walking backwards.
 */
function computeStreak(sheets: Array<{ date: string }>, today: string): number {
  const set = new Set(sheets.map((s) => s.date));
  let streak = 0;
  let cursor = today;
  // Allow up to 365 days back to avoid runaway loops on corrupt data.
  for (let i = 0; i < 365; i++) {
    if (!set.has(cursor)) break;
    streak++;
    cursor = addDaysISO(cursor, -1);
  }
  return streak;
}

export async function loadStats(
  userId: string,
  todayDate: string,
  thisWeekStarting: string,
  thisMonthStarting: string
): Promise<StatsData> {
  const thirtyDaysAgo = addDaysISO(todayDate, -30);
  const fourWeeksAgo = addDaysISO(thisWeekStarting, -21); // 3 full weeks back + current
  const monthEnd = addDaysISO(thisMonthStarting, 31); // safe upper bound

  // 1. This week's activities (scheduled on any day in this week range).
  // We use `scheduled_dates && range` via array overlap with the 7 dates.
  // For simplicity, fetch activities scheduled this week (any day) and
  // aggregate in app.
  const thisWeekActs = await db
    .select({
      id: activities.id,
      status: activities.status,
      scheduledDates: activities.scheduledDates,
    })
    .from(activities)
    .where(
      and(
        eq(activities.userId, userId),
        isNull(activities.deletedAt),
        sql`${activities.scheduledDates} && ARRAY[${sql.raw(
          Array.from({ length: 7 }, (_, i) => `'${addDaysISO(thisWeekStarting, i)}'::date`).join(
            ', '
          )
        )}]::date[]`
      )
    );
  const thisWeekDone = thisWeekActs.filter((a) => a.status === 'done').length;
  const thisWeekTotal = thisWeekActs.length;

  // 2. Last 4 weeks trend — pull weekSheets in the range + activity counts
  // per week. The activities-per-week query is grouped by week_starting
  // synthesized from scheduled_dates; we approximate by counting activities
  // whose first scheduled_dates falls in the range and then bucketing in app.
  const weekSheetRows = await db
    .select({
      weekStarting: weekSheets.weekStarting,
      threeWins: weekSheets.threeWins,
      reviewWins: weekSheets.reviewWins,
      reviewEnergy: weekSheets.reviewEnergy,
    })
    .from(weekSheets)
    .where(
      and(
        eq(weekSheets.userId, userId),
        gte(weekSheets.weekStarting, fourWeeksAgo),
        lte(weekSheets.weekStarting, thisWeekStarting)
      )
    );

  // For activity counts per week we fetch all activities in the 4-week
  // window and bucket in JS — keeps the SQL simple.
  const trendActs = await db
    .select({
      status: activities.status,
      scheduledDates: activities.scheduledDates,
    })
    .from(activities)
    .where(and(eq(activities.userId, userId), isNull(activities.deletedAt)));
  const weekBuckets = new Map<string, { done: number; total: number }>();
  for (let w = 0; w < 4; w++) {
    const ws = addDaysISO(thisWeekStarting, -7 * (3 - w));
    weekBuckets.set(ws, { done: 0, total: 0 });
  }
  for (const a of trendActs) {
    const dates = a.scheduledDates ?? [];
    for (const d of dates) {
      // Find which week bucket this date falls in.
      for (const [ws, bucket] of weekBuckets.entries()) {
        const we = addDaysISO(ws, 6);
        if (d >= ws && d <= we) {
          bucket.total++;
          if (a.status === 'done') bucket.done++;
          break;
        }
      }
    }
  }

  const weekTrend: WeekTrendPoint[] = Array.from(weekBuckets.entries()).map(([ws, b]) => {
    const sheet = weekSheetRows.find((s) => s.weekStarting === ws);
    return {
      weekStarting: ws,
      doneCount: b.done,
      totalCount: b.total,
      energy: sheet?.reviewEnergy ?? null,
      winsDone: sheet?.reviewWins?.length ?? 0,
      winsPlanned: sheet?.threeWins?.length ?? 0,
    };
  });

  // 3. Top reasons in last 30 days.
  const reasonRows = await db
    .select({
      reasonCategory: activities.reasonCategory,
      count: sql<number>`count(*)::int`,
    })
    .from(activities)
    .where(
      and(
        eq(activities.userId, userId),
        isNull(activities.deletedAt),
        isNotNull(activities.reasonCategory),
        gte(activities.updatedAt, new Date(`${thirtyDaysAgo}T00:00:00.000Z`))
      )
    )
    .groupBy(activities.reasonCategory)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

  // 4. Project breakdown — this month.
  const projectRows = await db
    .select({
      projectId: activities.projectId,
      projectName: projects.name,
      status: activities.status,
      scheduledDates: activities.scheduledDates,
    })
    .from(activities)
    .leftJoin(projects, eq(projects.id, activities.projectId))
    .where(and(eq(activities.userId, userId), isNull(activities.deletedAt)));
  const projectMap = new Map<string, ProjectBreakdownRow>();
  for (const r of projectRows) {
    const dates = r.scheduledDates ?? [];
    if (!dates.some((d) => d >= thisMonthStarting && d < monthEnd)) continue;
    const existing = projectMap.get(r.projectId) ?? {
      projectId: r.projectId,
      projectName: r.projectName ?? '—',
      total: 0,
      done: 0,
    };
    existing.total++;
    if (r.status === 'done') existing.done++;
    projectMap.set(r.projectId, existing);
  }
  const projectBreakdown = Array.from(projectMap.values()).sort((a, b) => b.total - a.total);

  // 5. Streak — consecutive recent days with evening_completed_at.
  const sheetRows = await db
    .select({
      date: daySheets.date,
    })
    .from(daySheets)
    .where(
      and(
        eq(daySheets.userId, userId),
        isNotNull(daySheets.eveningCompletedAt),
        gte(daySheets.date, addDaysISO(todayDate, -120))
      )
    );
  const streakDays = computeStreak(sheetRows, todayDate);

  return {
    thisWeek: { done: thisWeekDone, total: thisWeekTotal },
    weekTrend,
    topReasons: reasonRows.map((r) => ({
      reasonCategory: r.reasonCategory ?? 'sin categoría',
      count: r.count,
    })),
    projectBreakdown,
    streakDays,
  };
}
