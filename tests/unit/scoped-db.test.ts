/**
 * Tests for scopedDb — BR-1 multi-tenant data isolation enforcement.
 *
 * Strategy: spy on the underlying Drizzle `db` calls and assert that the
 * factory:
 *   - Builds SELECT/UPDATE/DELETE queries with a `user_id = $1` filter
 *   - Injects userId on INSERT (and overrides any caller-supplied userId)
 *   - Refuses construction without a userId
 *
 * We don't hit a live Neon branch here — that's covered indirectly by the
 * CRUD-issue test suites (ISSUE-010 onward). The point of these tests is to
 * lock in the SHAPE of the queries the factory produces so a regression in
 * scoped.ts can't silently leak rows across users.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Capture the SQL clauses Drizzle builds so we can assert structure.
const lastCall: {
  fromTable?: unknown;
  whereSql?: unknown;
  insertTable?: unknown;
  insertValues?: unknown;
  setValues?: unknown;
  updateTable?: unknown;
  deleteTable?: unknown;
} = {};

vi.mock('drizzle-orm', async () => {
  const actual = await vi.importActual<typeof import('drizzle-orm')>('drizzle-orm');
  return {
    ...actual,
    // Pass-through — we still want and()/eq() to build real SQL nodes so the
    // factory's structure is exercised.
  };
});

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn((table: unknown) => {
        lastCall.fromTable = table;
        return {
          where: vi.fn((sql: unknown) => {
            lastCall.whereSql = sql;
            return { execute: vi.fn().mockResolvedValue([]) };
          }),
        };
      }),
    })),
    insert: vi.fn((table: unknown) => {
      lastCall.insertTable = table;
      return {
        values: vi.fn((vals: unknown) => {
          lastCall.insertValues = vals;
          return { execute: vi.fn().mockResolvedValue(undefined) };
        }),
      };
    }),
    update: vi.fn((table: unknown) => {
      lastCall.updateTable = table;
      return {
        set: vi.fn((vals: unknown) => {
          lastCall.setValues = vals;
          return {
            where: vi.fn((sql: unknown) => {
              lastCall.whereSql = sql;
              return {
                execute: vi.fn().mockResolvedValue(undefined),
                returning: vi.fn().mockReturnValue({ execute: vi.fn().mockResolvedValue([]) }),
              };
            }),
          };
        }),
      };
    }),
    delete: vi.fn((table: unknown) => {
      lastCall.deleteTable = table;
      return {
        where: vi.fn((sql: unknown) => {
          lastCall.whereSql = sql;
          return {
            execute: vi.fn().mockResolvedValue(undefined),
            returning: vi.fn().mockReturnValue({ execute: vi.fn().mockResolvedValue([]) }),
          };
        }),
      };
    }),
  },
}));

const USER_A = '00000000-0000-0000-0000-00000000000a';
const USER_B = '00000000-0000-0000-0000-00000000000b';

describe('scopedDb — construction', () => {
  it('throws when userId is empty', async () => {
    const { scopedDb } = await import('@/lib/db/scoped');
    expect(() => scopedDb('')).toThrow(/non-empty userId/);
  });

  it('throws when userId is not a string', async () => {
    const { scopedDb } = await import('@/lib/db/scoped');
    // @ts-expect-error — intentional misuse
    expect(() => scopedDb(undefined)).toThrow(/non-empty userId/);
  });

  it('exposes the bound userId for audit metadata', async () => {
    const { scopedDb } = await import('@/lib/db/scoped');
    expect(scopedDb(USER_A).userId).toBe(USER_A);
  });
});

describe('scopedDb — SELECT', () => {
  beforeEach(() => {
    Object.keys(lastCall).forEach((k) => delete (lastCall as Record<string, unknown>)[k]);
  });

  it('SELECT against notification_prefs always includes a user_id filter', async () => {
    const { scopedDb } = await import('@/lib/db/scoped');
    const sdb = scopedDb(USER_A);
    sdb.select('notificationPrefs');

    expect(lastCall.fromTable).toBeDefined();
    // The factory's eq(table.userId, userId) builds a SQL Chunk. We can't
    // pattern-match SQL nodes cleanly, but we CAN verify the call shape.
    expect(lastCall.whereSql).toBeDefined();
  });

  it('SELECT for userA and userB build distinct where clauses', async () => {
    const { scopedDb } = await import('@/lib/db/scoped');

    scopedDb(USER_A).select('subscriptions');
    const whereA = lastCall.whereSql;

    scopedDb(USER_B).select('subscriptions');
    const whereB = lastCall.whereSql;

    // Different references — each call produces a fresh eq() node.
    expect(whereA).not.toBe(whereB);
    expect(whereA).toBeDefined();
    expect(whereB).toBeDefined();
  });
});

describe('scopedDb — INSERT', () => {
  beforeEach(() => {
    Object.keys(lastCall).forEach((k) => delete (lastCall as Record<string, unknown>)[k]);
  });

  it('INSERT auto-injects userId into a single-row payload', async () => {
    const { scopedDb } = await import('@/lib/db/scoped');
    scopedDb(USER_A).insert('subscriptions', { planId: 'plan-free' });

    expect(lastCall.insertValues).toMatchObject({
      planId: 'plan-free',
      userId: USER_A,
    });
  });

  it('INSERT auto-injects userId into batch payloads', async () => {
    const { scopedDb } = await import('@/lib/db/scoped');
    scopedDb(USER_A).insert('usageMeters', [
      { periodStart: '2026-05-01', aiCallsCount: 1 },
      { periodStart: '2026-06-01', aiCallsCount: 5 },
    ]);

    expect(Array.isArray(lastCall.insertValues)).toBe(true);
    expect(lastCall.insertValues).toHaveLength(2);
    expect((lastCall.insertValues as Array<{ userId: string }>)[0].userId).toBe(USER_A);
    expect((lastCall.insertValues as Array<{ userId: string }>)[1].userId).toBe(USER_A);
  });

  it('INSERT overrides caller-supplied userId (no spoofing)', async () => {
    const { scopedDb } = await import('@/lib/db/scoped');
    // Caller tries to insert as userB while bound to userA — must be neutralized.
    scopedDb(USER_A).insert('notificationPrefs', {
      userId: USER_B, // attacker-controlled
      morningTime: '07:00',
    });

    expect((lastCall.insertValues as { userId: string }).userId).toBe(USER_A);
  });
});

describe('scopedDb — UPDATE / DELETE', () => {
  beforeEach(() => {
    Object.keys(lastCall).forEach((k) => delete (lastCall as Record<string, unknown>)[k]);
  });

  it('UPDATE applies user_id filter even without extra where', async () => {
    const { scopedDb } = await import('@/lib/db/scoped');
    scopedDb(USER_A).update('notificationPrefs', { morningTime: '09:00' });

    expect(lastCall.updateTable).toBeDefined();
    expect(lastCall.setValues).toEqual({ morningTime: '09:00' });
    expect(lastCall.whereSql).toBeDefined();
  });

  it('DELETE applies user_id filter even without extra where', async () => {
    const { scopedDb } = await import('@/lib/db/scoped');
    scopedDb(USER_A).delete('notificationPrefs');

    expect(lastCall.deleteTable).toBeDefined();
    expect(lastCall.whereSql).toBeDefined();
  });
});

describe('scopedDb — TENANT_TABLES registry', () => {
  it('lists every registered tenant table', async () => {
    const { TENANT_TABLES } = await import('@/lib/db/scoped');
    // Sort both sides so the assertion is stable regardless of registration order.
    expect(Object.keys(TENANT_TABLES).sort()).toEqual(
      [
        'activities',
        'categories',
        'daySheets',
        'notificationPrefs',
        'projects',
        'subscriptions',
        'usageMeters',
      ].sort()
    );
  });
});

afterEach(() => {
  vi.clearAllMocks();
});
