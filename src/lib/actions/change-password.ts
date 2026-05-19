'use server';

/**
 * Change Password Action
 *
 * Allows users to change their password in-place without email.
 * Requires current password verification.
 *
 * @see SK-001 — Migrated to withSelf() helper
 */

import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { hashPassword, verifyPassword } from '@/lib/auth/utils';
import { withSelf } from '@/lib/actions/helpers';
import { ActionError, type ActionResult } from '@/lib/actions/types';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().optional(), // Not required for OAuth users setting first password
    newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirma la nueva contraseña'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

/**
 * Change the current user's password.
 *
 * @param formData - Form data containing currentPassword, newPassword, confirmPassword
 * @returns ActionResult with void data or error string
 */
export async function changePassword(formData: FormData): Promise<ActionResult> {
  return await withSelf(
    { schema: changePasswordSchema, revalidate: '/profile' },
    formData,
    async (data, userId) => {
      // Get current user with password
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { password: true },
      });

      if (user?.password) {
        // User has existing password — verify before changing
        if (!data.currentPassword) {
          throw new ActionError('La contraseña actual es requerida');
        }
        const isValid = await verifyPassword(data.currentPassword, user.password);
        if (!isValid) {
          throw new ActionError('La contraseña actual es incorrecta');
        }
      }
      // If no existing password (OAuth user) → skip verification, just set new one

      // Hash and update
      const hashedPassword = await hashPassword(data.newPassword);
      await db
        .update(users)
        .set({
          password: hashedPassword,
          modifiedAt: new Date(),
          modifiedBy: userId,
        })
        .where(eq(users.id, userId));
    }
  );
}
