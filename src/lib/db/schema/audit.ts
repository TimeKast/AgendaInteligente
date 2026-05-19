/**
 * Audit Logs Schema
 *
 * Database schema for security audit trail.
 * Logs auth events (login, logout, password changes, etc.)
 *
 * @see SEC-003
 */

import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

// =============================================================================
// Audit Logs Table
// =============================================================================

/**
 * Audit logs for security events.
 *
 * Events logged:
 * - login_success / login_failure
 * - logout
 * - password_reset_request / password_changed
 * - account_created
 * - role_changed
 */
export const auditLogs = pgTable('audit_logs', {
  /** Unique identifier (UUID v4) */
  id: uuid('id').primaryKey().defaultRandom(),

  /** When the event occurred */
  timestamp: timestamp('timestamp', { mode: 'date' }).notNull().defaultNow(),

  /** Event type */
  event: text('event').notNull(),

  /** User ID if known (null for failed logins with unknown email) */
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),

  /** Email (for login attempts where user might not exist) */
  email: text('email'),

  /** Client IP address */
  ipAddress: text('ip_address'),

  /** User agent string */
  userAgent: text('user_agent'),

  /** Additional metadata as JSON string */
  metadata: text('metadata'),
});

// =============================================================================
// Types (inferred from schema)
// =============================================================================

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
