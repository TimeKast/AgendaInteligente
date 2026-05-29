/**
 * SCR-020 — Today (server-loaded).
 *
 * Loads:
 *   - Session → user id + display name + email for the avatar initial.
 *   - User row → timezone (drives the local date + Spanish label).
 *   - `listActivities(today)` → real activity list, split into
 *      scheduled (calendar grid) + pool (sidebar) shapes the board
 *      expects.
 *   - `loadProjectLabelMap` → project name per id, used as caption.
 *
 * Hands everything to <TodayClient/> which keeps the interactive shell.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { listActivities } from '@/lib/actions/activity';
import { loadTodayUserProfile, loadProjectLabelMap } from '@/lib/db/queries/today';
import { todayInTimezone, todayLabelEs, userInitial } from '@/lib/domain/day-calc';
import { TodayClient } from '@/components/agenda/TodayClient';
import type { CloseDayActivityInput } from '@/components/agenda/CloseDayModal';

type Quadrant = 1 | 2 | 3 | 4;
type UiStatus = 'todo' | 'in_progress' | 'done' | 'skipped' | 'blocked';

interface ScheduledInput {
  id: string;
  title: string;
  status: UiStatus;
  scheduledTime: string;
  priority: number;
  projectLabel: string;
  durationMinutes: number;
  deadline?: string;
  progressPercent?: number;
  quadrant: Quadrant;
}
interface PoolInput {
  id: string;
  title: string;
  status: UiStatus;
  scope: 'today' | 'week' | 'backlog';
  quadrant: Quadrant;
  priority: number;
  projectLabel: string;
  deadline?: string;
  progressPercent?: number;
}

/** Map a 5-state DB status → the board's 5-state UI status. Same labels for now. */
function uiStatus(s: string): UiStatus {
  if (s === 'in_progress') return 'in_progress';
  if (s === 'done' || s === 'skipped' || s === 'blocked') return s;
  return 'todo';
}

/** Activity → ScheduledInput for an activity at a specific hour today. */
function toScheduled(
  a: {
    id: string;
    title: string;
    status: string;
    scheduledTime: string | null;
    durationMinutes: number | null;
    priority: number;
    quadrant: number | null;
    deadline: Date | null;
    progressPercent: number | null;
    projectId: string;
  },
  projectLabel: string
): ScheduledInput {
  return {
    id: a.id,
    title: a.title,
    status: uiStatus(a.status),
    scheduledTime: (a.scheduledTime ?? '08:00').slice(0, 5),
    priority: a.priority,
    projectLabel,
    durationMinutes: a.durationMinutes ?? 60,
    deadline: a.deadline ? a.deadline.toISOString().slice(0, 10) : undefined,
    progressPercent: a.progressPercent ?? undefined,
    quadrant: (a.quadrant as Quadrant) ?? 2,
  };
}

function toPool(
  a: {
    id: string;
    title: string;
    status: string;
    priority: number;
    quadrant: number | null;
    deadline: Date | null;
    progressPercent: number | null;
    projectId: string;
  },
  projectLabel: string,
  scope: 'today' | 'week' | 'backlog'
): PoolInput {
  return {
    id: a.id,
    title: a.title,
    status: uiStatus(a.status),
    scope,
    quadrant: (a.quadrant as Quadrant) ?? 2,
    priority: a.priority,
    projectLabel,
    deadline: a.deadline ? a.deadline.toISOString().slice(0, 10) : undefined,
    progressPercent: a.progressPercent ?? undefined,
  };
}

export default async function TodayPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/today');
  }

  const userId = session.user.id;

  // First-login race fallback (TZ default UTC + empty data).
  const profile = (await loadTodayUserProfile(userId)) ?? {
    timezone: 'UTC',
    name: null,
    email: null,
  };

  const now = new Date();
  const todayDate = todayInTimezone(now, profile.timezone);
  const dateLabel = todayLabelEs(now, profile.timezone);
  const initials = userInitial(profile.name ?? profile.email);

  const [listResult, projectLabelById] = await Promise.all([
    listActivities({ date: todayDate, includeDone: false }),
    loadProjectLabelMap(userId),
  ]);

  let todayActivities: CloseDayActivityInput[] = [];
  let initialScheduled: ScheduledInput[] = [];
  let initialPool: PoolInput[] = [];

  if (!listResult.error && listResult.data) {
    const { scheduled, pool } = listResult.data;
    initialScheduled = scheduled.map((a) =>
      toScheduled(a, projectLabelById.get(a.projectId) ?? '')
    );
    initialPool = [
      ...pool.todayUnscheduled.map((a) =>
        toPool(a, projectLabelById.get(a.projectId) ?? '', 'today')
      ),
      ...pool.thisWeek.map((a) => toPool(a, projectLabelById.get(a.projectId) ?? '', 'week')),
      ...pool.backlog.map((a) => toPool(a, projectLabelById.get(a.projectId) ?? '', 'backlog')),
    ];
    // Close-day list = scheduled + today-unscheduled (what the user
    // actually had on the agenda today).
    const todays = [...scheduled, ...pool.todayUnscheduled];
    todayActivities = todays.map((a) => ({
      id: a.id,
      title: a.title,
      projectLabel: projectLabelById.get(a.projectId) ?? '',
      progressPercent: a.progressPercent ?? 0,
    }));
  }

  return (
    <TodayClient
      todayDate={todayDate}
      dateLabel={dateLabel}
      initials={initials}
      todayActivities={todayActivities}
      initialScheduled={initialScheduled}
      initialPool={initialPool}
    />
  );
}
