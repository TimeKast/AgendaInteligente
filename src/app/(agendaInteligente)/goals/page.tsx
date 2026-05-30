/**
 * SCR-022 — Goals (server-loaded).
 *
 * Lists all non-deleted goals grouped by scope (trimestre/año/5año/vida)
 * with inline create. Detail / status / review / link-to-project live
 * in /goals/[id].
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { listGoals } from '@/lib/db/queries/goals';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { GoalsClient } from '@/components/agenda/GoalsClient';

export default async function GoalsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/goals');
  }
  const rows = await listGoals(session.user.id);
  return (
    <>
      <AgendaHeader dateLabel="Metas" />
      <GoalsClient initial={rows} />
    </>
  );
}
