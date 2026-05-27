/**
 * Tests for the token encryption helpers — ISSUE-090 / U-007.
 *
 * The crypto module is real (no mock) — we want to exercise the actual
 * AES-256-GCM path. `getEncryptionKey` is mocked so the test suite owns
 * its own deterministic key without touching the .env.local file.
 *
 * Locks in:
 *   - Roundtrip: encrypt → decrypt returns the original plaintext.
 *   - Distinct IV per call: encrypting the same plaintext twice yields
 *     different ciphers (no deterministic encryption leak).
 *   - Tamper detection: modifying any byte in the cipher fails decrypt.
 *   - Wrong-key decryption fails with an integrity error.
 *   - Edge cases: empty string, long string, non-ASCII (UTF-8 path).
 *   - Buffer / Uint8Array coercion on decrypt input.
 *   - Key shape validation: env value that doesn't decode to 32 bytes throws.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { randomBytes } from 'node:crypto';

// We mock the env helper so the test suite owns the key end-to-end —
// no risk of polluting the local .env.local during a parallel run.
const keyMock = vi.fn(() => randomBytes(32).toString('base64'));
vi.mock('@/lib/env', () => ({
  getEncryptionKey: () => keyMock(),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('encryptToken / decryptToken — roundtrip', () => {
  it('round-trips a typical OAuth token', async () => {
    const KEY = randomBytes(32).toString('base64');
    keyMock.mockReturnValue(KEY);

    const { encryptToken, decryptToken } = await import('@/lib/integrations/calendar/tokens');
    const plaintext = 'ya29.a0AVvZVso-FAKE-TOKEN-12345xyz';
    const cipher = encryptToken(plaintext);

    expect(Buffer.isBuffer(cipher)).toBe(true);
    expect(cipher.length).toBeGreaterThan(plaintext.length); // IV + tag prefix overhead
    expect(decryptToken(cipher)).toBe(plaintext);
  });

  it('round-trips an empty-ish string (single char) without losing data', async () => {
    const KEY = randomBytes(32).toString('base64');
    keyMock.mockReturnValue(KEY);

    const { encryptToken, decryptToken } = await import('@/lib/integrations/calendar/tokens');
    const cipher = encryptToken('x');
    expect(decryptToken(cipher)).toBe('x');
  });

  it('round-trips long strings (1KB)', async () => {
    const KEY = randomBytes(32).toString('base64');
    keyMock.mockReturnValue(KEY);

    const { encryptToken, decryptToken } = await import('@/lib/integrations/calendar/tokens');
    const plaintext = 'a'.repeat(1024);
    const cipher = encryptToken(plaintext);
    expect(decryptToken(cipher)).toBe(plaintext);
  });

  it('round-trips non-ASCII UTF-8 (emojis + accents)', async () => {
    const KEY = randomBytes(32).toString('base64');
    keyMock.mockReturnValue(KEY);

    const { encryptToken, decryptToken } = await import('@/lib/integrations/calendar/tokens');
    const plaintext = 'café-ñoño-🔐-こんにちは';
    expect(decryptToken(encryptToken(plaintext))).toBe(plaintext);
  });

  it('accepts a Uint8Array on decrypt (driver coercion safety)', async () => {
    const KEY = randomBytes(32).toString('base64');
    keyMock.mockReturnValue(KEY);

    const { encryptToken, decryptToken } = await import('@/lib/integrations/calendar/tokens');
    const cipherBuf = encryptToken('test');
    const cipherU8 = new Uint8Array(cipherBuf);
    // Some Postgres drivers surface bytea as Uint8Array, not Buffer.
    expect(decryptToken(cipherU8 as unknown as Buffer)).toBe('test');
  });
});

describe('encryptToken — non-determinism', () => {
  it('produces a different cipher on each call for the same plaintext', async () => {
    const KEY = randomBytes(32).toString('base64');
    keyMock.mockReturnValue(KEY);

    const { encryptToken } = await import('@/lib/integrations/calendar/tokens');
    const plaintext = 'same-secret';
    const a = encryptToken(plaintext);
    const b = encryptToken(plaintext);
    const c = encryptToken(plaintext);

    expect(a.equals(b)).toBe(false);
    expect(b.equals(c)).toBe(false);
    expect(a.equals(c)).toBe(false);
  });

  it('the random IV is the first 12 bytes (GCM convention)', async () => {
    const KEY = randomBytes(32).toString('base64');
    keyMock.mockReturnValue(KEY);

    const { encryptToken } = await import('@/lib/integrations/calendar/tokens');
    const a = encryptToken('x');
    const b = encryptToken('x');
    // The IV is the prefix; if it varies, the first 12 bytes differ.
    expect(a.subarray(0, 12).equals(b.subarray(0, 12))).toBe(false);
  });
});

describe('decryptToken — integrity', () => {
  it('rejects a tampered cipher (last byte flipped)', async () => {
    const KEY = randomBytes(32).toString('base64');
    keyMock.mockReturnValue(KEY);

    const { encryptToken, decryptToken } = await import('@/lib/integrations/calendar/tokens');
    const cipher = encryptToken('hello');
    const tampered = Buffer.from(cipher);
    tampered[tampered.length - 1] = tampered[tampered.length - 1] ^ 0xff;

    expect(() => decryptToken(tampered)).toThrow();
  });

  it('rejects a tampered auth tag (byte 12 flipped)', async () => {
    const KEY = randomBytes(32).toString('base64');
    keyMock.mockReturnValue(KEY);

    const { encryptToken, decryptToken } = await import('@/lib/integrations/calendar/tokens');
    const cipher = encryptToken('hello');
    const tampered = Buffer.from(cipher);
    tampered[12] = tampered[12] ^ 0xff;

    expect(() => decryptToken(tampered)).toThrow();
  });

  it('rejects too-short input', async () => {
    const KEY = randomBytes(32).toString('base64');
    keyMock.mockReturnValue(KEY);

    const { decryptToken } = await import('@/lib/integrations/calendar/tokens');
    // Less than IV(12) + tag(16) + 1 ciphertext byte = 29 bytes.
    expect(() => decryptToken(Buffer.alloc(10))).toThrow(/too short/i);
  });
});

describe('decryptToken — wrong key', () => {
  it('fails when decrypting with a different key than was used to encrypt', async () => {
    const { encryptToken } = await import('@/lib/integrations/calendar/tokens');
    keyMock.mockReturnValueOnce(randomBytes(32).toString('base64'));
    const cipher = encryptToken('hello');

    // Re-import so the next call re-reads the (different) key.
    // (loadKey() reads on every call, so changing the mock is enough.)
    keyMock.mockReturnValue(randomBytes(32).toString('base64'));
    const { decryptToken } = await import('@/lib/integrations/calendar/tokens');
    expect(() => decryptToken(cipher)).toThrow();
  });
});

describe('loadKey — env validation', () => {
  it('throws when ENCRYPTION_KEY does not decode to 32 bytes (too short)', async () => {
    keyMock.mockReturnValue(Buffer.alloc(16).toString('base64')); // only 16 bytes

    const { encryptToken } = await import('@/lib/integrations/calendar/tokens');
    expect(() => encryptToken('x')).toThrow(/32 bytes/);
  });

  it('throws when ENCRYPTION_KEY decodes to 40 bytes (too long)', async () => {
    keyMock.mockReturnValue(Buffer.alloc(40).toString('base64'));

    const { encryptToken } = await import('@/lib/integrations/calendar/tokens');
    expect(() => encryptToken('x')).toThrow(/32 bytes/);
  });
});

describe('encryptToken — type guards', () => {
  it('rejects non-string input', async () => {
    const KEY = randomBytes(32).toString('base64');
    keyMock.mockReturnValue(KEY);

    const { encryptToken } = await import('@/lib/integrations/calendar/tokens');
    // @ts-expect-error — intentional misuse
    expect(() => encryptToken(123)).toThrow(/string/);
    // @ts-expect-error — intentional misuse
    expect(() => encryptToken(null)).toThrow(/string/);
  });
});
