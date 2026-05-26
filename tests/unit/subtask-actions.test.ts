/**
 * Tests for Subtask server actions (ISSUE-015, BR-5).
 *
 * Mocks two modules:
 *   - `@/lib/db/scoped` — used by `requireOwnedActivity` to verify
 *     the parent activity belongs to the caller.
 *   - `@/lib/db/drizzle` — used for direct subtask CRUD (no user_id
 *     column on the table; allowlisted in ESLint).
 *
 * The state objects are vi.hoisted-isolated to survive parallel runs.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const authMock = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: authMock }));
vi.mock('@/lib/auth/permissions', () => ({ requirePermission: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const { scopedState, dbState } = vi.hoisted(() => ({
  scopedState: {
    // selectResults are staged for the `requireOwnedActivity` lookup.
    activityLookup: [] as unknown[],
  },
  dbState: {
    selectResults: [] as unknown[],
    inserted: undefined as unknown,
    updated: undefined as { set: unknown } | undefined,
    deleted: false,
    transactionInvoked: false,
    txUpdates: [] as Array<{ set: unknown }>,
  },
}));

vi.mock('@/lib/db/scoped', () => ({
  scopedDb: vi.fn(() => ({
    userId: 'mock',
    async select() {
      return scopedState.activityLookup as unknown[];
    },
  })),
}));

vi.mock('@/lib/db/drizzle', () => {
  const mkSelect = () => ({
    from: vi.fn(() => ({
      where: vi.fn(async () => (dbState.selectResults.shift() ?? []) as unknown[]),
    })),
  });

  const mkInsert = () => ({
    values: vi.fn((vals: unknown) => {
      dbState.inserted = vals;
      return {
        returning: vi.fn(() => Promise.resolve([{ id: 'new-subtask-uuid' }])),
      };
    }),
  });

  const mkUpdate = () => ({
    set: vi.fn((set: unknown) => {
      dbState.updated = { set };
      return { where: vi.fn(async () => undefined) };
    }),
  });

  const mkDelete = () => ({
    where: vi.fn(async () => {
      dbState.deleted = true;
      return undefined;
    }),
  });

  const mkTx = () => ({
    update: vi.fn(() => ({
      set: vi.fn((set: unknown) => {
        dbState.txUpdates.push({ set });
        return { where: vi.fn(async () => undefined) };
      }),
    })),
  });

  return {
    db: {
      select: vi.fn(() => mkSelect()),
      insert: vi.fn(() => mkInsert()),
      update: vi.fn(() => mkUpdate()),
      delete: vi.fn(() => mkDelete()),
      transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
        dbState.transactionInvoked = true;
        return cb(mkTx());
      }),
    },
  };
});

const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ACTIVITY_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const SUBTASK_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

function reset() {
  scopedState.activityLookup = [];
  dbState.selectResults = [];
  dbState.inserted = undefined;
  dbState.updated = undefined;
  dbState.deleted = false;
  dbState.transactionInvoked = false;
  dbState.txUpdates = [];
  vi.clearAllMocks();
  authMock.mockResolvedValue({ user: { id: USER_A, email: 'a@example.com', role: 'user' } });
}

describe('createSubtask', () => {
  beforeEach(reset);

  it('rejects when the parent activity is not owned by the user', async () => {
    scopedState.activityLookup = []; // no activity match

    const { createSubtask } = await import('@/lib/actions/subtask');
    const result = await createSubtask({ activityId: ACTIVITY_ID, title: 'X' });

    expect(result.error).toBe('Actividad no encontrada');
    expect(dbState.inserted).toBeUndefined();
  });

  it('inserts with position=0 when no siblings exist', async () => {
    scopedState.activityLookup = [{ id: ACTIVITY_ID }];
    dbState.selectResults = [[]]; // sibling lookup

    const { createSubtask } = await import('@/lib/actions/subtask');
    const result = await createSubtask({ activityId: ACTIVITY_ID, title: 'First' });

    expect(result.error).toBeUndefined();
    expect(result.data).toEqual({ id: 'new-subtask-uuid' });
    expect(dbState.inserted).toMatchObject({
      activityId: ACTIVITY_ID,
      title: 'First',
      status: 'pending',
      position: 0,
    });
  });

  it('auto-positions as max+1 when siblings exist', async () => {
    scopedState.activityLookup = [{ id: ACTIVITY_ID }];
    dbState.selectResults = [[{ position: 0 }, { position: 2 }, { position: 1 }]];

    const { createSubtask } = await import('@/lib/actions/subtask');
    await createSubtask({ activityId: ACTIVITY_ID, title: 'Fourth' });

    expect((dbState.inserted as { position: number }).position).toBe(3);
  });

  it('rejects empty title at the Zod layer', async () => {
    const { createSubtask } = await import('@/lib/actions/subtask');
    const result = await createSubtask({ activityId: ACTIVITY_ID, title: '   ' });

    expect(result.error).toMatch(/título es requerido/);
    expect(dbState.inserted).toBeUndefined();
  });
});

describe('toggleSubtask', () => {
  beforeEach(reset);

  it('pending → done sets completed_at and reports allSubtasksDone when it was the last one', async () => {
    scopedState.activityLookup = [{ id: ACTIVITY_ID }];
    dbState.selectResults = [
      [
        { id: SUBTASK_ID, status: 'pending' },
        { id: 'other-1', status: 'done' },
        { id: 'other-2', status: 'done' },
      ],
    ];

    const { toggleSubtask } = await import('@/lib/actions/subtask');
    const result = await toggleSubtask({ activityId: ACTIVITY_ID, id: SUBTASK_ID });

    expect(result.error).toBeUndefined();
    expect(result.data).toMatchObject({ allSubtasksDone: true, newStatus: 'done' });
    expect((dbState.updated?.set as Record<string, unknown>).status).toBe('done');
    expect((dbState.updated?.set as Record<string, unknown>).completedAt).toBeDefined();
  });

  it('done → pending clears completed_at and reports allSubtasksDone=false', async () => {
    scopedState.activityLookup = [{ id: ACTIVITY_ID }];
    dbState.selectResults = [
      [
        { id: SUBTASK_ID, status: 'done' },
        { id: 'other', status: 'done' },
      ],
    ];

    const { toggleSubtask } = await import('@/lib/actions/subtask');
    const result = await toggleSubtask({ activityId: ACTIVITY_ID, id: SUBTASK_ID });

    expect(result.error).toBeUndefined();
    expect(result.data).toMatchObject({ allSubtasksDone: false, newStatus: 'pending' });
    expect((dbState.updated?.set as Record<string, unknown>).status).toBe('pending');
    expect((dbState.updated?.set as Record<string, unknown>).completedAt).toBeNull();
  });

  it('reports allSubtasksDone=false when there are still pending siblings', async () => {
    scopedState.activityLookup = [{ id: ACTIVITY_ID }];
    dbState.selectResults = [
      [
        { id: SUBTASK_ID, status: 'pending' },
        { id: 'still-pending', status: 'pending' },
      ],
    ];

    const { toggleSubtask } = await import('@/lib/actions/subtask');
    const result = await toggleSubtask({ activityId: ACTIVITY_ID, id: SUBTASK_ID });

    expect(result.data?.allSubtasksDone).toBe(false);
  });

  it('rejects when the subtask does not belong to the activity', async () => {
    scopedState.activityLookup = [{ id: ACTIVITY_ID }];
    dbState.selectResults = [[{ id: 'different', status: 'pending' }]];

    const { toggleSubtask } = await import('@/lib/actions/subtask');
    const result = await toggleSubtask({ activityId: ACTIVITY_ID, id: SUBTASK_ID });

    expect(result.error).toBe('Subtask no encontrada');
  });

  it('rejects when the parent activity is not owned', async () => {
    scopedState.activityLookup = [];

    const { toggleSubtask } = await import('@/lib/actions/subtask');
    const result = await toggleSubtask({ activityId: ACTIVITY_ID, id: SUBTASK_ID });

    expect(result.error).toBe('Actividad no encontrada');
  });
});

describe('deleteSubtask', () => {
  beforeEach(reset);

  it('hard-deletes scoped to (subtask_id, activity_id)', async () => {
    scopedState.activityLookup = [{ id: ACTIVITY_ID }];

    const { deleteSubtask } = await import('@/lib/actions/subtask');
    const result = await deleteSubtask({ activityId: ACTIVITY_ID, id: SUBTASK_ID });

    expect(result.error).toBeUndefined();
    expect(dbState.deleted).toBe(true);
  });

  it('rejects when the parent activity is not owned', async () => {
    scopedState.activityLookup = [];

    const { deleteSubtask } = await import('@/lib/actions/subtask');
    const result = await deleteSubtask({ activityId: ACTIVITY_ID, id: SUBTASK_ID });

    expect(result.error).toBe('Actividad no encontrada');
    expect(dbState.deleted).toBe(false);
  });
});

describe('reorderSubtasks', () => {
  const ID_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa001';
  const ID_B = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa002';
  const ID_C = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa003';

  beforeEach(reset);

  it('applies positions 0/1/2 inside a transaction', async () => {
    scopedState.activityLookup = [{ id: ACTIVITY_ID }];
    dbState.selectResults = [[{ id: ID_A }, { id: ID_B }, { id: ID_C }]];

    const { reorderSubtasks } = await import('@/lib/actions/subtask');
    const result = await reorderSubtasks({
      activityId: ACTIVITY_ID,
      orderedIds: [ID_C, ID_A, ID_B],
    });

    expect(result.error).toBeUndefined();
    expect(dbState.transactionInvoked).toBe(true);
    expect(dbState.txUpdates).toHaveLength(3);
    expect((dbState.txUpdates[0].set as Record<string, unknown>).position).toBe(0);
    expect((dbState.txUpdates[1].set as Record<string, unknown>).position).toBe(1);
    expect((dbState.txUpdates[2].set as Record<string, unknown>).position).toBe(2);
  });

  it('rejects ids that do not belong to the activity', async () => {
    scopedState.activityLookup = [{ id: ACTIVITY_ID }];
    dbState.selectResults = [[{ id: ID_A }]]; // only 1 of 2 matched

    const { reorderSubtasks } = await import('@/lib/actions/subtask');
    const result = await reorderSubtasks({
      activityId: ACTIVITY_ID,
      orderedIds: [ID_A, ID_B],
    });

    expect(result.error).toMatch(/no pertenecen a esta actividad/);
    expect(dbState.transactionInvoked).toBe(false);
  });

  it('rejects duplicate ids at Zod', async () => {
    const { reorderSubtasks } = await import('@/lib/actions/subtask');
    const result = await reorderSubtasks({
      activityId: ACTIVITY_ID,
      orderedIds: [ID_A, ID_A],
    });

    expect(result.error).toMatch(/duplicados/);
  });

  it('rejects single-element arrays at Zod', async () => {
    const { reorderSubtasks } = await import('@/lib/actions/subtask');
    const result = await reorderSubtasks({
      activityId: ACTIVITY_ID,
      orderedIds: [ID_A],
    });

    expect(result.error).toMatch(/al menos 2/);
  });
});
