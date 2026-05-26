'use server';

/**
 * DaySheet server actions — ISSUE-030.
 *
 * `updateDaySheet` is the single user-facing action: it covers both
 * morning ritual fields (identity_statement, wins_planned, avoidance,
 * notes_dreams) and the evening close-day one-liner (close_summary).
 * Callers patch one or many fields per call; completion timestamps
 * are computed on the merged state.
 *
 * Auto-completion timestamps:
 *   - `morning_completed_at` set when all morning predicates pass for
 *     the first time. Subsequent updates keep the original timestamp.
 *   - `evening_completed_at` set on the FIRST close_summary write.
 *
 * Multi-tenant: `scopedDb('daySheets')` enforces userId on every read
 * and write; the action never touches another user's sheet.
 *
 * Linked: BR-7, FT-030, FT-031, US-030b, US-031b.
 */

import { eq } from 'drizzle-orm';
import { daySheets } from '@/lib/db/schema/day-sheets';
import { scopedDb } from '@/lib/db/scoped';
import { getOrCreateDaySheet } from '@/lib/db/queries/sheets';
import { withSelf } from '@/lib/actions/helpers';
import { type ActionResult } from '@/lib/actions/types';
import { updateDaySheetSchema } from '@/lib/validations/day-sheet';
import { isMorningCompleted, isEveningCompleted } from '@/lib/domain/day-sheet-completion';

export async function updateDaySheet(
  input: unknown
): Promise<
  ActionResult<{ id: string; morningCompletedAt: Date | null; eveningCompletedAt: Date | null }>
> {
  return await withSelf(
    { schema: updateDaySheetSchema, revalidate: '/today' },
    input,
    async (data, userId) => {
      // Step 1: ensure the row exists (atomic upsert via the query helper).
      const existing = await getOrCreateDaySheet(userId, data.date);

      // Step 2: merge the patch onto the existing snapshot to evaluate
      // completion against the FUTURE state (caller may set the last
      // missing field in this very call).
      const merged = {
        identityStatement:
          data.identityStatement !== undefined
            ? data.identityStatement
            : existing.identityStatement,
        winsPlanned: data.winsPlanned !== undefined ? data.winsPlanned : existing.winsPlanned,
        avoidance: data.avoidance !== undefined ? data.avoidance : existing.avoidance,
        closeSummary: data.closeSummary !== undefined ? data.closeSummary : existing.closeSummary,
        notesDreams: data.notesDreams !== undefined ? data.notesDreams : existing.notesDreams,
      };

      // Step 3: build the explicit update set — only fields the caller
      // provided + auto-stamped completion timestamps where applicable.
      const updates: Partial<typeof daySheets.$inferInsert> & {
        morningCompletedAt?: Date | null;
        eveningCompletedAt?: Date | null;
      } = {};

      if (data.identityStatement !== undefined) updates.identityStatement = data.identityStatement;
      if (data.winsPlanned !== undefined) updates.winsPlanned = data.winsPlanned;
      if (data.avoidance !== undefined) updates.avoidance = data.avoidance;
      if (data.closeSummary !== undefined) updates.closeSummary = data.closeSummary;
      if (data.notesDreams !== undefined) updates.notesDreams = data.notesDreams;

      // Morning completion: stamp once, never re-stamp on subsequent edits.
      if (!existing.morningCompletedAt && isMorningCompleted(merged)) {
        updates.morningCompletedAt = new Date();
      }

      // Evening completion: stamp on first close_summary write.
      if (!existing.eveningCompletedAt && isEveningCompleted(merged)) {
        updates.eveningCompletedAt = new Date();
      }

      // No-op shortcut — caller passed nothing changeable. Return the
      // existing row so the UI can react idempotently.
      if (Object.keys(updates).length === 0) {
        return {
          id: existing.id,
          morningCompletedAt: existing.morningCompletedAt,
          eveningCompletedAt: existing.eveningCompletedAt,
        };
      }

      const sdb = scopedDb(userId);
      await sdb
        .update('daySheets', updates as Record<string, unknown>)
        .where(eq(daySheets.id, existing.id))
        .execute();

      return {
        id: existing.id,
        morningCompletedAt: updates.morningCompletedAt ?? existing.morningCompletedAt,
        eveningCompletedAt: updates.eveningCompletedAt ?? existing.eveningCompletedAt,
      };
    }
  );
}
