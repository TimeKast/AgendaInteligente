/**
 * Invite Tokens Schema
 *
 * Database schema for invite system.
 * Tokens are hashed (SHA-256) before storage for security.
 *
 * @see EPIC-INVITES
 */

import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

// =============================================================================
// Invite Tokens Table
// =============================================================================

/**
 * Invite tokens for user invitations.
 *
 * Security design:
 * - Token is HASHED (sha256) before storage - never store plain tokens
 * - Default expiry: 7 days
 * - One use only (acceptedAt marks as used)
 */
export const inviteTokens = pgTable('invite_tokens', {
  /** Unique identifier (UUID v4) */
  id: uuid('id').primaryKey().defaultRandom(),

  /** Email address being invited */
  email: text('email').notNull(),

  /** SHA-256 hash of the token (NOT the plain token!) */
  token: text('token').notNull().unique(),

  /** User who sent the invite (optional, for tracking) */
  invitedBy: uuid('invited_by').references(() => users.id, { onDelete: 'set null' }),

  /** When the invite expires */
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),

  /** When the invite was accepted (null = not yet accepted) */
  acceptedAt: timestamp('accepted_at', { mode: 'date' }),

  /** When the invite was created */
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),

  /** Optional metadata (role, team, etc.) */
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
});

// =============================================================================
// Types (inferred from schema)
// =============================================================================

export type InviteToken = typeof inviteTokens.$inferSelect;
export type NewInviteToken = typeof inviteTokens.$inferInsert;
