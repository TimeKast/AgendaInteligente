'use server';

/**
 * Onboarding server actions (ISSUE-006).
 *
 * 7 per-step setters + 1 atomic finalizer:
 *
 *   1. setLanguage       → users.preferred_language
 *   2. setTimezone       → users.timezone
 *   3. setPushPref       → notification_prefs.push_enabled (upsert)
 *   4. setMicPref        → no DB persist today (capability flag is browser-only;
 *                          we record it as a no-op so the UI still completes
 *                          the step uniformly)
 *   5. setOnboardingContext → users.onboarding_context
 *   6. setSchedule       → notification_prefs.{morning,midday,evening}_time
 *   7. setCalendarOptIn  → no DB persist; 'now' returns a hint URL the client
 *                          uses to redirect to OAuth
 *   8. finalizeOnboarding → atomic transaction:
 *                            - Inbox Category (is_inbox=true)
 *                            - Inbox Project inside Inbox Category (is_inbox=true, status='active')
 *                            - NotificationPref row if not already created
 *                            - Subscription 'free' linked to plans.slug='free'
 *                            - users.onboarding_completed_at = now()
 *
 * The finalize step uses `db.transaction` directly (ESLint allowlist) because
 * multi-table writes can't be modeled through the scopedDb factory and atomicity
 * is essential — a partial onboarding row would corrupt the user's account.
 *
 * Inngest `user.signed_up` event is published post-commit via the typed
 * `publish()` wrapper (ISSUE-080). If Inngest is unconfigured (no event
 * key) the wrapper logs and returns — onboarding doesn't fail.
 *
 * Linked: FT-004, US-005, BR-2, BR-3.
 */

import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema/users';
import { categories } from '@/lib/db/schema/categories';
import { projects } from '@/lib/db/schema/projects';
import { notificationPrefs } from '@/lib/db/schema/notification-prefs';
import { plans, subscriptions } from '@/lib/db/schema/billing';
import { withSelf } from '@/lib/actions/helpers';
import { ActionError, type ActionResult } from '@/lib/actions/types';
import { publish } from '@/lib/inngest/publish';
import {
  setLanguageSchema,
  setTimezoneSchema,
  setPushPrefSchema,
  setMicPrefSchema,
  setOnboardingContextSchema,
  setScheduleSchema,
  setCalendarOptInSchema,
  finalizeOnboardingSchema,
} from '@/lib/validations/onboarding';

// ──────────────────────────────────────────────────────────────────────────
// Per-step setters — operate on a single user, no cross-table writes.
// They all use db directly (allowlisted in ESLint) instead of scopedDb to
// keep per-step actions simple: the `where(eq(users.id, userId))` already
// scopes the write to the calling user.
// ──────────────────────────────────────────────────────────────────────────

export async function setLanguage(input: unknown): Promise<ActionResult> {
  return await withSelf(
    { schema: setLanguageSchema, revalidate: '/onboarding/timezone' },
    input,
    async (data, userId) => {
      await db.update(users).set({ preferredLanguage: data.language }).where(eq(users.id, userId));
    }
  );
}

export async function setTimezone(input: unknown): Promise<ActionResult> {
  return await withSelf(
    { schema: setTimezoneSchema, revalidate: '/onboarding/push' },
    input,
    async (data, userId) => {
      await db.update(users).set({ timezone: data.timezone }).where(eq(users.id, userId));
    }
  );
}

/**
 * Persist push opt-in into notification_prefs. The row may not exist yet,
 * so we upsert keyed on user_id (the PK).
 */
export async function setPushPref(input: unknown): Promise<ActionResult> {
  return await withSelf(
    { schema: setPushPrefSchema, revalidate: '/onboarding/mic' },
    input,
    async (data, userId) => {
      await db
        .insert(notificationPrefs)
        .values({ userId, pushEnabled: data.pushEnabled })
        .onConflictDoUpdate({
          target: notificationPrefs.userId,
          set: { pushEnabled: data.pushEnabled, updatedAt: new Date() },
        });
    }
  );
}

/**
 * Mic permission is a browser capability — nothing to persist today. The
 * action exists so the onboarding flow has a uniform "complete step" call
 * pattern; if a future feature needs to remember the user's choice we add
 * a column without changing the action signature.
 */
export async function setMicPref(input: unknown): Promise<ActionResult> {
  return await withSelf(
    { schema: setMicPrefSchema, revalidate: '/onboarding/context' },
    input,
    async () => {
      // intentional no-op
    }
  );
}

export async function setOnboardingContext(input: unknown): Promise<ActionResult> {
  return await withSelf(
    { schema: setOnboardingContextSchema, revalidate: '/onboarding/schedule' },
    input,
    async (data, userId) => {
      await db.update(users).set({ onboardingContext: data.context }).where(eq(users.id, userId));
    }
  );
}

export async function setSchedule(input: unknown): Promise<ActionResult> {
  return await withSelf(
    { schema: setScheduleSchema, revalidate: '/onboarding/calendar' },
    input,
    async (data, userId) => {
      await db
        .insert(notificationPrefs)
        .values({
          userId,
          morningTime: data.morningTime,
          middayTime: data.middayTime,
          eveningTime: data.eveningTime,
        })
        .onConflictDoUpdate({
          target: notificationPrefs.userId,
          set: {
            morningTime: data.morningTime,
            middayTime: data.middayTime,
            eveningTime: data.eveningTime,
            updatedAt: new Date(),
          },
        });
    }
  );
}

/**
 * Calendar opt-in records the user's choice and returns a hint URL when
 * they picked 'now'. The Google OAuth flow itself is wired in ISSUE-090;
 * here we just signal the next step.
 */
export async function setCalendarOptIn(
  input: unknown
): Promise<ActionResult<{ redirectTo: string | null }>> {
  return await withSelf(
    { schema: setCalendarOptInSchema, revalidate: '/onboarding/done' },
    input,
    async (data) => {
      // 'now' → kick the user into the Google Calendar OAuth flow.
      // The route signs a CSRF state cookie and redirects to Google's
      // consent screen; the callback lands the connection row.
      return {
        redirectTo: data.choice === 'now' ? '/api/calendar/google/connect' : null,
      };
    }
  );
}

/**
 * Atomic finalize: creates Inbox Cat + Inbox Project + NotificationPref +
 * Subscription 'free' + marks onboarding_completed_at.
 *
 * Idempotent guard: if `onboarding_completed_at` is already set, returns
 * without re-running (defensive — a refresh on /onboarding/done shouldn't
 * double-insert Inbox rows).
 *
 * The whole thing runs in a single `db.transaction` so a partial failure
 * rolls back; we never leave the user with a half-built account.
 */
export async function finalizeOnboarding(input: unknown): Promise<ActionResult> {
  return await withSelf(
    { schema: finalizeOnboardingSchema, revalidate: '/today' },
    input,
    async (_data, userId) => {
      // Pre-check (cheap) — avoid opening a transaction if already done.
      const existing = await db
        .select({ onboardingCompletedAt: users.onboardingCompletedAt })
        .from(users)
        .where(eq(users.id, userId));
      if (existing[0]?.onboardingCompletedAt) {
        return; // idempotent no-op
      }

      // Resolve the free plan id once, outside the transaction. Auto-seed
      // it if missing — production envs that skipped `pnpm db:seed`
      // shouldn't lock every new user out of onboarding. Idempotent via
      // the unique `slug` column.
      let freePlanRows = await db
        .select({ id: plans.id })
        .from(plans)
        .where(eq(plans.slug, 'free'));
      if (freePlanRows.length === 0) {
        await db
          .insert(plans)
          .values({
            slug: 'free',
            name: 'Free',
            description: 'Default plan for all users. No limits enforced in v1.',
            features: {},
            limits: {},
            active: true,
          })
          .onConflictDoNothing({ target: plans.slug });
        freePlanRows = await db.select({ id: plans.id }).from(plans).where(eq(plans.slug, 'free'));
      }
      if (freePlanRows.length === 0) {
        throw new ActionError('No se pudo crear el plan free. Revisa la conexión a la DB.');
      }
      const freePlanId = freePlanRows[0].id;

      await db.transaction(async (tx) => {
        // 1. Inbox Category — name must be 'Inbox' per CHECK constraint.
        const [inboxCategory] = await tx
          .insert(categories)
          .values({
            userId,
            name: 'Inbox',
            isInbox: true,
            color: '#5C5C5C',
            icon: 'folder',
            position: 0,
          })
          .returning({ id: categories.id });

        // 2. Inbox Project inside the Inbox category.
        await tx.insert(projects).values({
          userId,
          categoryId: inboxCategory.id,
          name: 'Inbox',
          isInbox: true,
          status: 'active',
        });

        // 3. NotificationPref — upsert so prior steps that may have written
        //    a row (push opt-in, schedule) don't conflict.
        await tx
          .insert(notificationPrefs)
          .values({ userId })
          .onConflictDoNothing({ target: notificationPrefs.userId });

        // 4. Subscription 'free'.
        await tx.insert(subscriptions).values({
          userId,
          planId: freePlanId,
          status: 'active',
        });

        // 5. Mark user onboarding complete (also sets the 14-day gentle
        //    intensity default expiration per E-001).
        const fourteenDaysFromNow = new Date();
        fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);
        await tx
          .update(users)
          .set({
            onboardingCompletedAt: new Date(),
            intensityDefaultUntil: fourteenDaysFromNow,
            lastActiveAt: sql`now()`,
          })
          .where(eq(users.id, userId));
      });

      // Publish `user.signed_up` AFTER the transaction commits — if the
      // publish fails (e.g. transient Inngest outage), the user is still
      // onboarded; the wrapper logs and the schedule can be reissued by
      // hand. Inside the tx would risk DB rollback on a publish blip.
      await publish('user.signed_up', { userId });
    }
  );
}
