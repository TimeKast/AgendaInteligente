/**
 * User Queries
 *
 * Database queries for user data.
 */

import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { notDeleted } from '@/lib/db/helpers/soft-delete';

/**
 * Get fresh user data from database
 *
 * Used by protected layout to get up-to-date user info
 * instead of relying on cached session data.
 *
 * @param userId - The user ID from session
 * @returns Fresh user data or null if not found/deleted
 */
export async function getFreshUser(userId: string) {
  return db.query.users.findFirst({
    where: and(eq(users.id, userId), notDeleted(users)),
    columns: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
    },
  });
}

/**
 * Get user data for profile editing
 *
 * Includes password field to detect OAuth vs credential users.
 *
 * @param userId - The user ID from session
 * @returns User data for profile page or null if not found
 */
export async function getProfileUser(userId: string) {
  return db.query.users.findFirst({
    where: and(eq(users.id, userId), notDeleted(users)),
    columns: {
      id: true,
      name: true,
      email: true,
      image: true,
      password: true, // To detect OAuth vs credential users
    },
  });
}
