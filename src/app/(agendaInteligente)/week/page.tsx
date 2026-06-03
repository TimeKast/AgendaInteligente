/**
 * /week — WeekSheet + per-day task planner.
 *
 * Loads:
 *   - The WeekSheet for the target Sunday (auto-created on first visit).
 *   - All non-deleted activities, bucketed Sun..Sat for that week.
 *   - Project + category catalogs for the per-day quick-add picker.
 *
 * Navigation: `?week=YYYY-MM-DD` (must be a Sunday). Missing/invalid →
 * fall back to the current week.
 *
 * Linked: ISSUE-033, BR-7.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { loadTodayUserProfile } from '@/lib/db/queries/today';
import { getOrCreateWeekSheet } from '@/lib/db/queries/sheets';
import { listProjects, listCategories } from '@/lib/db/queries/catalog';
import { loadWeekActivities } from '@/lib/db/queries/week-activities';
import { weekStartingFor, shiftWeekStarting, isValidSundayString } from '@/lib/domain/week-calc';
import { todayInTimezone } from '@/lib/domain/day-calc';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { WeekMonthTabs } from '@/components/agenda/WeekMonthTabs';
import { WeekSheetClient } from '@/components/agenda/WeekSheetClient';

const SPANISH_MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

function weekLabelEs(weekStartingISO: string, showYear: boolean): string {
  const [y, m, d] = weekStartingISO.split('-').map(Number);
  const base = `Sem del ${d} de ${SPANISH_MONTHS[m - 1]}`;
  return showYear ? `${base} ${y}` : base;
}

interface WeekPageProps {
  searchParams: Promise<{ week?: string }>;
}

export default async function WeekPage({ searchParams }: WeekPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/week');
  }
  const userId = session.user.id;
  const profile = (await loadTodayUserProfile(userId)) ?? {
    timezone: 'UTC',
    name: null,
    email: null,
  };

  const now = new Date();
  const todayYmd = todayInTimezone(now, profile.timezone);
  const currentWeekStarting = weekStartingFor(now, profile.timezone);

  const { week: weekParam } = await searchParams;
  const weekStarting =
    weekParam && isValidSundayString(weekParam) ? weekParam : currentWeekStarting;

  const [sheet, weekActivities, projectRows, categoryRows] = await Promise.all([
    getOrCreateWeekSheet(userId, weekStarting),
    loadWeekActivities(userId, weekStarting),
    listProjects(userId),
    listCategories(userId),
  ]);

  const projects = projectRows.map((p) => ({
    id: p.id,
    name: p.name,
    isInbox: p.isInbox,
    categoryId: p.categoryId,
    categoryName: p.categoryName,
  }));
  const categories = categoryRows.map((c) => ({
    id: c.id,
    name: c.name,
    isInbox: c.isInbox,
  }));

  const prevWeek = shiftWeekStarting(weekStarting, -1);
  const nextWeek = shiftWeekStarting(weekStarting, 1);
  const isCurrentWeek = weekStarting === currentWeekStarting;
  const isPastWeek = weekStarting < currentWeekStarting;
  const currentYear = Number(currentWeekStarting.slice(0, 4));
  const targetYear = Number(weekStarting.slice(0, 4));
  const showYear = targetYear !== currentYear;

  return (
    <>
      <AgendaHeader dateLabel="Semana" />
      <WeekMonthTabs active="week" />
      <WeekSheetClient
        initial={{
          weekStarting,
          weekLabel: weekLabelEs(weekStarting, showYear),
          oneThing: sheet.oneThing ?? '',
          threeWins: sheet.threeWins ?? [],
          learnOne: sheet.learnOne ?? '',
          avoidOne: sheet.avoidOne ?? '',
          reviewOneSentence: sheet.reviewOneSentence ?? '',
          reviewEnergy: sheet.reviewEnergy,
          kickoffCompleted: !!sheet.kickoffCompletedAt,
          reviewed: !!sheet.reviewedAt,
        }}
        nav={{
          prevHref: `/week?week=${prevWeek}`,
          nextHref: `/week?week=${nextWeek}`,
          isCurrentWeek,
          isPastWeek,
          todayYmd,
        }}
        weekActivities={weekActivities}
        todayYmd={todayYmd}
        projects={projects}
        categories={categories}
      />
    </>
  );
}
