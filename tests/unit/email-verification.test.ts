/**
 * Tests for email verification flow (ISSUE-004).
 *
 * Two surfaces under test:
 *   1. `isWeakPassword` blocklist + heuristic (pure function, easy to test).
 *   2. `verifyEmailToken` token consumption flow (mocked db).
 *
 * `sendVerificationEmail` is exercised only at the integration layer (mocks
 * for sendEmail would just re-check Promise plumbing).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── isWeakPassword ───────────────────────────────────────────────────────

describe('isWeakPassword', () => {
  it('rejects bare members of the common list', async () => {
    const { isWeakPassword } = await import('@/lib/auth/weak-passwords');
    expect(isWeakPassword('password')).toBe(true);
    expect(isWeakPassword('123456')).toBe(true);
    expect(isWeakPassword('qwerty')).toBe(true);
    expect(isWeakPassword('letmein')).toBe(true);
    expect(isWeakPassword('iloveyou')).toBe(true);
  });

  it('is case-insensitive against the blocklist', async () => {
    const { isWeakPassword } = await import('@/lib/auth/weak-passwords');
    expect(isWeakPassword('PASSWORD')).toBe(true);
    expect(isWeakPassword('PaSsWoRd')).toBe(true);
    expect(isWeakPassword('QwErTy')).toBe(true);
  });

  it('rejects trivial patterns even when not in the blocklist', async () => {
    const { isWeakPassword } = await import('@/lib/auth/weak-passwords');
    expect(isWeakPassword('aaaaaa')).toBe(true); // repeated chars
    expect(isWeakPassword('zzzzzzzz')).toBe(true);
    expect(isWeakPassword('00000000')).toBe(true);
    expect(isWeakPassword('123456789')).toBe(true); // ascending
    expect(isWeakPassword('9876543210')).toBe(true); // descending
  });

  it('accepts reasonable passwords', async () => {
    const { isWeakPassword } = await import('@/lib/auth/weak-passwords');
    expect(isWeakPassword('Tr0ub4dor&3')).toBe(false);
    expect(isWeakPassword('correct horse battery staple')).toBe(false);
    expect(isWeakPassword('xkcd-style-passphrase!')).toBe(false);
    expect(isWeakPassword('Fed3rico!2026')).toBe(false);
  });

  it('accepts passwords that mix in blocklist words but are longer', async () => {
    const { isWeakPassword } = await import('@/lib/auth/weak-passwords');
    // "password" is blocked but "mypasswordstronger" is not (we don't do
    // substring matching — that would reject too many legit passwords).
    expect(isWeakPassword('mypasswordstronger123!')).toBe(false);
  });
});

// ─── verifyEmailToken ─────────────────────────────────────────────────────

const { dbState } = vi.hoisted(() => ({
  dbState: {
    tokens: [] as Array<{ userId: string; tokenHash: string; expiresAt: Date }>,
    transactionInvoked: false,
    txUpdates: [] as Array<{ table: string; set: unknown }>,
    txDeletes: [] as Array<{ table: string }>,
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/db/drizzle', () => {
  const mkSelectChain = () => ({
    from: vi.fn(() => ({
      where: vi.fn(async () => {
        // Return rows matching the current state. The helper queries
        // (tokenHash = X AND expiresAt > now) — we match by enumerating.
        const now = new Date();
        const matching = dbState.tokens.filter((t) => t.expiresAt > now);
        return matching.length > 0 ? [matching[0]] : [];
      }),
    })),
  });

  const mkInsertChain = () => ({
    values: vi.fn((vals: Record<string, unknown>) => {
      dbState.tokens.push({
        userId: vals.userId as string,
        tokenHash: vals.tokenHash as string,
        expiresAt: vals.expiresAt as Date,
      });
      return Promise.resolve(undefined);
    }),
  });

  const mkDeleteChain = () => ({
    where: vi.fn(async () => {
      // For our mock, any delete clears the array (simplification — tests
      // that need fine-grained matching can set state explicitly).
      dbState.tokens = [];
      return undefined;
    }),
  });

  const mkUpdateChain = () => ({
    set: vi.fn(() => ({
      where: vi.fn(async () => undefined),
    })),
  });

  const mkTx = () => ({
    update: vi.fn(() => ({
      set: vi.fn((set: unknown) => {
        dbState.txUpdates.push({ table: 'users', set });
        return { where: vi.fn(async () => undefined) };
      }),
    })),
    delete: vi.fn(() => {
      dbState.txDeletes.push({ table: 'email_verification_tokens' });
      return { where: vi.fn(async () => undefined) };
    }),
  });

  return {
    db: {
      select: vi.fn(() => mkSelectChain()),
      insert: vi.fn(() => mkInsertChain()),
      delete: vi.fn(() => mkDeleteChain()),
      update: vi.fn(() => mkUpdateChain()),
      transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
        dbState.transactionInvoked = true;
        return cb(mkTx());
      }),
    },
  };
});

vi.mock('@/lib/env', () => ({
  isDatabaseConfigured: () => true,
  isEmailConfigured: () => false,
  getAppUrl: () => 'http://localhost:3002',
}));

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(),
}));

vi.mock('@/lib/email/templates/verify-email', () => ({
  verifyEmail: vi.fn(() => '<html />'),
  verifyEmailText: vi.fn(() => 'plain'),
}));

function reset() {
  dbState.tokens = [];
  dbState.transactionInvoked = false;
  dbState.txUpdates = [];
  dbState.txDeletes = [];
  vi.clearAllMocks();
}

describe('verifyEmailToken', () => {
  beforeEach(reset);

  it('returns invalid on empty / missing token', async () => {
    const { verifyEmailToken } = await import('@/lib/auth/email-verification');
    expect(await verifyEmailToken('')).toEqual({ ok: false, reason: 'invalid' });
    // @ts-expect-error — intentional misuse
    expect(await verifyEmailToken(undefined)).toEqual({ ok: false, reason: 'invalid' });
  });

  it('returns invalid when no row matches the hash', async () => {
    dbState.tokens = []; // empty store
    const { verifyEmailToken } = await import('@/lib/auth/email-verification');
    const result = await verifyEmailToken('random-token-that-does-not-exist');
    expect(result.ok).toBe(false);
  });

  it('verifies + consumes a valid token (calls transaction)', async () => {
    const { generateVerificationToken, verifyEmailToken } =
      await import('@/lib/auth/email-verification');
    const { token, hash } = generateVerificationToken();
    dbState.tokens = [
      {
        userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        tokenHash: hash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    ];

    const result = await verifyEmailToken(token);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.userId).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    }
    expect(dbState.transactionInvoked).toBe(true);
    expect(dbState.txUpdates).toHaveLength(1);
    expect(dbState.txDeletes).toHaveLength(1);
    const userUpdate = dbState.txUpdates[0].set as { emailVerified: Date };
    expect(userUpdate.emailVerified).toBeInstanceOf(Date);
  });

  it('returns invalid when the token has expired (mocked filter excludes it)', async () => {
    // Our mock select filters expiresAt > now() implicitly — set a past
    // expiry and verify the helper interprets the empty result as invalid.
    const { generateVerificationToken, verifyEmailToken } =
      await import('@/lib/auth/email-verification');
    const { token, hash } = generateVerificationToken();
    dbState.tokens = [
      {
        userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        tokenHash: hash,
        expiresAt: new Date(Date.now() - 1000), // already expired
      },
    ];

    const result = await verifyEmailToken(token);
    expect(result.ok).toBe(false);
    expect(dbState.transactionInvoked).toBe(false);
  });
});

// ─── sendVerificationEmail ────────────────────────────────────────────────

describe('sendVerificationEmail', () => {
  beforeEach(reset);

  it('persists a token and short-circuits ok when email is unconfigured (dev path)', async () => {
    const { sendVerificationEmail } = await import('@/lib/auth/email-verification');
    const result = await sendVerificationEmail(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'alice@example.com'
    );
    expect(result.ok).toBe(true);
    // 1 insert into emailVerificationTokens.
    expect(dbState.tokens).toHaveLength(1);
    expect(dbState.tokens[0].userId).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  });
});

// ─── generateVerificationToken ────────────────────────────────────────────

describe('generateVerificationToken', () => {
  it('produces a base64url token + its sha-256 hex hash', async () => {
    const { generateVerificationToken } = await import('@/lib/auth/email-verification');
    const { token, hash } = generateVerificationToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/); // base64url alphabet
    expect(hash).toMatch(/^[0-9a-f]{64}$/); // sha-256 hex
  });

  it('produces a different token + hash on every call', async () => {
    const { generateVerificationToken } = await import('@/lib/auth/email-verification');
    const a = generateVerificationToken();
    const b = generateVerificationToken();
    expect(a.token).not.toBe(b.token);
    expect(a.hash).not.toBe(b.hash);
  });
});
