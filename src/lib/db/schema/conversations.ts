/**
 * Conversations + Messages Schemas — E-030 / E-031 per 06_DATA_MODEL.md.
 *
 * Threading model: 1 Conversation per `(user_id, channel, context-day)`.
 * The "context-day" pair is encoded by `linked_sheet_type` +
 * `linked_sheet_id`. The morning check-in on 2026-05-19 is one row
 * (linked to that day's DaySheet); the weekly kickoff for week starting
 * 2026-05-17 is another row (linked to that WeekSheet).
 *
 * `linked_sheet_id` is polymorphic by `linked_sheet_type` — no FK at the
 * DB level. The actions enforce ownership via `scopedDb('daySheets' |
 * 'weekSheets')` before touching the conversation.
 *
 * `linked_proactive_task_id` is reserved for ISSUE-082 (ProactiveTask
 * entity). No FK now — added in a later migration once that table exists.
 *
 * Messages live in `goal_links`-style ownership: no `user_id` column —
 * derived from `conversation_id → conversations.user_id`. ESLint
 * allowlist on the actions file (mirror subtask / goal-link pattern).
 *
 * Linked: FT-050, AI-9, US-050.
 */

import { pgTable, text, uuid, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    /** in_app_chat | in_app_voice (extend in v2 with whatsapp/sms). */
    channel: text('channel').notNull().default('in_app_chat'),

    startedAt: timestamp('started_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),

    /** NULL = still open. Set by `closeConversation`. */
    endedAt: timestamp('ended_at', { mode: 'date', withTimezone: true }),

    /** day | week | quarter | year | 5year | life (NULL for unscoped chats). */
    linkedSheetType: text('linked_sheet_type'),

    /** Polymorphic ID — no FK. App-layer validates ownership. */
    linkedSheetId: uuid('linked_sheet_id'),

    /** ProactiveTask trigger (ISSUE-082). NULL until that issue lands. */
    linkedProactiveTaskId: uuid('linked_proactive_task_id'),

    /**
     * AI-8 crisis exit timestamp. Stamped by the chat route when EITHER
     * the regex pre-filter OR the LLM tool call fires. NULL = no crisis
     * detected on this thread. Tracked here (not on messages) so the
     * thread carries the safety signal forward — a user returning to a
     * flagged conversation gets the crisis panel re-rendered.
     */
    crisisExitAt: timestamp('crisis_exit_at', { mode: 'date', withTimezone: true }),
  },
  (table) => [
    // "List my recent chats" hot path.
    index('conversations_user_started_desc_idx').on(table.userId, table.startedAt),
  ]
);

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),

    /** 'user' | 'agent' — CHECK in migration. */
    role: text('role').notNull(),

    content: text('content').notNull(),

    /** If the user message was voice, this points to the audio blob. */
    audioUrl: text('audio_url'),

    /**
     * Subset of {vague_language, repeat, identity, cost, reality}. The
     * agent records which challenge patterns it fired so we can
     * dashboard them (AI-9 telemetry).
     */
    challengesFired: text('challenges_fired').array().notNull().default([]),

    /**
     * If the agent message included tool_use blocks, the parsed calls
     * land here for replay / audit. Shape: `{ name, input, id }[]`.
     */
    toolCalls: jsonb('tool_calls'),

    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Pagination cursor: WHERE conversation_id = ? ORDER BY created_at.
    index('messages_conversation_created_idx').on(table.conversationId, table.createdAt),
  ]
);

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export const CONVERSATION_CHANNELS = ['in_app_chat', 'in_app_voice'] as const;
export type ConversationChannel = (typeof CONVERSATION_CHANNELS)[number];

export const LINKED_SHEET_TYPES = ['day', 'week', 'quarter', 'year', '5year', 'life'] as const;
export type LinkedSheetType = (typeof LINKED_SHEET_TYPES)[number];

export const MESSAGE_ROLES = ['user', 'agent'] as const;
export type MessageRole = (typeof MESSAGE_ROLES)[number];
