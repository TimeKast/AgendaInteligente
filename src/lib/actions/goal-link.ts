'use server';

/**
 * GoalLink server actions (ISSUE-041 — Slice A backend).
 *
 * M2M polymorphic: connects Goals to Projects or Activities.
 *
 * Scoping pattern (mirror Subtask via Activity): `goal_links` has no
 * `user_id` column. Ownership is derived from the parent goal — every
 * action validates `goal_id` belongs to the caller via
 * `scopedDb('goals')` BEFORE touching `goal_links`. The polymorphic
 * `target_id` is similarly validated against `scopedDb('projects' |
 * 'activities')` so no orphan / cross-tenant links can exist.
 *
 * ESLint allowlist: `goal_links` is not in TENANT_TABLES, so this file
 * is allowed direct `db.*` access (mirrors subtask.ts pattern). The
 * tenant-isolation guarantee is enforced by the goal-ownership check at
 * the top of each action — every `db.*` call below operates on rows
 * we've already proven belong to the caller.
 *
 * Slice A scope: backend only (3 actions + polymorphic integrity tests).
 * UI (CMP-057 GoalLinkPicker + integration en ActivityDetail/GoalDetail)
 * lives in ISSUE-041b — opens once ActivityDetail/GoalDetail screens land.
 *
 * Linked: BR-6, E-011, FT-041, US-041.
 */

import { and, eq, isNull, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { goals, type Goal } from '@/lib/db/schema/goals';
import { goalLinks } from '@/lib/db/schema/goal-links';
import { projects } from '@/lib/db/schema/projects';
import { activities } from '@/lib/db/schema/activities';
import { scopedDb } from '@/lib/db/scoped';
import { withSelf } from '@/lib/actions/helpers';
import { ActionError, type ActionResult } from '@/lib/actions/types';
import {
  linkGoalSchema,
  unlinkGoalSchema,
  listLinkedGoalsSchema,
} from '@/lib/validations/goal-link';

/**
 * Verify the goal belongs to the caller AND is not soft-deleted. Returns
 * the goal row or throws an enumeration-safe "no encontrada" error.
 */
async function requireOwnedActiveGoal(userId: string, goalId: string): Promise<Goal> {
  const sdb = scopedDb(userId);
  const rows = await sdb.select('goals', and(eq(goals.id, goalId), isNull(goals.deletedAt)));
  if (rows.length === 0) {
    throw new ActionError('Meta no encontrada');
  }
  return rows[0];
}

/**
 * Verify the polymorphic target exists, belongs to the caller, and is
 * not soft-deleted. Throws an enumeration-safe 404 if any check fails.
 */
async function requireOwnedActiveTarget(
  userId: string,
  targetType: 'project' | 'activity',
  targetId: string
): Promise<void> {
  const sdb = scopedDb(userId);
  if (targetType === 'project') {
    const rows = await sdb.select(
      'projects',
      and(eq(projects.id, targetId), isNull(projects.deletedAt))
    );
    if (rows.length === 0) {
      throw new ActionError('Proyecto no encontrado');
    }
    return;
  }
  // activity
  const rows = await sdb.select(
    'activities',
    and(eq(activities.id, targetId), isNull(activities.deletedAt))
  );
  if (rows.length === 0) {
    throw new ActionError('Actividad no encontrada');
  }
}

/**
 * Create a Goal ↔ {Project | Activity} link.
 *
 * Idempotent: re-linking the same triplet (goal, target_type, target_id)
 * is a no-op — the UNIQUE index on those three columns catches it and we
 * return the existing link's id.
 */
export async function linkGoal(input: unknown): Promise<ActionResult<{ id: string }>> {
  return await withSelf(
    { schema: linkGoalSchema, revalidate: '/goals' },
    input,
    async (data, userId) => {
      // Ownership checks: goal AND target both belong to the caller.
      await requireOwnedActiveGoal(userId, data.goalId);
      await requireOwnedActiveTarget(userId, data.targetType, data.targetId);

      // Idempotent insert: ON CONFLICT DO NOTHING + fallback SELECT.
      const inserted = await db
        .insert(goalLinks)
        .values({
          goalId: data.goalId,
          targetType: data.targetType,
          targetId: data.targetId,
        })
        .onConflictDoNothing({
          target: [goalLinks.goalId, goalLinks.targetType, goalLinks.targetId],
        })
        .returning({ id: goalLinks.id });

      if (inserted.length > 0) {
        return { id: inserted[0].id };
      }

      // Conflict: link already existed. Look it up so the caller gets a
      // stable id back (UI can treat re-link as success without a refresh).
      const existing = await db
        .select({ id: goalLinks.id })
        .from(goalLinks)
        .where(
          and(
            eq(goalLinks.goalId, data.goalId),
            eq(goalLinks.targetType, data.targetType),
            eq(goalLinks.targetId, data.targetId)
          )
        );
      if (existing.length === 0) {
        throw new Error(
          `GoalLink vanished after upsert (${data.goalId}, ${data.targetType}, ${data.targetId})`
        );
      }
      return { id: existing[0].id };
    }
  );
}

/**
 * Remove a single link by its row id.
 *
 * Ownership: we read the link, then verify its parent goal belongs to
 * the caller. This catches cross-tenant unlink attempts (user B passing
 * user A's link id).
 *
 * 404 (enumeration-safe) if the link doesn't exist or its goal isn't ours.
 */
export async function unlinkGoal(input: unknown): Promise<ActionResult> {
  return await withSelf(
    { schema: unlinkGoalSchema, revalidate: '/goals' },
    input,
    async (data, userId) => {
      const found = await db
        .select({ id: goalLinks.id, goalId: goalLinks.goalId })
        .from(goalLinks)
        .where(eq(goalLinks.id, data.linkId));

      if (found.length === 0) {
        throw new ActionError('Link no encontrado');
      }

      // Ownership check via parent goal. soft-deleted goals are fine to
      // unlink from — the link is orphaned-but-existing data and a user
      // should be able to drop it.
      const sdb = scopedDb(userId);
      const ownerCheck = await sdb.select('goals', eq(goals.id, found[0].goalId));
      if (ownerCheck.length === 0) {
        throw new ActionError('Link no encontrado');
      }

      await db.delete(goalLinks).where(eq(goalLinks.id, data.linkId));
    }
  );
}

/**
 * Return the list of (active, non-deleted) Goals currently linked to
 * `targetType:targetId`. The target itself must belong to the caller —
 * otherwise we'd leak the goals of other users via a foreign target id.
 */
export async function listLinkedGoals(input: unknown): Promise<ActionResult<{ goals: Goal[] }>> {
  return await withSelf(
    // Read-only query — no path to revalidate.
    { schema: listLinkedGoalsSchema },
    input,
    async (data, userId) => {
      await requireOwnedActiveTarget(userId, data.targetType, data.targetId);

      // Find all link rows pointing at this target.
      const links = await db
        .select({ goalId: goalLinks.goalId })
        .from(goalLinks)
        .where(
          and(eq(goalLinks.targetType, data.targetType), eq(goalLinks.targetId, data.targetId))
        );

      if (links.length === 0) {
        return { goals: [] };
      }

      // Fetch goals via scopedDb so soft-deleted + foreign-tenant goals
      // get filtered automatically.
      const sdb = scopedDb(userId);
      const goalIds = links.map((l) => l.goalId);
      const rows = await sdb.select(
        'goals',
        and(inArray(goals.id, goalIds), isNull(goals.deletedAt))
      );

      return { goals: rows };
    }
  );
}
