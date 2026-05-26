/**
 * Email Verification Tokens — ISSUE-004
 *
 * Distinct from NextAuth's `verification_tokens` (which is the magic-link
 * adapter table). This table stores email-confirmation tokens minted after
 * signup; the user clicks the link in their inbox and we set
 * `users.email_verified`.
 *
 * Security model mirrors `password_reset_tokens`:
 *   - The token is hashed (SHA-256) before storage — never store the plain
 *     value. The plain value only exists in the email body.
 *   - 24h expiry.
 *   - One token per user; minting a new one invalidates the old.
 *
 * Linked: FT-002, US-003, BR-12 (defense in depth).
 */

import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

export const emailVerificationTokens = pgTable('email_verification_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),

  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  /** SHA-256 hex of the plain token. */
  tokenHash: text('token_hash').notNull().unique(),

  /** Hard expiry (24h after creation). */
  expiresAt: timestamp('expires_at', { mode: 'date', withTimezone: true }).notNull(),

  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
});

export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type NewEmailVerificationToken = typeof emailVerificationTokens.$inferInsert;
