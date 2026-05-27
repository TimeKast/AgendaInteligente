/**
 * Zod schemas for GoalLink server actions (ISSUE-041).
 *
 * Polymorphic target validation: the target_type enum is enforced by the
 * DB CHECK; the schema mirrors it for early rejection at the action
 * boundary (descriptive error vs SQL constraint failure).
 *
 * `target_id` is a UUID at the schema level — the polymorphic FK lives
 * in app code (linkGoal verifies the row exists in projects/activities
 * AND belongs to the user via scopedDb).
 *
 * Linked: BR-6, E-011.
 */

import { z } from 'zod';
import { GOAL_LINK_TARGET_TYPES } from '@/lib/db/schema/goal-links';

const idSchema = z.string().uuid('ID inválido');

const targetTypeSchema = z.enum(GOAL_LINK_TARGET_TYPES, {
  message: 'target_type debe ser "project" o "activity"',
});

export const linkGoalSchema = z.object({
  goalId: idSchema,
  targetType: targetTypeSchema,
  targetId: idSchema,
});

export const unlinkGoalSchema = z.object({
  linkId: idSchema,
});

export const listLinkedGoalsSchema = z.object({
  targetType: targetTypeSchema,
  targetId: idSchema,
});

export type LinkGoalInput = z.infer<typeof linkGoalSchema>;
export type UnlinkGoalInput = z.infer<typeof unlinkGoalSchema>;
export type ListLinkedGoalsInput = z.infer<typeof listLinkedGoalsSchema>;
