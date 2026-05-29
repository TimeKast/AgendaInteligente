'use server';

/**
 * WeekSheet server actions.
 *
 * v1 wire: a single `updateWeekSheet` that upserts kickoff + review
 * text fields. Mirrors `updateDaySheet` semantics — partial patches,
 * `kickoff_completed_at` stamps when oneThing + at least one win are
 * present, `reviewed_at` stamps on first review_one_sentence write.
 *
 * Multi-tenant: scoped via `eq(users.id, userId)` on the WHERE clause
 * (ESLint allowlist applies — this file is under src/lib/actions and
 * is not in the BR-1 banned list).
 *
 * Linked: ISSUE-033 (Week screen wire), BR-7.
 */

import { eq } from 'drizzle-orm';
import { weekSheets } from '@/lib/db/schema/week-sheets';
import { scopedDb } from '@/lib/db/scoped';
import { getOrCreateWeekSheet } from '@/lib/db/queries/sheets';
import { withSelf } from '@/lib/actions/helpers';
import type { ActionResult } from '@/lib/actions/types';
import { updateWeekSheetSchema } from '@/lib/validations/week-sheet';

export async function updateWeekSheet(input: unknown): Promise<ActionResult<{ id: string }>> {
  return await withSelf(
    { schema: updateWeekSheetSchema, revalidate: '/week' },
    input,
    async (data, userId) => {
      const existing = await getOrCreateWeekSheet(userId, data.weekStarting);

      const merged = {
        oneThing: data.oneThing !== undefined ? data.oneThing : existing.oneThing,
        threeWins: data.threeWins !== undefined ? data.threeWins : existing.threeWins,
        reviewOneSentence:
          data.reviewOneSentence !== undefined
            ? data.reviewOneSentence
            : existing.reviewOneSentence,
      };

      const updates: Partial<typeof weekSheets.$inferInsert> & {
        kickoffCompletedAt?: Date | null;
        reviewedAt?: Date | null;
      } = {};

      if (data.oneThing !== undefined) updates.oneThing = data.oneThing;
      if (data.threeWins !== undefined) updates.threeWins = data.threeWins;
      if (data.learnOne !== undefined) updates.learnOne = data.learnOne;
      if (data.avoidOne !== undefined) updates.avoidOne = data.avoidOne;
      if (data.reviewOneSentence !== undefined) updates.reviewOneSentence = data.reviewOneSentence;
      if (data.reviewEnergy !== undefined) updates.reviewEnergy = data.reviewEnergy;

      // Kickoff complete = has a "one thing" + at least one win.
      const kickoffReady =
        merged.oneThing && merged.oneThing.length > 0 && (merged.threeWins?.length ?? 0) > 0;
      if (kickoffReady && !existing.kickoffCompletedAt) {
        updates.kickoffCompletedAt = new Date();
      }

      // Review stamped on the first non-empty review_one_sentence.
      if (merged.reviewOneSentence && merged.reviewOneSentence.length > 0 && !existing.reviewedAt) {
        updates.reviewedAt = new Date();
      }

      if (Object.keys(updates).length === 0) {
        return { id: existing.id };
      }

      const sdb = scopedDb(userId);
      await sdb
        .update('weekSheets', updates as Record<string, unknown>)
        .where(eq(weekSheets.id, existing.id))
        .execute();

      return { id: existing.id };
    }
  );
}
