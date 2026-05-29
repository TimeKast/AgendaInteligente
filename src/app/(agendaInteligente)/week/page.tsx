/**
 * /week — WeekSheet (server-loaded, basic text fields).
 *
 * Loads the current week's sheet (auto-creates on first visit via
 * getOrCreateWeekSheet) + renders WeekSheetClient.
 *
 * Scope: kickoff text fields + review one-sentence/energy. JSONB
 * editors (calendar blocks, people, self-care) defer to a follow-up.
 *
 * Linked: ISSUE-033, BR-7.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { loadTodayUserProfile } from '@/lib/db/queries/today';
import { getOrCreateWeekSheet } from '@/lib/db/queries/sheets';
import { weekStartingFor } from '@/lib/domain/week-calc';
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
  const weekStarting = weekStartingFor(new Date(), profile.timezone);
  const sheet = await getOrCreateWeekSheet(userId, weekStarting);

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
      />
    </>
  );
}
