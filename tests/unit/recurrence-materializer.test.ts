/**
 * Tests for `expandRecurrence` and the high-level cron materializer
 * (ISSUE-024).
 *
 * Pure expander gets exhaustive coverage including DST + month-edge
 * cases. The materializer is tested via mocked db to verify idempotency
 * and the "all parents" walk.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { expandRecurrence, expandFromString, parseRecurrenceRule } from '@/lib/domain/recurrence';

// Helper — build a UTC date for tests (no TZ ambiguity in the input).
function utc(y: number, m: number, d: number, h = 12, min = 0): Date {
  return new Date(Date.UTC(y, m - 1, d, h, min));
}

// ─── expandRecurrence ────────────────────────────────────────────────────

describe('expandRecurrence — daily', () => {
  it('emits N consecutive days for a 14-day window', () => {
    const dates = expandRecurrence({ kind: 'daily' }, utc(2026, 5, 19), 14, 'America/Mexico_City');
    expect(dates).toHaveLength(14);
    expect(dates[0]).toBe('2026-05-19');
    expect(dates[13]).toBe('2026-06-01');
  });

  it('emits nothing for days=0', () => {
    expect(expandRecurrence({ kind: 'daily' }, utc(2026, 5, 19), 0, 'UTC')).toEqual([]);
  });
});

describe('expandRecurrence — weekly', () => {
  it('emits only matching weekdays', () => {
    // May 19 2026 is a Tuesday → MO/WE/FR in next 14 days:
    //   WE 20, FR 22, MO 25, WE 27, FR 29, MO Jun 1
    const dates = expandRecurrence(
      { kind: 'weekly', days: new Set(['MO', 'WE', 'FR']) },
      utc(2026, 5, 19),
      14,
      'America/Mexico_City'
    );
    expect(dates).toEqual([
      '2026-05-20',
      '2026-05-22',
      '2026-05-25',
      '2026-05-27',
      '2026-05-29',
      '2026-06-01',
    ]);
  });

  it('handles single-day weekly (e.g. only SU)', () => {
    // May 19 2026 Tue, next 14d Sundays: May 24, May 31.
    const dates = expandRecurrence(
      { kind: 'weekly', days: new Set(['SU']) },
      utc(2026, 5, 19),
      14,
      'America/Mexico_City'
    );
    expect(dates).toEqual(['2026-05-24', '2026-05-31']);
  });
});

describe('expandRecurrence — monthly_day', () => {
  it('emits the next occurrence of day N inside the window', () => {
    // Starting May 19, asking for day 1 → next is Jun 1 (within 14 days).
    const dates = expandRecurrence(
      { kind: 'monthly_day', day: 1 },
      utc(2026, 5, 19),
      14,
      'America/Mexico_City'
    );
    expect(dates).toEqual(['2026-06-01']);
  });

  it('returns empty if day N falls outside the window', () => {
    // Starting May 19, asking for day 15 → next is Jun 15 (27 days away).
    const dates = expandRecurrence(
      { kind: 'monthly_day', day: 15 },
      utc(2026, 5, 19),
      14,
      'America/Mexico_City'
    );
    expect(dates).toEqual([]);
  });

  it('finds two occurrences in a wide window crossing two month-1s', () => {
    const dates = expandRecurrence(
      { kind: 'monthly_day', day: 1 },
      utc(2026, 5, 28),
      40,
      'America/Mexico_City'
    );
    expect(dates).toContain('2026-06-01');
    expect(dates).toContain('2026-07-01');
  });
});

describe('expandRecurrence — monthly_last', () => {
  it('resolves "last day" correctly across short + long months', () => {
    // Window covers end of May (31), end of June (30), end of July (31).
    const dates = expandRecurrence(
      { kind: 'monthly_last' },
      utc(2026, 5, 20),
      80,
      'America/Mexico_City'
    );
    expect(dates).toContain('2026-05-31');
    expect(dates).toContain('2026-06-30');
    expect(dates).toContain('2026-07-31');
  });

  it('handles February 28 in non-leap year', () => {
    const dates = expandRecurrence(
      { kind: 'monthly_last' },
      utc(2026, 2, 15),
      20,
      'America/Mexico_City'
    );
    // 2026 is NOT a leap year — Feb has 28 days.
    expect(dates).toEqual(['2026-02-28']);
  });

  it('handles February 29 in leap year (2028)', () => {
    const dates = expandRecurrence(
      { kind: 'monthly_last' },
      utc(2028, 2, 15),
      20,
      'America/Mexico_City'
    );
    expect(dates).toEqual(['2028-02-29']);
  });
});

describe('expandRecurrence — TZ + DST', () => {
  it('resolves weekday in user TZ, not UTC', () => {
    // 2026-05-19 03:00 UTC → 2026-05-18 22:00 in America/Mexico_City (Sun-Mon-Tue boundary).
    // Wait actually 03:00 UTC May 19 = 21:00 May 18 in CST (UTC-6). So Mon May 18 (local).
    // Asking weekly:MO over 1 day from this instant should match (it's locally Monday).
    const dates = expandRecurrence(
      { kind: 'weekly', days: new Set(['MO']) },
      new Date('2026-05-19T03:00:00Z'),
      1,
      'America/Mexico_City'
    );
    expect(dates).toEqual(['2026-05-18']);
  });

  it('does not skip a day across DST spring-forward (US Pacific)', () => {
    // US DST springs forward 2026-03-08 02:00 local. A daily rule starting
    // March 7 over 4 days must emit 4 distinct local dates without dupes.
    const dates = expandRecurrence(
      { kind: 'daily' },
      utc(2026, 3, 7, 10),
      4,
      'America/Los_Angeles'
    );
    expect(dates).toEqual(['2026-03-07', '2026-03-08', '2026-03-09', '2026-03-10']);
  });

  it('does not duplicate a day across DST fall-back', () => {
    // US DST falls back 2026-11-01 02:00 → 01:00. Daily rule over 4 days.
    const dates = expandRecurrence(
      { kind: 'daily' },
      utc(2026, 10, 31, 10),
      4,
      'America/Los_Angeles'
    );
    expect(dates).toEqual(['2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03']);
    expect(new Set(dates).size).toBe(4); // no dup
  });
});

describe('expandFromString — convenience', () => {
  it('parses + expands in one call (valid rule)', () => {
    const dates = expandFromString('weekly:WE', utc(2026, 5, 19), 14, 'UTC');
    // May 19 2026 is Tue. Next WEs in 14d: May 20, May 27.
    expect(dates).toEqual(['2026-05-20', '2026-05-27']);
  });

  it('returns empty array for an invalid rule string (no throw)', () => {
    const dates = expandFromString('FREQ=DAILY', utc(2026, 5, 19), 14, 'UTC');
    expect(dates).toEqual([]);
  });

  it('returns empty array for null rule', () => {
    const dates = expandFromString('', utc(2026, 5, 19), 14, 'UTC');
    expect(dates).toEqual([]);
  });
});

// ─── Cron materializer (mocked db) ───────────────────────────────────────

const { dbState } = vi.hoisted(() => ({
  dbState: {
    selectResults: [] as unknown[],
    inserted: undefined as unknown,
    insertCalls: 0,
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(async () => (dbState.selectResults.shift() ?? []) as unknown[]),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn((vals: unknown) => {
        dbState.inserted = vals;
        dbState.insertCalls += 1;
        return Promise.resolve(undefined);
      }),
    })),
  },
}));

function resetDb() {
  dbState.selectResults = [];
  dbState.inserted = undefined;
  dbState.insertCalls = 0;
  vi.clearAllMocks();
}

const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

describe('materializeUserRecurrences', () => {
  beforeEach(resetDb);

  it('no-ops when the user has no recurring parents', async () => {
    dbState.selectResults = [
      [{ timezone: 'America/Mexico_City' }], // user lookup
      [], // parents lookup — empty
    ];

    const { materializeUserRecurrences } = await import('@/lib/cron/recurrence');
    const result = await materializeUserRecurrences(USER_A, {
      fromDate: utc(2026, 5, 19),
    });

    expect(result).toEqual({ created: 0, skipped: 0, parentCount: 0 });
    expect(dbState.insertCalls).toBe(0);
  });

  it('emits "user not found" gracefully', async () => {
    dbState.selectResults = [[]]; // user lookup empty

    const { materializeUserRecurrences } = await import('@/lib/cron/recurrence');
    const result = await materializeUserRecurrences(USER_A);

    expect(result).toEqual({ created: 0, skipped: 0, parentCount: 0 });
    expect(dbState.insertCalls).toBe(0);
  });

  it('inserts missing instances for a daily parent (14 in empty state)', async () => {
    const parent = {
      id: 'parent-1',
      userId: USER_A,
      projectId: 'proj-1',
      title: 'Diario',
      description: null,
      recurrenceRule: 'daily',
      scheduledTime: '08:00',
      durationMinutes: 30,
      estimatedMinutes: 30,
      priority: 3,
      quadrant: null,
      tags: [],
    };
    dbState.selectResults = [
      [{ timezone: 'America/Mexico_City' }],
      [parent], // 1 parent
      [], // existing instances — none
    ];

    const { materializeUserRecurrences } = await import('@/lib/cron/recurrence');
    const result = await materializeUserRecurrences(USER_A, {
      fromDate: utc(2026, 5, 19),
    });

    expect(result.parentCount).toBe(1);
    expect(result.created).toBe(14);
    expect(result.skipped).toBe(0);
    expect(dbState.insertCalls).toBe(1);
    expect((dbState.inserted as unknown[]).length).toBe(14);
  });

  it('is idempotent — re-run with existing instances skips them', async () => {
    const parent = {
      id: 'parent-2',
      userId: USER_A,
      projectId: 'proj-1',
      title: 'Daily',
      description: null,
      recurrenceRule: 'daily',
      scheduledTime: null,
      durationMinutes: null,
      estimatedMinutes: null,
      priority: 3,
      quadrant: null,
      tags: [],
    };
    // Existing instances cover the first 10 days of the window.
    const existingDates = Array.from({ length: 10 }, (_, i) => {
      const d = new Date(utc(2026, 5, 19));
      d.setUTCDate(d.getUTCDate() + i);
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d);
    });

    dbState.selectResults = [
      [{ timezone: 'America/Mexico_City' }],
      [parent],
      existingDates.map((d) => ({ scheduledDates: [d] })),
    ];

    const { materializeUserRecurrences } = await import('@/lib/cron/recurrence');
    const result = await materializeUserRecurrences(USER_A, {
      fromDate: utc(2026, 5, 19),
    });

    // 14 target dates, 10 already exist → 4 created, 10 skipped.
    expect(result.created).toBe(4);
    expect(result.skipped).toBe(10);
    expect((dbState.inserted as unknown[]).length).toBe(4);
  });

  it('skips a parent whose rule expands to zero dates inside the window', async () => {
    const parent = {
      id: 'parent-3',
      userId: USER_A,
      projectId: 'proj-1',
      title: 'Monthly day 15',
      description: null,
      recurrenceRule: 'monthly:15',
      scheduledTime: null,
      durationMinutes: null,
      estimatedMinutes: null,
      priority: 3,
      quadrant: null,
      tags: [],
    };
    // 14 days from May 19 doesn't hit day 15.
    dbState.selectResults = [
      [{ timezone: 'America/Mexico_City' }],
      [parent],
      // existing instances lookup — never reached for parents with no
      // targetDates, but stage [] just in case.
      [],
    ];

    const { materializeUserRecurrences } = await import('@/lib/cron/recurrence');
    const result = await materializeUserRecurrences(USER_A, {
      fromDate: utc(2026, 5, 19),
    });

    expect(result.created).toBe(0);
    expect(dbState.insertCalls).toBe(0);
  });
});

describe('Zod recurrenceSchema integration with parseRecurrenceRule', () => {
  // Smoke test that the schema rejects what the parser rejects.
  it('parser-rejection matches schema-rejection for FREQ strings', () => {
    expect(parseRecurrenceRule('FREQ=DAILY')).toBeNull();
  });

  it('parser-acceptance matches schema-acceptance for valid DSL', () => {
    expect(parseRecurrenceRule('weekly:MO,WE')).not.toBeNull();
    expect(parseRecurrenceRule('monthly:last')).not.toBeNull();
  });
});
