/**
 * Tests for Activity server actions (ISSUE-013).
 *
 * Covers the 9 AC scenarios + edge cases:
 *   - BR-15: scheduled_dates dedupe + sort
 *   - BR-15: empty array = pool/backlog (default)
 *   - BR-16: durationMinutes requires scheduledTime
 *   - quadrant range check (Zod 1-4)
 *   - progress_percent range check (Zod 0-100)
 *   - BR-17: status='done' forces progress_percent=100
 *   - Default to Inbox project when projectId omitted
 *   - Title required
 *   - Inbox missing returns clear error
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const authMock = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: authMock }));
vi.mock('@/lib/auth/permissions', () => ({ requirePermission: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const { scopedState } = vi.hoisted(() => ({
  scopedState: {
    selectResults: [] as unknown[],
    selectCalls: [] as { key: string; extra: unknown }[],
    inserted: undefined as unknown,
    insertedReturning: undefined as unknown,
    updated: undefined as { table: string; set: unknown; where: unknown } | undefined,
  },
}));

vi.mock('@/lib/db/scoped', () => ({
  scopedDb: vi.fn((userId: string) => ({
    userId,
    async select(key: string, extra: unknown) {
      scopedState.selectCalls.push({ key, extra });
      return (scopedState.selectResults.shift() ?? []) as unknown[];
    },
    insert(_key: string, values: unknown) {
      scopedState.inserted = values;
      return {
        returning: vi.fn(() =>
          Promise.resolve(scopedState.insertedReturning ?? [{ id: 'new-id' }])
        ),
      };
    },
    update(table: string, set: unknown) {
      return {
        where(extra: unknown) {
          scopedState.updated = { table, set, where: extra };
          return { execute: vi.fn().mockResolvedValue(undefined) };
        },
      };
    },
    delete: vi.fn(),
  })),
}));

const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PROJECT_INBOX = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const PROJECT_OTHER = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const ACTIVITY_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

function authedSession() {
  authMock.mockResolvedValue({ user: { id: USER_A, email: 'a@example.com', role: 'user' } });
}

function reset() {
  scopedState.selectResults = [];
  scopedState.selectCalls = [];
  scopedState.inserted = undefined;
  scopedState.insertedReturning = undefined;
  scopedState.updated = undefined;
  vi.clearAllMocks();
  authedSession();
}

describe('createActivity — BR-15 (scheduled_dates normalization)', () => {
  beforeEach(reset);

  it('dedupes + sorts asc', async () => {
    scopedState.insertedReturning = [{ id: 'a1' }];
    const { createActivity } = await import('@/lib/actions/activity');
    const result = await createActivity({
      title: 'Llamar a Juan',
      projectId: PROJECT_OTHER,
      scheduledDates: ['2026-05-21', '2026-05-19', '2026-05-21'],
    });

    expect(result.error).toBeUndefined();
    expect((scopedState.inserted as { scheduledDates: string[] }).scheduledDates).toEqual([
      '2026-05-19',
      '2026-05-21',
    ]);
  });

  it('defaults to empty array (pool/backlog) when omitted', async () => {
    scopedState.insertedReturning = [{ id: 'a1' }];
    const { createActivity } = await import('@/lib/actions/activity');
    await createActivity({ title: 'Pendiente', projectId: PROJECT_OTHER });

    expect((scopedState.inserted as { scheduledDates: string[] }).scheduledDates).toEqual([]);
  });
});

describe('createActivity — BR-16 (duration requires scheduled_time)', () => {
  beforeEach(reset);

  it('rejects durationMinutes without scheduledTime', async () => {
    const { createActivity } = await import('@/lib/actions/activity');
    const result = await createActivity({
      title: 'X',
      projectId: PROJECT_OTHER,
      durationMinutes: 30,
    });

    expect(result.error).toMatch(/duration_minutes requiere scheduled_time/);
    expect(scopedState.inserted).toBeUndefined();
  });

  it('accepts durationMinutes when scheduledTime is set', async () => {
    scopedState.insertedReturning = [{ id: 'a1' }];
    const { createActivity } = await import('@/lib/actions/activity');
    const result = await createActivity({
      title: 'Gym',
      projectId: PROJECT_OTHER,
      scheduledTime: '07:00',
      durationMinutes: 45,
    });

    expect(result.error).toBeUndefined();
    expect(scopedState.inserted).toMatchObject({
      scheduledTime: '07:00',
      durationMinutes: 45,
    });
  });
});

describe('createActivity — quadrant + progress_percent range', () => {
  beforeEach(reset);

  it('rejects quadrant=5', async () => {
    const { createActivity } = await import('@/lib/actions/activity');
    const result = await createActivity({
      title: 'X',
      projectId: PROJECT_OTHER,
      quadrant: 5,
    });

    expect(result.error).toBeDefined();
    expect(scopedState.inserted).toBeUndefined();
  });

  it('rejects progress_percent=150', async () => {
    const { createActivity } = await import('@/lib/actions/activity');
    const result = await createActivity({
      title: 'X',
      projectId: PROJECT_OTHER,
      progressPercent: 150,
    });

    expect(result.error).toBeDefined();
    expect(scopedState.inserted).toBeUndefined();
  });

  it('accepts quadrant in 1..4', async () => {
    scopedState.insertedReturning = [{ id: 'a1' }];
    const { createActivity } = await import('@/lib/actions/activity');
    await createActivity({ title: 'X', projectId: PROJECT_OTHER, quadrant: 2 });
    expect((scopedState.inserted as { quadrant: number }).quadrant).toBe(2);
  });
});

describe('createActivity — BR-17 (status=done forces progress=100)', () => {
  beforeEach(reset);

  it('overrides user-supplied progress when status=done at create', async () => {
    scopedState.insertedReturning = [{ id: 'a1' }];
    const { createActivity } = await import('@/lib/actions/activity');
    await createActivity({
      title: 'Done at create',
      projectId: PROJECT_OTHER,
      status: 'done',
      progressPercent: 60,
    });

    expect((scopedState.inserted as { progressPercent: number }).progressPercent).toBe(100);
  });

  it('sets completed_at when status=done at create', async () => {
    scopedState.insertedReturning = [{ id: 'a1' }];
    const { createActivity } = await import('@/lib/actions/activity');
    await createActivity({
      title: 'Done',
      projectId: PROJECT_OTHER,
      status: 'done',
    });

    expect((scopedState.inserted as { completedAt: Date | null }).completedAt).toBeInstanceOf(Date);
  });
});

describe('createActivity — default to Inbox', () => {
  beforeEach(reset);

  it('uses the Inbox project_id when omitted', async () => {
    scopedState.selectResults = [[{ id: PROJECT_INBOX, name: 'Inbox', isInbox: true }]];
    scopedState.insertedReturning = [{ id: 'a1' }];

    const { createActivity } = await import('@/lib/actions/activity');
    await createActivity({ title: 'Sin proyecto' });

    expect((scopedState.inserted as { projectId: string }).projectId).toBe(PROJECT_INBOX);
  });

  it('returns a clear error when Inbox is not yet created', async () => {
    scopedState.selectResults = [[]]; // no Inbox row

    const { createActivity } = await import('@/lib/actions/activity');
    const result = await createActivity({ title: 'Sin proyecto' });

    expect(result.error).toMatch(/Inbox/);
    expect(scopedState.inserted).toBeUndefined();
  });
});

describe('createActivity — basic validation', () => {
  beforeEach(reset);

  it('rejects empty title', async () => {
    const { createActivity } = await import('@/lib/actions/activity');
    const result = await createActivity({ title: '', projectId: PROJECT_OTHER });

    expect(result.error).toMatch(/título es requerido/);
    expect(scopedState.inserted).toBeUndefined();
  });

  it('normalizes tags (lowercase + dedupe)', async () => {
    scopedState.insertedReturning = [{ id: 'a1' }];
    const { createActivity } = await import('@/lib/actions/activity');
    await createActivity({
      title: 'X',
      projectId: PROJECT_OTHER,
      tags: ['Work', 'work', 'Urgent', 'urgent'],
    });

    expect((scopedState.inserted as { tags: string[] }).tags).toEqual(['urgent', 'work']);
  });

  it('rejects invalid recurrence DSL', async () => {
    const { createActivity } = await import('@/lib/actions/activity');
    const result = await createActivity({
      title: 'X',
      projectId: PROJECT_OTHER,
      recurrenceRule: 'every-other-tuesday',
    });

    expect(result.error).toMatch(/DSL de recurrencia/);
  });

  it('accepts valid recurrence DSL: weekly:MO,WE,FR', async () => {
    scopedState.insertedReturning = [{ id: 'a1' }];
    const { createActivity } = await import('@/lib/actions/activity');
    const result = await createActivity({
      title: 'Gym',
      projectId: PROJECT_OTHER,
      recurrenceRule: 'weekly:MO,WE,FR',
    });

    expect(result.error).toBeUndefined();
  });

  it('accepts monthly:last', async () => {
    scopedState.insertedReturning = [{ id: 'a1' }];
    const { createActivity } = await import('@/lib/actions/activity');
    const result = await createActivity({
      title: 'Reporte mensual',
      projectId: PROJECT_OTHER,
      recurrenceRule: 'monthly:last',
    });

    expect(result.error).toBeUndefined();
  });
});

describe('updateActivity — BR-17 (status transition to done forces progress=100)', () => {
  beforeEach(reset);

  it('forces progress=100 when transitioning to done', async () => {
    scopedState.selectResults = [
      [
        {
          id: ACTIVITY_ID,
          status: 'in_progress',
          progressPercent: 60,
          completedAt: null,
        },
      ],
    ];

    const { updateActivity } = await import('@/lib/actions/activity');
    const result = await updateActivity({
      id: ACTIVITY_ID,
      status: 'done',
    });

    expect(result.error).toBeUndefined();
    const set = scopedState.updated?.set as Record<string, unknown>;
    expect(set.progressPercent).toBe(100);
    expect(set.completedAt).toBeInstanceOf(Date);
  });

  it('clears completed_at when re-opening from done', async () => {
    scopedState.selectResults = [
      [
        {
          id: ACTIVITY_ID,
          status: 'done',
          progressPercent: 100,
          completedAt: new Date('2026-05-19'),
        },
      ],
    ];

    const { updateActivity } = await import('@/lib/actions/activity');
    await updateActivity({ id: ACTIVITY_ID, status: 'in_progress', progressPercent: 50 });

    const set = scopedState.updated?.set as Record<string, unknown>;
    expect(set.status).toBe('in_progress');
    expect(set.completedAt).toBeNull();
  });

  it('overrides user-supplied progress when also transitioning to done', async () => {
    scopedState.selectResults = [
      [{ id: ACTIVITY_ID, status: 'pending', progressPercent: null, completedAt: null }],
    ];

    const { updateActivity } = await import('@/lib/actions/activity');
    await updateActivity({ id: ACTIVITY_ID, status: 'done', progressPercent: 30 });

    const set = scopedState.updated?.set as Record<string, unknown>;
    expect(set.progressPercent).toBe(100);
  });
});

describe('updateActivity — no-op when nothing to update', () => {
  beforeEach(reset);

  it('no-ops when only id is provided', async () => {
    scopedState.selectResults = [[{ id: ACTIVITY_ID, status: 'pending', completedAt: null }]];

    const { updateActivity } = await import('@/lib/actions/activity');
    const result = await updateActivity({ id: ACTIVITY_ID });

    expect(result.error).toBeUndefined();
    expect(scopedState.updated).toBeUndefined();
  });

  it('returns "no encontrada" when row does not exist', async () => {
    scopedState.selectResults = [[]];

    const { updateActivity } = await import('@/lib/actions/activity');
    const result = await updateActivity({ id: ACTIVITY_ID, title: 'X' });

    expect(result.error).toBe('Actividad no encontrada');
  });
});

describe('deleteActivity', () => {
  beforeEach(reset);

  it('soft-deletes', async () => {
    scopedState.selectResults = [[{ id: ACTIVITY_ID, deletedAt: null }]];

    const { deleteActivity } = await import('@/lib/actions/activity');
    const result = await deleteActivity({ id: ACTIVITY_ID });

    expect(result.error).toBeUndefined();
    expect(scopedState.updated?.set).toHaveProperty('deletedAt');
  });

  it('idempotent on already-deleted', async () => {
    scopedState.selectResults = [[{ id: ACTIVITY_ID, deletedAt: new Date() }]];

    const { deleteActivity } = await import('@/lib/actions/activity');
    const result = await deleteActivity({ id: ACTIVITY_ID });

    expect(result.error).toBeUndefined();
    expect(scopedState.updated).toBeUndefined();
  });

  it('returns "no encontrada" when row missing', async () => {
    scopedState.selectResults = [[]];

    const { deleteActivity } = await import('@/lib/actions/activity');
    const result = await deleteActivity({ id: ACTIVITY_ID });

    expect(result.error).toBe('Actividad no encontrada');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// transitionActivity (ISSUE-017) — BR-8 matrix + reason capture
// ─────────────────────────────────────────────────────────────────────────

describe('transitionActivity — BR-8 enforcement', () => {
  beforeEach(reset);

  it('happy path: pending → done sets progress=100 + completed_at', async () => {
    scopedState.selectResults = [
      [{ id: ACTIVITY_ID, status: 'pending', progressPercent: null, completedAt: null }],
    ];

    const { transitionActivity } = await import('@/lib/actions/activity');
    const result = await transitionActivity({ id: ACTIVITY_ID, toStatus: 'done' });

    expect(result.error).toBeUndefined();
    const set = scopedState.updated?.set as Record<string, unknown>;
    expect(set.status).toBe('done');
    expect(set.progressPercent).toBe(100);
    expect(set.completedAt).toBeInstanceOf(Date);
  });

  it('rejects done → skipped (BR-8 forbidden)', async () => {
    scopedState.selectResults = [[{ id: ACTIVITY_ID, status: 'done', completedAt: new Date() }]];

    const { transitionActivity } = await import('@/lib/actions/activity');
    const result = await transitionActivity({ id: ACTIVITY_ID, toStatus: 'skipped' });

    expect(result.error).toBe('Transición no permitida');
    expect(scopedState.updated).toBeUndefined();
  });

  it('rejects done → blocked (BR-8 forbidden)', async () => {
    scopedState.selectResults = [[{ id: ACTIVITY_ID, status: 'done', completedAt: new Date() }]];

    const { transitionActivity } = await import('@/lib/actions/activity');
    const result = await transitionActivity({ id: ACTIVITY_ID, toStatus: 'blocked' });

    expect(result.error).toBe('Transición no permitida');
  });

  it('rejects skipped → done (must route via pending)', async () => {
    scopedState.selectResults = [[{ id: ACTIVITY_ID, status: 'skipped' }]];

    const { transitionActivity } = await import('@/lib/actions/activity');
    const result = await transitionActivity({ id: ACTIVITY_ID, toStatus: 'done' });

    expect(result.error).toBe('Transición no permitida');
  });

  it('no-ops when fromStatus === toStatus', async () => {
    scopedState.selectResults = [[{ id: ACTIVITY_ID, status: 'pending' }]];

    const { transitionActivity } = await import('@/lib/actions/activity');
    const result = await transitionActivity({ id: ACTIVITY_ID, toStatus: 'pending' });

    expect(result.error).toBeUndefined();
    expect(scopedState.updated).toBeUndefined();
  });
});

describe('transitionActivity — reason capture', () => {
  beforeEach(reset);

  it('rejects → blocked without reasonText with "Indica por qué..."', async () => {
    scopedState.selectResults = [[{ id: ACTIVITY_ID, status: 'pending' }]];

    const { transitionActivity } = await import('@/lib/actions/activity');
    const result = await transitionActivity({
      id: ACTIVITY_ID,
      toStatus: 'blocked',
      // no reasonText
    });

    expect(result.error).toMatch(/Indica por qué está bloqueado/);
    expect(scopedState.updated).toBeUndefined();
  });

  it('accepts → blocked with reasonText + reasonCategory', async () => {
    scopedState.selectResults = [[{ id: ACTIVITY_ID, status: 'pending' }]];

    const { transitionActivity } = await import('@/lib/actions/activity');
    const result = await transitionActivity({
      id: ACTIVITY_ID,
      toStatus: 'blocked',
      reasonText: 'Espero feedback de cliente',
      reasonCategory: 'blocked',
    });

    expect(result.error).toBeUndefined();
    const set = scopedState.updated?.set as Record<string, unknown>;
    expect(set.status).toBe('blocked');
    expect(set.reasonNotDone).toBe('Espero feedback de cliente');
    expect(set.reasonCategory).toBe('blocked');
  });

  it('accepts → skipped without reasonText (optional)', async () => {
    scopedState.selectResults = [[{ id: ACTIVITY_ID, status: 'pending' }]];

    const { transitionActivity } = await import('@/lib/actions/activity');
    const result = await transitionActivity({
      id: ACTIVITY_ID,
      toStatus: 'skipped',
      reasonCategory: 'time',
    });

    expect(result.error).toBeUndefined();
    const set = scopedState.updated?.set as Record<string, unknown>;
    expect(set.status).toBe('skipped');
    expect(set.reasonCategory).toBe('time');
  });

  it('rejects invalid reasonCategory at Zod layer', async () => {
    const { transitionActivity } = await import('@/lib/actions/activity');
    const result = await transitionActivity({
      id: ACTIVITY_ID,
      toStatus: 'skipped',
      reasonCategory: 'bogus_value',
    });

    expect(result.error).toBeDefined();
    expect(scopedState.updated).toBeUndefined();
  });
});

describe('transitionActivity — undo + reactivate semantics', () => {
  beforeEach(reset);

  it('done → pending clears completed_at', async () => {
    scopedState.selectResults = [
      [{ id: ACTIVITY_ID, status: 'done', completedAt: new Date('2026-05-19') }],
    ];

    const { transitionActivity } = await import('@/lib/actions/activity');
    const result = await transitionActivity({ id: ACTIVITY_ID, toStatus: 'pending' });

    expect(result.error).toBeUndefined();
    const set = scopedState.updated?.set as Record<string, unknown>;
    expect(set.status).toBe('pending');
    expect(set.completedAt).toBeNull();
  });

  it('skipped → pending clears reason_* fields', async () => {
    scopedState.selectResults = [
      [
        {
          id: ACTIVITY_ID,
          status: 'skipped',
          reasonCategory: 'time',
          reasonNotDone: 'No tuve tiempo',
        },
      ],
    ];

    const { transitionActivity } = await import('@/lib/actions/activity');
    const result = await transitionActivity({ id: ACTIVITY_ID, toStatus: 'pending' });

    expect(result.error).toBeUndefined();
    const set = scopedState.updated?.set as Record<string, unknown>;
    expect(set.reasonCategory).toBeNull();
    expect(set.reasonNotDone).toBeNull();
  });

  it('blocked → in_progress preserves the existing reason fields (cleanup happens on pending)', async () => {
    scopedState.selectResults = [
      [
        {
          id: ACTIVITY_ID,
          status: 'blocked',
          reasonCategory: 'blocked',
          reasonNotDone: 'Esperando aprobación',
        },
      ],
    ];

    const { transitionActivity } = await import('@/lib/actions/activity');
    const result = await transitionActivity({ id: ACTIVITY_ID, toStatus: 'in_progress' });

    expect(result.error).toBeUndefined();
    const set = scopedState.updated?.set as Record<string, unknown>;
    expect(set.status).toBe('in_progress');
    // No keys for reason* — old values persist (intentional; UI clears on user action).
    expect(Object.prototype.hasOwnProperty.call(set, 'reasonCategory')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(set, 'reasonNotDone')).toBe(false);
  });
});

describe('transitionActivity — auth + not-found', () => {
  beforeEach(reset);

  it('returns "no encontrada" if row missing for user', async () => {
    scopedState.selectResults = [[]];

    const { transitionActivity } = await import('@/lib/actions/activity');
    const result = await transitionActivity({ id: ACTIVITY_ID, toStatus: 'done' });

    expect(result.error).toBe('Actividad no encontrada');
    expect(scopedState.updated).toBeUndefined();
  });
});

// ─── listActivities ──────────────────────────────────────────────────────

describe('listActivities — scope classification', () => {
  beforeEach(reset);

  function row(overrides: Partial<Record<string, unknown>>) {
    return {
      id: 'r-' + Math.random().toString(36).slice(2, 8),
      userId: USER_A,
      projectId: PROJECT_INBOX,
      title: 'x',
      description: null,
      scheduledDates: [],
      scheduledTime: null,
      durationMinutes: null,
      deadline: null,
      estimatedMinutes: null,
      priority: 3,
      quadrant: null,
      progressPercent: null,
      recurrenceRule: null,
      status: 'pending' as const,
      reasonNotDone: null,
      reasonCategory: null,
      tags: [],
      completedAt: null,
      deletedAt: null,
      ...overrides,
    };
  }

  it('splits rows into today_scheduled / today_pool / week / backlog', async () => {
    scopedState.selectResults = [
      [
        row({ id: 'a', scheduledDates: ['2026-05-27'], scheduledTime: '09:00:00' }),
        row({ id: 'b', scheduledDates: ['2026-05-27'], scheduledTime: null }),
        row({ id: 'c', scheduledDates: ['2026-05-29'], scheduledTime: null }),
        row({ id: 'd', scheduledDates: ['2026-06-15'], scheduledTime: null }),
        row({ id: 'e', scheduledDates: [], scheduledTime: null }),
        row({ id: 'f', scheduledDates: ['2025-01-01'], scheduledTime: null }),
      ],
    ];

    const { listActivities } = await import('@/lib/actions/activity');
    const result = await listActivities({ date: '2026-05-27' });

    if ('error' in result && result.error) throw new Error(result.error);
    const data = result.data!;
    expect(data.scheduled.map((r) => r.id)).toEqual(['a']);
    expect(data.pool.todayUnscheduled.map((r) => r.id)).toEqual(['b']);
    expect(data.pool.thisWeek.map((r) => r.id)).toEqual(['c']);
    // d (far future), e (no dates), f (past only) → all backlog.
    expect(data.pool.backlog.map((r) => r.id).sort()).toEqual(['d', 'e', 'f']);
  });

  it('skips done activities when includeDone=false', async () => {
    scopedState.selectResults = [
      [
        row({ id: 'p', status: 'pending', scheduledDates: ['2026-05-27'] }),
        row({ id: 'd', status: 'done', scheduledDates: ['2026-05-27'] }),
      ],
    ];

    const { listActivities } = await import('@/lib/actions/activity');
    const result = await listActivities({ date: '2026-05-27', includeDone: false });

    if ('error' in result && result.error) throw new Error(result.error);
    expect(result.data!.rows.map((r) => r.id)).toEqual(['p']);
  });

  it('excludes soft-deleted rows by default', async () => {
    scopedState.selectResults = [[row({ id: 'live' })]];

    const { listActivities } = await import('@/lib/actions/activity');
    await listActivities({ date: '2026-05-27' });

    // First (and only) select call must carry the isNull(deletedAt) extra clause.
    expect(scopedState.selectCalls).toHaveLength(1);
    expect(scopedState.selectCalls[0].extra).toBeDefined();
  });

  it('returns "Debes iniciar sesión" when no session', async () => {
    authMock.mockResolvedValueOnce(null);
    const { listActivities } = await import('@/lib/actions/activity');
    const result = await listActivities({ date: '2026-05-27' });
    expect(result.error).toBe('Debes iniciar sesión');
  });
});
