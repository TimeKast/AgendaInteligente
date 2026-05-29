/**
 * Zod schemas for onboarding step actions (ISSUE-006).
 *
 * Each step updates a focused slice of the user profile or notification
 * preferences. Step 8 (`finalize`) has no payload — it triggers the atomic
 * creation of Inbox + Subscription + completion timestamp.
 *
 * Linked: FT-004, US-005, SCR-010..017.
 */

import { z } from 'zod';

const hhmm = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Hora inválida (HH:mm)');

export const setLanguageSchema = z.object({
  language: z.enum(['es', 'en']),
});

export const setTimezoneSchema = z.object({
  timezone: z
    .string()
    .min(1)
    .max(64)
    // IANA TZ identifiers are alphanumerics + `/_-+`. Keep the validator
    // loose; runtime lookup will reject unknown zones.
    .regex(/^[A-Za-z0-9_\-+/]+$/, 'Zona horaria inválida'),
});

export const setPushPrefSchema = z.object({
  /** true = user accepted browser push permission; false = declined/skipped. */
  pushEnabled: z.boolean(),
});

export const setMicPrefSchema = z.object({
  micEnabled: z.boolean(),
});

export const CONTACT_CHANNELS = ['email', 'discord', 'whatsapp'] as const;
export type ContactChannel = (typeof CONTACT_CHANNELS)[number];

export const setOnboardingContextSchema = z.object({
  context: z.string().trim().min(1, 'Cuéntanos algo').max(2000, 'Máximo 2000 caracteres'),
  /**
   * Channels the user wants the agent to reach out on. Empty array →
   * defaults to ['email'] at the action layer so the user never ends
   * up unreachable.
   */
  contactChannels: z.array(z.enum(CONTACT_CHANNELS)).default([]),
});

export const setDiscordWebhookSchema = z.object({
  /**
   * Discord webhook URL. NULL/empty clears it. Otherwise must look
   * like a Discord webhook (https://discord.com/api/webhooks/...).
   */
  webhookUrl: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null))
    .refine(
      (v) =>
        v === null ||
        /^https:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/.test(v),
      'URL inválida — pega el webhook completo desde Discord (Server Settings → Integrations → Webhooks)'
    ),
});

export const setScheduleSchema = z.object({
  morningTime: hhmm,
  middayTime: hhmm,
  eveningTime: hhmm,
});

export const setCalendarOptInSchema = z.object({
  /** 'now' redirects to Google OAuth; 'later' just records the choice. */
  choice: z.enum(['now', 'later']),
});

// finalize takes no payload — it's a trigger.
export const finalizeOnboardingSchema = z.object({}).strict();

export type SetDiscordWebhookInput = z.infer<typeof setDiscordWebhookSchema>;
export type SetLanguageInput = z.infer<typeof setLanguageSchema>;
export type SetTimezoneInput = z.infer<typeof setTimezoneSchema>;
export type SetPushPrefInput = z.infer<typeof setPushPrefSchema>;
export type SetMicPrefInput = z.infer<typeof setMicPrefSchema>;
export type SetOnboardingContextInput = z.infer<typeof setOnboardingContextSchema>;
export type SetScheduleInput = z.infer<typeof setScheduleSchema>;
export type SetCalendarOptInInput = z.infer<typeof setCalendarOptInSchema>;
