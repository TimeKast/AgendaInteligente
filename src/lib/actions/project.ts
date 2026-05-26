'use server';

/**
 * Project server actions (ISSUE-012).
 *
 * Self-service CRUD + status transitions via `withSelf` + `scopedDb`.
 *
 * Inbox project (`is_inbox = true`) is read-only at the API layer:
 * `updateProject`, `transitionProjectStatus`, and `deleteProject` all
 * reject Inbox rows with ActionError.
 *
 * Status lifecycle:
 *   - Default status on create = 'active'
 *   - Any → any transition is permitted (the matrix is intentionally
 *     permissive; UX decides which moves to expose).
 *   - status → 'completed' auto-sets `completed_at = now()`
 *   - status leaves 'completed' (re-open) → clears `completed_at = NULL`
 *
 * `reason` on kill is accepted by the schema but NOT persisted today —
 * E-004 has no kill-reason column. It's logged for agent / telemetry
 * context. Spec gap documented in ISSUE-012 evidence.
 *
 * Linked: E-004, BR-2, BR-3, FT-011, US-013, US-014.
 */

import { and, eq, isNull, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { projects } from '@/lib/db/schema/projects';
import { scopedDb } from '@/lib/db/scoped';
import { withSelf } from '@/lib/actions/helpers';
import { ActionError, type ActionResult } from '@/lib/actions/types';
import {
  createProjectSchema,
  updateProjectSchema,
  transitionProjectStatusSchema,
  deleteProjectSchema,
} from '@/lib/validations/project';

/**
 * Create a new (non-Inbox) project inside a category.
 * Name must be unique within (user, category) for active rows.
 */
export async function createProject(input: unknown): Promise<ActionResult<{ id: string }>> {
  return await withSelf(
    { schema: createProjectSchema, revalidate: '/projects' },
    input,
    async (data, userId) => {
      const sdb = scopedDb(userId);

      // Collision check within the target category.
      const collision = await sdb.select(
        'projects',
        and(
          eq(projects.categoryId, data.categoryId),
          eq(projects.name, data.name),
          isNull(projects.deletedAt)
        )
      );
      if (collision.length > 0) {
        throw new ActionError('Ya existe un proyecto con ese nombre en la categoría');
      }

      const inserted = await sdb
        .insert('projects', {
          categoryId: data.categoryId,
          name: data.name,
          description: data.description ?? null,
          deadline: data.deadline ?? null,
          outcomeExpected: data.outcomeExpected ?? null,
          status: 'active',
          isInbox: false,
        })
        .returning({ id: projects.id });

      return { id: inserted[0].id };
    }
  );
}

/**
 * Update name / description / deadline / outcome / category of a non-Inbox
 * project. Status changes go through `transitionProjectStatus`.
 */
export async function updateProject(input: unknown): Promise<ActionResult> {
  return await withSelf(
    { schema: updateProjectSchema, revalidate: '/projects' },
    input,
    async (data, userId) => {
      const sdb = scopedDb(userId);

      const existing = await sdb.select('projects', eq(projects.id, data.id));
      if (existing.length === 0) {
        throw new ActionError('Proyecto no encontrado');
      }
      if (existing[0].isInbox) {
        throw new ActionError('Inbox no se puede editar');
      }

      // Collision check when renaming or moving categories.
      const targetCategoryId = data.categoryId ?? existing[0].categoryId;
      const targetName = data.name ?? existing[0].name;
      const movedOrRenamed =
        targetCategoryId !== existing[0].categoryId || targetName !== existing[0].name;
      if (movedOrRenamed) {
        const collision = await sdb.select(
          'projects',
          and(
            eq(projects.categoryId, targetCategoryId),
            eq(projects.name, targetName),
            isNull(projects.deletedAt)
          )
        );
        const others = collision.filter((c) => c.id !== data.id);
        if (others.length > 0) {
          throw new ActionError('Ya existe un proyecto con ese nombre en la categoría');
        }
      }

      const updates: Partial<typeof projects.$inferInsert> = {};
      if (data.name !== undefined) updates.name = data.name;
      if (data.description !== undefined) updates.description = data.description;
      if (data.deadline !== undefined) updates.deadline = data.deadline;
      if (data.outcomeExpected !== undefined) updates.outcomeExpected = data.outcomeExpected;
      if (data.categoryId !== undefined) updates.categoryId = data.categoryId;

      if (Object.keys(updates).length === 0) {
        return;
      }

      await sdb
        .update('projects', updates as Record<string, unknown>)
        .where(eq(projects.id, data.id))
        .execute();
    }
  );
}

/**
 * Move a project between statuses. `completed_at` is auto-managed.
 *
 * @param input.id - Project UUID.
 * @param input.newStatus - One of active|paused|completed|killed.
 * @param input.reason - Optional free text (telemetry only — not persisted).
 */
export async function transitionProjectStatus(input: unknown): Promise<ActionResult> {
  return await withSelf(
    { schema: transitionProjectStatusSchema, revalidate: '/projects' },
    input,
    async (data, userId) => {
      const sdb = scopedDb(userId);

      const existing = await sdb.select('projects', eq(projects.id, data.id));
      if (existing.length === 0) {
        throw new ActionError('Proyecto no encontrado');
      }
      if (existing[0].isInbox) {
        throw new ActionError('Inbox no cambia de estado');
      }

      // No-op if status didn't change.
      if (existing[0].status === data.newStatus) {
        return;
      }

      const updates: Partial<typeof projects.$inferInsert> & {
        completedAt?: Date | null | typeof sql;
      } = {
        status: data.newStatus,
      };

      if (data.newStatus === 'completed') {
        updates.completedAt = sql`now()` as unknown as Date;
      } else if (existing[0].completedAt) {
        // Re-opening from completed — clear the timestamp.
        updates.completedAt = null;
      }

      await sdb
        .update('projects', updates as Record<string, unknown>)
        .where(eq(projects.id, data.id))
        .execute();

      // Telemetry: kill reason is logged but not persisted (E-004 gap).
      if (data.newStatus === 'killed' && data.reason) {
        logger.info(
          `[project] kill reason for ${data.id}: ${data.reason.slice(0, 200)} (userId=${userId})`
        );
      }
    }
  );
}

/**
 * Soft-delete a non-Inbox project. Cascade to activities lives in ISSUE-011
 * (and the Activity entity itself doesn't exist yet — ISSUE-013).
 */
export async function deleteProject(input: unknown): Promise<ActionResult> {
  return await withSelf(
    { schema: deleteProjectSchema, revalidate: '/projects' },
    input,
    async (data, userId) => {
      const sdb = scopedDb(userId);

      const existing = await sdb.select('projects', eq(projects.id, data.id));
      if (existing.length === 0) {
        throw new ActionError('Proyecto no encontrado');
      }
      if (existing[0].isInbox) {
        throw new ActionError('Inbox no se puede borrar');
      }
      if (existing[0].deletedAt) {
        return; // idempotent
      }

      await sdb
        .update('projects', { deletedAt: sql`now()` })
        .where(eq(projects.id, data.id))
        .execute();
    }
  );
}
