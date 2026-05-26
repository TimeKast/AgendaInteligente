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
  },
}));

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

describe('deleteCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetState();
    authedSession();
  });

  it('soft-deletes a non-Inbox category', async () => {
    scopedState.selectResults = [
      [{ id: CATEGORY_ID, name: 'Personal', isInbox: false, deletedAt: null }],
    ];

    const { deleteCategory } = await import('@/lib/actions/category');
    const result = await deleteCategory({ id: CATEGORY_ID });

    expect(result.error).toBeUndefined();
    expect(scopedState.updated?.set).toHaveProperty('deletedAt');
  });

  it('blocks deleting Inbox', async () => {
    scopedState.selectResults = [[{ id: CATEGORY_ID, name: 'Inbox', isInbox: true }]];

    const { deleteCategory } = await import('@/lib/actions/category');
    const result = await deleteCategory({ id: CATEGORY_ID });

    expect(result.error).toBe('Inbox no se puede borrar');
    expect(scopedState.updated).toBeUndefined();
  });

  it('returns "no encontrada" if row does not exist for this user', async () => {
    scopedState.selectResults = [[]];
    const { deleteCategory } = await import('@/lib/actions/category');
    const result = await deleteCategory({ id: CATEGORY_ID });

    expect(result.error).toBe('Categoría no encontrada');
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
    expect(scopedState.updated).toBeUndefined();
  });
});
