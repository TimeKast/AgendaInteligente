/**
 * Zod schema for the updateNotificationPrefs server action.
 *
 * Lives outside the `'use server'` action file because Next.js 16+ rejects
 * any non-async export from action files at runtime
 * ("A 'use server' file can only export async functions").
 */

import { z } from 'zod';

const hhmm = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Hora inválida (HH:mm)');
const dow = z.number().int().min(0).max(6);

export const updateNotificationPrefsSchema = z.object({
  morningTime: hhmm.optional(),
  middayTime: hhmm.optional(),
  eveningTime: hhmm.optional(),
  weeklyKickoffDow: dow.optional(),
  weeklyKickoffTime: hhmm.optional(),
  weeklyReviewDow: dow.optional(),
  weeklyReviewTime: hhmm.optional(),
  weekendSkip: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  contactChannels: z.array(z.enum(['email', 'discord', 'whatsapp'])).optional(),
});

export type UpdateNotificationPrefsInput = z.infer<typeof updateNotificationPrefsSchema>;
