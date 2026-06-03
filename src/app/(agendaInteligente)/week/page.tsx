/**
 * /week — WeekSheet + per-day task planner.
 *
 * Loads:
 *   - The current week's WeekSheet (auto-created on first visit).
 *   - All non-deleted activities, bucketed Sun..Sat for the visible week.
 *   - Project + category catalogs for the per-day quick-add picker.
 *
 * Linked: ISSUE-033, BR-7.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { loadTodayUserProfile } from '@/lib/db/queries/today';
import { getOrCreateWeekSheet } from '@/lib/db/queries/sheets';
import { listProjects, listCategories } from '@/lib/db/queries/catalog';
import { loadWeekActivities } from '@/lib/db/queries/week-activities';
import { weekStartingFor } from '@/lib/domain/week-calc';
import { todayInTimezone } from '@/lib/domain/day-calc';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
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

function weekLabelEs(weekStartingISO: string): string {
  const [, m, d] = weekStartingISO.split('-').map(Number);
  return `Sem del ${d} de ${SPANISH_MONTHS[m - 1]}`;
}

export default async function WeekPage() {
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
  const weekStarting = weekStartingFor(now, profile.timezone);

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

  return (
    <>
      <AgendaHeader dateLabel="Semana" />
      <WeekSheetClient
        initial={{
          weekStarting,
          weekLabel: weekLabelEs(weekStarting),
          oneThing: sheet.oneThing ?? '',
          threeWins: sheet.threeWins ?? [],
          learnOne: sheet.learnOne ?? '',
          avoidOne: sheet.avoidOne ?? '',
          reviewOneSentence: sheet.reviewOneSentence ?? '',
          reviewEnergy: sheet.reviewEnergy,
          kickoffCompleted: !!sheet.kickoffCompletedAt,
          reviewed: !!sheet.reviewedAt,
        }}
        weekActivities={weekActivities}
        todayYmd={todayYmd}
        projects={projects}
        categories={categories}
      />
    </>
  );
}
