/**
 * Super Admin Utilities
 *
 * Simple role-based super admin detection.
 *
 * ## How It Works
 *
 * 1. **Seed creates the first super_admin** — `pnpm db:seed`
 * 2. **Promotion in-app** — Only super_admins can promote others
 *
 * No env-based whitelist. Role is determined solely by database.
 *
 * @see SEED-001 for superadmin bootstrap
 */

import { logger } from '@/lib/logger';
import { isSuperAdmin as isSuperAdminRole } from '@/config/roles';
import { logAuditEvent } from '@/lib/audit';
import { db } from '@/lib/db/drizzle';
import { auditLogs, type AuditLog } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { isDatabaseConfigured } from '@/lib/env';

// =============================================================================
// Super Admin Detection
// =============================================================================

/**
 * Check if a user object is a super admin
 *
 * @param user - User object with role property
 * @returns true if user is super admin
 *
 * @example
 * if (isUserSuperAdmin(session.user)) {
 *   // Show admin panel
 * }
 */
export function isUserSuperAdmin(user: { role?: string } | null | undefined): boolean {
  return user?.role ? isSuperAdminRole(user.role) : false;
}

// =============================================================================
// Audit Logging (persisted to audit_logs table)
// =============================================================================

/**
 * Log a super admin action to the audit_logs table.
 *
 * Delegates to the centralized `logAuditEvent()` with event type `super_admin_action`.
 * Falls back to console logging if the database is not configured.
 *
 * @param userId - The super admin's user ID
 * @param email - The super admin's email
 * @param action - The action being performed
 * @param metadata - Additional context
 */
export async function logSuperAdminAction(
  userId: string,
  email: string,
  action: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAuditEvent({
    event: 'super_admin_action',
    userId,
    email,
    metadata: { action, ...metadata },
  });
}

/**
 * Get recent super admin actions from the audit_logs table.
 *
 * @param limit - Maximum number of entries to return (default: 100)
 * @returns Recent audit log entries for super admin actions
 */
export async function getRecentSuperAdminActions(limit = 100): Promise<AuditLog[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  try {
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.event, 'super_admin_action'))
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit);
  } catch (error) {
    logger.error('[SuperAdmin Audit] Failed to query actions:', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return [];
  }
}

// =============================================================================
// Alerts
// =============================================================================

/**
 * Send alert when super admin access is used
 *
 * @param userId - The super admin's user ID
 * @param email - The super admin's email
 * @param action - What triggered the alert
 */
export async function alertSuperAdminUsage(
  userId: string,
  email: string,
  action: 'promoted' | 'used_emergency_access'
): Promise<void> {
  const alertMessages = {
    promoted: `⚠️ User promoted to super admin: ${email}`,
    used_emergency_access: `🔐 Super admin used emergency access: ${email}`,
  };

  const message = alertMessages[action];

  // Log to console
  logger.warn(`[SuperAdmin Alert] ${message}`);

  // NOTE: Production alerting extension point
  // await sendSlackAlert(message);
}
