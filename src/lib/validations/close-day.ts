/**
 * Zod schemas for the closeDay server action.
 *
 * Lives outside the `'use server'` action file because Next.js 16+ rejects
 * any non-async export from action files at runtime
 * ("A 'use server' file can only export async functions"). The action
 * imports its schema from here.
 */

import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)');

const closeDayActivitySchema = z.object({
  id: z.string().uuid(),
  outcome: z.enum(['done', 'partial', 'missed']),
  /** 0-100. Only meaningful when outcome === 'partial'. */
  partialPct: z.number().int().min(0).max(100).optional(),
  /**
   * Only meaningful when outcome === 'done'. True = the activity is
   * also fully closed (no more iterations) — informational.
   */
  closed: z.boolean().optional(),
});

export const closeDaySchema = z.object({
  date: isoDate,
  activities: z.array(closeDayActivitySchema).max(200),
  oneLine: z.string().trim().max(500).default(''),
});

export type CloseDayInput = z.infer<typeof closeDaySchema>;

export interface CloseDayResult {
  daySheetId: string;
  transitioned: number;
  /** Non-fatal failures per activity, surfaced to the UI but non-blocking. */
  partialErrors: Array<{ activityId: string; error: string }>;
}
