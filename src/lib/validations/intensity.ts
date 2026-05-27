/**
 * Zod schema for setIntensityMode — ISSUE-054.
 */

import { z } from 'zod';

const INTENSITY_MODES = ['sharp', 'standard', 'gentle', 'listening'] as const;
export type IntensityMode = (typeof INTENSITY_MODES)[number];

export const setIntensityModeSchema = z.object({
  mode: z.enum(INTENSITY_MODES, {
    message: 'Intensidad inválida — usa sharp, standard, gentle o listening',
  }),
});

export type SetIntensityModeInput = z.infer<typeof setIntensityModeSchema>;
