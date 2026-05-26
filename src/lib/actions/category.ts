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

import { and, eq, isNull, sql } from 'drizzle-orm';
import { categories } from '@/lib/db/schema/categories';
import { scopedDb } from '@/lib/db/scoped';
import { withSelf } from '@/lib/actions/helpers';
import { ActionError, type ActionResult } from '@/lib/actions/types';
import {
  createCategorySchema,
  updateCategorySchema,
  deleteCategorySchema,
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
 * Soft-delete a non-Inbox category. Sets deleted_at = now().
 *
 * Cascade to dependent projects/activities lives in ISSUE-011. Today this
 * action only marks the category row — orphan-detection / cleanup will be
 * wired when Projects are introduced.
 */
export async function deleteCategory(input: unknown): Promise<ActionResult> {
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
        return; // Already deleted — idempotent no-op
      }

      await sdb
        .update('categories', { deletedAt: sql`now()` })
        .where(eq(categories.id, data.id))
        .execute();
    }
  );
}
