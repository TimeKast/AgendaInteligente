/**
 * SCR-020 — Today (server component, wired Phase 1).
 *
 * Loads:
 *   - Session → user id + display name + email for the avatar initial.
 *   - User row → timezone (drives the local date + Spanish label).
 *   - `listActivities(today)` → real activity list. Today's union
 *      (scheduled + unscheduled-but-on-today) feeds the close-day modal.
 *
 * Hands everything to <TodayClient/> which keeps the interactive shell.
 *
 * Drag-and-drop / pool / quick-add mutations stay visual in this slice
 * (Phase 2 wires them to updateActivity / transitionActivity).
 *
 * Linked: ISSUE-025 (Today UI), ISSUE-031 (close day), BR-7.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { listActivities } from '@/lib/actions/activity';
import { loadTodayUserProfile, loadProjectLabelMap } from '@/lib/db/queries/today';
import { todayInTimezone, todayLabelEs, userInitial } from '@/lib/domain/day-calc';
import { TodayClient } from '@/components/agenda/TodayClient';
import type { CloseDayActivityInput } from '@/components/agenda/CloseDayModal';

export default async function TodayPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/today');
  }

  const userId = session.user.id;

  // First-login race: middleware lets the route through but the user
  // row is still being seeded. Fall back to UTC + empty list rather
  // than crash; subsequent loads will land the real data.
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
    listActivities({ date: todayDate }),
    loadProjectLabelMap(userId),
  ]);

  let todayActivities: CloseDayActivityInput[] = [];
  if (!listResult.error && listResult.data) {
    // Close-day cares about what the user actually had on the agenda
    // today: scheduled OR pool-but-marked-for-today. Future scopes are
    // out (the user isn't closing those today).
    const todays = [...listResult.data.scheduled, ...listResult.data.pool.todayUnscheduled];
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
    />
  );
}
