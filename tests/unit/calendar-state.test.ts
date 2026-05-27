/**
 * Tests for OAuth state CSRF helper — ISSUE-090b.
 *
 * Covers:
 *   - signState → verifyState roundtrip with valid userId
 *   - Tampered MAC fails (timing-safe compare)
 *   - Tampered payload fails
 *   - Expired token fails
 *   - Malformed shape fails
 *   - Missing AUTH_SECRET throws
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const envMock = vi.fn();
vi.mock('@/lib/env', () => ({
  getEnv: () => envMock(),
}));

beforeEach(() => {
  envMock.mockReturnValue({
    AUTH_SECRET: 'test-secret-key-32-bytes-or-more-base64==',
    NEXTAUTH_SECRET: undefined,
  });
});

const USER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

describe('signState / verifyState', () => {
  it('roundtrips a fresh token', async () => {
    const { signState, verifyState } = await import('@/lib/integrations/calendar/state');
    const token = signState(USER);
    const payload = verifyState(token);
    expect(payload.userId).toBe(USER);
    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('uses NEXTAUTH_SECRET as fallback when AUTH_SECRET unset', async () => {
    envMock.mockReturnValueOnce({ AUTH_SECRET: undefined, NEXTAUTH_SECRET: 'fallback-key' });
    const { signState } = await import('@/lib/integrations/calendar/state');
    const token = signState(USER);
    expect(typeof token).toBe('string');
    expect(token).toContain('.');
  });

  it('rejects tampered MAC (flip a middle base64 char)', async () => {
    const { signState, verifyState } = await import('@/lib/integrations/calendar/state');
    const token = signState(USER);
    const dot = token.indexOf('.');
    const macStart = dot + 1;
    // Flip a char near the MIDDLE of the MAC b64 — guarantees the
    // decoded bytes change. Tampering the LAST char of base64url can
    // be a no-op when it only encodes padding bits.
    const flipIdx = macStart + Math.floor((token.length - macStart) / 2);
    const original = token[flipIdx];
    const replacement = original === 'a' ? 'b' : 'a';
    const tampered = token.slice(0, flipIdx) + replacement + token.slice(flipIdx + 1);
    expect(() => verifyState(tampered)).toThrow(/mac/);
  });

  it('rejects tampered payload (signature no longer matches)', async () => {
    const { signState, verifyState } = await import('@/lib/integrations/calendar/state');
    const token = signState(USER);
    const [, mac] = token.split('.');
    const newPayload = Buffer.from(
      JSON.stringify({ userId: 'attacker', exp: Math.floor(Date.now() / 1000) + 300 })
    )
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    expect(() => verifyState(`${newPayload}.${mac}`)).toThrow(/mac/);
  });

  it('rejects expired token', async () => {
    const { signState, verifyState } = await import('@/lib/integrations/calendar/state');
    // ttl = -1s → already expired the moment it's signed
    const token = signState(USER, -1);
    expect(() => verifyState(token)).toThrow(/expired/);
  });

  it('rejects malformed shape (no dot)', async () => {
    const { verifyState } = await import('@/lib/integrations/calendar/state');
    expect(() => verifyState('not-a-state-token')).toThrow(/shape/);
  });

  it('rejects empty halves around the dot', async () => {
    const { verifyState } = await import('@/lib/integrations/calendar/state');
    expect(() => verifyState('.something')).toThrow();
    expect(() => verifyState('something.')).toThrow();
  });

  it('signState throws when userId is empty', async () => {
    const { signState } = await import('@/lib/integrations/calendar/state');
    expect(() => signState('')).toThrow(/userId/);
  });

  it('throws when AUTH_SECRET + NEXTAUTH_SECRET are both unset', async () => {
    envMock.mockReturnValueOnce({ AUTH_SECRET: undefined, NEXTAUTH_SECRET: undefined });
    const { signState } = await import('@/lib/integrations/calendar/state');
    expect(() => signState(USER)).toThrow(/AUTH_SECRET/);
  });
});
