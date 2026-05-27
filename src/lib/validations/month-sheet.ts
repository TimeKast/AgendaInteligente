/**
 * Zod schemas for MonthSheet server actions — ISSUE-131.
 */

import { z } from 'zod';

const monthStartingSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'monthStarting must be YYYY-MM-DD');

const themeSchema = z.string().trim().min(1).max(80);

export const updateMonthSheetSchema = z.object({
  monthStarting: monthStartingSchema,
  goals: z.string().trim().max(4000).nullable().optional(),
  themes: z.array(themeSchema).max(5).optional(),
  closeSummary: z.string().trim().max(4000).nullable().optional(),
});

export const closeMonthSchema = z.object({
  monthStarting: monthStartingSchema,
  closeSummary: z.string().trim().min(1).max(4000),
});

export type UpdateMonthSheetInput = z.infer<typeof updateMonthSheetSchema>;
export type CloseMonthInput = z.infer<typeof closeMonthSchema>;
