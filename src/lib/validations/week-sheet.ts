/**
 * Zod schemas for WeekSheet server actions.
 *
 * v1 wire scope: kickoff text fields (one_thing, three_wins,
 * learn_one, avoid_one, plus the review one-sentence at week close).
 * Complex JSONB shapes (calendar_blocks, people_to_connect, self_care,
 * review_post_mortem) defer to follow-ups — schema accepts them but
 * the UI doesn't expose editors yet.
 */

import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)');

export const updateWeekSheetSchema = z.object({
  weekStarting: isoDate,
  oneThing: z.string().trim().max(500).nullable().optional(),
  threeWins: z.array(z.string().trim().min(1).max(200)).max(3).optional(),
  learnOne: z.string().trim().max(500).nullable().optional(),
  avoidOne: z.string().trim().max(500).nullable().optional(),
  reviewOneSentence: z.string().trim().max(500).nullable().optional(),
  reviewEnergy: z.number().int().min(1).max(10).nullable().optional(),
});
export type UpdateWeekSheetInput = z.infer<typeof updateWeekSheetSchema>;
