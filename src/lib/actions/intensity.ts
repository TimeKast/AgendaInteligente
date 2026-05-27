'use server';

/**
 * Intensity mode server action — ISSUE-054.
 *
 * Switching mode rules:
 *   - `listening` sets `intensity_expires_at = now + 48h` (OPS-4 auto-
 *     revert via the listening-mode-expired hourly cron).
 *   - Any other mode clears `intensity_expires_at` (a user who picks
 *     sharp/standard/gentle explicitly is OUT of the time-limited
 *     listening window).
 *   - Picking ANY mode also clears `intensity_default_until` — the user
 *     made an explicit choice, so the 14-day gentle migration shouldn't
 *     re-flip them later.
 *
 * Auth: self-service via `withSelf`. RBAC not applicable (user edits
 * own intensity).
 *
 * Linked: AI-5, OPS-4, FT-052, US-052.
 */

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema/users';
import { withSelf } from '@/lib/actions/helpers';
import { type ActionResult } from '@/lib/actions/types';
import { setIntensityModeSchema } from '@/lib/validations/intensity';

const LISTENING_TTL_MS = 48 * 60 * 60 * 1000;

export async function setIntensityMode(
  input: unknown
): Promise<ActionResult<{ mode: string; expiresAt: Date | null }>> {
  return await withSelf(
    { schema: setIntensityModeSchema, revalidate: '/settings/intensity' },
    input,
    async (data, userId) => {
      const expiresAt = data.mode === 'listening' ? new Date(Date.now() + LISTENING_TTL_MS) : null;

      // We use `db.transaction`-style direct UPDATE here (users is not in
      // TENANT_TABLES — it's the auth root table). The userId scoping is
      // explicit on the WHERE clause.
      await db
        .update(users)
        .set({
          intensityMode: data.mode,
          intensityExpiresAt: expiresAt,
          intensityDefaultUntil: null,
        })
        .where(eq(users.id, userId));

      return { mode: data.mode, expiresAt };
    }
  );
}
