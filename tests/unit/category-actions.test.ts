/**
 * Tests for Category server actions (ISSUE-010).
 *
 * Strategy: mock `scopedDb` so we can capture what the actions ask the DB
 * to do without touching Neon. We assert:
 *   - createCategory: rejects duplicate names, auto-assigns next position,
 *     inserts with isInbox=false
 *   - updateCategory: blocks Inbox, blocks duplicate name on rename, no-ops
 *     when nothing to update
 *   - deleteCategory: blocks Inbox, soft-deletes (sets deleted_at)
 *
 * Real-Neon integration tests live with the broader E2E suite once the UI
 * is wired in ISSUE-006.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ──────────────────────────────────────────────────────────────

const authMock = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: authMock,
}));

vi.mock('@/lib/auth/permissions', () => ({
  requirePermission: vi.fn(),
}));

// vi.hoisted ensures scopedState is created in the same hoist phase as the
// vi.mock factory below, so they share the same per-file closure even under
// parallel test execution. Without this, multiple test files mocking the
// same module path can have their factories re-bound to the wrong file's
// state, causing assertion bleed.
const { scopedState } = vi.hoisted(() => ({
  scopedState: {
    selectResults: [] as unknown[],
    selectCalls: [] as { key: string; extra: unknown }[],
    inserted: undefined as unknown,
    insertedReturning: undefined as unknown,
    updated: undefined as { table: string; set: unknown; where: unknown } | undefined,
    // ISSUE-011: cascade delete + reorder use db.transaction directly.
    // We capture every tx.update(table).set(...).where(...) call so tests
    // can assert the correct order and payloads.
    transactionInvoked: false,
    txUpdates: [] as Array<{ set: unknown }>,
  },
}));

vi.mock('@/lib/db/drizzle', () => {
  const mkTx = () => ({
    update: vi.fn(() => ({
      set: vi.fn((set: unknown) => {
        scopedState.txUpdates.push({ set });
        return { where: vi.fn(async () => undefined) };
      }),
    })),
  });

  return {
    db: {
      transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
        scopedState.transactionInvoked = true;
        return cb(mkTx());
      }),
    },
  };
});

vi.mock('@/lib/db/scoped', () => {
  return {
    scopedDb: vi.fn((userId: string) => ({
      userId,
      async select(key: string, extra: unknown) {
        scopedState.selectCalls.push({ key, extra });
        // Each call shifts the next staged result. Default to [] if nothing staged.
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
  };
});

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// ─── Tests ──────────────────────────────────────────────────────────────

// Valid v4 UUIDs (version=4 in 3rd group, variant=8|9|a|b in 4th group)
const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CATEGORY_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function authedSession() {
  authMock.mockResolvedValue({ user: { id: USER_A, email: 'a@example.com', role: 'user' } });
}

function resetState() {
  scopedState.selectResults = [];
  scopedState.selectCalls = [];
  scopedState.inserted = undefined;
  scopedState.insertedReturning = undefined;
  scopedState.updated = undefined;
  scopedState.transactionInvoked = false;
  scopedState.txUpdates = [];
}

describe('createCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetState();
    authedSession();
  });

  it('inserts a new row with position=0 when no categories exist', async () => {
    // Stage: [] collision check, [] list-for-position
    scopedState.selectResults = [[], []];
    scopedState.insertedReturning = [{ id: 'new-cat' }];

    const { createCategory } = await import('@/lib/actions/category');
    const result = await createCategory({ name: 'Trabajo', color: '#5C7B5C' });

    expect(result.error).toBeUndefined();
    expect(result.data).toEqual({ id: 'new-cat' });
    expect(scopedState.inserted).toMatchObject({
      name: 'Trabajo',
      color: '#5C7B5C',
      position: 0,
      isInbox: false,
    });
  });

  it('auto-assigns position = max + 1 when categories exist', async () => {
    scopedState.selectResults = [
      [], // collision check
      [{ position: 0 }, { position: 2 }, { position: 1 }], // existing rows
    ];

    const { createCategory } = await import('@/lib/actions/category');
    await createCategory({ name: 'Side project' });

    expect((scopedState.inserted as { position: number }).position).toBe(3);
  });

  it('rejects duplicate names with a friendly error', async () => {
    scopedState.selectResults = [[{ id: 'existing', name: 'Personal' }]];

    const { createCategory } = await import('@/lib/actions/category');
    const result = await createCategory({ name: 'Personal' });

    expect(result.error).toBe('Ya existe esa categoría');
    expect(scopedState.inserted).toBeUndefined();
  });

  it('rejects the reserved name "Inbox" at the Zod layer', async () => {
    const { createCategory } = await import('@/lib/actions/category');
    const result = await createCategory({ name: 'Inbox' });

    expect(result.error).toMatch(/Inbox/);
    expect(scopedState.inserted).toBeUndefined();
  });

  it('rejects invalid hex color codes', async () => {
    const { createCategory } = await import('@/lib/actions/category');
    const result = await createCategory({ name: 'Trabajo', color: 'red' });

    expect(result.error).toMatch(/hex/i);
  });
});

describe('updateCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetState();
    authedSession();
  });

  it('updates name + color when not Inbox and no name collision', async () => {
    scopedState.selectResults = [
      [{ id: CATEGORY_ID, name: 'Old', color: '#aaaaaa', isInbox: false }],
      [], // name collision check
    ];

    const { updateCategory } = await import('@/lib/actions/category');
    const result = await updateCategory({
      id: CATEGORY_ID,
      name: 'New',
      color: '#5C7B5C',
    });

    expect(result.error).toBeUndefined();
    expect(scopedState.updated?.set).toMatchObject({ name: 'New', color: '#5C7B5C' });
  });

  it('blocks editing the Inbox category', async () => {
    scopedState.selectResults = [[{ id: CATEGORY_ID, name: 'Inbox', isInbox: true }]];

    const { updateCategory } = await import('@/lib/actions/category');
    const result = await updateCategory({ id: CATEGORY_ID, name: 'Renombrado' });

    expect(result.error).toBe('Inbox no se puede editar');
    expect(scopedState.updated).toBeUndefined();
  });

  it('returns "no encontrada" when row does not exist for this user', async () => {
    scopedState.selectResults = [[]]; // empty existing
    const { updateCategory } = await import('@/lib/actions/category');
    const result = await updateCategory({ id: CATEGORY_ID, name: 'X' });

    expect(result.error).toBe('Categoría no encontrada');
  });

  it('rejects rename to a name already in use', async () => {
    scopedState.selectResults = [
      [{ id: CATEGORY_ID, name: 'Old', isInbox: false }],
      [{ id: 'other-uuid', name: 'Personal' }], // collision
    ];

    const { updateCategory } = await import('@/lib/actions/category');
    const result = await updateCategory({ id: CATEGORY_ID, name: 'Personal' });

    expect(result.error).toBe('Ya existe esa categoría');
    expect(scopedState.updated).toBeUndefined();
  });

  it('no-ops when no fields are provided', async () => {
    scopedState.selectResults = [[{ id: CATEGORY_ID, name: 'Old', isInbox: false }]];

    const { updateCategory } = await import('@/lib/actions/category');
    const result = await updateCategory({ id: CATEGORY_ID });

    expect(result.error).toBeUndefined();
    expect(scopedState.updated).toBeUndefined();
  });
});

// ISSUE-011 — deleteCategory cascade + reorderCategories tests.
// The old single-row deleteCategory tests were superseded; the new suite
// covers Inbox guard / not-found / idempotent paths against the cascade
// implementation.

describe('deleteCategory — cascade (ISSUE-011)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetState();
    authedSession();
  });

  it('soft-deletes a category with NO projects (just the category row)', async () => {
    scopedState.selectResults = [
      [{ id: CATEGORY_ID, name: 'Personal', isInbox: false, deletedAt: null }],
      [], // active projects under category — empty
    ];

    const { deleteCategory } = await import('@/lib/actions/category');
    const result = await deleteCategory({ id: CATEGORY_ID });

    expect(result.error).toBeUndefined();
    expect(result.data).toEqual({ projectCount: 0, activityCount: 0 });
    expect(scopedState.transactionInvoked).toBe(true);
    // Only the category UPDATE inside the tx (no projects, no activities).
    expect(scopedState.txUpdates).toHaveLength(1);
    expect((scopedState.txUpdates[0].set as Record<string, unknown>).deletedAt).toBeDefined();
  });

  it('cascades to projects + activities and returns counts', async () => {
    scopedState.selectResults = [
      [{ id: CATEGORY_ID, name: 'Empresa Genomma', isInbox: false, deletedAt: null }],
      // 2 active projects
      [
        { id: 'proj-1', categoryId: CATEGORY_ID, deletedAt: null },
        { id: 'proj-2', categoryId: CATEGORY_ID, deletedAt: null },
      ],
      // 3 active activities across those projects
      [
        { id: 'act-1', projectId: 'proj-1', deletedAt: null },
        { id: 'act-2', projectId: 'proj-1', deletedAt: null },
        { id: 'act-3', projectId: 'proj-2', deletedAt: null },
      ],
    ];

    const { deleteCategory } = await import('@/lib/actions/category');
    const result = await deleteCategory({ id: CATEGORY_ID });

    expect(result.error).toBeUndefined();
    expect(result.data).toEqual({ projectCount: 2, activityCount: 3 });
    expect(scopedState.transactionInvoked).toBe(true);
    // 3 updates in tx: activities, projects, category — deepest first.
    expect(scopedState.txUpdates).toHaveLength(3);
    expect((scopedState.txUpdates[0].set as Record<string, unknown>).deletedAt).toBeDefined();
    expect((scopedState.txUpdates[1].set as Record<string, unknown>).deletedAt).toBeDefined();
    expect((scopedState.txUpdates[2].set as Record<string, unknown>).deletedAt).toBeDefined();
  });

  it('skips activity update when projects have no activities', async () => {
    scopedState.selectResults = [
      [{ id: CATEGORY_ID, name: 'Side', isInbox: false, deletedAt: null }],
      [{ id: 'proj-x', categoryId: CATEGORY_ID, deletedAt: null }],
      [], // no activities
    ];

    const { deleteCategory } = await import('@/lib/actions/category');
    const result = await deleteCategory({ id: CATEGORY_ID });

    expect(result.error).toBeUndefined();
    expect(result.data).toEqual({ projectCount: 1, activityCount: 0 });
    // 2 updates in tx: project + category (no activities branch)
    expect(scopedState.txUpdates).toHaveLength(2);
  });

  it('blocks deleting Inbox', async () => {
    scopedState.selectResults = [[{ id: CATEGORY_ID, name: 'Inbox', isInbox: true }]];

    const { deleteCategory } = await import('@/lib/actions/category');
    const result = await deleteCategory({ id: CATEGORY_ID });

    expect(result.error).toBe('Inbox no se puede borrar');
    expect(scopedState.transactionInvoked).toBe(false);
  });

  it('returns "no encontrada" if row does not exist for this user', async () => {
    scopedState.selectResults = [[]];
    const { deleteCategory } = await import('@/lib/actions/category');
    const result = await deleteCategory({ id: CATEGORY_ID });

    expect(result.error).toBe('Categoría no encontrada');
    expect(scopedState.transactionInvoked).toBe(false);
  });

  it('idempotent: no-ops if already soft-deleted', async () => {
    scopedState.selectResults = [
      [
        {
          id: CATEGORY_ID,
          name: 'Personal',
          isInbox: false,
          deletedAt: new Date('2026-05-01'),
        },
      ],
    ];

    const { deleteCategory } = await import('@/lib/actions/category');
    const result = await deleteCategory({ id: CATEGORY_ID });

    expect(result.error).toBeUndefined();
    expect(result.data).toEqual({ projectCount: 0, activityCount: 0 });
    expect(scopedState.transactionInvoked).toBe(false);
  });
});

describe('reorderCategories (ISSUE-011)', () => {
  const ID_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa001';
  const ID_B = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa002';
  const ID_C = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa003';

  beforeEach(() => {
    vi.clearAllMocks();
    resetState();
    authedSession();
  });

  it('reorders three categories atomically with positions 0/1/2', async () => {
    scopedState.selectResults = [
      [
        { id: ID_A, isInbox: false },
        { id: ID_B, isInbox: false },
        { id: ID_C, isInbox: false },
      ],
    ];

    const { reorderCategories } = await import('@/lib/actions/category');
    const result = await reorderCategories({ orderedIds: [ID_C, ID_A, ID_B] });

    expect(result.error).toBeUndefined();
    expect(scopedState.transactionInvoked).toBe(true);
    // One UPDATE per id in the array.
    expect(scopedState.txUpdates).toHaveLength(3);
    expect((scopedState.txUpdates[0].set as Record<string, unknown>).position).toBe(0);
    expect((scopedState.txUpdates[1].set as Record<string, unknown>).position).toBe(1);
    expect((scopedState.txUpdates[2].set as Record<string, unknown>).position).toBe(2);
  });

  it('rejects when an id is missing from the user-scoped query', async () => {
    // User has only 2 of the 3 requested ids.
    scopedState.selectResults = [
      [
        { id: ID_A, isInbox: false },
        { id: ID_B, isInbox: false },
      ],
    ];

    const { reorderCategories } = await import('@/lib/actions/category');
    const result = await reorderCategories({ orderedIds: [ID_A, ID_B, ID_C] });

    expect(result.error).toMatch(/no existen o no te pertenecen/);
    expect(scopedState.transactionInvoked).toBe(false);
  });

  it('rejects when one of the ids is Inbox', async () => {
    scopedState.selectResults = [
      [
        { id: ID_A, isInbox: false },
        { id: ID_B, isInbox: true }, // Inbox sneaked in
      ],
    ];

    const { reorderCategories } = await import('@/lib/actions/category');
    const result = await reorderCategories({ orderedIds: [ID_A, ID_B] });

    expect(result.error).toBe('Inbox no se puede reordenar');
    expect(scopedState.transactionInvoked).toBe(false);
  });

  it('rejects duplicate ids at the Zod layer', async () => {
    const { reorderCategories } = await import('@/lib/actions/category');
    const result = await reorderCategories({ orderedIds: [ID_A, ID_A] });

    expect(result.error).toMatch(/duplicados/);
    expect(scopedState.transactionInvoked).toBe(false);
  });

  it('rejects single-element arrays at the Zod layer', async () => {
    const { reorderCategories } = await import('@/lib/actions/category');
    const result = await reorderCategories({ orderedIds: [ID_A] });

    expect(result.error).toMatch(/al menos 2/);
  });
});
