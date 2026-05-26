/**
 * Zod schemas for Project server actions (ISSUE-012).
 *
 * Schema → DB shape in `src/lib/db/schema/projects.ts` (E-004).
 * Status enum mirrors `PROJECT_STATUSES`.
 *
 * Linked: BR-2, BR-3.
 */

import { z } from 'zod';
import { PROJECT_STATUSES } from '@/lib/db/schema/projects';

const idSchema = z.string().uuid('ID inválido');

const nameSchema = z
  .string()
  .trim()
  .min(1, 'El nombre es requerido')
  .max(80, 'Máximo 80 caracteres');

const descriptionSchema = z
  .string()
  .trim()
  .max(2000, 'Máximo 2000 caracteres')
  .nullable()
  .optional();

const deadlineSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (usá YYYY-MM-DD)')
  .nullable()
  .optional();

const outcomeSchema = z.string().trim().max(500, 'Máximo 500 caracteres').nullable().optional();

const statusSchema = z.enum(PROJECT_STATUSES);

export const createProjectSchema = z.object({
  categoryId: idSchema,
  name: nameSchema,
  description: descriptionSchema,
  deadline: deadlineSchema,
  outcomeExpected: outcomeSchema,
});

export const updateProjectSchema = z.object({
  id: idSchema,
  name: nameSchema.optional(),
  description: descriptionSchema,
  deadline: deadlineSchema,
  outcomeExpected: outcomeSchema,
  /** Optional category move. */
  categoryId: idSchema.optional(),
});

export const transitionProjectStatusSchema = z.object({
  id: idSchema,
  newStatus: statusSchema,
  /**
   * Optional free-text reason. Used today only for telemetry / agent context
   * when transitioning to 'killed' — not persisted (E-004 has no column).
   */
  reason: z.string().trim().max(500).nullable().optional(),
});

export const deleteProjectSchema = z.object({
  id: idSchema,
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type TransitionProjectStatusInput = z.infer<typeof transitionProjectStatusSchema>;
export type DeleteProjectInput = z.infer<typeof deleteProjectSchema>;
