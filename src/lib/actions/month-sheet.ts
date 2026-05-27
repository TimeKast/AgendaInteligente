'use server';

/**
 * MonthSheet server actions — ISSUE-131 (Slice A1).
 *
 * Two actions:
 *   - `updateMonthSheet`: patch goals/themes/closeSummary on a sheet.
 *     Creates the row if it doesn't exist (via getOrCreateMonthSheet).
 *   - `closeMonth`: stamps `closed_at = now` + writes the final
 *     `close_summary`. Idempotent — re-closing keeps the original stamp.
 *
 * BR-19: every input `monthStarting` gets normalized to first-of-month
 * via the helper before any DB touch. Defense in depth: the DB CHECK
 * also enforces this.
 *
 * Linked: BR-7, BR-19, FT-131, US-131.
 */

import { eq, sql } from 'drizzle-orm';
import { monthSheets } from '@/lib/db/schema/month-sheets';
import { scopedDb } from '@/lib/db/scoped';
import { getOrCreateMonthSheet } from '@/lib/db/queries/sheets';
import { normalizeToMonthStarting } from '@/lib/domain/month-calc';
import { withSelf } from '@/lib/actions/helpers';
import { type ActionResult } from '@/lib/actions/types';
import { updateMonthSheetSchema, closeMonthSchema } from '@/lib/validations/month-sheet';

export async function updateMonthSheet(input: unknown): Promise<ActionResult<{ id: string }>> {
  return await withSelf(
    { schema: updateMonthSheetSchema, revalidate: '/month' },
    input,
    async (data, userId) => {
      const monthStarting = normalizeToMonthStarting(data.monthStarting);
      const existing = await getOrCreateMonthSheet(userId, monthStarting);

      const updates: Partial<typeof monthSheets.$inferInsert> = {};
      if (data.goals !== undefined) updates.goals = data.goals;
      if (data.themes !== undefined) updates.themes = data.themes;
      if (data.closeSummary !== undefined) updates.closeSummary = data.closeSummary;

      if (Object.keys(updates).length === 0) {
        return { id: existing.id };
      }

      const sdb = scopedDb(userId);
      await sdb
        .update('monthSheets', updates as Record<string, unknown>)
        .where(eq(monthSheets.id, existing.id))
        .execute();

      return { id: existing.id };
    }
  );
}

/**
 * Stamp `close_summary` + `closed_at`. Idempotent: re-closing keeps
 * the original `closed_at` and overwrites `close_summary` (the user
 * may want to refine the wording).
 */
export async function closeMonth(input: unknown): Promise<ActionResult<{ id: string }>> {
  return await withSelf(
    { schema: closeMonthSchema, revalidate: '/month' },
    input,
    async (data, userId) => {
      const monthStarting = normalizeToMonthStarting(data.monthStarting);
      const existing = await getOrCreateMonthSheet(userId, monthStarting);

      const sdb = scopedDb(userId);
      await sdb
        .update('monthSheets', {
          closeSummary: data.closeSummary,
          // Only stamp closed_at on first close — keep the original date.
          closedAt: existing.closedAt ?? sql`now()`,
        })
        .where(eq(monthSheets.id, existing.id))
        .execute();

      return { id: existing.id };
    }
  );
}
