/**
 * Zod schemas for Subtask server actions (ISSUE-015).
 *
 * Subtasks live INSIDE an activity (E-006). Every action takes an
 * `activityId` so the server can verify activity ownership before
 * touching the child rows — multi-tenant isolation is enforced via the
 * activity, not on the subtask row itself.
 *
 * Linked: BR-5, FT-013.
 */

import { z } from 'zod';

const idSchema = z.string().uuid('ID inválido');
const titleSchema = z
  .string()
  .trim()
  .min(1, 'El título es requerido')
  .max(200, 'Máximo 200 caracteres');

export const createSubtaskSchema = z.object({
  activityId: idSchema,
  title: titleSchema,
});

export const toggleSubtaskSchema = z.object({
  activityId: idSchema,
  id: idSchema,
});

export const deleteSubtaskSchema = z.object({
  activityId: idSchema,
  id: idSchema,
});

export const reorderSubtasksSchema = z.object({
  activityId: idSchema,
  orderedIds: z
    .array(idSchema)
    .min(2, 'Necesitas al menos 2 subtasks para reordenar')
    .max(100)
    .refine((arr) => new Set(arr).size === arr.length, { message: 'IDs duplicados' }),
});

export type CreateSubtaskInput = z.infer<typeof createSubtaskSchema>;
export type ToggleSubtaskInput = z.infer<typeof toggleSubtaskSchema>;
export type DeleteSubtaskInput = z.infer<typeof deleteSubtaskSchema>;
export type ReorderSubtasksInput = z.infer<typeof reorderSubtasksSchema>;
