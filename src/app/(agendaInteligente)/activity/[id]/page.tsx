/**
 * SCR-040 — Activity detail (server-loaded).
 *
 * Loads the activity by id (404s if not found / not owned), maps the
 * DB shape to the client's editable props, renders ActivityDetailClient.
 */

import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { loadActivityDetail, loadActivityGoals } from '@/lib/db/queries/activity-detail';
import { ActivityDetailClient } from '@/components/agenda/ActivityDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ActivityDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  const { id } = await params;
  const [activity, goals] = await Promise.all([
    loadActivityDetail(session.user.id, id),
    loadActivityGoals(session.user.id, id),
  ]);
  if (!activity) {
    notFound();
  }

  return (
    <ActivityDetailClient
      initial={{
        id: activity.id,
        title: activity.title,
        description: activity.description,
        projectName: activity.projectName,
        status: activity.status,
        priority: activity.priority,
        scheduledDates: activity.scheduledDates ?? [],
        scheduledTime: activity.scheduledTime,
        durationMinutes: activity.durationMinutes,
        deadline: activity.deadline ? activity.deadline.toISOString().slice(0, 10) : null,
        progressPercent: activity.progressPercent,
        recurrenceRule: activity.recurrenceRule,
      }}
      goals={goals}
    />
  );
}
