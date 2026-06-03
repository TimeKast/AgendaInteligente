/**
 * /month — MonthSheet (server-loaded).
 *
 * Loads the month sheet (auto-creates via getOrCreateMonthSheet) + renders
 * MonthSheetClient with goals/themes/close-summary form.
 *
 * Navigation: `?month=YYYY-MM-01`. Missing/invalid → current month.
 *
 * Linked: ISSUE-131, BR-7, BR-19.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { loadTodayUserProfile } from '@/lib/db/queries/today';
import { getOrCreateMonthSheet } from '@/lib/db/queries/sheets';
import { loadMonthActivities } from '@/lib/db/queries/month-activities';
import {
  monthStartingFor,
  shiftMonthStarting,
  isValidMonthStartingString,
} from '@/lib/domain/month-calc';
import { todayInTimezone } from '@/lib/domain/day-calc';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { WeekMonthTabs } from '@/components/agenda/WeekMonthTabs';
import { MonthSheetClient } from '@/components/agenda/MonthSheetClient';

const SPANISH_MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

function monthLabelEs(monthStartingISO: string): string {
  const [y, m] = monthStartingISO.split('-').map(Number);
  return `${SPANISH_MONTHS[m - 1]} ${y}`;
}

interface MonthPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function MonthPage({ searchParams }: MonthPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/month');
  }
  const userId = session.user.id;
  const profile = (await loadTodayUserProfile(userId)) ?? {
    timezone: 'UTC',
    name: null,
    email: null,
  };
  const now = new Date();
  const todayYmd = todayInTimezone(now, profile.timezone);
  const currentMonthStarting = monthStartingFor(now, profile.timezone);

  const { month: monthParam } = await searchParams;
  const monthStarting =
    monthParam && isValidMonthStartingString(monthParam) ? monthParam : currentMonthStarting;

  const [sheet, monthData] = await Promise.all([
    getOrCreateMonthSheet(userId, monthStarting),
    loadMonthActivities(userId, monthStarting),
  ]);

  const prevMonth = shiftMonthStarting(monthStarting, -1);
  const nextMonth = shiftMonthStarting(monthStarting, 1);
  const isCurrentMonth = monthStarting === currentMonthStarting;
  const isPastMonth = monthStarting < currentMonthStarting;

  return (
    <>
      <AgendaHeader dateLabel="Mes" />
      <WeekMonthTabs active="month" />
      <MonthSheetClient
        initial={{
          monthStarting,
          monthLabel: monthLabelEs(monthStarting),
          goals: sheet.goals ?? '',
          themes: sheet.themes ?? [],
          closeSummary: sheet.closeSummary ?? '',
          closed: !!sheet.closedAt,
        }}
        nav={{
          prevHref: `/month?month=${prevMonth}`,
          nextHref: `/month?month=${nextMonth}`,
          isCurrentMonth,
          isPastMonth,
          todayYmd,
        }}
        monthActivities={monthData}
        todayYmd={todayYmd}
      />
    </>
  );
}
