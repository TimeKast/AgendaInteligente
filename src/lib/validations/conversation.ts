/**
 * Zod schemas for Conversation / Message server actions — ISSUE-051.
 */

import { z } from 'zod';
import {
  CONVERSATION_CHANNELS,
  LINKED_SHEET_TYPES,
  MESSAGE_ROLES,
} from '@/lib/db/schema/conversations';

const idSchema = z.string().uuid('ID inválido');

export const getOrCreateConversationSchema = z.object({
  channel: z.enum(CONVERSATION_CHANNELS).optional(),
  linkedSheetType: z.enum(LINKED_SHEET_TYPES).optional(),
  linkedSheetId: idSchema.optional(),
});

export const appendMessageSchema = z.object({
  conversationId: idSchema,
  role: z.enum(MESSAGE_ROLES),
  content: z.string().min(1, 'content vacío').max(20000, 'mensaje demasiado largo'),
  audioUrl: z.string().url().nullable().optional(),
  challengesFired: z.array(z.string().min(1).max(64)).max(10).optional(),
  toolCalls: z.unknown().optional(),
});

export const closeConversationSchema = z.object({
  conversationId: idSchema,
});

export const listMessagesSchema = z.object({
  conversationId: idSchema,
  limit: z.number().int().min(1).max(200).optional(),
  /** ISO timestamp — return messages strictly before this. Cursor pagination. */
  before: z.string().datetime().optional(),
});

export type GetOrCreateConversationInput = z.infer<typeof getOrCreateConversationSchema>;
export type AppendMessageInput = z.infer<typeof appendMessageSchema>;
export type CloseConversationInput = z.infer<typeof closeConversationSchema>;
export type ListMessagesInput = z.infer<typeof listMessagesSchema>;
