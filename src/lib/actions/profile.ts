'use server';

/**
 * Profile Server Actions
 *
 * Server-side actions for user profile management.
 *
 * @see SK-001 — Migrated to withSelf() helper
 */

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { profileSchema } from '@/lib/validations/profile';
import { withSelf } from '@/lib/actions/helpers';
import { type ActionResult } from '@/lib/actions/types';

/**
 * Update the current user's profile.
 *
 * @param formData - Form data containing name field
 * @returns ActionResult with void data or error string
 */
export async function updateProfile(formData: FormData): Promise<ActionResult> {
  return await withSelf(
    { schema: profileSchema, revalidate: '/profile' },
    formData,
    async (data, userId) => {
      await db
        .update(users)
        .set({
          name: data.name,
          modifiedAt: new Date(),
          modifiedBy: userId,
        })
        .where(eq(users.id, userId));
    }
  );
}
