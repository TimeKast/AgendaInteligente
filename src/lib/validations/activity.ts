/**
 * Zod schemas for Activity server actions (ISSUE-013).
 *
 * Schema → DB shape in `src/lib/db/schema/activities.ts` (E-005).
 *
 * Cross-field invariants enforced here:
 *   - BR-15: `scheduled_dates` normalized to unique + ascending order
 *   - BR-16: `duration_minutes` requires `scheduled_time` to be set
 *
 * NOT enforced here:
 *   - BR-17 (status='done' → progress_percent=100) — applied in the server
 *     action because the refine has no way to distinguish "user passed
 *     progress=60 with done" from "user passed progress=undefined with
 *     done"; the action sets it explicitly.
 *
 * Linked: BR-15, BR-16, BR-17.
 */

import { z } from 'zod';
import { ACTIVITY_STATUSES, ACTIVITY_REASON_CATEGORIES } from '@/lib/db/schema/activities';
import { parseRecurrenceRule } from '@/lib/domain/recurrence';

const idSchema = z.string().uuid('ID inválido');
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)');
const hhmm = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Hora inválida (HH:mm)');
const isoDateTime = z.string().datetime({ offset: true }).or(z.date());

/**
 * Recurrence DSL — validates against the parser in
 * `src/lib/domain/recurrence.ts` (single source of truth, BR-11).
 * Legacy iCal-style strings (`FREQ=…`) get a friendlier error message
 * because older clients may still attempt them.
 */
const recurrenceSchema = z
  .string()
  .nullable()
  .optional()
  .superRefine((val, ctx) => {
    if (val === null || val === undefined) return;
    if (parseRecurrenceRule(val) !== null) return;
    ctx.addIssue({
      code: 'custom',
      message: /^FREQ=/i.test(val)
        ? 'Usa el DSL simplificado (daily | weekly:DAYS | monthly:N | monthly:last) — no iCal RRULE'
        : 'DSL de recurrencia inválido (ej: daily | weekly:MO,WE | monthly:1 | monthly:last)',
    });
  });

const titleSchema = z
  .string()
  .trim()
  .min(1, 'El título es requerido')
  .max(200, 'Máximo 200 caracteres');
const descriptionSchema = z.string().trim().max(2000).nullable().optional();
const reasonNotDoneSchema = z.string().trim().max(500).nullable().optional();
const reasonCategorySchema = z.enum(ACTIVITY_REASON_CATEGORIES).nullable().optional();

/**
 * BR-15 transformer: dedupes + sorts asc.
 * Empty array stays empty (= pool/backlog row).
 */
const scheduledDatesSchema = z
  .array(isoDate)
  .max(366, 'Máximo 366 fechas por actividad')
  .default([])
  .transform((arr) => Array.from(new Set(arr)).sort());

const baseFields = {
  title: titleSchema,
  description: descriptionSchema,
  projectId: idSchema.optional(),
  scheduledDates: scheduledDatesSchema.optional(),
  scheduledTime: hhmm.nullable().optional(),
  durationMinutes: z.number().int().positive('La duración debe ser positiva').nullable().optional(),
  deadline: isoDateTime.nullable().optional(),
  estimatedMinutes: z.number().int().positive().nullable().optional(),
  priority: z.number().int().min(1).max(5).default(3),
  quadrant: z.number().int().min(1).max(4).nullable().optional(),
  progressPercent: z.number().int().min(0).max(100).nullable().optional(),
  recurrenceRule: recurrenceSchema,
  status: z.enum(ACTIVITY_STATUSES).default('pending'),
  reasonNotDone: reasonNotDoneSchema,
  reasonCategory: reasonCategorySchema,
  tags: z
    .array(z.string().trim().min(1).max(40))
    .max(20, 'Máximo 20 tags')
    .default([])
    .transform((arr) => Array.from(new Set(arr.map((t) => t.toLowerCase()))).sort()),
};

/**
 * BR-16 refine: durationMinutes requires scheduledTime.
 * Applied at the schema level so both create AND update reject the
 * invalid combination at the boundary (no round-trip to the DB).
 */
const br16Refine = <T extends { durationMinutes?: number | null; scheduledTime?: string | null }>(
  schema: z.ZodType<T>
) =>
  schema.refine(
    (data) =>
      data.durationMinutes === null ||
      data.durationMinutes === undefined ||
      (data.scheduledTime !== null && data.scheduledTime !== undefined),
    {
      message: 'duration_minutes requiere scheduled_time (BR-16)',
      path: ['durationMinutes'],
    }
  );

export const createActivitySchema = br16Refine(z.object(baseFields));

// Update-mode versions of array transforms — distinct from create because
// `.default([])` would fire on undefined input and accidentally write empty
// arrays during a no-op patch.
const scheduledDatesUpdateSchema = z
  .array(isoDate)
  .max(366)
  .optional()
  .transform((arr) => (arr === undefined ? undefined : Array.from(new Set(arr)).sort()));

const tagsUpdateSchema = z
  .array(z.string().trim().min(1).max(40))
  .max(20)
  .optional()
  .transform((arr) =>
    arr === undefined ? undefined : Array.from(new Set(arr.map((t) => t.toLowerCase()))).sort()
  );

export const updateActivitySchema = br16Refine(
  z.object({
    id: idSchema,
    title: titleSchema.optional(),
    description: descriptionSchema,
    projectId: idSchema.optional(),
    scheduledDates: scheduledDatesUpdateSchema,
    scheduledTime: hhmm.nullable().optional(),
    durationMinutes: z.number().int().positive().nullable().optional(),
    deadline: isoDateTime.nullable().optional(),
    estimatedMinutes: z.number().int().positive().nullable().optional(),
    priority: z.number().int().min(1).max(5).optional(),
    quadrant: z.number().int().min(1).max(4).nullable().optional(),
    progressPercent: z.number().int().min(0).max(100).nullable().optional(),
    recurrenceRule: recurrenceSchema,
    status: z.enum(ACTIVITY_STATUSES).optional(),
    reasonNotDone: reasonNotDoneSchema,
    reasonCategory: reasonCategorySchema,
    tags: tagsUpdateSchema,
  })
);

export const deleteActivitySchema = z.object({
  id: idSchema,
});

/**
 * ISSUE-017 — guarded state-machine transition. The action validates the
 * BR-8 matrix (see `lib/domain/activity-transitions.ts`) and the reason
 * requirements (textRequired for `blocked`).
 *
 * `reasonCategory` is the structured enum (time | priority | blocked |
 * didnt_want | other), `reasonText` is free-form user input.
 */
export const transitionActivitySchema = z.object({
  id: idSchema,
  toStatus: z.enum(ACTIVITY_STATUSES),
  reasonCategory: reasonCategorySchema,
  reasonText: z.string().trim().max(500, 'Máximo 500 caracteres').nullable().optional(),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type DeleteActivityInput = z.infer<typeof deleteActivitySchema>;
export type TransitionActivityInput = z.infer<typeof transitionActivitySchema>;

/**
 * Input for `listActivities` — the Today screen's anchor query.
 *
 * `date` is the user's local YYYY-MM-DD; the action computes pool /
 * scheduled split from `scheduled_dates` relative to it. `includeDone`
 * defaults to true so closed days still render; the Today view passes
 * false when only the live-work list is wanted.
 */
export const listActivitiesSchema = z.object({
  date: isoDate,
  includeDone: z.boolean().default(true),
  includeDeleted: z.boolean().default(false),
});
export type ListActivitiesInput = z.infer<typeof listActivitiesSchema>;
