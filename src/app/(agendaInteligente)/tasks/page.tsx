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
import { listProjects, listCategories } from '@/lib/db/queries/catalog';
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

  const [listResult, projectLabelById, projectRows, categoryRows] = await Promise.all([
    listActivities({ date: todayDate, includeDone: true }),
    loadProjectLabelMap(userId),
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

  // Map DB activity status → UI ActivityStatus. The DB enum uses
  // 'pending' for the "no work done yet" state, but the row UI/filter
  // family talks in 'todo' (per ActivityRow + TasksClient OPEN_STATUSES).
  // Without this remap every new task lands in the cast as 'pending',
  // never matches the "Por hacer" chip, and the user sees zero rows
  // outside the "Todas" filter.
  function toUiStatus(s: string): ActivityStatus {
    if (
      s === 'in_progress' ||
      s === 'done' ||
      s === 'skipped' ||
      s === 'blocked' ||
      s === 'cancelled'
    ) {
      return s;
    }
    return 'todo';
  }

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
        status: toUiStatus(a.status),
        priority: a.priority,
        scheduledTime: a.scheduledTime ? a.scheduledTime.slice(0, 5) : undefined,
        scheduledDate,
        deadline: a.deadline ? a.deadline.toISOString().slice(0, 10) : undefined,
        progressPercent: a.progressPercent ?? undefined,
        recurrenceRule: a.recurrenceRule ?? null,
        description: a.description ?? null,
      });
    }
  }

  return (
    <TasksClient
      initialTasks={initialTasks}
      todayDate={todayDate}
      projects={projects}
      categories={categories}
    />
  );
}
