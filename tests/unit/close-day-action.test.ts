/**
 * Tests for the `closeDay` orchestrator (ISSUE-031 wire).
 *
 * Strategy: stub the underlying actions (transitionActivity,
 * updateActivity, updateDaySheet) and verify the orchestrator routes
 * each outcome to the right one, accumulates partial errors instead of
 * aborting, and always writes the DaySheet summary at the end.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const authMock = vi.fn();
vi.mock('@/lib/auth/auth', () => ({ auth: authMock }));

const transitionMock = vi.fn();
const updateActivityMock = vi.fn();
const updateDaySheetMock = vi.fn();

vi.mock('@/lib/actions/activity', () => ({
  transitionActivity: (input: unknown) => transitionMock(input),
  updateActivity: (input: unknown) => updateActivityMock(input),
}));
vi.mock('@/lib/actions/day-sheet', () => ({
  updateDaySheet: (input: unknown) => updateDaySheetMock(input),
}));

const USER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ user: { id: USER, email: 'a@example.com', role: 'user' } });
  transitionMock.mockResolvedValue({ data: undefined });
  updateActivityMock.mockResolvedValue({ data: undefined });
  updateDaySheetMock.mockResolvedValue({
    data: { id: 'sheet-1', morningCompletedAt: null, eveningCompletedAt: new Date() },
  });
});

const validId = (n: number) => `${n.toString().padStart(8, '0')}-aaaa-4aaa-8aaa-aaaaaaaaaaaa`;

describe('closeDay — routing', () => {
  it("routes 'done' → transitionActivity(done)", async () => {
    const { closeDay } = await import('@/lib/actions/close-day');
    const result = await closeDay({
      date: '2026-05-27',
      activities: [{ id: validId(1), outcome: 'done', closed: false }],
      oneLine: 'all good',
    });

    expect(result.error).toBeUndefined();
    expect(transitionMock).toHaveBeenCalledWith({ id: validId(1), toStatus: 'done' });
    expect(updateActivityMock).not.toHaveBeenCalled();
    expect(result.data?.transitioned).toBe(1);
    expect(result.data?.partialErrors).toEqual([]);
  });

  it("routes 'partial' → updateActivity(progressPercent)", async () => {
    const { closeDay } = await import('@/lib/actions/close-day');
    await closeDay({
      date: '2026-05-27',
      activities: [{ id: validId(2), outcome: 'partial', partialPct: 40 }],
      oneLine: '',
    });

    expect(updateActivityMock).toHaveBeenCalledWith({ id: validId(2), progressPercent: 40 });
    expect(transitionMock).not.toHaveBeenCalled();
  });

  it("routes 'missed' → transitionActivity(skipped)", async () => {
    const { closeDay } = await import('@/lib/actions/close-day');
    await closeDay({
      date: '2026-05-27',
      activities: [{ id: validId(3), outcome: 'missed' }],
      oneLine: '',
    });

    expect(transitionMock).toHaveBeenCalledWith({ id: validId(3), toStatus: 'cancelled' });
  });

  it('always writes the DaySheet summary at the end (even when empty)', async () => {
    const { closeDay } = await import('@/lib/actions/close-day');
    await closeDay({ date: '2026-05-27', activities: [], oneLine: '' });

    expect(updateDaySheetMock).toHaveBeenCalledWith({
      date: '2026-05-27',
      closeSummary: '',
    });
  });
});

describe('closeDay — partial-error accumulation', () => {
  it('does not abort when one activity fails; continues and surfaces the error', async () => {
    transitionMock.mockImplementation(async (input: { id: string; toStatus: string }) => {
      if (input.id === validId(2)) return { error: 'Actividad no encontrada' };
      return { data: undefined };
    });

    const { closeDay } = await import('@/lib/actions/close-day');
    const result = await closeDay({
      date: '2026-05-27',
      activities: [
        { id: validId(1), outcome: 'done' },
        { id: validId(2), outcome: 'done' }, // this one fails
        { id: validId(3), outcome: 'missed' },
      ],
      oneLine: 'mixed bag',
    });

    expect(result.error).toBeUndefined();
    expect(result.data?.transitioned).toBe(2);
    expect(result.data?.partialErrors).toEqual([
      { activityId: validId(2), error: 'Actividad no encontrada' },
    ]);
    // DaySheet still written.
    expect(updateDaySheetMock).toHaveBeenCalled();
  });

  it('reports day_sheet failure under the synthetic __day_sheet__ key', async () => {
    updateDaySheetMock.mockResolvedValueOnce({ error: 'sheet boom' });

    const { closeDay } = await import('@/lib/actions/close-day');
    const result = await closeDay({
      date: '2026-05-27',
      activities: [{ id: validId(1), outcome: 'done' }],
      oneLine: '',
    });

    expect(result.error).toBeUndefined();
    expect(result.data?.partialErrors).toContainEqual({
      activityId: '__day_sheet__',
      error: 'sheet boom',
    });
  });
});

describe('closeDay — auth', () => {
  it('returns "Debes iniciar sesión" when no session', async () => {
    authMock.mockResolvedValueOnce(null);
    const { closeDay } = await import('@/lib/actions/close-day');
    const result = await closeDay({ date: '2026-05-27', activities: [], oneLine: '' });
    expect(result.error).toBe('Debes iniciar sesión');
    expect(updateDaySheetMock).not.toHaveBeenCalled();
  });
});
