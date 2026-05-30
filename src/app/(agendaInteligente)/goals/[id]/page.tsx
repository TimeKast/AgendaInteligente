/**
 * SCR-043 — Goal detail (server-loaded).
 *
 * Loads the goal by id (404 if missing / not owned), renders
 * GoalDetailClient with editable form.
 */

import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { loadGoalDetail } from '@/lib/db/queries/goals';
import { GoalDetailClient } from '@/components/agenda/GoalDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GoalDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  const { id } = await params;
  const goal = await loadGoalDetail(session.user.id, id);
  if (!goal) {
    notFound();
  }

  return (
    <GoalDetailClient
      initial={{
        id: goal.id,
        title: goal.title,
        description: goal.description,
        scope: goal.scope,
        deadline: goal.deadline,
        outcomeExpected: goal.outcomeExpected,
        notesCost: goal.notesCost,
        status: goal.status,
        reviewScore: goal.reviewScore,
        reviewNotes: goal.reviewNotes,
      }}
    />
  );
}
