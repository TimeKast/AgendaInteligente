'use server';

/**
 * Conversation + Message server actions — ISSUE-051.
 *
 * Threading: `getOrCreateConversation` collapses to a single OPEN
 * conversation per `(user, channel, linked_sheet_type, linked_sheet_id)`.
 * Calling it twice the same day with the same context returns the same
 * id — never opens duplicate threads.
 *
 * Messages have no `user_id` column (ownership derived from the parent
 * conversation, mirror subtask / goal-link pattern). ESLint allowlisted.
 *
 * Linked: FT-050, AI-9, E-030, E-031.
 */

import { and, desc, eq, isNull, lt, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  conversations,
  messages,
  type Conversation,
  type Message,
} from '@/lib/db/schema/conversations';
import { scopedDb } from '@/lib/db/scoped';
import { withSelf } from '@/lib/actions/helpers';
import { ActionError, type ActionResult } from '@/lib/actions/types';
import {
  getOrCreateConversationSchema,
  appendMessageSchema,
  closeConversationSchema,
  listMessagesSchema,
} from '@/lib/validations/conversation';

/**
 * Get the currently-open conversation for `(user, channel, linkedSheet)`
 * or create one. "Open" = `ended_at IS NULL`. A closed conversation does
 * NOT collide — opening a new one returns a fresh row.
 */
export async function getOrCreateConversation(
  input: unknown
): Promise<ActionResult<{ id: string; created: boolean }>> {
  return await withSelf({ schema: getOrCreateConversationSchema }, input, async (data, userId) => {
    const channel = data.channel ?? 'in_app_chat';
    const sdb = scopedDb(userId);

    // Build the equality predicate: same channel + same linked context.
    // NULLs need IS NULL — `eq()` doesn't.
    const linkedTypeMatch =
      data.linkedSheetType !== undefined
        ? eq(conversations.linkedSheetType, data.linkedSheetType)
        : isNull(conversations.linkedSheetType);
    const linkedIdMatch =
      data.linkedSheetId !== undefined
        ? eq(conversations.linkedSheetId, data.linkedSheetId)
        : isNull(conversations.linkedSheetId);

    const existing = await sdb.select(
      'conversations',
      and(
        eq(conversations.channel, channel),
        linkedTypeMatch,
        linkedIdMatch,
        isNull(conversations.endedAt)
      )
    );
    if (existing.length > 0) {
      return { id: existing[0].id, created: false };
    }

    const inserted = await sdb
      .insert('conversations', {
        channel,
        linkedSheetType: data.linkedSheetType ?? null,
        linkedSheetId: data.linkedSheetId ?? null,
      })
      .returning({ id: conversations.id });

    return { id: inserted[0].id, created: true };
  });
}

/**
 * Append a message to a conversation. Verifies the conversation belongs
 * to the caller (cross-tenant message injection → 404).
 */
export async function appendMessage(input: unknown): Promise<ActionResult<{ id: string }>> {
  return await withSelf({ schema: appendMessageSchema }, input, async (data, userId) => {
    const sdb = scopedDb(userId);
    const ownerCheck = await sdb.select('conversations', eq(conversations.id, data.conversationId));
    if (ownerCheck.length === 0) {
      throw new ActionError('Conversación no encontrada');
    }

    const inserted = await db
      .insert(messages)
      .values({
        conversationId: data.conversationId,
        role: data.role,
        content: data.content,
        audioUrl: data.audioUrl ?? null,
        challengesFired: data.challengesFired ?? [],
        toolCalls: (data.toolCalls ?? null) as never,
      })
      .returning({ id: messages.id });

    return { id: inserted[0].id };
  });
}

/**
 * Mark a conversation closed. Idempotent: re-close on an already-closed
 * row is a no-op (we don't overwrite `ended_at`).
 */
export async function closeConversation(input: unknown): Promise<ActionResult> {
  return await withSelf({ schema: closeConversationSchema }, input, async (data, userId) => {
    const sdb = scopedDb(userId);
    const existing = await sdb.select('conversations', eq(conversations.id, data.conversationId));
    if (existing.length === 0) {
      throw new ActionError('Conversación no encontrada');
    }
    if (existing[0].endedAt) {
      return; // already closed
    }
    await sdb
      .update('conversations', { endedAt: sql`now()` })
      .where(eq(conversations.id, data.conversationId))
      .execute();
  });
}

/**
 * Cursor-paginated message list. Returns up to `limit` messages strictly
 * older than `before` (ISO timestamp), DESC then reversed so the caller
 * gets chronological order for rendering.
 *
 * Returns the next cursor (oldest `created_at` in the page) so the UI
 * can infinite-scroll.
 */
export async function listMessages(
  input: unknown
): Promise<ActionResult<{ messages: Message[]; nextCursor: string | null }>> {
  return await withSelf({ schema: listMessagesSchema }, input, async (data, userId) => {
    const sdb = scopedDb(userId);
    const ownerCheck = await sdb.select('conversations', eq(conversations.id, data.conversationId));
    if (ownerCheck.length === 0) {
      throw new ActionError('Conversación no encontrada');
    }

    const limit = data.limit ?? 50;
    const beforeDate = data.before ? new Date(data.before) : null;

    const rows = await db
      .select()
      .from(messages)
      .where(
        beforeDate
          ? and(
              eq(messages.conversationId, data.conversationId),
              lt(messages.createdAt, beforeDate)
            )
          : eq(messages.conversationId, data.conversationId)
      )
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    const chronological = rows.slice().reverse();
    const nextCursor = rows.length === limit ? rows[rows.length - 1].createdAt.toISOString() : null;

    return { messages: chronological, nextCursor };
  });
}

// Re-export types for callers that don't want to import from schema directly.
export type { Conversation, Message };
