'use server';

/**
 * setLanguagePref — language + timezone in one write.
 *
 * Settings page version of the onboarding setLanguage + setTimezone
 * actions. Single Zod schema + single UPDATE so the form submit is
 * atomic and revalidates /settings/language correctly.
 */

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema/users';
import { withSelf } from '@/lib/actions/helpers';
import type { ActionResult } from '@/lib/actions/types';

const setLanguagePrefSchema = z.object({
  language: z.enum(['es', 'en']),
  timezone: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[A-Za-z0-9_\-+/]+$/, 'Zona horaria inválida'),
});

export async function setLanguagePref(input: unknown): Promise<ActionResult> {
  return await withSelf(
    { schema: setLanguagePrefSchema, revalidate: '/settings/language' },
    input,
    async (data, userId) => {
      await db
        .update(users)
        .set({
          preferredLanguage: data.language,
          timezone: data.timezone,
        })
        .where(eq(users.id, userId));
    }
  );
}
