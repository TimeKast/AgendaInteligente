/**
 * Audit Log Helper
 *
 * Provides a simple API for logging security-relevant events.
 * Events are stored in the audit_logs table for security auditing.
 *
 * @example
 * import { logAuditEvent } from '@/lib/audit';
 *
 * await logAuditEvent({
 *   event: 'login_success',
 *   userId: user.id,
 *   email: user.email,
 *   ipAddress: request.headers.get('x-forwarded-for'),
 * });
 *
 * @see SEC-003
 */

import { db } from '@/lib/db/drizzle';
import { auditLogs } from '@/lib/db/schema';
import { logger } from '@/lib/logger';
import { isDatabaseConfigured } from '@/lib/env';

// =============================================================================
// Types
// =============================================================================

/**
 * Audit event types
 */
export type AuditEvent =
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'password_reset_request'
  | 'password_changed'
  | 'account_created'
  | 'role_changed'
  | 'invite_sent'
  | 'invite_accepted'
  | 'super_admin_action';

/**
 * Parameters for logging an audit event
 */
export interface LogAuditEventParams {
  /** Type of event */
  event: AuditEvent;
  /** User ID if known */
  userId?: string;
  /** Email (useful for failed logins where user might not exist) */
  email?: string;
  /** Client IP address */
  ipAddress?: string | null;
  /** User agent string */
  userAgent?: string | null;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Main Function
// =============================================================================

/**
 * Log an audit event to the database.
 *
 * This is a fire-and-forget operation - errors are logged but don't fail
 * the calling operation. This ensures audit logging never breaks user flows.
 */
export async function logAuditEvent(params: LogAuditEventParams): Promise<void> {
  // Skip if no database
  if (!isDatabaseConfigured()) {
    return;
  }

  try {
    await db.insert(auditLogs).values({
      event: params.event,
      userId: params.userId || null,
      email: params.email || null,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    });
  } catch (error) {
    // Log to console but don't fail the request
    logger.error('[Audit] Failed to log event:', {
      event: params.event,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// =============================================================================
// Helper for extracting request info
// =============================================================================

/**
 * Extract IP address from request headers
 */
export function getIpFromHeaders(headers: Headers): string | null {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || null;
}

/**
 * Extract user agent from request headers
 */
export function getUserAgentFromHeaders(headers: Headers): string | null {
  return headers.get('user-agent');
}
