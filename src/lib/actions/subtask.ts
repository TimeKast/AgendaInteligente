'use server';

/**
 * Subtask server actions (ISSUE-015, BR-5).
 *
 * Scoping pattern: subtasks have no `user_id` column (spec fidelity —
 * E-006). Every action verifies the parent activity belongs to the
 * caller via `scopedDb('activities')` before reading/writing subtasks;
 * the subtask table is allowlisted in ESLint for direct `db.*` use.
 *
 * "All subtasks done" suggestion: `toggleSubtask` returns
 * `{ allSubtasksDone: boolean }` so the UI can render a toast asking
 * the user to mark the parent activity as done. We never auto-mark —
 * agency stays with the user.
 *
 * Linked: E-006, BR-5, FT-013, US-017.
 */

import { eq, and, inArray, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { activities } from '@/lib/db/schema/activities';
import { subtasks } from '@/lib/db/schema/subtasks';
import { scopedDb } from '@/lib/db/scoped';
import { withSelf } from '@/lib/actions/helpers';
import { ActionError, type ActionResult } from '@/lib/actions/types';
import {
  createSubtaskSchema,
  toggleSubtaskSchema,
  deleteSubtaskSchema,
  reorderSubtasksSchema,
} from '@/lib/validations/subtask';

/**
 * Ensure the activity belongs to the caller. Returns the activity row or
 * throws an ActionError that maps to the standard "not found" UX (we
 * never differentiate "doesn't exist" from "exists but not yours" to
 * avoid an enumeration vector).
 */
async function requireOwnedActivity(userId: string, activityId: string) {
  const sdb = scopedDb(userId);
  const rows = await sdb.select('activities', eq(activities.id, activityId));
  if (rows.length === 0) {
    throw new ActionError('Actividad no encontrada');
  }
  return rows[0];
}

/**
 * Create a new subtask under an activity. Position = max + 1 (or 0).
 */
export async function createSubtask(input: unknown): Promise<ActionResult<{ id: string }>> {
  return await withSelf(
    { schema: createSubtaskSchema, revalidate: '/today' },
    input,
    async (data, userId) => {
      await requireOwnedActivity(userId, data.activityId);

      const existing = await db
        .select({ position: subtasks.position })
        .from(subtasks)
        .where(eq(subtasks.activityId, data.activityId));
      const nextPosition =
        existing.length === 0 ? 0 : Math.max(...existing.map((r) => r.position)) + 1;

      const inserted = await db
        .insert(subtasks)
        .values({
          activityId: data.activityId,
          title: data.title,
          status: 'pending',
          position: nextPosition,
        })
        .returning({ id: subtasks.id });

      return { id: inserted[0].id };
    }
  );
}

/**
 * Flip a subtask between pending ↔ done. Returns whether the parent's
 * full subtask set is now complete so the UI can suggest closing the
 * activity.
 */
export async function toggleSubtask(
  input: unknown
): Promise<ActionResult<{ allSubtasksDone: boolean; newStatus: 'pending' | 'done' }>> {
  return await withSelf(
    { schema: toggleSubtaskSchema, revalidate: '/today' },
    input,
    async (data, userId) => {
      await requireOwnedActivity(userId, data.activityId);

      // Fetch the target subtask + count siblings in one round-trip.
      const all = await db
        .select({ id: subtasks.id, status: subtasks.status })
        .from(subtasks)
        .where(eq(subtasks.activityId, data.activityId));

      const target = all.find((s) => s.id === data.id);
      if (!target) {
        throw new ActionError('Subtask no encontrada');
      }

      const newStatus = target.status === 'done' ? 'pending' : 'done';

      await db
        .update(subtasks)
        .set({
          status: newStatus,
          completedAt: newStatus === 'done' ? sql`now()` : null,
        })
        .where(and(eq(subtasks.id, data.id), eq(subtasks.activityId, data.activityId)));

      // Recompute "all done" with the new state of the target row.
      const allDone =
        all.length > 0 &&
        all.every((s) => (s.id === target.id ? newStatus === 'done' : s.status === 'done'));

      return { allSubtasksDone: allDone, newStatus };
    }
  );
}

/**
 * Hard-delete a subtask. Subtasks have no soft-delete column — they're
 * tied to their activity's lifecycle (CASCADE on the FK). Per-item
 * delete from the UI removes the row outright; if the user wants the
 * "undo" affordance the UI can hold the row in local state for N seconds
 * before calling this.
 */
export async function deleteSubtask(input: unknown): Promise<ActionResult> {
  return await withSelf(
    { schema: deleteSubtaskSchema, revalidate: '/today' },
    input,
    async (data, userId) => {
      await requireOwnedActivity(userId, data.activityId);

      await db
        .delete(subtasks)
        .where(and(eq(subtasks.id, data.id), eq(subtasks.activityId, data.activityId)));
    }
  );
}

/**
 * Reorder subtasks within one activity. Same N-UPDATEs-in-tx pattern as
 * `reorderCategories` — row count is tiny, simplicity wins over CTE tricks.
 */
export async function reorderSubtasks(input: unknown): Promise<ActionResult> {
  return await withSelf(
    { schema: reorderSubtasksSchema, revalidate: '/today' },
    input,
    async (data, userId) => {
      await requireOwnedActivity(userId, data.activityId);

      // Verify every id belongs to this activity (rejects cross-activity drag).
      const owned = await db
        .select({ id: subtasks.id })
        .from(subtasks)
        .where(
          and(eq(subtasks.activityId, data.activityId), inArray(subtasks.id, data.orderedIds))
        );
      if (owned.length !== data.orderedIds.length) {
        throw new ActionError('Una o más subtasks no pertenecen a esta actividad');
      }

      await db.transaction(async (tx) => {
        for (let i = 0; i < data.orderedIds.length; i++) {
          await tx
            .update(subtasks)
            .set({ position: i })
            .where(
              and(eq(subtasks.id, data.orderedIds[i]), eq(subtasks.activityId, data.activityId))
            );
        }
      });
    }
  );
}
