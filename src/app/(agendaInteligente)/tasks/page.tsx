/**
 * /tasks — Cross-project flat list (server-loaded).
 *
 * Loads every non-deleted activity for the user + a project label map,
 * then renders the interactive client shell (filters / sort / search
 * stay client-side; mutations route through createActivity /
 * transitionActivity).
 *
 * Linked: ISSUE-025 (Today wiring follow-up).
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { listActivities } from '@/lib/actions/activity';
import { loadTodayUserProfile, loadProjectLabelMap } from '@/lib/db/queries/today';
import { listProjects } from '@/lib/db/queries/catalog';
import { todayInTimezone } from '@/lib/domain/day-calc';
import { TasksClient } from '@/components/agenda/TasksClient';
import type { Task } from '@/components/agenda/TasksClient';
import type { ActivityStatus } from '@/components/agenda/ActivityRow';

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/tasks');
  }
  const userId = session.user.id;

  const profile = (await loadTodayUserProfile(userId)) ?? {
    timezone: 'UTC',
    name: null,
    email: null,
  };
  const todayDate = todayInTimezone(new Date(), profile.timezone);

  const [listResult, projectLabelById, projectRows] = await Promise.all([
    listActivities({ date: todayDate, includeDone: true }),
    loadProjectLabelMap(userId),
    listProjects(userId),
  ]);

  const projects = projectRows.map((p) => ({
    id: p.id,
    name: p.name,
    isInbox: p.isInbox,
  }));

  const initialTasks: Task[] = [];
  if (!listResult.error && listResult.data) {
    for (const a of listResult.data.rows) {
      const dates = a.scheduledDates ?? [];
      // Earliest scheduled date is the most relevant for the list view.
      const scheduledDate = dates.length > 0 ? dates[0] : undefined;
      initialTasks.push({
        id: a.id,
        title: a.title,
        projectLabel: projectLabelById.get(a.projectId) ?? '',
        status: a.status as ActivityStatus,
        priority: a.priority,
        scheduledTime: a.scheduledTime ? a.scheduledTime.slice(0, 5) : undefined,
        scheduledDate,
        deadline: a.deadline ? a.deadline.toISOString().slice(0, 10) : undefined,
        progressPercent: a.progressPercent ?? undefined,
        recurrenceRule: a.recurrenceRule ?? null,
      });
    }
  }

  return <TasksClient initialTasks={initialTasks} todayDate={todayDate} projects={projects} />;
}
