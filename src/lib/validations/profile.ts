/**
 * Profile Validation Schema
 *
 * Zod schema for user profile updates.
 */

import { z } from 'zod';

export const profileSchema = z.object({
  name: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length >= 1, { message: 'El nombre es requerido' })
    .refine((val) => val.length <= 100, { message: 'El nombre no puede exceder 100 caracteres' }),
});

export type ProfileInput = z.infer<typeof profileSchema>;
