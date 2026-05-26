/**
 * Tests for the typed Inngest publisher — ISSUE-080.
 *
 * Locks in:
 *   - Payload validation runs before `inngest.send()` (catches bugs in dev).
 *   - Missing Inngest config → no-op + warn (graceful degradation).
 *   - Send errors are caught (don't surface to the caller).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/inngest/client', () => ({
  getInngest: () => ({ send: sendMock }),
}));

vi.mock('@/lib/env', () => ({
  isInngestConfigured: vi.fn(() => true),
}));

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const VALID_UUID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

describe('publish — configured', () => {
  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockResolvedValue(undefined);
  });

  it('sends a validated event when Inngest is configured', async () => {
    const { publish } = await import('@/lib/inngest/publish');
    await publish('user.signed_up', { userId: VALID_UUID });

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith({
      name: 'user.signed_up',
      data: { userId: VALID_UUID },
    });
  });

  it('rejects malformed payload BEFORE calling send (runtime Zod check)', async () => {
    const { publish } = await import('@/lib/inngest/publish');
    // userId is typed `string` at compile time (Zod's .uuid() refines only
    // at runtime), so no ts-expect-error needed — just exercise the runtime
    // validation directly.
    await expect(publish('user.signed_up', { userId: 'not-a-uuid' })).rejects.toThrow();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('swallows send errors (caller flow continues)', async () => {
    sendMock.mockRejectedValueOnce(new Error('Inngest outage'));
    const { publish } = await import('@/lib/inngest/publish');
    // Should NOT throw — graceful degradation.
    await expect(publish('user.signed_up', { userId: VALID_UUID })).resolves.toBeUndefined();
  });
});

describe('publish — not configured', () => {
  beforeEach(() => {
    sendMock.mockReset();
  });

  it('skips the send when isInngestConfigured() returns false', async () => {
    const env = await import('@/lib/env');
    vi.mocked(env.isInngestConfigured).mockReturnValueOnce(false);

    const { publish } = await import('@/lib/inngest/publish');
    await publish('user.signed_up', { userId: VALID_UUID });

    expect(sendMock).not.toHaveBeenCalled();
  });

  it('still validates payload before deciding to skip (catches dev contract bugs)', async () => {
    const env = await import('@/lib/env');
    vi.mocked(env.isInngestConfigured).mockReturnValueOnce(false);

    const { publish } = await import('@/lib/inngest/publish');
    await expect(
      // @ts-expect-error — intentional type misuse (number vs string)
      publish('user.signed_up', { userId: 123 })
    ).rejects.toThrow();
  });
});
