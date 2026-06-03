/**
 * Dashboard data loader — /resumen.
 *
 * Three slices in one round-trip per slice:
 *   1. Activities with deadline in the next 7 days (not done).
 *   2. Active goals sorted by deadline (nearest first), top N.
 *   3. Last 4 week sheets with done/open activity counts per week.
 *
 * Multi-tenant: each query filters by userId. Lives under
 * `src/lib/db/queries` (BR-1 allowlist).
 */

import { and, asc, count, eq, gte, isNull, isNotNull, lt, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { activities } from '@/lib/db/schema/activities';
import { projects } from '@/lib/db/schema/projects';
import { goals } from '@/lib/db/schema/goals';
import { weekSheets } from '@/lib/db/schema/week-sheets';

export interface DashboardDueSoonRow {
  id: string;
  title: string;
  deadline: string;
  priority: number;
  projectName: string;
}

export interface DashboardGoalRow {
  id: string;
  title: string;
  scope: string;
  deadline: string | null;
}

export interface DashboardWeekStat {
  weekStarting: string; // YYYY-MM-DD
  reviewed: boolean;
  doneCount: number;
  openCount: number;
}

export interface DashboardData {
  dueSoon: DashboardDueSoonRow[];
  upcomingGoals: DashboardGoalRow[];
  recentWeeks: DashboardWeekStat[];
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + n);
  return next;
}

export async function loadDashboard(userId: string, todayYmd: string): Promise<DashboardData> {
  const todayDate = new Date(`${todayYmd}T00:00:00.000Z`);
  const in7days = addDays(todayDate, 7);

  // ── 1. Tareas que vencen pronto ────────────────────────────────
  const dueSoonRows = await db
    .select({
      id: activities.id,
      title: activities.title,
      deadline: activities.deadline,
      priority: activities.priority,
      projectName: projects.name,
      status: activities.status,
    })
    .from(activities)
    .leftJoin(projects, eq(projects.id, activities.projectId))
    .where(
      and(
        eq(activities.userId, userId),
        isNull(activities.deletedAt),
        isNotNull(activities.deadline),
        gte(activities.deadline, todayDate),
        lt(activities.deadline, in7days)
      )
    )
    .orderBy(asc(activities.deadline));

  const dueSoon: DashboardDueSoonRow[] = dueSoonRows
    .filter((r) => r.status !== 'done' && r.deadline)
    .slice(0, 10)
    .map((r) => ({
      id: r.id,
      title: r.title,
      deadline: r.deadline!.toISOString().slice(0, 10),
      priority: r.priority,
      projectName: r.projectName ?? '',
    }));

  // ── 2. Metas más cercanas ──────────────────────────────────────
  const goalRows = await db
    .select({
      id: goals.id,
      title: goals.title,
      scope: goals.scope,
      deadline: goals.deadline,
    })
    .from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.status, 'active'), isNull(goals.deletedAt)))
    .orderBy(sql`${goals.deadline} ASC NULLS LAST`)
    .limit(5);

  const upcomingGoals: DashboardGoalRow[] = goalRows.map((r) => ({
    id: r.id,
    title: r.title,
    scope: r.scope,
    deadline: r.deadline,
  }));

  // ── 3. Últimas 4 semanas con desempeño ────────────────────────
  const recentSheetRows = await db
    .select({
      weekStarting: weekSheets.weekStarting,
      reviewedAt: weekSheets.reviewedAt,
    })
    .from(weekSheets)
    .where(eq(weekSheets.userId, userId))
    .orderBy(sql`${weekSheets.weekStarting} DESC`)
    .limit(4);

  const recentWeeks: DashboardWeekStat[] = [];
  for (const sheet of recentSheetRows) {
    const weekStart = sheet.weekStarting;
    const weekEndDate = addDays(new Date(`${weekStart}T00:00:00.000Z`), 7);
    const weekEnd = weekEndDate.toISOString().slice(0, 10);

    // Done + open activity counts for activities scheduled inside the week.
    // Use scheduled_dates && array overlap with the 7 days.
    const days: string[] = [];
    for (let i = 0; i < 7; i++)
      days.push(
        addDays(new Date(`${weekStart}T00:00:00.000Z`), i)
          .toISOString()
          .slice(0, 10)
      );

    const [doneRes, openRes] = await Promise.all([
      db
        .select({ c: count() })
        .from(activities)
        .where(
          and(
            eq(activities.userId, userId),
            isNull(activities.deletedAt),
            eq(activities.status, 'done'),
            sql`${activities.scheduledDates} && ARRAY[${sql.join(
              days.map((d) => sql`${d}::date`),
              sql`, `
            )}]::date[]`
          )
        ),
      db
        .select({ c: count() })
        .from(activities)
        .where(
          and(
            eq(activities.userId, userId),
            isNull(activities.deletedAt),
            sql`${activities.status} IN ('pending','in_progress')`,
            sql`${activities.scheduledDates} && ARRAY[${sql.join(
              days.map((d) => sql`${d}::date`),
              sql`, `
            )}]::date[]`
          )
        ),
    ]);
    void weekEnd; // unused but kept for readability
    recentWeeks.push({
      weekStarting: weekStart,
      reviewed: !!sheet.reviewedAt,
      doneCount: doneRes[0]?.c ?? 0,
      openCount: openRes[0]?.c ?? 0,
    });
  }

  return { dueSoon, upcomingGoals, recentWeeks };
}
