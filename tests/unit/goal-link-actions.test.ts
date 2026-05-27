/**
 * Tests for GoalLink server actions (ISSUE-041 — Slice A).
 *
 * GoalLinks have no `user_id` column (polymorphic M2M). Ownership is
 * enforced through TWO scopedDb lookups per write:
 *   1. The parent goal — must belong to caller AND not be soft-deleted.
 *   2. The polymorphic target (project | activity) — same checks.
 *
 * This suite locks in:
 *   - linkGoal: 404 when goal absent / target absent / cross-tenant,
 *               idempotent on re-link.
 *   - unlinkGoal: 404 when link absent / link's goal not ours.
 *   - listLinkedGoals: target ownership check, filters soft-deleted goals.
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
    // Staged per-key results for `sdb.select(key, where)` lookups.
    // Each call shifts the first staged array off the queue, defaulting to [].
    byKey: {} as Record<string, unknown[][]>,
    selectCalls: [] as Array<{ key: string }>,
  },
  dbState: {
    // Stage results for raw `db.select().from(goalLinks).where(...)` lookups.
    selectResults: [] as unknown[][],
    insertedValues: undefined as unknown,
    insertOnConflictReturning: [] as unknown[],
    conflictLookupResult: [] as unknown[],
    deletedWhere: undefined as unknown,
  },
}));

vi.mock('@/lib/db/scoped', () => ({
  scopedDb: vi.fn(() => ({
    userId: 'mock',
    async select(key: string) {
      scopedState.selectCalls.push({ key });
      const queue = scopedState.byKey[key] ?? [];
      return (queue.shift() ?? []) as unknown[];
    },
  })),
}));

vi.mock('@/lib/db/drizzle', () => {
  const mkSelectChain = () => ({
    from: vi.fn(() => ({
      where: vi.fn(async () => (dbState.selectResults.shift() ?? []) as unknown[]),
    })),
  });

  const mkInsertChain = () => ({
    values: vi.fn((vals: unknown) => {
      dbState.insertedValues = vals;
      return {
        onConflictDoNothing: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve(dbState.insertOnConflictReturning)),
        })),
      };
    }),
  });

  const mkDeleteChain = () => ({
    where: vi.fn(async (whereSql: unknown) => {
      dbState.deletedWhere = whereSql;
      return undefined;
    }),
  });

  return {
    db: {
      select: vi.fn(() => mkSelectChain()),
      insert: vi.fn(() => mkInsertChain()),
      delete: vi.fn(() => mkDeleteChain()),
    },
  };
});

// ─── Fixtures ───────────────────────────────────────────────────────────

const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const GOAL_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const PROJECT_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const ACTIVITY_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const LINK_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

function reset() {
  scopedState.byKey = {};
  scopedState.selectCalls = [];
  dbState.selectResults = [];
  dbState.insertedValues = undefined;
  dbState.insertOnConflictReturning = [];
  dbState.conflictLookupResult = [];
  dbState.deletedWhere = undefined;
  vi.clearAllMocks();
  authMock.mockResolvedValue({ user: { id: USER_A, email: 'a@example.com', role: 'user' } });
}

function stageGoal(rows: unknown[] = [{ id: GOAL_ID, userId: USER_A, deletedAt: null }]) {
  scopedState.byKey.goals = [...(scopedState.byKey.goals ?? []), rows];
}
function stageProject(rows: unknown[] = [{ id: PROJECT_ID, deletedAt: null }]) {
  scopedState.byKey.projects = [...(scopedState.byKey.projects ?? []), rows];
}
function stageActivity(rows: unknown[] = [{ id: ACTIVITY_ID, deletedAt: null }]) {
  scopedState.byKey.activities = [...(scopedState.byKey.activities ?? []), rows];
}

// ─── linkGoal ───────────────────────────────────────────────────────────

describe('linkGoal — success paths', () => {
  beforeEach(reset);

  it('links goal to activity when both belong to user', async () => {
    stageGoal();
    stageActivity();
    dbState.insertOnConflictReturning = [{ id: LINK_ID }];

    const { linkGoal } = await import('@/lib/actions/goal-link');
    const result = await linkGoal({
      goalId: GOAL_ID,
      targetType: 'activity',
      targetId: ACTIVITY_ID,
    });

    expect(result.error).toBeUndefined();
    expect(result.data).toEqual({ id: LINK_ID });
    expect(dbState.insertedValues).toMatchObject({
      goalId: GOAL_ID,
      targetType: 'activity',
      targetId: ACTIVITY_ID,
    });
  });

  it('links goal to project (targetType=project goes through projects scopedDb)', async () => {
    stageGoal();
    stageProject();
    dbState.insertOnConflictReturning = [{ id: LINK_ID }];

    const { linkGoal } = await import('@/lib/actions/goal-link');
    await linkGoal({ goalId: GOAL_ID, targetType: 'project', targetId: PROJECT_ID });

    const lookupKeys = scopedState.selectCalls.map((c) => c.key);
    expect(lookupKeys).toContain('goals');
    expect(lookupKeys).toContain('projects');
    expect(lookupKeys).not.toContain('activities');
  });

  it('idempotent on re-link: returns the existing link id when the unique conflict fires', async () => {
    stageGoal();
    stageActivity();
    dbState.insertOnConflictReturning = []; // conflict — no new row
    dbState.selectResults = [[{ id: LINK_ID }]]; // existing-link lookup

    const { linkGoal } = await import('@/lib/actions/goal-link');
    const result = await linkGoal({
      goalId: GOAL_ID,
      targetType: 'activity',
      targetId: ACTIVITY_ID,
    });

    expect(result.error).toBeUndefined();
    expect(result.data).toEqual({ id: LINK_ID });
  });
});

describe('linkGoal — ownership + validation guards', () => {
  beforeEach(reset);

  it('404 when goal does not belong to user (empty scoped lookup)', async () => {
    // Don't stage goal — scopedDb returns []
    stageActivity();

    const { linkGoal } = await import('@/lib/actions/goal-link');
    const result = await linkGoal({
      goalId: GOAL_ID,
      targetType: 'activity',
      targetId: ACTIVITY_ID,
    });

    expect(result.error).toBe('Meta no encontrada');
    expect(dbState.insertedValues).toBeUndefined();
  });

  it('404 when goal is soft-deleted (filtered by isNull(deletedAt))', async () => {
    // scopedDb('goals') filter is `deletedAt IS NULL` — soft-deleted goals
    // surface as [] from the scopedDb mock by virtue of the query, not the
    // mock. We simulate by staging an empty result for the goals key.
    stageGoal([]);
    stageActivity();

    const { linkGoal } = await import('@/lib/actions/goal-link');
    const result = await linkGoal({
      goalId: GOAL_ID,
      targetType: 'activity',
      targetId: ACTIVITY_ID,
    });

    expect(result.error).toBe('Meta no encontrada');
  });

  it('404 when activity target does not belong to user', async () => {
    stageGoal();
    stageActivity([]); // empty — target not owned

    const { linkGoal } = await import('@/lib/actions/goal-link');
    const result = await linkGoal({
      goalId: GOAL_ID,
      targetType: 'activity',
      targetId: ACTIVITY_ID,
    });

    expect(result.error).toBe('Actividad no encontrada');
    expect(dbState.insertedValues).toBeUndefined();
  });

  it('404 when project target does not belong to user', async () => {
    stageGoal();
    stageProject([]);

    const { linkGoal } = await import('@/lib/actions/goal-link');
    const result = await linkGoal({
      goalId: GOAL_ID,
      targetType: 'project',
      targetId: PROJECT_ID,
    });

    expect(result.error).toBe('Proyecto no encontrado');
  });

  it('rejects invalid targetType (Zod enum)', async () => {
    const { linkGoal } = await import('@/lib/actions/goal-link');
    const result = await linkGoal({
      goalId: GOAL_ID,
      targetType: 'category', // not in enum
      targetId: ACTIVITY_ID,
    });

    expect(result.error).toBeDefined();
  });

  it('rejects non-uuid goalId', async () => {
    const { linkGoal } = await import('@/lib/actions/goal-link');
    const result = await linkGoal({
      goalId: 'not-a-uuid',
      targetType: 'activity',
      targetId: ACTIVITY_ID,
    });

    expect(result.error).toBeDefined();
  });
});

// ─── unlinkGoal ─────────────────────────────────────────────────────────

describe('unlinkGoal', () => {
  beforeEach(reset);

  it('deletes the link when its goal belongs to the user', async () => {
    // Mock chain: db.select() → from(goalLinks) → where() returns the link row
    dbState.selectResults = [[{ id: LINK_ID, goalId: GOAL_ID }]];
    // Then scopedDb('goals').select() → goal row exists for this user
    stageGoal();

    const { unlinkGoal } = await import('@/lib/actions/goal-link');
    const result = await unlinkGoal({ linkId: LINK_ID });

    expect(result.error).toBeUndefined();
    expect(dbState.deletedWhere).toBeDefined();
  });

  it('404 when link row does not exist', async () => {
    dbState.selectResults = [[]];

    const { unlinkGoal } = await import('@/lib/actions/goal-link');
    const result = await unlinkGoal({ linkId: LINK_ID });

    expect(result.error).toBe('Link no encontrado');
    expect(dbState.deletedWhere).toBeUndefined();
  });

  it('404 when link belongs to another user (cross-tenant)', async () => {
    // Link exists, but the scopedDb('goals') ownership lookup returns [].
    dbState.selectResults = [[{ id: LINK_ID, goalId: GOAL_ID }]];
    stageGoal([]); // not ours

    const { unlinkGoal } = await import('@/lib/actions/goal-link');
    const result = await unlinkGoal({ linkId: LINK_ID });

    expect(result.error).toBe('Link no encontrado');
    expect(dbState.deletedWhere).toBeUndefined();
  });

  it('rejects invalid linkId', async () => {
    const { unlinkGoal } = await import('@/lib/actions/goal-link');
    const result = await unlinkGoal({ linkId: 'nope' });

    expect(result.error).toBeDefined();
  });
});

// ─── listLinkedGoals ────────────────────────────────────────────────────

describe('listLinkedGoals', () => {
  beforeEach(reset);

  it('returns empty array when target has no linked goals', async () => {
    stageActivity();
    dbState.selectResults = [[]]; // no link rows

    const { listLinkedGoals } = await import('@/lib/actions/goal-link');
    const result = await listLinkedGoals({ targetType: 'activity', targetId: ACTIVITY_ID });

    expect(result.error).toBeUndefined();
    expect(result.data).toEqual({ goals: [] });
  });

  it('returns goals attached to the target (active, not soft-deleted)', async () => {
    stageActivity();
    dbState.selectResults = [[{ goalId: 'g1' }, { goalId: 'g2' }]];
    const goalRows = [
      { id: 'g1', userId: USER_A, title: 'A', scope: 'quarter', deletedAt: null },
      { id: 'g2', userId: USER_A, title: 'B', scope: 'year', deletedAt: null },
    ];
    stageGoal(goalRows);

    const { listLinkedGoals } = await import('@/lib/actions/goal-link');
    const result = await listLinkedGoals({ targetType: 'activity', targetId: ACTIVITY_ID });

    expect(result.error).toBeUndefined();
    expect(result.data?.goals).toHaveLength(2);
    expect(result.data?.goals[0]).toMatchObject({ title: 'A' });
  });

  it('404 when target does not belong to user (no cross-tenant goal leak)', async () => {
    stageActivity([]); // target not owned

    const { listLinkedGoals } = await import('@/lib/actions/goal-link');
    const result = await listLinkedGoals({ targetType: 'activity', targetId: ACTIVITY_ID });

    expect(result.error).toBe('Actividad no encontrada');
  });

  it('uses projects key for project target lookup', async () => {
    stageProject();
    dbState.selectResults = [[]];

    const { listLinkedGoals } = await import('@/lib/actions/goal-link');
    await listLinkedGoals({ targetType: 'project', targetId: PROJECT_ID });

    const keys = scopedState.selectCalls.map((c) => c.key);
    expect(keys).toContain('projects');
    expect(keys).not.toContain('activities');
  });

  it('rejects invalid targetType', async () => {
    const { listLinkedGoals } = await import('@/lib/actions/goal-link');
    const result = await listLinkedGoals({ targetType: 'category', targetId: ACTIVITY_ID });

    expect(result.error).toBeDefined();
  });
});
