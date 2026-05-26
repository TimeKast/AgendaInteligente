/**
 * Zod schemas for DaySheet actions (ISSUE-030).
 *
 * Legacy fields (intention, gratitude, evening_win, evening_lesson,
 * tomorrow_top, insight, energy_*) are stripped silently by Zod's default
 * unknown-keys behaviour — no error, no persistence. Spec calls for
 * "strip silencioso" (06_DATA_MODEL.md §E-020 reconciliation).
 */

import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)');

const textOptional = z.string().trim().max(2000).nullable().optional();
const shortTextOptional = z.string().trim().max(500).nullable().optional();

export const updateDaySheetSchema = z.object({
  /** ISO date string in user TZ — caller resolves TZ before invoking. */
  date: isoDate,

  /** Morning ritual fields. All optional — caller may patch one at a time. */
  identityStatement: textOptional,
  winsPlanned: z
    .array(z.string().trim().min(1).max(200))
    .max(3, 'Máximo 3 wins')
    .nullable()
    .optional(),
  avoidance: textOptional,

  /** Evening ritual one-liner. */
  closeSummary: shortTextOptional,

  /** Pre-morning notes. */
  notesDreams: textOptional,
});

export type UpdateDaySheetInput = z.infer<typeof updateDaySheetSchema>;
