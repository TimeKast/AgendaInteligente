/**
 * Tests for MonthSheet server actions — ISSUE-131 Slice A1.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const authMock = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: authMock }));
vi.mock('@/lib/auth/permissions', () => ({ requirePermission: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const { state } = vi.hoisted(() => ({
  state: {
    existing: null as {
      id: string;
      closedAt: Date | null;
    } | null,
    updateSet: undefined as unknown,
  },
}));

const getOrCreateMonthSheetMock = vi.fn();
vi.mock('@/lib/db/queries/sheets', () => ({
  getOrCreateMonthSheet: getOrCreateMonthSheetMock,
}));

vi.mock('@/lib/db/scoped', () => ({
  scopedDb: vi.fn(() => ({
    userId: 'u',
    update(_table: string, set: unknown) {
      state.updateSet = set;
      return {
        where: () => ({ execute: vi.fn().mockResolvedValue(undefined) }),
      };
    },
  })),
}));

const USER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const SHEET = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function reset() {
  vi.clearAllMocks();
  state.existing = { id: SHEET, closedAt: null };
  state.updateSet = undefined;
  authMock.mockResolvedValue({ user: { id: USER, email: 'a@example.com', role: 'user' } });
  getOrCreateMonthSheetMock.mockImplementation(async () => state.existing);
}

beforeEach(reset);

describe('updateMonthSheet', () => {
  it('normalizes mid-month date to YYYY-MM-01 before resolving the sheet', async () => {
    const { updateMonthSheet } = await import('@/lib/actions/month-sheet');
    await updateMonthSheet({ monthStarting: '2026-05-19', goals: 'foo' });

    expect(getOrCreateMonthSheetMock).toHaveBeenCalledWith(USER, '2026-05-01');
  });

  it('patches only provided fields', async () => {
    const { updateMonthSheet } = await import('@/lib/actions/month-sheet');
    await updateMonthSheet({
      monthStarting: '2026-05-01',
      goals: 'Lanzar MVP',
      themes: ['enfoque', 'salud'],
    });

    expect(state.updateSet).toEqual({
      goals: 'Lanzar MVP',
      themes: ['enfoque', 'salud'],
    });
  });

  it('no-op when caller provides nothing patchable', async () => {
    const { updateMonthSheet } = await import('@/lib/actions/month-sheet');
    const result = await updateMonthSheet({ monthStarting: '2026-05-01' });
    expect(result.error).toBeUndefined();
    expect(state.updateSet).toBeUndefined();
  });

  it('rejects themes longer than 5 entries', async () => {
    const { updateMonthSheet } = await import('@/lib/actions/month-sheet');
    const result = await updateMonthSheet({
      monthStarting: '2026-05-01',
      themes: ['a', 'b', 'c', 'd', 'e', 'f'],
    });
    expect(result.error).toBeDefined();
  });

  it('rejects malformed monthStarting', async () => {
    const { updateMonthSheet } = await import('@/lib/actions/month-sheet');
    const result = await updateMonthSheet({ monthStarting: '05-01-2026' });
    expect(result.error).toBeDefined();
  });
});

describe('closeMonth', () => {
  it('stamps closeSummary + sets closed_at on first close', async () => {
    const { closeMonth } = await import('@/lib/actions/month-sheet');
    await closeMonth({ monthStarting: '2026-05-01', closeSummary: 'Mes intenso.' });

    const set = state.updateSet as { closeSummary: string; closedAt: unknown };
    expect(set.closeSummary).toBe('Mes intenso.');
    expect(set.closedAt).toBeDefined();
  });

  it('preserves existing closed_at on re-close (idempotent stamp)', async () => {
    const original = new Date('2026-06-01T10:00:00Z');
    state.existing = { id: SHEET, closedAt: original };

    const { closeMonth } = await import('@/lib/actions/month-sheet');
    await closeMonth({ monthStarting: '2026-05-01', closeSummary: 'wording v2' });

    const set = state.updateSet as { closedAt: Date };
    expect(set.closedAt).toBe(original);
  });

  it('rejects empty closeSummary', async () => {
    const { closeMonth } = await import('@/lib/actions/month-sheet');
    const result = await closeMonth({ monthStarting: '2026-05-01', closeSummary: '' });
    expect(result.error).toBeDefined();
  });
});
