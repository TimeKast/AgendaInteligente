/**
 * SCR-stats — Tu progreso (server-loaded).
 *
 * MVP dashboard: this-week %, streak (días con evening_completed_at),
 * trend de últimas 4 semanas (done/total + energía + wins), top
 * razones para saltar (30d), breakdown por proyecto del mes.
 *
 * Pure server component — no client interactivity for v1.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { loadStats } from '@/lib/db/queries/stats';
import { loadTodayUserProfile } from '@/lib/db/queries/today';
import { todayInTimezone } from '@/lib/domain/day-calc';
import { weekStartingFor } from '@/lib/domain/week-calc';
import { monthStartingFor } from '@/lib/domain/month-calc';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { StatsView } from '@/components/agenda/StatsView';

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

export default async function StatsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/stats');
  }
  const userId = session.user.id;
  const profile = (await loadTodayUserProfile(userId)) ?? {
    timezone: 'UTC',
    name: null,
    email: null,
  };
  const now = new Date();
  const todayDate = todayInTimezone(now, profile.timezone);
  const thisWeekStarting = weekStartingFor(now, profile.timezone);
  const thisMonthStarting = monthStartingFor(now, profile.timezone);

  const data = await loadStats(userId, todayDate, thisWeekStarting, thisMonthStarting);

  return (
    <>
      <AgendaHeader dateLabel="Tu progreso" backHref="/settings" />
      <StatsView data={data} monthLabel={monthLabelEs(thisMonthStarting)} />
    </>
  );
}
