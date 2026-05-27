/**
 * CalendarConnection Schema — E-060 per 06_DATA_MODEL.md (ISSUE-090 / Slice A1).
 *
 * N:1 with User: a user can connect 2+ external calendar accounts
 * (typically work + personal Google). v1 supports `google`; `apple` and
 * `outlook` are reserved in the enum and deferred to v1.5.
 *
 * Multi-account isolation: BR-20 → `UNIQUE (user_id, provider,
 * external_account_id)` blocks reconnecting the same account twice. The
 * `external_account_id` is the email address Google returns from
 * `userinfo.email` — stable per Google account.
 *
 * Tokens at rest (BR-12):
 *   - `access_token` + `refresh_token` are `bytea` columns holding the
 *     concatenation `IV || authTag || ciphertext` produced by
 *     `encryptToken()` (`src/lib/integrations/calendar/tokens.ts`).
 *   - NO plaintext ever lands in the DB. The encryption is app-layer
 *     (AES-256-GCM, Node `crypto`); the spec's "pgcrypto" wording is
 *     legacy — we documented the divergence in ISSUE-090 evidence.
 *
 * Provider-agnostic shape: the OAuth lifecycle helpers will plug in
 * different `provider`-keyed implementations (google v1, apple/outlook
 * v1.5). The schema doesn't bind to any one provider.
 *
 * Constraints (migration):
 *   - CHECK provider IN ('google','apple','outlook')
 *   - UNIQUE (user_id, provider, external_account_id) — BR-20
 *
 * Indexes:
 *   - UNIQUE composite (above) covers (user_id, provider, …) forward lookup
 *   - (user_id, enabled) for "list active calendars" hot path
 *
 * OAuth flow + refresh + disconnect routes live in ISSUE-090b. UI
 * (SCR-033 settings integrations) in ISSUE-090c.
 *
 * Linked: BR-12, BR-20, R-T-002, E-060, FT-090, US-090.
 */

import {
  pgTable,
  text,
  uuid,
  boolean,
  timestamp,
  customType,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Postgres `bytea` mapped to Node `Buffer`. Drizzle doesn't ship a
 * first-class bytea type — we declare it locally so both insert payloads
 * and select rows surface as `Buffer` instances.
 */
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return 'bytea';
  },
});

export const calendarConnections = pgTable(
  'calendar_connections',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    /** 'google' v1; 'apple' | 'outlook' reserved for v1.5. CHECK in migration. */
    provider: text('provider').notNull(),

    /**
     * Stable account id from the provider. For Google: the email returned
     * by `userinfo.email`. Used for BR-20 UNIQUE and for the default
     * `account_label`.
     */
    externalAccountId: text('external_account_id').notNull(),

    /** AES-256-GCM cipher of the OAuth access_token. NEVER plaintext. */
    accessToken: bytea('access_token').notNull(),

    /** AES-256-GCM cipher of the OAuth refresh_token. NEVER plaintext. */
    refreshToken: bytea('refresh_token').notNull(),

    /** Server-side expiry of `access_token`. Refresh logic reads this. */
    expiresAt: timestamp('expires_at', { mode: 'date', withTimezone: true }).notNull(),

    /**
     * Calendar ids selected for sync within this account. Populated by
     * the OAuth callback (ISSUE-090b) after listing the user's calendars
     * — empty array on insert.
     */
    calendarIds: text('calendar_ids').array().notNull().default([]),

    /** Toggle to pause sync without disconnecting (preserves tokens). */
    enabled: boolean('enabled').notNull().default(true),

    /** Default to externalAccountId at first connect; user can rename. */
    accountLabel: text('account_label'),

    connectedAt: timestamp('connected_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),

    /** Set by the sync worker (ISSUE-091); NULL before first sync. */
    lastSyncedAt: timestamp('last_synced_at', { mode: 'date', withTimezone: true }),

    /** Last sync error message — surfaces to user as a banner. */
    lastSyncError: text('last_sync_error'),
  },
  (table) => [
    // BR-20: same Google account cannot be linked twice.
    uniqueIndex('calendar_connections_user_provider_account_unique').on(
      table.userId,
      table.provider,
      table.externalAccountId
    ),
    // "List my active calendars" hot path for the integrations screen.
    index('calendar_connections_user_enabled_idx').on(table.userId, table.enabled),
  ]
);

export type CalendarConnection = typeof calendarConnections.$inferSelect;
export type NewCalendarConnection = typeof calendarConnections.$inferInsert;

/** Provider enum — extend in v1.5 with 'apple' / 'outlook'. */
export const CALENDAR_PROVIDERS = ['google', 'apple', 'outlook'] as const;
export type CalendarProvider = (typeof CALENDAR_PROVIDERS)[number];
