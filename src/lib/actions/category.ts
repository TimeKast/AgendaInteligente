'use server';

/**
 * Category server actions (ISSUE-010).
 *
 * Self-service CRUD: every action runs through `withSelf` (auth required, no
 * RBAC check) + `scopedDb(userId)` for multi-tenant data isolation (BR-1).
 *
 * Inbox is read-only here — UI never shows edit/delete affordances for the
 * Inbox category, and the API rejects edits even if attempted directly.
 *
 * Cascade-on-delete (cleanup of dependent projects/activities) lives in
 * ISSUE-011 alongside drag-reorder. Today's delete is a soft-delete only.
 *
 * Linked: E-003, BR-3, BR-4, FT-010, US-010.
 */

import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { categories } from '@/lib/db/schema/categories';
import { projects } from '@/lib/db/schema/projects';
import { activities } from '@/lib/db/schema/activities';
import { scopedDb } from '@/lib/db/scoped';
import { withSelf } from '@/lib/actions/helpers';
import { ActionError, type ActionResult } from '@/lib/actions/types';
import {
  createCategorySchema,
  updateCategorySchema,
  deleteCategorySchema,
  reorderCategoriesSchema,
} from '@/lib/validations/category';

/**
 * Create a new (non-Inbox) category for the current user.
 * Position is auto-assigned as the next slot (max + 1) so the new row lands
 * at the bottom of the list.
 */
export async function createCategory(input: unknown): Promise<ActionResult<{ id: string }>> {
  return await withSelf(
    { schema: createCategorySchema, revalidate: '/categories' },
    input,
    async (data, userId) => {
      const sdb = scopedDb(userId);

      // Pre-check: name must not collide with an active row for this user.
      // The DB UNIQUE index also enforces this; we check first to return a
      // friendly error before round-tripping the INSERT.
      const collision = await sdb.select(
        'categories',
        and(eq(categories.name, data.name), isNull(categories.deletedAt))
      );
      if (collision.length > 0) {
        throw new ActionError('Ya existe esa categoría');
      }

      // Next position = max(position) + 1, defaulting to 0 if no rows yet.
      const rows = await sdb.select('categories');
      const nextPosition = rows.length === 0 ? 0 : Math.max(...rows.map((r) => r.position)) + 1;

      const inserted = await sdb
        .insert('categories', {
          name: data.name,
          color: data.color ?? '#5C5C5C',
          icon: data.icon ?? null,
          position: nextPosition,
          isInbox: false,
        })
        .returning({ id: categories.id });

      return { id: inserted[0].id };
    }
  );
}

/**
 * Update name / color / icon of a non-Inbox category.
 * Inbox is hard-blocked: `is_inbox = true` rows fail with ActionError.
 */
export async function updateCategory(input: unknown): Promise<ActionResult> {
  return await withSelf(
    { schema: updateCategorySchema, revalidate: '/categories' },
    input,
    async (data, userId) => {
      const sdb = scopedDb(userId);

      const existing = await sdb.select('categories', eq(categories.id, data.id));
      if (existing.length === 0) {
        throw new ActionError('Categoría no encontrada');
      }
      if (existing[0].isInbox) {
        throw new ActionError('Inbox no se puede editar');
      }

      // Check name collision (excluding the row being updated, and ignoring
      // soft-deleted rows).
      if (data.name && data.name !== existing[0].name) {
        const collision = await sdb.select(
          'categories',
          and(eq(categories.name, data.name), isNull(categories.deletedAt))
        );
        if (collision.length > 0) {
          throw new ActionError('Ya existe esa categoría');
        }
      }

      const updates: Partial<typeof categories.$inferInsert> = {};
      if (data.name !== undefined) updates.name = data.name;
      if (data.color !== undefined) updates.color = data.color;
      if (data.icon !== undefined) updates.icon = data.icon;

      if (Object.keys(updates).length === 0) {
        return; // Nothing to update — no-op
      }

      await sdb
        .update('categories', updates as Record<string, unknown>)
        .where(eq(categories.id, data.id))
        .execute();
    }
  );
}

/**
 * Soft-delete a non-Inbox category with cascade (ISSUE-011).
 *
 * Cascade target: every active project under the category + every active
 * activity under those projects gets `deleted_at = now()` in the same
 * transaction. We use `db.transaction` directly here because scopedDb
 * can't model multi-table atomic writes; userId scoping is applied
 * explicitly via `eq(table.userId, userId)` on every statement.
 *
 * Returns counts so the caller can render a "X proyectos + Y actividades
 * borrados" toast.
 *
 * Note on ON DELETE RESTRICT: the FK constraint on `projects.category_id`
 * is RESTRICT, which only fires on HARD delete. Soft delete (setting
 * `deleted_at`) doesn't trigger it — that's why we explicitly cascade in
 * app code.
 */
export async function deleteCategory(
  input: unknown
): Promise<ActionResult<{ projectCount: number; activityCount: number }>> {
  return await withSelf(
    { schema: deleteCategorySchema, revalidate: '/categories' },
    input,
    async (data, userId) => {
      const sdb = scopedDb(userId);

      const existing = await sdb.select('categories', eq(categories.id, data.id));
      if (existing.length === 0) {
        throw new ActionError('Categoría no encontrada');
      }
      if (existing[0].isInbox) {
        throw new ActionError('Inbox no se puede borrar');
      }
      if (existing[0].deletedAt) {
        return { projectCount: 0, activityCount: 0 };
      }

      // Resolve active projects + activities under this category before the
      // transaction so we have the counts to return.
      const activeProjects = await sdb.select(
        'projects',
        and(eq(projects.categoryId, data.id), isNull(projects.deletedAt))
      );
      const projectIds = activeProjects.map((p) => p.id);

      const activeActivities =
        projectIds.length === 0
          ? []
          : await sdb.select(
              'activities',
              and(inArray(activities.projectId, projectIds), isNull(activities.deletedAt))
            );

      await db.transaction(async (tx) => {
        const now = sql`now()`;
        // Cascade activities first (deepest in the tree), then projects,
        // then the category. Order is cosmetic for soft delete but mirrors
        // the dependency direction so a future hard-delete migration
        // works without reorder.
        if (activeActivities.length > 0) {
          await tx
            .update(activities)
            .set({ deletedAt: now })
            .where(
              and(
                eq(activities.userId, userId),
                inArray(
                  activities.id,
                  activeActivities.map((a) => a.id)
                )
              )
            );
        }
        if (projectIds.length > 0) {
          await tx
            .update(projects)
            .set({ deletedAt: now })
            .where(and(eq(projects.userId, userId), inArray(projects.id, projectIds)));
        }
        await tx
          .update(categories)
          .set({ deletedAt: now })
          .where(and(eq(categories.userId, userId), eq(categories.id, data.id)));
      });

      return {
        projectCount: activeProjects.length,
        activityCount: activeActivities.length,
      };
    }
  );
}

/**
 * Reorder the user's active categories (ISSUE-011).
 *
 * `orderedIds` is the desired sort: the first id becomes position 0, the
 * second position 1, and so on. Inbox is excluded because it's pinned to
 * the bottom of the UI — including its id triggers an error rather than
 * silently shuffling it.
 *
 * Implementation: a single UPDATE per id inside a transaction. PG can't
 * apply an arbitrary "reorder" with one statement without CTEs, and the
 * row count is small enough that N round-trips inside a tx is fine.
 *
 * The op is idempotent (calling twice with the same array yields the same
 * positions) and atomic (any FK or scoping error rolls back the whole
 * reorder).
 */
export async function reorderCategories(input: unknown): Promise<ActionResult> {
  return await withSelf(
    { schema: reorderCategoriesSchema, revalidate: '/categories' },
    input,
    async (data, userId) => {
      const sdb = scopedDb(userId);

      // Verify all ids belong to this user and none is the Inbox.
      const rows = await sdb.select('categories', inArray(categories.id, data.orderedIds));
      if (rows.length !== data.orderedIds.length) {
        throw new ActionError('Una o más categorías no existen o no te pertenecen');
      }
      if (rows.some((r) => r.isInbox)) {
        throw new ActionError('Inbox no se puede reordenar');
      }

      await db.transaction(async (tx) => {
        for (let i = 0; i < data.orderedIds.length; i++) {
          await tx
            .update(categories)
            .set({ position: i })
            .where(and(eq(categories.userId, userId), eq(categories.id, data.orderedIds[i])));
        }
      });
    }
  );
}
