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
  /**
   * Recurrence rule resolved at the SERIES level. If this row is a
   * materialized child instance, the value comes from its parent
   * template (instances themselves carry `recurrence_rule = null`).
   * For pure rows + parent templates it equals `this.recurrenceRule`.
   */
  effectiveRecurrenceRule: string | null;
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
  const row = rows[0].activity;

  // Resolve the series-level recurrence rule: instances carry NULL on
  // their own row, but the user's mental model treats them as "this
  // recurring task", so we pull the rule off the parent template.
  let effectiveRecurrenceRule = row.recurrenceRule;
  if (effectiveRecurrenceRule === null && row.recurrenceParentId !== null) {
    const parent = await db
      .select({ recurrenceRule: activities.recurrenceRule })
      .from(activities)
      .where(and(eq(activities.id, row.recurrenceParentId), eq(activities.userId, userId)));
    effectiveRecurrenceRule = parent[0]?.recurrenceRule ?? null;
  }

  return {
    ...row,
    projectName: rows[0].projectName ?? '',
    effectiveRecurrenceRule,
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
