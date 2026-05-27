/**
 * Zod schema for the chat SSE route — ISSUE-052.
 */

import { z } from 'zod';
import { LINKED_SHEET_TYPES } from '@/lib/db/schema/conversations';

export const chatRequestSchema = z.object({
  conversationId: z.string().uuid().optional(),
  linkedSheetType: z.enum(LINKED_SHEET_TYPES).optional(),
  linkedSheetId: z.string().uuid().optional(),
  message: z.string().min(1).max(20000),
});

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;
