'use server';

/**
 * Goal server actions (ISSUE-040).
 *
 * Self-service CRUD: every action runs through `withSelf` (auth required,
 * no RBAC check) + `scopedDb(userId)` for multi-tenant isolation (BR-1).
 *
 * Soft-delete only — `deletedAt` is the kill switch. Reads filter
 * `isNull(deletedAt)` so users never see ghost rows. No hard-delete in v1
 * (mirrors Category/Project/Activity).
 *
 * `reviewedAt` is auto-stamped the first time a review field
 * (`review_score` OR `review_notes`) gets a non-null value. Subsequent
 * edits don't re-stamp — the "reviewed at" instant is the user's first
 * commitment to a self-assessment, not the last keystroke.
 *
 * No state machine on `status` (free transitions — different from
 * Activity's BR-8 matrix). The user decides when a goal is achieved /
 * partial / abandoned.
 *
 * GoalLink (E-011, project/activity M2M) lives in ISSUE-041 and is NOT
 * touched here.
 *
 * Linked: BR-1, BR-6, BR-9, FT-040, US-040.
 */

import { and, eq, isNull } from 'drizzle-orm';
import { goals } from '@/lib/db/schema/goals';
import { scopedDb } from '@/lib/db/scoped';
import { withSelf } from '@/lib/actions/helpers';
import { ActionError, type ActionResult } from '@/lib/actions/types';
import { createGoalSchema, updateGoalSchema, deleteGoalSchema } from '@/lib/validations/goal';

/**
 * Create a new Goal for the current user. Status defaults to 'active'.
 * Deadline is required for quarter/year scopes (enforced in Zod).
 */
export async function createGoal(input: unknown): Promise<ActionResult<{ id: string }>> {
  return await withSelf(
    { schema: createGoalSchema, revalidate: '/goals' },
    input,
    async (data, userId) => {
      const sdb = scopedDb(userId);

      const inserted = await sdb
        .insert('goals', {
          title: data.title,
          description: data.description ?? null,
          scope: data.scope,
          deadline: data.deadline ?? null,
          outcomeExpected: data.outcomeExpected ?? null,
          notesCost: data.notesCost ?? null,
          status: 'active',
        })
        .returning({ id: goals.id });

      return { id: inserted[0].id };
    }
  );
}

/**
 * Update one or many Goal fields. Only fields the caller supplies are
 * written — `undefined` means "leave alone".
 *
 * Auto-stamps `reviewed_at` on the FIRST review write. Re-saving review
 * fields later does NOT re-stamp.
 *
 * Returns 404 (ActionError) if the row doesn't belong to the user or has
 * been soft-deleted.
 */
export async function updateGoal(input: unknown): Promise<ActionResult> {
  return await withSelf(
    { schema: updateGoalSchema, revalidate: '/goals' },
    input,
    async (data, userId) => {
      const sdb = scopedDb(userId);

      const existing = await sdb.select(
        'goals',
        and(eq(goals.id, data.id), isNull(goals.deletedAt))
      );
      if (existing.length === 0) {
        throw new ActionError('Meta no encontrada');
      }
      const row = existing[0];

      const updates: Partial<typeof goals.$inferInsert> = {};
      if (data.title !== undefined) updates.title = data.title;
      if (data.description !== undefined) updates.description = data.description;
      if (data.scope !== undefined) updates.scope = data.scope;
      if (data.deadline !== undefined) updates.deadline = data.deadline;
      if (data.outcomeExpected !== undefined) updates.outcomeExpected = data.outcomeExpected;
      if (data.notesCost !== undefined) updates.notesCost = data.notesCost;
      if (data.status !== undefined) updates.status = data.status;
      if (data.reviewScore !== undefined) updates.reviewScore = data.reviewScore;
      if (data.reviewNotes !== undefined) updates.reviewNotes = data.reviewNotes;

      // Stamp `reviewed_at` on first review-field write. The merged shape
      // matters: a caller setting review_score=null + review_notes='foo'
      // still counts as a review (notes alone is enough).
      const mergedReviewScore = data.reviewScore !== undefined ? data.reviewScore : row.reviewScore;
      const mergedReviewNotes = data.reviewNotes !== undefined ? data.reviewNotes : row.reviewNotes;
      const willHaveReview =
        (mergedReviewScore !== null && mergedReviewScore !== undefined) ||
        (mergedReviewNotes !== null && mergedReviewNotes !== undefined && mergedReviewNotes !== '');

      if (!row.reviewedAt && willHaveReview) {
        (updates as Record<string, unknown>).reviewedAt = new Date();
      }

      if (Object.keys(updates).length === 0) {
        return; // No-op
      }

      await sdb
        .update('goals', updates as Record<string, unknown>)
        .where(eq(goals.id, data.id))
        .execute();
    }
  );
}

/**
 * Soft-delete a Goal. Idempotent: deleting an already-deleted Goal is a
 * no-op (returns OK). The row stays in the DB until the purge cron
 * (BR-14) sweeps it.
 *
 * GoalLink rows pointing at this goal are NOT touched here — they're
 * cleaned up by the cascade in ISSUE-041 (E-011 has ON DELETE CASCADE
 * keyed on `goal_id`, but soft-delete doesn't fire FK cascades, so
 * ISSUE-041 will handle link cleanup explicitly).
 */
export async function deleteGoal(input: unknown): Promise<ActionResult> {
  return await withSelf(
    { schema: deleteGoalSchema, revalidate: '/goals' },
    input,
    async (data, userId) => {
      const sdb = scopedDb(userId);

      const existing = await sdb.select('goals', eq(goals.id, data.id));
      if (existing.length === 0) {
        throw new ActionError('Meta no encontrada');
      }
      if (existing[0].deletedAt) {
        return; // Already deleted — idempotent no-op
      }

      await sdb.update('goals', { deletedAt: new Date() }).where(eq(goals.id, data.id)).execute();
    }
  );
}
