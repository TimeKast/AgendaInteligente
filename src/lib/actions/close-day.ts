'use server';

/**
 * closeDay orchestrator (ISSUE-031 wire).
 *
 * One server entry point for the evening close-day flow:
 *   1. For every activity row in the payload, transition its status
 *      (done | partial → in_progress at pct | missed → skipped) and
 *      update progress accordingly.
 *   2. Write the one-line `close_summary` to the user's DaySheet for
 *      that date (`updateDaySheet` auto-stamps `evening_completed_at`).
 *
 * All sub-operations route through the existing scoped actions, so
 * tenant isolation + BR-17 (status=done → progress=100) come for free.
 *
 * Errors are accumulated and returned in `partialErrors` instead of
 * aborting on first failure: a stuck transition shouldn't block the
 * user from saving their summary. The caller surfaces the count.
 *
 * Linked: ISSUE-031, BR-7, BR-8, BR-17.
 */

import { withSelf } from '@/lib/actions/helpers';
import type { ActionResult } from '@/lib/actions/types';
import { transitionActivity, updateActivity } from '@/lib/actions/activity';
import { updateDaySheet } from '@/lib/actions/day-sheet';
import { closeDaySchema, type CloseDayResult } from '@/lib/validations/close-day';

export async function closeDay(input: unknown): Promise<ActionResult<CloseDayResult>> {
  return await withSelf({ schema: closeDaySchema, revalidate: '/today' }, input, async (data) => {
    const partialErrors: Array<{ activityId: string; error: string }> = [];
    let transitioned = 0;

    for (const a of data.activities) {
      if (a.outcome === 'done') {
        const r = await transitionActivity({ id: a.id, toStatus: 'done' });
        if (r.error) {
          partialErrors.push({ activityId: a.id, error: r.error });
          continue;
        }
        transitioned++;
        continue;
      }

      if (a.outcome === 'partial') {
        // Partial: bump progress + keep status in_progress (or leave as
        // pending if the user never started). updateActivity handles
        // BR-17 on the merged status.
        const r = await updateActivity({
          id: a.id,
          progressPercent: a.partialPct ?? 50,
        });
        if (r.error) {
          partialErrors.push({ activityId: a.id, error: r.error });
          continue;
        }
        transitioned++;
        continue;
      }

      // outcome === 'missed' → mark cancelled. Used to be 'skipped' but
      // that state was retired in migration 0030 — "didn't do it" reads
      // as cancellation now, and the row stops surfacing in lists.
      const r = await transitionActivity({ id: a.id, toStatus: 'cancelled' });
      if (r.error) {
        partialErrors.push({ activityId: a.id, error: r.error });
        continue;
      }
      transitioned++;
    }

    // Always write the summary, even when `oneLine` is empty — the
    // DaySheet write stamps `evening_completed_at` and locks the close.
    const sheet = await updateDaySheet({
      date: data.date,
      closeSummary: data.oneLine,
    });
    if (sheet.error || !sheet.data) {
      return {
        daySheetId: '',
        transitioned,
        partialErrors: [
          ...partialErrors,
          { activityId: '__day_sheet__', error: sheet.error ?? 'day_sheet_failed' },
        ],
      };
    }

    return {
      daySheetId: sheet.data.id,
      transitioned,
      partialErrors,
    };
  });
}
