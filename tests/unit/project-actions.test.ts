/**
 * Tests for Project server actions (ISSUE-012).
 *
 * Same mock strategy as category-actions.test.ts: stub `scopedDb` with a
 * spy-based fake so we can stage select() results and capture insert/update
 * payloads. Real-Neon integration is deferred to E2E once auth + UI land.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const authMock = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: authMock }));
vi.mock('@/lib/auth/permissions', () => ({ requirePermission: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// vi.hoisted keeps scopedState in the same hoist phase as vi.mock — protects
// against parallel-test mock factory bleed across files that mock the same
// module path. See category-actions.test.ts for the long form.
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

// Valid v4 UUIDs.
const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CATEGORY_A = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const CATEGORY_B = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const PROJECT_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

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

describe('createProject', () => {
  beforeEach(reset);

  it('inserts a row with status="active" and isInbox=false', async () => {
    scopedState.selectResults = [[]]; // collision check
    scopedState.insertedReturning = [{ id: 'p-new' }];

    const { createProject } = await import('@/lib/actions/project');
    const result = await createProject({
      categoryId: CATEGORY_A,
      name: 'Side hustle',
      deadline: '2026-09-30',
    });

    expect(result.error).toBeUndefined();
    expect(result.data).toEqual({ id: 'p-new' });
    expect(scopedState.inserted).toMatchObject({
      categoryId: CATEGORY_A,
      name: 'Side hustle',
      deadline: '2026-09-30',
      status: 'active',
      isInbox: false,
    });
  });

  it('rejects duplicate names within the same category', async () => {
    scopedState.selectResults = [[{ id: 'existing', name: 'Side hustle' }]];

    const { createProject } = await import('@/lib/actions/project');
    const result = await createProject({ categoryId: CATEGORY_A, name: 'Side hustle' });

    expect(result.error).toMatch(/Ya existe un proyecto con ese nombre/);
    expect(scopedState.inserted).toBeUndefined();
  });

  it('allows the same name across different categories', async () => {
    // Collision check filtered by category — staged as empty.
    scopedState.selectResults = [[]];

    const { createProject } = await import('@/lib/actions/project');
    const result = await createProject({ categoryId: CATEGORY_B, name: 'Side hustle' });

    expect(result.error).toBeUndefined();
  });

  it('rejects malformed deadline strings', async () => {
    const { createProject } = await import('@/lib/actions/project');
    const result = await createProject({
      categoryId: CATEGORY_A,
      name: 'X',
      deadline: '30 sept 2026',
    });

    expect(result.error).toMatch(/Fecha inválida/);
  });
});

describe('updateProject', () => {
  beforeEach(reset);

  it('updates name + outcome when not Inbox', async () => {
    scopedState.selectResults = [
      [{ id: PROJECT_ID, name: 'Old', categoryId: CATEGORY_A, isInbox: false }],
      [], // collision
    ];

    const { updateProject } = await import('@/lib/actions/project');
    const result = await updateProject({
      id: PROJECT_ID,
      name: 'New',
      outcomeExpected: 'Shipped to prod',
    });

    expect(result.error).toBeUndefined();
    expect(scopedState.updated?.set).toMatchObject({
      name: 'New',
      outcomeExpected: 'Shipped to prod',
    });
  });

  it('blocks editing Inbox', async () => {
    scopedState.selectResults = [
      [{ id: PROJECT_ID, name: 'Inbox', categoryId: CATEGORY_A, isInbox: true }],
    ];

    const { updateProject } = await import('@/lib/actions/project');
    const result = await updateProject({ id: PROJECT_ID, name: 'Try' });

    expect(result.error).toBe('Inbox no se puede editar');
    expect(scopedState.updated).toBeUndefined();
  });

  it('allows moving project to another category if name does not collide', async () => {
    scopedState.selectResults = [
      [{ id: PROJECT_ID, name: 'Side', categoryId: CATEGORY_A, isInbox: false }],
      [], // collision check in new category
    ];

    const { updateProject } = await import('@/lib/actions/project');
    const result = await updateProject({ id: PROJECT_ID, categoryId: CATEGORY_B });

    expect(result.error).toBeUndefined();
    expect(scopedState.updated?.set).toMatchObject({ categoryId: CATEGORY_B });
  });

  it('rejects move when target category already has a project with same name', async () => {
    scopedState.selectResults = [
      [{ id: PROJECT_ID, name: 'Side', categoryId: CATEGORY_A, isInbox: false }],
      [{ id: 'other', name: 'Side', categoryId: CATEGORY_B }], // collision in target
    ];

    const { updateProject } = await import('@/lib/actions/project');
    const result = await updateProject({ id: PROJECT_ID, categoryId: CATEGORY_B });

    expect(result.error).toMatch(/Ya existe un proyecto con ese nombre/);
    expect(scopedState.updated).toBeUndefined();
  });

  it('no-ops when nothing to update', async () => {
    scopedState.selectResults = [
      [{ id: PROJECT_ID, name: 'X', categoryId: CATEGORY_A, isInbox: false }],
    ];

    const { updateProject } = await import('@/lib/actions/project');
    const result = await updateProject({ id: PROJECT_ID });

    expect(result.error).toBeUndefined();
    expect(scopedState.updated).toBeUndefined();
  });
});

describe('transitionProjectStatus', () => {
  beforeEach(reset);

  it('sets completed_at when transitioning to completed', async () => {
    scopedState.selectResults = [
      [{ id: PROJECT_ID, status: 'active', isInbox: false, completedAt: null }],
    ];

    const { transitionProjectStatus } = await import('@/lib/actions/project');
    const result = await transitionProjectStatus({ id: PROJECT_ID, newStatus: 'completed' });

    expect(result.error).toBeUndefined();
    const set = scopedState.updated?.set as Record<string, unknown>;
    expect(set.status).toBe('completed');
    expect(set.completedAt).toBeDefined(); // sql`now()`
  });

  it('clears completed_at when re-opening from completed', async () => {
    scopedState.selectResults = [
      [{ id: PROJECT_ID, status: 'completed', isInbox: false, completedAt: new Date() }],
    ];

    const { transitionProjectStatus } = await import('@/lib/actions/project');
    const result = await transitionProjectStatus({ id: PROJECT_ID, newStatus: 'active' });

    expect(result.error).toBeUndefined();
    const set = scopedState.updated?.set as Record<string, unknown>;
    expect(set.status).toBe('active');
    expect(set.completedAt).toBeNull();
  });

  it('no-ops when status does not change', async () => {
    scopedState.selectResults = [
      [{ id: PROJECT_ID, status: 'active', isInbox: false, completedAt: null }],
    ];

    const { transitionProjectStatus } = await import('@/lib/actions/project');
    const result = await transitionProjectStatus({ id: PROJECT_ID, newStatus: 'active' });

    expect(result.error).toBeUndefined();
    expect(scopedState.updated).toBeUndefined();
  });

  it('blocks Inbox status changes', async () => {
    scopedState.selectResults = [
      [{ id: PROJECT_ID, status: 'active', isInbox: true, completedAt: null }],
    ];

    const { transitionProjectStatus } = await import('@/lib/actions/project');
    const result = await transitionProjectStatus({ id: PROJECT_ID, newStatus: 'killed' });

    expect(result.error).toBe('Inbox no cambia de estado');
    expect(scopedState.updated).toBeUndefined();
  });

  it('rejects unknown status values at the Zod layer', async () => {
    const { transitionProjectStatus } = await import('@/lib/actions/project');
    const result = await transitionProjectStatus({ id: PROJECT_ID, newStatus: 'archived' });

    // Zod enum failure
    expect(result.error).toBeDefined();
    expect(scopedState.updated).toBeUndefined();
  });

  it('accepts and logs an optional kill reason without persisting it', async () => {
    scopedState.selectResults = [
      [{ id: PROJECT_ID, status: 'active', isInbox: false, completedAt: null }],
    ];

    const { transitionProjectStatus } = await import('@/lib/actions/project');
    const result = await transitionProjectStatus({
      id: PROJECT_ID,
      newStatus: 'killed',
      reason: 'cliente canceló',
    });

    expect(result.error).toBeUndefined();
    const set = scopedState.updated?.set as Record<string, unknown>;
    expect(set.status).toBe('killed');
    // Reason is NOT in the update payload (no column on E-004).
    expect(set).not.toHaveProperty('reason');
    expect(set).not.toHaveProperty('killReason');
  });
});

describe('deleteProject', () => {
  beforeEach(reset);

  it('soft-deletes a non-Inbox project', async () => {
    scopedState.selectResults = [[{ id: PROJECT_ID, name: 'X', isInbox: false, deletedAt: null }]];

    const { deleteProject } = await import('@/lib/actions/project');
    const result = await deleteProject({ id: PROJECT_ID });

    expect(result.error).toBeUndefined();
    expect(scopedState.updated?.set).toHaveProperty('deletedAt');
  });

  it('blocks deleting Inbox', async () => {
    scopedState.selectResults = [[{ id: PROJECT_ID, name: 'Inbox', isInbox: true }]];

    const { deleteProject } = await import('@/lib/actions/project');
    const result = await deleteProject({ id: PROJECT_ID });

    expect(result.error).toBe('Inbox no se puede borrar');
    expect(scopedState.updated).toBeUndefined();
  });

  it('returns "no encontrado" when row does not exist', async () => {
    scopedState.selectResults = [[]];

    const { deleteProject } = await import('@/lib/actions/project');
    const result = await deleteProject({ id: PROJECT_ID });

    expect(result.error).toBe('Proyecto no encontrado');
  });

  it('idempotent on already-deleted rows', async () => {
    scopedState.selectResults = [
      [{ id: PROJECT_ID, name: 'X', isInbox: false, deletedAt: new Date() }],
    ];

    const { deleteProject } = await import('@/lib/actions/project');
    const result = await deleteProject({ id: PROJECT_ID });

    expect(result.error).toBeUndefined();
    expect(scopedState.updated).toBeUndefined();
  });
});
