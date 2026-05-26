/**
 * Tests for Onboarding server actions (ISSUE-006).
 *
 * Strategy: mock the kit db client + auth so we can stage table state and
 * capture write payloads without hitting Neon. The atomic finalize action
 * is verified by asserting:
 *   - the transaction callback is invoked
 *   - all 5 writes happen inside the same tx instance
 *   - idempotency: re-running on an already-onboarded user is a no-op
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const authMock = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: authMock }));
vi.mock('@/lib/auth/permissions', () => ({ requirePermission: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const { dbState } = vi.hoisted(() => ({
  dbState: {
    /** Sequenced results for `db.select().from(...).where(...)` awaits. */
    selectResults: [] as unknown[],
    updates: [] as Array<{ set: unknown }>,
    inserts: [] as Array<{ values: unknown; onConflict?: 'do-nothing' | 'do-update' }>,
    transactionInvoked: false,
    txInserts: [] as Array<{ table: string; values: unknown }>,
    txUpdates: [] as Array<{ table: string; set: unknown }>,
    txReturning: undefined as unknown,
  },
}));

vi.mock('@/lib/db/drizzle', () => {
  const tableNameOf = (t: unknown): string => {
    // Drizzle tables expose Symbol(drizzle:Name) — for our mock we don't
    // need the exact name, but we do want a stable hint. Most tests rely
    // on call ORDER, not table name; if needed we can introspect later.
    if (t && typeof t === 'object') {
      const sym = Object.getOwnPropertySymbols(t).find((s) => s.description === 'drizzle:Name');
      if (sym) return (t as Record<symbol, string>)[sym];
    }
    return 'unknown';
  };

  const mkSelectChain = () => {
    let lastFrom: unknown;
    return {
      from(table: unknown) {
        lastFrom = table;
        return {
          where: vi.fn(async () => {
            return (dbState.selectResults.shift() ?? []) as unknown[];
          }),
          // Chain for plain `.from().` awaits (no where).
          then(resolve: (rows: unknown[]) => unknown) {
            return resolve((dbState.selectResults.shift() ?? []) as unknown[]);
          },
        };
      },
      _lastFrom: () => lastFrom,
    };
  };

  const mkInsertChain = (onConflict?: 'do-nothing' | 'do-update') => ({
    values: vi.fn((vals: unknown) => {
      dbState.inserts.push({ values: vals, onConflict });
      const chain = {
        onConflictDoNothing: vi.fn(() => {
          dbState.inserts[dbState.inserts.length - 1].onConflict = 'do-nothing';
          return chain;
        }),
        onConflictDoUpdate: vi.fn(() => {
          dbState.inserts[dbState.inserts.length - 1].onConflict = 'do-update';
          return chain;
        }),
        returning: vi.fn(() => Promise.resolve([{ id: 'new-uuid' }])),
        execute: vi.fn().mockResolvedValue(undefined),
        then(resolve: (v: unknown) => unknown) {
          return resolve(undefined);
        },
      };
      return chain;
    }),
  });

  const mkUpdateChain = () => ({
    set: vi.fn((set: unknown) => {
      dbState.updates.push({ set });
      return {
        where: vi.fn(async () => undefined),
      };
    }),
  });

  // Inside a transaction: capture by table.
  const mkTx = () => ({
    insert: vi.fn((table: unknown) => ({
      values: vi.fn((values: unknown) => {
        dbState.txInserts.push({ table: tableNameOf(table), values });
        const chain = {
          onConflictDoNothing: vi.fn(() => chain),
          onConflictDoUpdate: vi.fn(() => chain),
          returning: vi.fn(() => Promise.resolve([{ id: 'inbox-cat-uuid' }])),
          execute: vi.fn().mockResolvedValue(undefined),
          then(resolve: (v: unknown) => unknown) {
            return resolve(undefined);
          },
        };
        return chain;
      }),
    })),
    update: vi.fn((table: unknown) => ({
      set: vi.fn((set: unknown) => {
        dbState.txUpdates.push({ table: tableNameOf(table), set });
        return {
          where: vi.fn(async () => undefined),
        };
      }),
    })),
  });

  return {
    db: {
      select: vi.fn(() => mkSelectChain()),
      insert: vi.fn(() => mkInsertChain()),
      update: vi.fn(() => mkUpdateChain()),
      transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
        dbState.transactionInvoked = true;
        return cb(mkTx());
      }),
      query: {},
    },
  };
});

const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function authedSession() {
  authMock.mockResolvedValue({ user: { id: USER_A, email: 'a@example.com', role: 'user' } });
}

function reset() {
  dbState.selectResults = [];
  dbState.updates = [];
  dbState.inserts = [];
  dbState.transactionInvoked = false;
  dbState.txInserts = [];
  dbState.txUpdates = [];
  dbState.txReturning = undefined;
  vi.clearAllMocks();
  authedSession();
}

describe('setLanguage', () => {
  beforeEach(reset);

  it('updates users.preferred_language', async () => {
    const { setLanguage } = await import('@/lib/actions/onboarding');
    const result = await setLanguage({ language: 'es' });
    expect(result.error).toBeUndefined();
    expect(dbState.updates[0]?.set).toMatchObject({ preferredLanguage: 'es' });
  });

  it('rejects an unknown language', async () => {
    const { setLanguage } = await import('@/lib/actions/onboarding');
    const result = await setLanguage({ language: 'fr' });
    expect(result.error).toBeDefined();
    expect(dbState.updates).toHaveLength(0);
  });
});

describe('setTimezone', () => {
  beforeEach(reset);

  it('updates users.timezone', async () => {
    const { setTimezone } = await import('@/lib/actions/onboarding');
    const result = await setTimezone({ timezone: 'America/Mexico_City' });
    expect(result.error).toBeUndefined();
    expect(dbState.updates[0]?.set).toMatchObject({ timezone: 'America/Mexico_City' });
  });

  it('rejects an invalid timezone string', async () => {
    const { setTimezone } = await import('@/lib/actions/onboarding');
    const result = await setTimezone({ timezone: 'has spaces!' });
    expect(result.error).toMatch(/inválida/);
  });
});

describe('setPushPref', () => {
  beforeEach(reset);

  it('upserts notification_prefs.push_enabled', async () => {
    const { setPushPref } = await import('@/lib/actions/onboarding');
    const result = await setPushPref({ pushEnabled: true });
    expect(result.error).toBeUndefined();
    expect(dbState.inserts[0]?.onConflict).toBe('do-update');
    expect((dbState.inserts[0]?.values as { pushEnabled: boolean }).pushEnabled).toBe(true);
  });
});

describe('setSchedule', () => {
  beforeEach(reset);

  it('upserts the three check-in times', async () => {
    const { setSchedule } = await import('@/lib/actions/onboarding');
    const result = await setSchedule({
      morningTime: '07:30',
      middayTime: '12:30',
      eveningTime: '20:30',
    });
    expect(result.error).toBeUndefined();
    const vals = dbState.inserts[0]?.values as Record<string, string>;
    expect(vals.morningTime).toBe('07:30');
    expect(vals.middayTime).toBe('12:30');
    expect(vals.eveningTime).toBe('20:30');
  });

  it('rejects malformed times', async () => {
    const { setSchedule } = await import('@/lib/actions/onboarding');
    const result = await setSchedule({
      morningTime: '8am',
      middayTime: '12:30',
      eveningTime: '20:30',
    });
    expect(result.error).toMatch(/inválida/);
  });
});

describe('setOnboardingContext', () => {
  beforeEach(reset);

  it('updates users.onboarding_context', async () => {
    const { setOnboardingContext } = await import('@/lib/actions/onboarding');
    const result = await setOnboardingContext({
      context: 'Probé Notion y Todoist y no sostuve ninguno.',
    });
    expect(result.error).toBeUndefined();
    expect(dbState.updates[0]?.set).toMatchObject({
      onboardingContext: 'Probé Notion y Todoist y no sostuve ninguno.',
    });
  });

  it('rejects empty context', async () => {
    const { setOnboardingContext } = await import('@/lib/actions/onboarding');
    const result = await setOnboardingContext({ context: '' });
    expect(result.error).toMatch(/Contanos|requerido|algo/);
  });
});

describe('setCalendarOptIn', () => {
  beforeEach(reset);

  it('returns redirectTo /api/connect/google when "now"', async () => {
    const { setCalendarOptIn } = await import('@/lib/actions/onboarding');
    const result = await setCalendarOptIn({ choice: 'now' });
    expect(result.error).toBeUndefined();
    expect(result.data?.redirectTo).toBe('/api/connect/google');
  });

  it('returns redirectTo null when "later"', async () => {
    const { setCalendarOptIn } = await import('@/lib/actions/onboarding');
    const result = await setCalendarOptIn({ choice: 'later' });
    expect(result.error).toBeUndefined();
    expect(result.data?.redirectTo).toBeNull();
  });
});

describe('finalizeOnboarding — atomic step 8', () => {
  beforeEach(reset);

  it('runs the full transaction when user is not yet onboarded', async () => {
    // 1st select: existing onboarding_completed_at check → null.
    // 2nd select: free plan lookup → returns the plan id.
    dbState.selectResults = [[{ onboardingCompletedAt: null }], [{ id: 'free-plan-uuid' }]];

    const { finalizeOnboarding } = await import('@/lib/actions/onboarding');
    const result = await finalizeOnboarding({});

    expect(result.error).toBeUndefined();
    expect(dbState.transactionInvoked).toBe(true);
    // 4 inserts inside the tx: categories, projects, notification_prefs, subscriptions.
    expect(dbState.txInserts.length).toBe(4);
    // 1 update inside the tx: users.onboarding_completed_at.
    expect(dbState.txUpdates.length).toBe(1);

    const userUpdate = dbState.txUpdates[0].set as Record<string, unknown>;
    expect(userUpdate.onboardingCompletedAt).toBeInstanceOf(Date);
    expect(userUpdate.intensityDefaultUntil).toBeInstanceOf(Date);
  });

  it('is idempotent — no-op if user is already onboarded', async () => {
    dbState.selectResults = [[{ onboardingCompletedAt: new Date('2026-05-01') }]];

    const { finalizeOnboarding } = await import('@/lib/actions/onboarding');
    const result = await finalizeOnboarding({});

    expect(result.error).toBeUndefined();
    expect(dbState.transactionInvoked).toBe(false);
    expect(dbState.txInserts.length).toBe(0);
  });

  it('errors clearly if the free plan is not seeded', async () => {
    dbState.selectResults = [
      [{ onboardingCompletedAt: null }],
      [], // no plan found
    ];

    const { finalizeOnboarding } = await import('@/lib/actions/onboarding');
    const result = await finalizeOnboarding({});

    expect(result.error).toMatch(/plan free/);
    expect(dbState.transactionInvoked).toBe(false);
  });

  it('creates Inbox category with name="Inbox" and is_inbox=true', async () => {
    dbState.selectResults = [[{ onboardingCompletedAt: null }], [{ id: 'free-plan-uuid' }]];

    const { finalizeOnboarding } = await import('@/lib/actions/onboarding');
    await finalizeOnboarding({});

    // First tx insert should be the categories row.
    const catInsert = dbState.txInserts[0].values as Record<string, unknown>;
    expect(catInsert.name).toBe('Inbox');
    expect(catInsert.isInbox).toBe(true);
    expect(catInsert.userId).toBe(USER_A);
  });

  it('creates Inbox project tied to the new Inbox category', async () => {
    dbState.selectResults = [[{ onboardingCompletedAt: null }], [{ id: 'free-plan-uuid' }]];

    const { finalizeOnboarding } = await import('@/lib/actions/onboarding');
    await finalizeOnboarding({});

    const projInsert = dbState.txInserts[1].values as Record<string, unknown>;
    expect(projInsert.name).toBe('Inbox');
    expect(projInsert.isInbox).toBe(true);
    expect(projInsert.categoryId).toBe('inbox-cat-uuid'); // from tx mock returning
    expect(projInsert.status).toBe('active');
  });

  it('creates a free-plan subscription for the user', async () => {
    dbState.selectResults = [[{ onboardingCompletedAt: null }], [{ id: 'free-plan-uuid' }]];

    const { finalizeOnboarding } = await import('@/lib/actions/onboarding');
    await finalizeOnboarding({});

    const subInsert = dbState.txInserts[3].values as Record<string, unknown>;
    expect(subInsert.planId).toBe('free-plan-uuid');
    expect(subInsert.status).toBe('active');
    expect(subInsert.userId).toBe(USER_A);
  });
});
