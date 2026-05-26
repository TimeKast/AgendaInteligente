/**
 * AgendaInteligente schema — type-level + import smoke tests
 *
 * Real CRUD tests against Neon are deferred to the per-domain CRUD issues
 * (ISSUE-010 Category, ISSUE-012 Project, ISSUE-013 Activity, etc.). This
 * file validates that the new schema modules compile, expose the expected
 * tables and inferred types, and don't collide with kit-shipped schemas.
 */

import { describe, it, expect, expectTypeOf } from 'vitest';
import { getTableName, getTableColumns } from 'drizzle-orm';
import {
  notificationPrefs,
  type NotificationPref,
  type NewNotificationPref,
  plans,
  type Plan,
  type NewPlan,
  subscriptions,
  type Subscription,
  type NewSubscription,
  usageMeters,
  type UsageMeter,
  type NewUsageMeter,
  users,
  type User,
} from '@/lib/db/schema';

describe('AgendaInteligente schema — table objects', () => {
  it('notificationPrefs uses the agenda-specific table name (not the kit table)', () => {
    // kit's table is `notification_preferences`; ours is the schedule
    // singleton `notification_prefs`. They coexist by design.
    expect(getTableName(notificationPrefs)).toBe('notification_prefs');
  });

  it('plans table is named "plans"', () => {
    expect(getTableName(plans)).toBe('plans');
  });

  it('subscriptions table is named "subscriptions"', () => {
    expect(getTableName(subscriptions)).toBe('subscriptions');
  });

  it('usageMeters table is named "usage_meters"', () => {
    expect(getTableName(usageMeters)).toBe('usage_meters');
  });
});

describe('AgendaInteligente schema — inferred types', () => {
  it('User has the AgendaInteligente-specific fields', () => {
    expectTypeOf<User>().toHaveProperty('intensityMode').toEqualTypeOf<string>();
    expectTypeOf<User>().toHaveProperty('preferredLanguage').toEqualTypeOf<string>();
    expectTypeOf<User>().toHaveProperty('timezone').toEqualTypeOf<string>();
    expectTypeOf<User>().toHaveProperty('googleOauthId').toEqualTypeOf<string | null>();
    expectTypeOf<User>().toHaveProperty('onboardingCompletedAt').toEqualTypeOf<Date | null>();
    expectTypeOf<User>().toHaveProperty('lastActiveAt').toEqualTypeOf<Date | null>();
  });

  it('NotificationPref types include schedule + days_off + weekend_skip', () => {
    expectTypeOf<NotificationPref>().toHaveProperty('userId').toEqualTypeOf<string>();
    expectTypeOf<NotificationPref>().toHaveProperty('morningTime').toEqualTypeOf<string>();
    expectTypeOf<NotificationPref>().toHaveProperty('weeklyKickoffDow').toEqualTypeOf<number>();
    expectTypeOf<NotificationPref>().toHaveProperty('weekendSkip').toEqualTypeOf<boolean>();
    expectTypeOf<NotificationPref>().toHaveProperty('daysOff').toEqualTypeOf<string[]>();
    expectTypeOf<NotificationPref>().toHaveProperty('mutedUntil').toEqualTypeOf<Date | null>();
  });

  it('NewNotificationPref makes scheduled fields optional (covered by defaults)', () => {
    // userId is the only required column on insert — everything else has a default.
    const insertable: NewNotificationPref = { userId: '00000000-0000-0000-0000-000000000000' };
    expect(insertable.userId).toBeTruthy();
  });

  it('Plan + NewPlan shape matches E-070', () => {
    expectTypeOf<Plan>().toHaveProperty('slug').toEqualTypeOf<string>();
    expectTypeOf<Plan>()
      .toHaveProperty('features')
      .toEqualTypeOf<Record<string, boolean | number | string>>();
    expectTypeOf<Plan>().toHaveProperty('limits').toEqualTypeOf<Record<string, number | null>>();
    expectTypeOf<Plan>().toHaveProperty('priceMonthly').toEqualTypeOf<string | null>();

    const insertable: NewPlan = { slug: 'free', name: 'Free' };
    expect(insertable.slug).toBe('free');
  });

  it('Subscription + NewSubscription shape matches E-071', () => {
    expectTypeOf<Subscription>().toHaveProperty('status').toEqualTypeOf<string>();
    expectTypeOf<Subscription>()
      .toHaveProperty('stripeSubscriptionId')
      .toEqualTypeOf<string | null>();

    const insertable: NewSubscription = {
      userId: '00000000-0000-0000-0000-000000000000',
      planId: '00000000-0000-0000-0000-000000000000',
    };
    expect(insertable.userId).toBeTruthy();
  });

  it('UsageMeter + NewUsageMeter shape matches E-072', () => {
    expectTypeOf<UsageMeter>().toHaveProperty('aiCallsCount').toEqualTypeOf<number>();
    expectTypeOf<UsageMeter>().toHaveProperty('aiTokensInput').toEqualTypeOf<bigint>();
    expectTypeOf<UsageMeter>().toHaveProperty('voiceMinutesCount').toEqualTypeOf<string>();

    const insertable: NewUsageMeter = {
      userId: '00000000-0000-0000-0000-000000000000',
      periodStart: '2026-05-01',
    };
    expect(insertable.periodStart).toBe('2026-05-01');
  });
});

describe('AgendaInteligente schema — coexistence with kit notification_preferences', () => {
  it('the kit table is exported under its own symbol and is distinct', async () => {
    const kit = await import('@/lib/db/schema/notifications');
    expect(getTableName(kit.notificationPreferences)).toBe('notification_preferences');
    expect(getTableName(notificationPrefs)).toBe('notification_prefs');
  });
});

describe('users table — AgendaInteligente column wiring', () => {
  it('exposes the new columns via Drizzle metadata', () => {
    const cols = getTableColumns(users);
    expect(cols).toHaveProperty('intensityMode');
    expect(cols).toHaveProperty('preferredLanguage');
    expect(cols).toHaveProperty('timezone');
    expect(cols).toHaveProperty('googleOauthId');
    expect(cols).toHaveProperty('onboardingContext');
    expect(cols).toHaveProperty('lastActiveAt');
    expect(cols).toHaveProperty('silenceReEntrySentAt');
  });
});
