/**
 * Users Schema
 *
 * Database schema for user authentication and authorization.
 * Role is stored as text (not enum) to allow easy customization per project.
 *
 * @see ADR-007: Auth Framework Design
 */

import { pgTable, text, timestamp, uuid, integer, primaryKey } from 'drizzle-orm/pg-core';

// =============================================================================
// Users Table
// =============================================================================

/**
 * Users table for authentication.
 *
 * Note: Role is TEXT not ENUM to avoid migrations when adding custom roles.
 * Role validation happens in config/roles.ts
 */
export const users = pgTable('users', {
  /** Unique identifier (UUID v4) */
  id: uuid('id').primaryKey().defaultRandom(),

  /**
   * Human-readable identifier for URLs and display (e.g. USR-0001).
   * Backed by raw PG sequence `user_human_id_seq` (not managed by Drizzle).
   * Created in: migration 0003, seed.ts, and tests/global-setup.ts.
   * If using db:push, run seed to create the sequence.
   */
  humanId: text('human_id').notNull().unique(),

  /** User's display name */
  name: text('name'),

  /** User's email address (unique, required for auth) */
  email: text('email').notNull().unique(),

  /** When email was verified (null = not verified) */
  emailVerified: timestamp('email_verified', { mode: 'date' }),

  /** Profile image URL */
  image: text('image'),

  /** Base64-encoded avatar image (WebP, 128×128). Served via /api/avatar/[userId] */
  avatarData: text('avatar_data'),

  /**
   * User role for authorization.
   * Stored as TEXT to allow project-specific roles without migrations.
   * Valid values defined in config/roles.ts
   *
   * @default 'user'
   */
  role: text('role').notNull().default('user'),

  /** Hashed password (null for OAuth-only users) */
  password: text('password'),

  /** Soft delete timestamp (null = active user) */
  deletedAt: timestamp('deleted_at', { mode: 'date', withTimezone: true }),

  /** User who deleted this record (for soft delete traceability) */
  deletedBy: uuid('deleted_by'),

  // ========================
  // AgendaInteligente fields (E-001 per 06_DATA_MODEL.md)
  // ========================

  /** Google OAuth `sub` claim. UNIQUE partial WHERE NOT NULL (migration-level). */
  googleOauthId: text('google_oauth_id'),

  /** User-preferred language code. Constrained to 'es' | 'en' at DB level. */
  preferredLanguage: text('preferred_language').notNull().default('es'),

  /** IANA timezone. Used by check-in scheduler. */
  timezone: text('timezone').notNull().default('America/Mexico_City'),

  /**
   * Agent intensity mode.
   * Constrained to 'sharp' | 'standard' | 'gentle' | 'listening' at DB level.
   * Default 'gentle' for new users; OPS-4 auto-reverts 'listening' after intensity_expires_at.
   */
  intensityMode: text('intensity_mode').notNull().default('gentle'),

  /** When 'listening' mode auto-reverts to 'gentle' (OPS-4). */
  intensityExpiresAt: timestamp('intensity_expires_at', { mode: 'date', withTimezone: true }),

  /** When the post-signup gentle default expires (14d after signup, then mode becomes user-controlled). */
  intensityDefaultUntil: timestamp('intensity_default_until', { mode: 'date', withTimezone: true }),

  /** Free-text frustration captured at signup ("what brought you here"). */
  onboardingContext: text('onboarding_context'),

  /** NULL = user still in onboarding flow. */
  onboardingCompletedAt: timestamp('onboarding_completed_at', { mode: 'date', withTimezone: true }),

  /** Last meaningful user action — used for silence detection (OPS-3). */
  lastActiveAt: timestamp('last_active_at', { mode: 'date', withTimezone: true }),

  /** When the silence re-entry notification was last sent. Reset on user action. */
  silenceReEntrySentAt: timestamp('silence_re_entry_sent_at', { mode: 'date', withTimezone: true }),

  // ========================
  // Audit Fields
  // ========================

  /** Record creation timestamp */
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),

  /**
   * User who created this record (null for seed/self-registration).
   * Note: FK constraint added via migration to avoid circular reference.
   */
  createdBy: uuid('created_by'),

  /** Last modification timestamp */
  modifiedAt: timestamp('modified_at', { mode: 'date', withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),

  /**
   * User who last modified this record.
   * Note: FK constraint added via migration to avoid circular reference.
   */
  modifiedBy: uuid('modified_by'),
});

// =============================================================================
// NextAuth.js Required Tables
// =============================================================================

/**
 * Accounts table for OAuth providers.
 * Required by NextAuth.js Drizzle adapter.
 *
 * Note: Uses integer for expires_at as required by @auth/drizzle-adapter
 */
export const accounts = pgTable(
  'accounts',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })]
);

/**
 * Sessions table for database sessions.
 * Required by NextAuth.js Drizzle adapter.
 */
export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

/**
 * Verification tokens for email verification and magic links.
 * Required by NextAuth.js Drizzle adapter.
 */
export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ]
);

// =============================================================================
// Password Reset Tokens
// =============================================================================

/**
 * Password reset tokens table.
 *
 * Security design:
 * - Token is HASHED (sha256) before storage - never store plain tokens
 * - One token per user (new request deletes old tokens)
 * - Expires after 1 hour
 *
 * @see email_password_reset_plan.md
 */
export const passwordResetTokens = pgTable('password_reset_tokens', {
  /** Unique identifier (UUID v4) */
  id: uuid('id').primaryKey().defaultRandom(),

  /** User who requested the reset */
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  /** SHA-256 hash of the token (NOT the plain token!) */
  tokenHash: text('token_hash').notNull().unique(),

  /** When the token expires */
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),

  /** When the token was created */
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

// =============================================================================
// Types (inferred from schema)
// =============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;
