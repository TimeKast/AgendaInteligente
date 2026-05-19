'use server';

/**
 * Audit Log Server Actions
 *
 * Server-side actions for querying the audit log.
 * Provides paginated access to user activity events.
 *
 * @see SK-003
 */

import { eq, desc, count } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { auditLogs } from '@/lib/db/schema';
import { requirePermission } from '@/lib/auth/permissions';

// =============================================================================
// Types
// =============================================================================

export interface AuditLogItem {
  id: string;
  timestamp: Date;
  event: string;
  email: string | null;
  ipAddress: string | null;
  metadata: string | null;
}

export interface PaginatedAuditLogs {
  data: AuditLogItem[];
  total: number;
  page: number;
  pageSize: number;
}

// =============================================================================
// Get User Activity (Paginated)
// =============================================================================

/**
 * Get paginated audit log entries for a specific user.
 *
 * @param userId - The user ID to fetch activity for
 * @param page - Page number (1-indexed), defaults to 1
 * @param pageSize - Items per page, defaults to 20
 * @returns Paginated audit log entries
 */
export async function getUserActivity(
  userId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedAuditLogs> {
  const session = await auth();
  if (!session?.user?.id) {
    return { data: [], total: 0, page: 1, pageSize };
  }

  requirePermission(session.user.role, 'users', 'read');

  // Get total count
  const [totalResult] = await db
    .select({ total: count() })
    .from(auditLogs)
    .where(eq(auditLogs.userId, userId));

  const total = totalResult?.total ?? 0;

  // Clamp page
  const safePage = Math.max(1, page);
  const offset = (safePage - 1) * pageSize;

  // Get paginated data
  const data = await db
    .select({
      id: auditLogs.id,
      timestamp: auditLogs.timestamp,
      event: auditLogs.event,
      email: auditLogs.email,
      ipAddress: auditLogs.ipAddress,
      metadata: auditLogs.metadata,
    })
    .from(auditLogs)
    .where(eq(auditLogs.userId, userId))
    .orderBy(desc(auditLogs.timestamp))
    .limit(pageSize)
    .offset(offset);

  return {
    data,
    total,
    page: safePage,
    pageSize,
  };
}
