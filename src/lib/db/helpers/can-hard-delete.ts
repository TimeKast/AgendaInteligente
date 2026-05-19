'use server';

/**
 * Hard Delete Eligibility Check
 *
 * Verifies that a user has no dependencies in the system before
 * allowing permanent deletion. Checks in real-time — no flags.
 *
 * @see SK-002
 */

import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq, or, count } from 'drizzle-orm';

/** Result of a hard-delete eligibility check */
export interface CanHardDeleteResult {
  /** Whether the entity can be permanently deleted */
  canDelete: boolean;
  /** Human-readable reason if not deletable */
  reason?: string;
  /** Number of dependent records found */
  dependencyCount?: number;
}

/**
 * Check if a user can be permanently deleted.
 *
 * Verifies that no other records reference this user via
 * `createdBy`, `modifiedBy`, or `deletedBy` foreign keys.
 *
 * @param userId - The user ID to check
 * @returns CanHardDeleteResult with eligibility and reason
 *
 * @example
 * ```typescript
 * const result = await canHardDeleteUser('uuid-123');
 * if (result.canDelete) {
 *   await db.delete(users).where(eq(users.id, 'uuid-123'));
 * } else {
 *   console.log(result.reason); // "Tiene 3 registros asociados"
 * }
 * ```
 */
export async function canHardDeleteUser(userId: string): Promise<CanHardDeleteResult> {
  // Count all records that reference this user
  const [result] = await db
    .select({ total: count() })
    .from(users)
    .where(
      or(eq(users.createdBy, userId), eq(users.modifiedBy, userId), eq(users.deletedBy, userId))
    );

  const total = result?.total ?? 0;

  if (total > 0) {
    return {
      canDelete: false,
      reason: `Tiene ${total} registro${total === 1 ? '' : 's'} asociado${total === 1 ? '' : 's'}`,
      dependencyCount: total,
    };
  }

  return { canDelete: true };
}
