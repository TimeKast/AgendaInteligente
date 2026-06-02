'use server';

/**
 * updateNotificationPrefs — settings-page version that touches every
 * notification scheduling field in one call.
 *
 * Different from the onboarding `setPushPref` / `setSchedule` actions
 * (those only mutate one slice each and revalidate onboarding paths).
 *
 * Also updates `users.contact_channels` so the user can edit which
 * channels reach them from the settings page (not just onboarding).
 *
 * Multi-tenant: WHERE clause scoped on userId. Upserts notification_prefs
 * keyed on the user_id PK so absent rows are created on first save.
 *
 * Linked: FT-085, US-085 (notification schedule), AI-1 contact channels.
 */

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema/users';
import { notificationPrefs } from '@/lib/db/schema/notification-prefs';
import { withSelf } from '@/lib/actions/helpers';
import type { ActionResult } from '@/lib/actions/types';
import { updateNotificationPrefsSchema } from '@/lib/validations/notification-prefs';

export async function updateNotificationPrefs(input: unknown): Promise<ActionResult> {
  return await withSelf(
    { schema: updateNotificationPrefsSchema, revalidate: '/settings/notifications' },
    input,
    async (data, userId) => {
      // Split: notification_prefs columns vs users.contact_channels.
      const prefsUpdate: Record<string, unknown> = {};
      const fields = [
        'morningTime',
        'middayTime',
        'eveningTime',
        'weeklyKickoffDow',
        'weeklyKickoffTime',
        'weeklyReviewDow',
        'weeklyReviewTime',
        'weekendSkip',
        'pushEnabled',
        'emailEnabled',
      ] as const;
      for (const f of fields) {
        if (data[f] !== undefined) prefsUpdate[f] = data[f];
      }

      if (Object.keys(prefsUpdate).length > 0) {
        await db
          .insert(notificationPrefs)
          .values({ userId, ...prefsUpdate })
          .onConflictDoUpdate({
            target: notificationPrefs.userId,
            set: { ...prefsUpdate, updatedAt: new Date() },
          });
      }

      if (data.contactChannels !== undefined) {
        // Defensive: never let the user end up with zero channels.
        const channels: string[] =
          data.contactChannels.length > 0 ? [...data.contactChannels] : ['email'];
        await db.update(users).set({ contactChannels: channels }).where(eq(users.id, userId));
      }
    }
  );
}
