#!/usr/bin/env tsx
/**
 * Reset a user's onboarding state — operational tool, not a migration.
 *
 * Use case: dogfood / QA when an account needs to walk through the
 * onboarding flow again. Clears everything finalizeOnboarding creates:
 *
 *   - subscriptions          (free plan link)
 *   - activities             (any rows the user created post-onboarding)
 *   - projects               (Inbox + any custom)
 *   - categories             (Inbox + any custom)  ← partial UNIQUE on is_inbox forces this
 *   - notification_prefs     (push/morning/midday/evening times)
 *   - day_sheets / week_sheets / month_sheets    (downstream user data)
 *   - conversations + messages (via cascade)
 *   - goals + goal_links (via cascade)
 *
 * Then resets `users.onboarding_completed_at` to NULL + nukes the
 * onboarding-collected fields back to defaults. The auth row + email
 * + Google OAuth link STAY — the user keeps their session.
 *
 * Reads target email from argv. Bails out if email matches more than
 * one user (defensive — shouldn't happen since email is UNIQUE).
 *
 * Usage:
 *   pnpm reset:onboarding <email>
 *
 * Env: loads .env.local for DATABASE_URL.
 */

import 'dotenv/config';
import { config } from 'dotenv';
import { resolve } from 'node:path';

// Load .env.local explicitly (dotenv/config reads .env by default).
config({ path: resolve(process.cwd(), '.env.local'), override: true });

import { eq } from 'drizzle-orm';
import { db } from '../../src/lib/db/drizzle';
import { users } from '../../src/lib/db/schema/users';
import { categories } from '../../src/lib/db/schema/categories';
import { projects } from '../../src/lib/db/schema/projects';
import { activities } from '../../src/lib/db/schema/activities';
import { notificationPrefs } from '../../src/lib/db/schema/notification-prefs';
import { subscriptions } from '../../src/lib/db/schema/billing';
import { daySheets } from '../../src/lib/db/schema/day-sheets';
import { weekSheets } from '../../src/lib/db/schema/week-sheets';
import { monthSheets } from '../../src/lib/db/schema/month-sheets';
import { conversations } from '../../src/lib/db/schema/conversations';
import { goals } from '../../src/lib/db/schema/goals';

async function main(): Promise<void> {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: pnpm reset:onboarding <email>');
    process.exit(1);
  }

  const matches = await db
    .select({
      id: users.id,
      email: users.email,
      onboardingCompletedAt: users.onboardingCompletedAt,
    })
    .from(users)
    .where(eq(users.email, email.toLowerCase()));

  if (matches.length === 0) {
    console.error(`No user found with email ${email}`);
    process.exit(2);
  }
  if (matches.length > 1) {
    console.error(`Expected 1 user, found ${matches.length}. Aborting.`);
    process.exit(3);
  }

  const userId = matches[0].id;
  const wasOnboarded = !!matches[0].onboardingCompletedAt;

  console.log(`Target: ${email}  id=${userId}  onboarded=${wasOnboarded}`);
  console.log('Clearing tenant data + resetting onboarding flags…');

  await db.transaction(async (tx) => {
    // Order: tables with FKs FIRST, then parents, then user-level fields.
    // Most have ON DELETE CASCADE so user-row deletion would cascade — but
    // we want to KEEP the user, just blank their tenant slate.

    const tables = [
      { name: 'goals', table: goals },
      { name: 'conversations', table: conversations },
      { name: 'day_sheets', table: daySheets },
      { name: 'week_sheets', table: weekSheets },
      { name: 'month_sheets', table: monthSheets },
      { name: 'activities', table: activities },
      { name: 'projects', table: projects },
      { name: 'categories', table: categories },
      { name: 'notification_prefs', table: notificationPrefs },
      { name: 'subscriptions', table: subscriptions },
    ] as const;

    for (const { name, table } of tables) {
      const result = await tx
        .delete(table as never)
        .where(eq((table as { userId: unknown }).userId as never, userId));
      console.log(`  - ${name}: ${(result as { rowCount?: number }).rowCount ?? '?'} deleted`);
    }

    await tx
      .update(users)
      .set({
        onboardingCompletedAt: null,
        intensityDefaultUntil: null,
        intensityExpiresAt: null,
        preferredLanguage: 'es',
        timezone: 'America/Mexico_City',
        intensityMode: 'gentle',
        onboardingContext: null,
        lastActiveAt: null,
        silenceReEntrySentAt: null,
      })
      .where(eq(users.id, userId));
    console.log('  - users.onboarding_completed_at + flags reset');
  });

  console.log(
    '\n✅ Done. Tell the user to reload — middleware will route them to /onboarding/language.'
  );
  console.log('   The JWT session keeps onboardingCompletedAt cached until next login;');
  console.log('   simplest is for them to sign out + sign in again with Google.');

  process.exit(0);
}

main().catch((err) => {
  console.error('FAILED:', err);
  process.exit(99);
});
