/**
 * Zod schemas for Goal server actions (ISSUE-040).
 *
 * Schema → DB shape mapping in `src/lib/db/schema/goals.ts` (E-010).
 *
 * Conditional deadline rule (CREATE only):
 *   - `quarter` + `year` → deadline REQUIRED
 *   - `5year` + `life`   → deadline OPTIONAL
 *
 * Enforced in CREATE via `.superRefine`. UPDATE does NOT re-validate this
 * invariant because:
 *   1. The AC ("Create yearly goal sin deadline rejected") only mentions
 *      create.
 *   2. Validating on update requires reading the existing row + merging
 *      pending fields, which inflates the action surface.
 *   3. The DB CHECK constraints already guarantee scope/status validity
 *      at write time, so a malformed update fails loudly at the SQL layer.
 *   If real flows reveal "year goal lost its deadline via update" bugs,
 *   add a merge-and-validate pass in `updateGoal` (mirror DaySheet).
 *
 * Linked: BR-6, BR-9.
 */

import { z } from 'zod';
import { GOAL_SCOPES, GOAL_STATUSES } from '@/lib/db/schema/goals';

const idSchema = z.string().uuid('ID de meta inválido');

const titleSchema = z
  .string()
  .trim()
  .min(1, 'El título es requerido')
  .max(200, 'Máximo 200 caracteres');

const descriptionSchema = z
  .string()
  .trim()
  .max(2000, 'Máximo 2000 caracteres')
  .nullable()
  .optional();

const scopeSchema = z.enum(GOAL_SCOPES, {
  message: 'Scope inválido — usa quarter, year, 5year o life',
});

const statusSchema = z.enum(GOAL_STATUSES, {
  message: 'Status inválido',
});

const deadlineSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Deadline debe ser YYYY-MM-DD')
  .nullable()
  .optional();

const reviewScoreSchema = z
  .number()
  .int('review_score debe ser entero')
  .min(1, 'Mínimo 1')
  .max(10, 'Máximo 10')
  .nullable()
  .optional();

const reviewNotesSchema = z
  .string()
  .trim()
  .max(4000, 'Máximo 4000 caracteres')
  .nullable()
  .optional();

const freeTextSchema = z.string().trim().max(2000).nullable().optional();

/**
 * Scopes that require a deadline at create time. 5year/life are
 * deliberately open-ended (deadline-less long-horizon goals are valid).
 */
const SCOPES_REQUIRING_DEADLINE: ReadonlySet<(typeof GOAL_SCOPES)[number]> = new Set([
  'quarter',
  'year',
]);

export const createGoalSchema = z
  .object({
    title: titleSchema,
    description: descriptionSchema,
    scope: scopeSchema,
    deadline: deadlineSchema,
    outcomeExpected: freeTextSchema,
    notesCost: freeTextSchema,
  })
  .superRefine((data, ctx) => {
    if (SCOPES_REQUIRING_DEADLINE.has(data.scope) && !data.deadline) {
      ctx.addIssue({
        code: 'custom',
        path: ['deadline'],
        message: `Deadline requerido para scope "${data.scope}"`,
      });
    }
  });

export const updateGoalSchema = z.object({
  id: idSchema,
  title: titleSchema.optional(),
  description: descriptionSchema,
  scope: scopeSchema.optional(),
  deadline: deadlineSchema,
  outcomeExpected: freeTextSchema,
  notesCost: freeTextSchema,
  status: statusSchema.optional(),
  reviewScore: reviewScoreSchema,
  reviewNotes: reviewNotesSchema,
});

export const deleteGoalSchema = z.object({
  id: idSchema,
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type DeleteGoalInput = z.infer<typeof deleteGoalSchema>;
