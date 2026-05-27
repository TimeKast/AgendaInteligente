/**
 * Tests for Goal server actions (ISSUE-040).
 *
 * Strategy: mock `scopedDb` so we can capture what each action asks the
 * DB to do without touching Neon. We assert:
 *   - createGoal: requires deadline for quarter/year; accepts null for
 *     5year/life; defaults status='active'; inserts inside scopedDb.
 *   - updateGoal: 404 when row absent or soft-deleted, stamps reviewed_at
 *     on first review write, no-op when nothing changes.
 *   - deleteGoal: soft-deletes via deletedAt; idempotent on already-deleted.
 *
 * Multi-tenant safety is structural (scopedDb scopes every read/write
 * by the bound userId — covered by scoped-db.test.ts).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ──────────────────────────────────────────────────────────────

const authMock = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: authMock }));

vi.mock('@/lib/auth/permissions', () => ({
  requirePermission: vi.fn(),
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

vi.mock('@/lib/db/scoped', () => {
  return {
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
            Promise.resolve(scopedState.insertedReturning ?? [{ id: 'goal-new-id' }])
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
  };
});

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// ─── Fixtures ───────────────────────────────────────────────────────────

const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const GOAL_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function authedSession() {
  authMock.mockResolvedValue({ user: { id: USER_A, email: 'a@example.com', role: 'user' } });
}

function resetState() {
  scopedState.selectResults = [];
  scopedState.selectCalls = [];
  scopedState.inserted = undefined;
  scopedState.insertedReturning = undefined;
  scopedState.updated = undefined;
}

function existingGoal(overrides: Record<string, unknown> = {}) {
  return {
    id: GOAL_ID,
    userId: USER_A,
    title: 'Lanzar MVP',
    description: null,
    scope: 'quarter',
    deadline: '2026-06-30',
    outcomeExpected: null,
    notesCost: null,
    status: 'active',
    reviewScore: null,
    reviewNotes: null,
    reviewedAt: null,
    deletedAt: null,
    createdAt: new Date('2026-05-01'),
    updatedAt: new Date('2026-05-01'),
    ...overrides,
  };
}

// ─── createGoal ─────────────────────────────────────────────────────────

describe('createGoal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetState();
    authedSession();
  });

  it('inserts a quarter goal with status="active" and the provided deadline', async () => {
    const { createGoal } = await import('@/lib/actions/goal');
    const result = await createGoal({
      title: 'Lanzar MVP',
      scope: 'quarter',
      deadline: '2026-06-30',
    });

    expect(result.error).toBeUndefined();
    expect(result.data).toEqual({ id: 'goal-new-id' });
    expect(scopedState.inserted).toMatchObject({
      title: 'Lanzar MVP',
      scope: 'quarter',
      deadline: '2026-06-30',
      status: 'active',
      description: null,
      outcomeExpected: null,
      notesCost: null,
    });
  });

  it('rejects yearly goal without deadline (Zod conditional refine)', async () => {
    const { createGoal } = await import('@/lib/actions/goal');
    const result = await createGoal({
      title: 'Año del foco',
      scope: 'year',
      // deadline missing — required for year
    });

    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/deadline/i);
  });

  it('rejects quarterly goal without deadline', async () => {
    const { createGoal } = await import('@/lib/actions/goal');
    const result = await createGoal({
      title: 'Q3',
      scope: 'quarter',
      // deadline missing
    });

    expect(result.error).toBeDefined();
  });

  it('accepts 5year goal without deadline (deadline-less is allowed)', async () => {
    const { createGoal } = await import('@/lib/actions/goal');
    const result = await createGoal({
      title: 'Independencia financiera',
      scope: '5year',
    });

    expect(result.error).toBeUndefined();
    expect(scopedState.inserted).toMatchObject({
      scope: '5year',
      deadline: null,
    });
  });

  it('accepts life goal without deadline', async () => {
    const { createGoal } = await import('@/lib/actions/goal');
    const result = await createGoal({
      title: 'Vida con propósito',
      scope: 'life',
    });

    expect(result.error).toBeUndefined();
    expect(scopedState.inserted).toMatchObject({ scope: 'life', deadline: null });
  });

  it('rejects invalid scope value', async () => {
    const { createGoal } = await import('@/lib/actions/goal');
    const result = await createGoal({
      title: 'foo',
      scope: 'monthly', // not in enum
      deadline: '2026-06-30',
    });

    expect(result.error).toBeDefined();
  });

  it('rejects empty title', async () => {
    const { createGoal } = await import('@/lib/actions/goal');
    const result = await createGoal({
      title: '   ',
      scope: 'quarter',
      deadline: '2026-06-30',
    });

    expect(result.error).toBeDefined();
  });

  it('rejects malformed deadline (not YYYY-MM-DD)', async () => {
    const { createGoal } = await import('@/lib/actions/goal');
    const result = await createGoal({
      title: 'Foo',
      scope: 'quarter',
      deadline: '06/30/2026',
    });

    expect(result.error).toBeDefined();
  });

  it('stores outcomeExpected + notesCost when provided', async () => {
    const { createGoal } = await import('@/lib/actions/goal');
    await createGoal({
      title: 'Aprender alemán',
      scope: 'year',
      deadline: '2026-12-31',
      outcomeExpected: 'Poder leer un libro técnico en alemán',
      notesCost: 'Menos tiempo en proyectos paralelos los sábados',
    });

    expect(scopedState.inserted).toMatchObject({
      outcomeExpected: 'Poder leer un libro técnico en alemán',
      notesCost: 'Menos tiempo en proyectos paralelos los sábados',
    });
  });
});

// ─── updateGoal ─────────────────────────────────────────────────────────

describe('updateGoal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetState();
    authedSession();
  });

  it('returns 404 when goal not found (empty select result)', async () => {
    scopedState.selectResults = [[]];
    const { updateGoal } = await import('@/lib/actions/goal');
    const result = await updateGoal({ id: GOAL_ID, title: 'edited' });

    expect(result.error).toBe('Meta no encontrada');
  });

  it('updates only provided fields (partial patch)', async () => {
    scopedState.selectResults = [[existingGoal()]];
    const { updateGoal } = await import('@/lib/actions/goal');
    const result = await updateGoal({ id: GOAL_ID, title: 'Lanzar MVP v2' });

    expect(result.error).toBeUndefined();
    expect(scopedState.updated?.set).toEqual({ title: 'Lanzar MVP v2' });
  });

  it('no-op when no changeable fields provided', async () => {
    scopedState.selectResults = [[existingGoal()]];
    const { updateGoal } = await import('@/lib/actions/goal');
    const result = await updateGoal({ id: GOAL_ID });

    expect(result.error).toBeUndefined();
    expect(scopedState.updated).toBeUndefined();
  });

  it('stamps reviewed_at on first review write (review_score only)', async () => {
    scopedState.selectResults = [[existingGoal({ reviewedAt: null })]];
    const { updateGoal } = await import('@/lib/actions/goal');
    await updateGoal({ id: GOAL_ID, reviewScore: 8 });

    expect(scopedState.updated?.set).toMatchObject({ reviewScore: 8 });
    expect((scopedState.updated?.set as { reviewedAt?: Date }).reviewedAt).toBeInstanceOf(Date);
  });

  it('stamps reviewed_at when only review_notes is set', async () => {
    scopedState.selectResults = [[existingGoal({ reviewedAt: null })]];
    const { updateGoal } = await import('@/lib/actions/goal');
    await updateGoal({ id: GOAL_ID, reviewNotes: 'Quedó a medias por blockers externos' });

    expect((scopedState.updated?.set as { reviewedAt?: Date }).reviewedAt).toBeInstanceOf(Date);
  });

  it('does NOT re-stamp reviewed_at on subsequent review edits', async () => {
    const firstReview = new Date('2026-04-15');
    scopedState.selectResults = [[existingGoal({ reviewedAt: firstReview, reviewScore: 7 })]];
    const { updateGoal } = await import('@/lib/actions/goal');
    await updateGoal({ id: GOAL_ID, reviewScore: 9 });

    expect(scopedState.updated?.set).toEqual({ reviewScore: 9 });
    expect((scopedState.updated?.set as { reviewedAt?: Date }).reviewedAt).toBeUndefined();
  });

  it('does NOT stamp reviewed_at when only setting non-review fields', async () => {
    scopedState.selectResults = [[existingGoal({ reviewedAt: null })]];
    const { updateGoal } = await import('@/lib/actions/goal');
    await updateGoal({ id: GOAL_ID, status: 'achieved' });

    expect(scopedState.updated?.set).toEqual({ status: 'achieved' });
    expect((scopedState.updated?.set as { reviewedAt?: Date }).reviewedAt).toBeUndefined();
  });

  it('does NOT stamp reviewed_at when review_notes is the empty string', async () => {
    // Empty string isn't a real review — only count it as filled if it has content.
    scopedState.selectResults = [[existingGoal({ reviewedAt: null })]];
    const { updateGoal } = await import('@/lib/actions/goal');
    await updateGoal({ id: GOAL_ID, reviewNotes: '' });

    expect((scopedState.updated?.set as { reviewedAt?: Date }).reviewedAt).toBeUndefined();
  });

  it('rejects invalid status value', async () => {
    scopedState.selectResults = [[existingGoal()]];
    const { updateGoal } = await import('@/lib/actions/goal');
    const result = await updateGoal({ id: GOAL_ID, status: 'cancelled' });

    expect(result.error).toBeDefined();
  });

  it('rejects review_score out of 1..10 range', async () => {
    const { updateGoal } = await import('@/lib/actions/goal');
    const tooHigh = await updateGoal({ id: GOAL_ID, reviewScore: 11 });
    const tooLow = await updateGoal({ id: GOAL_ID, reviewScore: 0 });

    expect(tooHigh.error).toBeDefined();
    expect(tooLow.error).toBeDefined();
  });
});

// ─── deleteGoal ─────────────────────────────────────────────────────────

describe('deleteGoal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetState();
    authedSession();
  });

  it('soft-deletes by setting deletedAt', async () => {
    scopedState.selectResults = [[existingGoal()]];
    const { deleteGoal } = await import('@/lib/actions/goal');
    const result = await deleteGoal({ id: GOAL_ID });

    expect(result.error).toBeUndefined();
    expect((scopedState.updated?.set as { deletedAt?: Date }).deletedAt).toBeInstanceOf(Date);
  });

  it('returns 404 when goal not found', async () => {
    scopedState.selectResults = [[]];
    const { deleteGoal } = await import('@/lib/actions/goal');
    const result = await deleteGoal({ id: GOAL_ID });

    expect(result.error).toBe('Meta no encontrada');
  });

  it('is idempotent on already-deleted goal (no second UPDATE)', async () => {
    scopedState.selectResults = [[existingGoal({ deletedAt: new Date('2026-04-01') })]];
    const { deleteGoal } = await import('@/lib/actions/goal');
    const result = await deleteGoal({ id: GOAL_ID });

    expect(result.error).toBeUndefined();
    expect(scopedState.updated).toBeUndefined();
  });

  it('rejects invalid uuid', async () => {
    const { deleteGoal } = await import('@/lib/actions/goal');
    const result = await deleteGoal({ id: 'not-a-uuid' });

    expect(result.error).toBeDefined();
  });
});
