/**
 * Activity detail loader.
 *
 * Returns the activity row + its project name in one round-trip. Both
 * lookups are explicit-userId scoped on the WHERE clause (BR-1
 * allowlist applies to src/lib/db/queries).
 */

import { eq, and, isNull, inArray, asc } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { activities, type Activity } from '@/lib/db/schema/activities';
import { projects } from '@/lib/db/schema/projects';
import { goals } from '@/lib/db/schema/goals';
import { goalLinks } from '@/lib/db/schema/goal-links';

export interface ActivityDetail extends Activity {
  projectName: string;
}

export interface ActivityGoalRow {
  id: string;
  title: string;
  scope: string;
  deadline: string | null;
  /** True when this goal is already linked to the activity. */
  linked: boolean;
}

export async function loadActivityDetail(
  userId: string,
  activityId: string
): Promise<ActivityDetail | null> {
  const rows = await db
    .select({
      activity: activities,
      projectName: projects.name,
    })
    .from(activities)
    .leftJoin(projects, eq(projects.id, activities.projectId))
    .where(
      and(
        eq(activities.id, activityId),
        eq(activities.userId, userId),
        isNull(activities.deletedAt)
      )
    );
  if (rows.length === 0) return null;
  return {
    ...rows[0].activity,
    projectName: rows[0].projectName ?? '',
  };
}

/**
 * Load every active goal owned by `userId` plus a flag indicating whether
 * each is currently linked to `activityId`. Drives the goal picker on the
 * activity detail screen.
 */
export async function loadActivityGoals(
  userId: string,
  activityId: string
): Promise<ActivityGoalRow[]> {
  const rows = await db
    .select({
      id: goals.id,
      title: goals.title,
      scope: goals.scope,
      deadline: goals.deadline,
      status: goals.status,
    })
    .from(goals)
    .where(and(eq(goals.userId, userId), isNull(goals.deletedAt)))
    .orderBy(asc(goals.scope), asc(goals.deadline));

  if (rows.length === 0) return [];

  const links = await db
    .select({ goalId: goalLinks.goalId })
    .from(goalLinks)
    .where(
      and(
        eq(goalLinks.targetType, 'activity'),
        eq(goalLinks.targetId, activityId),
        inArray(
          goalLinks.goalId,
          rows.map((r) => r.id)
        )
      )
    );
  const linkedSet = new Set(links.map((l) => l.goalId));

  return rows
    .filter((r) => r.status === 'active' || linkedSet.has(r.id))
    .map((r) => ({
      id: r.id,
      title: r.title,
      scope: r.scope,
      deadline: r.deadline,
      linked: linkedSet.has(r.id),
    }));
}
