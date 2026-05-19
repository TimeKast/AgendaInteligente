'use server';

/**
 * Send Password Reset from Profile
 *
 * Sends password reset email directly from profile page.
 * Returns immediately with toast, email sent in background.
 *
 * @see SK-001 — Migrated to withSelf() helper (no schema overload)
 */

import { requestPasswordReset } from '@/lib/auth/password-reset';
import { withSelf } from '@/lib/actions/helpers';
import { type ActionResult } from '@/lib/actions/types';

/**
 * Send password reset email to the current user.
 *
 * @returns ActionResult with void data or error string
 */
export async function sendPasswordResetEmail(): Promise<ActionResult> {
  return await withSelf({}, async (_userId, email) => {
    if (!email) {
      throw new Error('No se encontró tu email');
    }
    await requestPasswordReset(email);
  });
}
