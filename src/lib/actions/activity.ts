'use server';

/**
 * Activity server actions (ISSUE-013).
 *
 * Core CRUD only. Status transitions with reason_not_done validation are
 * deferred to ISSUE-017; here transitions are permissive (any → any) and
 * the action applies the BR-17 invariant on `done`.
 *
 * Invariants enforced:
 *   - BR-15: scheduled_dates normalized at the Zod transform layer
 *   - BR-16: durationMinutes requires scheduledTime (Zod refine)
 *   - BR-17: status='done' forces progress_percent=100 (applied here)
 *   - BR-2: project_id required; defaults to user's Inbox project when
 *     omitted, or throws if no Inbox exists yet (ISSUE-006 creates Inbox).
 *
 * Linked: E-005, BR-1, BR-2, BR-8, BR-15, BR-16, BR-17.
 */

import { eq, sql } from 'drizzle-orm';
import { activities } from '@/lib/db/schema/activities';
import { projects } from '@/lib/db/schema/projects';
import { scopedDb } from '@/lib/db/scoped';
import { withSelf } from '@/lib/actions/helpers';
import { ActionError, type ActionResult } from '@/lib/actions/types';
import {
  createActivitySchema,
  updateActivitySchema,
  deleteActivitySchema,
} from '@/lib/validations/activity';

/** Find the Inbox project id for the user, or null if not yet seeded. */
async function findInboxProjectId(userId: string): Promise<string | null> {
  const sdb = scopedDb(userId);
  const rows = await sdb.select('projects', eq(projects.isInbox, true));
  return rows[0]?.id ?? null;
}

/**
 * Create a new activity. project_id defaults to user's Inbox when omitted.
 */
export async function createActivity(input: unknown): Promise<ActionResult<{ id: string }>> {
  return await withSelf(
    { schema: createActivitySchema, revalidate: '/today' },
    input,
    async (data, userId) => {
      const sdb = scopedDb(userId);

      let projectId = data.projectId;
      if (!projectId) {
        const inbox = await findInboxProjectId(userId);
        if (!inbox) {
          throw new ActionError(
            'No se encontró el Inbox. Completá el onboarding antes de crear actividades.'
          );
        }
        projectId = inbox;
      }

      // BR-17 baseline: if status comes in as 'done', progress is 100.
      const status = data.status ?? 'pending';
      let progressPercent = data.progressPercent ?? null;
      if (status === 'done') progressPercent = 100;

      const inserted = await sdb
        .insert('activities', {
          projectId,
          title: data.title,
          description: data.description ?? null,
          scheduledDates: data.scheduledDates ?? [],
          scheduledTime: data.scheduledTime ?? null,
          durationMinutes: data.durationMinutes ?? null,
          deadline:
            data.deadline === undefined || data.deadline === null
              ? null
              : data.deadline instanceof Date
                ? data.deadline
                : new Date(data.deadline),
          estimatedMinutes: data.estimatedMinutes ?? null,
          priority: data.priority,
          quadrant: data.quadrant ?? null,
          progressPercent,
          recurrenceRule: data.recurrenceRule ?? null,
          status,
          reasonNotDone: data.reasonNotDone ?? null,
          reasonCategory: data.reasonCategory ?? null,
          tags: data.tags ?? [],
          completedAt: status === 'done' ? new Date() : null,
        })
        .returning({ id: activities.id });

      return { id: inserted[0].id };
    }
  );
}

/**
 * Patch an activity. Status transitions are permissive here — ISSUE-017
 * adds the reason_not_done validation when status ∈ skipped|blocked.
 *
 * BR-17 is applied to the merged state (existing + patch):
 *   - merged.status === 'done' → progress_percent = 100
 *   - merged.status leaves 'done' → completed_at cleared
 */
export async function updateActivity(input: unknown): Promise<ActionResult> {
  return await withSelf(
    { schema: updateActivitySchema, revalidate: '/today' },
    input,
    async (data, userId) => {
      const sdb = scopedDb(userId);

      const existing = await sdb.select('activities', eq(activities.id, data.id));
      if (existing.length === 0) {
        throw new ActionError('Actividad no encontrada');
      }
      const current = existing[0];

      const updates: Partial<typeof activities.$inferInsert> & {
        completedAt?: Date | null;
        progressPercent?: number | null;
      } = {};

      const keys: Array<keyof typeof data> = [
        'title',
        'description',
        'projectId',
        'scheduledDates',
        'scheduledTime',
        'durationMinutes',
        'deadline',
        'estimatedMinutes',
        'priority',
        'quadrant',
        'progressPercent',
        'recurrenceRule',
        'status',
        'reasonNotDone',
        'reasonCategory',
        'tags',
      ];
      for (const k of keys) {
        if (data[k] !== undefined) {
          // deadline arrives as Date | string from Zod — normalize.
          if (k === 'deadline' && typeof data[k] === 'string') {
            (updates as Record<string, unknown>)[k] = new Date(data[k] as string);
          } else {
            (updates as Record<string, unknown>)[k] = data[k];
          }
        }
      }

      // BR-17: enforce on merged status.
      const mergedStatus = (updates.status ?? current.status) as string;
      if (mergedStatus === 'done') {
        updates.progressPercent = 100;
        if (!current.completedAt) updates.completedAt = new Date();
      } else if (current.status === 'done' && mergedStatus !== 'done') {
        updates.completedAt = null;
      }

      if (Object.keys(updates).length === 0) {
        return;
      }

      await sdb
        .update('activities', updates as Record<string, unknown>)
        .where(eq(activities.id, data.id))
        .execute();
    }
  );
}

/**
 * Soft-delete an activity. The project's RESTRICT FK is irrelevant for
 * soft-delete (it only triggers on hard DELETE), so this never cascades
 * to subtasks today; ISSUE-015 will handle subtask cleanup.
 */
export async function deleteActivity(input: unknown): Promise<ActionResult> {
  return await withSelf(
    { schema: deleteActivitySchema, revalidate: '/today' },
    input,
    async (data, userId) => {
      const sdb = scopedDb(userId);

      const existing = await sdb.select('activities', eq(activities.id, data.id));
      if (existing.length === 0) {
        throw new ActionError('Actividad no encontrada');
      }
      if (existing[0].deletedAt) {
        return; // idempotent
      }

      await sdb
        .update('activities', { deletedAt: sql`now()` })
        .where(eq(activities.id, data.id))
        .execute();
    }
  );
}
