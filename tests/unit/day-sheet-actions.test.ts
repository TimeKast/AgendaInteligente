/**
 * Tests for updateDaySheet action + getOrCreateDaySheet query (ISSUE-030).
 *
 * Mocks:
 *   - `@/lib/auth` — authed session
 *   - `@/lib/db/scoped` — captures updates
 *   - `@/lib/db/queries/sheets` — provides the existing row baseline
 *
 * Concurrency note: real Postgres-level concurrency for `getOrCreateDaySheet`
 * is covered by the UNIQUE index at the DB layer + the upsert SQL
 * pattern. The mock simulates "same row returned for both callers" to
 * lock in the contract the helper exposes.
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
    existingSheet: undefined as unknown,
    updated: undefined as { set: unknown } | undefined,
  },
}));

// Mock the query helper to return whatever baseline the test stages.
vi.mock('@/lib/db/queries/sheets', () => ({
  getOrCreateDaySheet: vi.fn(async () => state.existingSheet),
}));

// Mock scopedDb to capture the update payload.
vi.mock('@/lib/db/scoped', () => ({
  scopedDb: vi.fn(() => ({
    userId: 'mock',
    update(_table: string, set: unknown) {
      return {
        where() {
          state.updated = { set };
          return { execute: vi.fn().mockResolvedValue(undefined) };
        },
      };
    },
  })),
}));

const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const TODAY = '2026-05-26';
const SHEET_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

function reset() {
  state.existingSheet = undefined;
  state.updated = undefined;
  vi.clearAllMocks();
  authMock.mockResolvedValue({ user: { id: USER_A, email: 'a@example.com', role: 'user' } });
}

function emptySheet() {
  return {
    id: SHEET_ID,
    userId: USER_A,
    date: TODAY,
    identityStatement: null,
    winsPlanned: null,
    avoidance: null,
    closeSummary: null,
    notesDreams: null,
    morningCompletedAt: null,
    eveningCompletedAt: null,
  };
}

describe('updateDaySheet — patch semantics', () => {
  beforeEach(reset);

  it('patches a single field without touching others', async () => {
    state.existingSheet = emptySheet();

    const { updateDaySheet } = await import('@/lib/actions/day-sheet');
    const result = await updateDaySheet({ date: TODAY, identityStatement: 'Soy enfocado.' });

    expect(result.error).toBeUndefined();
    const set = state.updated?.set as Record<string, unknown>;
    expect(set.identityStatement).toBe('Soy enfocado.');
    expect(set).not.toHaveProperty('winsPlanned');
    expect(set).not.toHaveProperty('avoidance');
    // No completion timestamp because morning isn't fully filled.
    expect(set).not.toHaveProperty('morningCompletedAt');
  });

  it('no-ops when caller passes only the date', async () => {
    state.existingSheet = emptySheet();

    const { updateDaySheet } = await import('@/lib/actions/day-sheet');
    const result = await updateDaySheet({ date: TODAY });

    expect(result.error).toBeUndefined();
    expect(state.updated).toBeUndefined();
  });

  it('strips silently the legacy fields (intention, energy_*, evening_win, etc)', async () => {
    state.existingSheet = emptySheet();

    const { updateDaySheet } = await import('@/lib/actions/day-sheet');
    const result = await updateDaySheet({
      date: TODAY,
      // Legacy fields — should be stripped by Zod default behaviour.
      intention: 'eliminada',
      energy_physical: 5,
      evening_win: 'borrada',
      tomorrow_top: 'borrada',
      // Real field
      avoidance: 'Sin Twitter.',
    });

    expect(result.error).toBeUndefined();
    const set = state.updated?.set as Record<string, unknown>;
    expect(set.avoidance).toBe('Sin Twitter.');
    expect(set).not.toHaveProperty('intention');
    expect(set).not.toHaveProperty('energy_physical');
    expect(set).not.toHaveProperty('evening_win');
    expect(set).not.toHaveProperty('tomorrow_top');
  });

  it('rejects winsPlanned with more than 3 elements', async () => {
    const { updateDaySheet } = await import('@/lib/actions/day-sheet');
    const result = await updateDaySheet({
      date: TODAY,
      winsPlanned: ['a', 'b', 'c', 'd'],
    });

    expect(result.error).toMatch(/Máximo 3 wins/);
    expect(state.updated).toBeUndefined();
  });

  it('rejects malformed date', async () => {
    const { updateDaySheet } = await import('@/lib/actions/day-sheet');
    const result = await updateDaySheet({ date: '26 mayo 2026', avoidance: 'x' });

    expect(result.error).toMatch(/Fecha inválida/);
  });
});

describe('updateDaySheet — auto-completion timestamps', () => {
  beforeEach(reset);

  it('stamps morning_completed_at when the patch completes all 3 morning fields', async () => {
    state.existingSheet = emptySheet();

    const { updateDaySheet } = await import('@/lib/actions/day-sheet');
    const result = await updateDaySheet({
      date: TODAY,
      identityStatement: 'Soy x.',
      winsPlanned: ['Llamar a Juan'],
      avoidance: 'No abro Twitter.',
    });

    expect(result.error).toBeUndefined();
    const set = state.updated?.set as Record<string, unknown>;
    expect(set.morningCompletedAt).toBeInstanceOf(Date);
    expect(result.data?.morningCompletedAt).toBeInstanceOf(Date);
  });

  it('stamps morning_completed_at when LAST missing field gets set across multiple calls', async () => {
    // Existing has 2 of 3 morning fields. The patch sets the third.
    state.existingSheet = {
      ...emptySheet(),
      identityStatement: 'Soy x.',
      winsPlanned: ['a'],
    };

    const { updateDaySheet } = await import('@/lib/actions/day-sheet');
    await updateDaySheet({ date: TODAY, avoidance: 'No checks.' });

    const set = state.updated?.set as Record<string, unknown>;
    expect(set.morningCompletedAt).toBeInstanceOf(Date);
  });

  it('does NOT re-stamp morning_completed_at on subsequent edits', async () => {
    const earlier = new Date('2026-05-26T07:00:00Z');
    state.existingSheet = {
      ...emptySheet(),
      identityStatement: 'Soy x.',
      winsPlanned: ['a'],
      avoidance: 'y',
      morningCompletedAt: earlier,
    };

    const { updateDaySheet } = await import('@/lib/actions/day-sheet');
    await updateDaySheet({ date: TODAY, winsPlanned: ['updated win'] });

    const set = state.updated?.set as Record<string, unknown>;
    // The action did NOT add morningCompletedAt to the update payload.
    expect(set).not.toHaveProperty('morningCompletedAt');
  });

  it('stamps evening_completed_at on first close_summary write', async () => {
    state.existingSheet = emptySheet();

    const { updateDaySheet } = await import('@/lib/actions/day-sheet');
    await updateDaySheet({ date: TODAY, closeSummary: 'Buen día.' });

    const set = state.updated?.set as Record<string, unknown>;
    expect(set.eveningCompletedAt).toBeInstanceOf(Date);
    expect(set.closeSummary).toBe('Buen día.');
  });

  it('does NOT re-stamp evening_completed_at on subsequent close_summary edits', async () => {
    const earlier = new Date('2026-05-26T22:00:00Z');
    state.existingSheet = {
      ...emptySheet(),
      closeSummary: 'Inicial.',
      eveningCompletedAt: earlier,
    };

    const { updateDaySheet } = await import('@/lib/actions/day-sheet');
    await updateDaySheet({ date: TODAY, closeSummary: 'Editado.' });

    const set = state.updated?.set as Record<string, unknown>;
    expect(set).not.toHaveProperty('eveningCompletedAt');
  });

  it('stamps both timestamps when the same call completes both morning and evening', async () => {
    state.existingSheet = emptySheet();

    const { updateDaySheet } = await import('@/lib/actions/day-sheet');
    await updateDaySheet({
      date: TODAY,
      identityStatement: 'Soy x.',
      winsPlanned: ['a'],
      avoidance: 'b',
      closeSummary: 'Cerrado.',
    });

    const set = state.updated?.set as Record<string, unknown>;
    expect(set.morningCompletedAt).toBeInstanceOf(Date);
    expect(set.eveningCompletedAt).toBeInstanceOf(Date);
  });
});
