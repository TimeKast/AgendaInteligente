/**
 * Tests for setIntensityMode — ISSUE-054.
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
    updateSet: undefined as unknown,
  },
}));

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    update: vi.fn(() => ({
      set: vi.fn((set: unknown) => {
        state.updateSet = set;
        return { where: vi.fn(async () => undefined) };
      }),
    })),
  },
}));

const USER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function reset() {
  state.updateSet = undefined;
  vi.clearAllMocks();
  authMock.mockResolvedValue({ user: { id: USER, email: 'a@example.com', role: 'user' } });
}

beforeEach(reset);

describe('setIntensityMode', () => {
  it('listening sets intensity_expires_at = now + 48h', async () => {
    const { setIntensityMode } = await import('@/lib/actions/intensity');
    const before = Date.now();
    const result = await setIntensityMode({ mode: 'listening' });

    expect(result.error).toBeUndefined();
    expect(result.data?.mode).toBe('listening');
    const set = state.updateSet as { intensityExpiresAt: Date };
    expect(set.intensityExpiresAt).toBeInstanceOf(Date);
    const delta = set.intensityExpiresAt.getTime() - before;
    expect(delta).toBeGreaterThanOrEqual(48 * 60 * 60 * 1000 - 5_000);
    expect(delta).toBeLessThanOrEqual(48 * 60 * 60 * 1000 + 5_000);
  });

  it('non-listening modes clear intensity_expires_at', async () => {
    const { setIntensityMode } = await import('@/lib/actions/intensity');
    for (const mode of ['sharp', 'standard', 'gentle'] as const) {
      reset();
      await setIntensityMode({ mode });
      const set = state.updateSet as { intensityExpiresAt: Date | null };
      expect(set.intensityExpiresAt).toBeNull();
    }
  });

  it('always clears intensity_default_until (explicit choice opts out of migration)', async () => {
    const { setIntensityMode } = await import('@/lib/actions/intensity');
    await setIntensityMode({ mode: 'sharp' });
    const set = state.updateSet as { intensityDefaultUntil: Date | null };
    expect(set.intensityDefaultUntil).toBeNull();
  });

  it('rejects invalid mode', async () => {
    const { setIntensityMode } = await import('@/lib/actions/intensity');
    const result = await setIntensityMode({ mode: 'extreme' });
    expect(result.error).toBeDefined();
    expect(state.updateSet).toBeUndefined();
  });
});
