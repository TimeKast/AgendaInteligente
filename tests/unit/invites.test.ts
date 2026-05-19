/**
 * Invite Token Utilities Tests
 *
 * Unit tests for token generation and hashing functions.
 */

import { describe, it, expect } from 'vitest';
import { generateInviteToken, hashInviteToken, DEFAULT_INVITE_EXPIRY_MS } from '@/lib/invites';

describe('generateInviteToken', () => {
  it('returns a 64 character string', () => {
    const token = generateInviteToken();
    expect(token).toHaveLength(64);
  });

  it('returns a valid hex string', () => {
    const token = generateInviteToken();
    expect(/^[a-f0-9]+$/.test(token)).toBe(true);
  });

  it('generates unique tokens', () => {
    const token1 = generateInviteToken();
    const token2 = generateInviteToken();
    expect(token1).not.toBe(token2);
  });

  it('generates multiple unique tokens', () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 100; i++) {
      tokens.add(generateInviteToken());
    }
    expect(tokens.size).toBe(100);
  });
});

describe('hashInviteToken', () => {
  it('returns a consistent hash for the same input', () => {
    const token = 'test-token-12345';
    const hash1 = hashInviteToken(token);
    const hash2 = hashInviteToken(token);
    expect(hash1).toBe(hash2);
  });

  it('returns a 64 character hex string (SHA-256)', () => {
    const hash = hashInviteToken('test-token');
    expect(hash).toHaveLength(64);
    expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
  });

  it('hash differs from input', () => {
    const token = 'test-token';
    const hash = hashInviteToken(token);
    expect(hash).not.toBe(token);
  });

  it('different inputs produce different hashes', () => {
    const hash1 = hashInviteToken('token-1');
    const hash2 = hashInviteToken('token-2');
    expect(hash1).not.toBe(hash2);
  });
});

describe('DEFAULT_INVITE_EXPIRY_MS', () => {
  it('equals 7 days in milliseconds', () => {
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    expect(DEFAULT_INVITE_EXPIRY_MS).toBe(sevenDays);
  });
});
