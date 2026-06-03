/**
 * /month — MonthSheet (server-loaded).
 *
 * Loads the current month sheet (auto-creates via getOrCreateMonthSheet)
 * + renders MonthSheetClient with goals/themes/close-summary form.
 *
 * Linked: ISSUE-131, BR-7, BR-19.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { loadTodayUserProfile } from '@/lib/db/queries/today';
import { getOrCreateMonthSheet } from '@/lib/db/queries/sheets';
import { monthStartingFor } from '@/lib/domain/month-calc';
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

export default async function MonthPage() {
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
  const monthStarting = monthStartingFor(new Date(), profile.timezone);
  const sheet = await getOrCreateMonthSheet(userId, monthStarting);

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
      />
    </>
  );
}
