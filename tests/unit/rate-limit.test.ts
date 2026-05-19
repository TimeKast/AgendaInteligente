/**
 * Rate Limit Tests — KIT-020
 *
 * Coverage:
 * - RATE_LIMIT_ENABLED=false bypass
 * - Decision tree (`getRateLimitMode`): Upstash > Postgres(prod) > Memory(dev)
 * - In-memory backend: counter increment + window expiry
 * - Postgres backend: SQL shape (atomic UPSERT with CASE WHEN), type normalization,
 *   cleanup failure isolation
 * - Bucket configs (`auth`, `register`, `inviteToken`)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mocks (hoisted) ──────────────────────────────────────────────────────────

const mockExecute = vi.fn();
const mockLoggerWarn = vi.fn();

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    execute: (...args: unknown[]) => mockExecute(...args),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: (...args: unknown[]) => mockLoggerWarn(...args),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Save originals to restore between tests (the test bumps RATE_LIMIT_*, UPSTASH_*, DATABASE_URL).
// NODE_ENV uses vi.stubEnv (read-only at the type level) and is restored via vi.unstubAllEnvs.
const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

// ─── 1. RATE_LIMIT_ENABLED=false bypass ───────────────────────────────────────

describe('RATE_LIMIT_ENABLED flag', () => {
  it('bypasses entirely when explicitly disabled', async () => {
    process.env.RATE_LIMIT_ENABLED = 'false';
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    vi.resetModules();
    const { checkRateLimit, getRateLimitMode } = await import('@/lib/rate-limit');

    expect(getRateLimitMode()).toBe('disabled');

    // 100 calls, all should succeed without touching DB or memory
    for (let i = 0; i < 100; i++) {
      const r = await checkRateLimit('1.2.3.4', 'auth');
      expect(r.success).toBe(true);
      expect(r.remaining).toBe(Number.POSITIVE_INFINITY);
    }

    expect(mockExecute).not.toHaveBeenCalled();
  });

  it('is enabled by default (no env var set)', async () => {
    delete process.env.RATE_LIMIT_ENABLED;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DATABASE_URL;
    vi.stubEnv('NODE_ENV', 'development');

    vi.resetModules();
    const { getRateLimitMode } = await import('@/lib/rate-limit');

    // Default ON → falls through to memory in dev
    expect(getRateLimitMode()).toBe('memory');
  });

  it('is enabled when set to anything other than "false"', async () => {
    process.env.RATE_LIMIT_ENABLED = 'true';
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DATABASE_URL;
    vi.stubEnv('NODE_ENV', 'development');

    vi.resetModules();
    const { getRateLimitMode } = await import('@/lib/rate-limit');

    expect(getRateLimitMode()).toBe('memory');
  });
});

// ─── 2. Decision tree ─────────────────────────────────────────────────────────

describe('getRateLimitMode — decision tree', () => {
  it('selects Upstash when configured (highest priority)', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    process.env.DATABASE_URL = 'postgres://db';
    vi.stubEnv('NODE_ENV', 'production');
    delete process.env.RATE_LIMIT_ENABLED;

    vi.resetModules();
    const { getRateLimitMode } = await import('@/lib/rate-limit');

    expect(getRateLimitMode()).toBe('upstash');
  });

  it('selects Postgres when DATABASE_URL set + production + no Upstash', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    process.env.DATABASE_URL = 'postgres://db';
    vi.stubEnv('NODE_ENV', 'production');
    delete process.env.RATE_LIMIT_ENABLED;

    vi.resetModules();
    const { getRateLimitMode } = await import('@/lib/rate-limit');

    expect(getRateLimitMode()).toBe('postgres');
  });

  it('falls back to memory in development (even with DATABASE_URL)', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    process.env.DATABASE_URL = 'postgres://db';
    vi.stubEnv('NODE_ENV', 'development');
    delete process.env.RATE_LIMIT_ENABLED;

    vi.resetModules();
    const { getRateLimitMode } = await import('@/lib/rate-limit');

    expect(getRateLimitMode()).toBe('memory');
  });

  it('falls back to memory when nothing is configured', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DATABASE_URL;
    vi.stubEnv('NODE_ENV', 'production');
    delete process.env.RATE_LIMIT_ENABLED;

    vi.resetModules();
    const { getRateLimitMode } = await import('@/lib/rate-limit');

    expect(getRateLimitMode()).toBe('memory');
  });

  it('disabled flag wins over backend selection', async () => {
    process.env.RATE_LIMIT_ENABLED = 'false';
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    process.env.DATABASE_URL = 'postgres://db';
    vi.stubEnv('NODE_ENV', 'production');

    vi.resetModules();
    const { getRateLimitMode } = await import('@/lib/rate-limit');

    expect(getRateLimitMode()).toBe('disabled');
  });
});

// ─── 3. In-memory backend (default dev) ───────────────────────────────────────

describe('memory backend (dev fallback)', () => {
  beforeEach(() => {
    delete process.env.RATE_LIMIT_ENABLED;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DATABASE_URL;
    vi.stubEnv('NODE_ENV', 'development');
    process.env.RATE_LIMIT_AUTH_REQUESTS = '3';
    process.env.RATE_LIMIT_AUTH_WINDOW_SECONDS = '60';
  });

  it('allows up to N requests then blocks', async () => {
    vi.resetModules();
    const { checkRateLimit } = await import('@/lib/rate-limit');

    const r1 = await checkRateLimit('ip-A', 'auth');
    const r2 = await checkRateLimit('ip-A', 'auth');
    const r3 = await checkRateLimit('ip-A', 'auth');
    const r4 = await checkRateLimit('ip-A', 'auth');

    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
    expect(r3.success).toBe(true);
    expect(r4.success).toBe(false);
    expect(r4.remaining).toBe(0);
  });

  it('isolates counters per identifier', async () => {
    vi.resetModules();
    const { checkRateLimit } = await import('@/lib/rate-limit');

    await checkRateLimit('ip-X', 'auth');
    await checkRateLimit('ip-X', 'auth');
    await checkRateLimit('ip-X', 'auth');
    const blocked = await checkRateLimit('ip-X', 'auth');
    const otherIp = await checkRateLimit('ip-Y', 'auth');

    expect(blocked.success).toBe(false);
    expect(otherIp.success).toBe(true);
  });
});

// ─── 4. Postgres backend (production fallback) ────────────────────────────────

describe('postgres backend', () => {
  beforeEach(() => {
    delete process.env.RATE_LIMIT_ENABLED;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    process.env.DATABASE_URL = 'postgres://db';
    vi.stubEnv('NODE_ENV', 'production');
    process.env.RATE_LIMIT_AUTH_REQUESTS = '10';
    process.env.RATE_LIMIT_AUTH_WINDOW_SECONDS = '60';

    // Default: UPSERT returns count=1 (first hit)
    mockExecute.mockResolvedValue({
      rows: [{ count: 1, reset_at: new Date(Date.now() + 60_000) }],
    });
  });

  it('issues a single atomic UPSERT with CASE WHEN reset_at <= now()', async () => {
    vi.resetModules();
    const { checkRateLimit } = await import('@/lib/rate-limit');

    await checkRateLimit('1.2.3.4', 'auth');

    // Single statement (no multi-query) → atomic by construction
    expect(mockExecute).toHaveBeenCalledTimes(1);

    // Drizzle `sql\`\`` template stores the literal text in `queryChunks`.
    // Inspect those chunks to assert the SQL shape without coupling to private API.
    const callArg = mockExecute.mock.calls[0][0] as { queryChunks?: unknown[] };
    expect(callArg).toHaveProperty('queryChunks');
    const literalText = (callArg.queryChunks ?? [])
      .map((chunk) =>
        typeof chunk === 'object' && chunk !== null && 'value' in chunk
          ? (chunk as { value: string[] }).value.join('')
          : ''
      )
      .join('');

    expect(literalText).toContain('INSERT INTO rate_limit_buckets');
    expect(literalText).toContain('ON CONFLICT (key) DO UPDATE SET');
    expect(literalText).toContain('CASE');
    expect(literalText).toContain('reset_at <= now()');
    expect(literalText).toContain('RETURNING count, reset_at');
  });

  it('returns success=true when count is within limit', async () => {
    mockExecute.mockResolvedValueOnce({
      rows: [{ count: 5, reset_at: new Date(Date.now() + 60_000) }],
    });

    vi.resetModules();
    const { checkRateLimit } = await import('@/lib/rate-limit');

    const r = await checkRateLimit('1.2.3.4', 'auth');
    expect(r.success).toBe(true);
    expect(r.remaining).toBe(5); // limit=10, count=5 → remaining=5
  });

  it('returns success=false when count exceeds limit', async () => {
    mockExecute.mockResolvedValueOnce({
      rows: [{ count: 11, reset_at: new Date(Date.now() + 60_000) }],
    });

    vi.resetModules();
    const { checkRateLimit } = await import('@/lib/rate-limit');

    const r = await checkRateLimit('1.2.3.4', 'auth');
    expect(r.success).toBe(false);
    expect(r.remaining).toBe(0);
  });

  it('normalizes string types from drivers (count + reset_at as strings)', async () => {
    const futureMs = Date.now() + 60_000;
    mockExecute.mockResolvedValueOnce({
      rows: [{ count: '7', reset_at: new Date(futureMs).toISOString() }],
    });

    vi.resetModules();
    const { checkRateLimit } = await import('@/lib/rate-limit');

    const r = await checkRateLimit('1.2.3.4', 'auth');
    expect(r.success).toBe(true);
    expect(r.remaining).toBe(3); // limit=10, count=7 → remaining=3
    expect(r.reset).toBe(Math.floor(futureMs / 1000));
  });

  it('cleanup failure does not affect rate-limit decision', async () => {
    // Force cleanup branch
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.001); // < 0.01

    mockExecute
      // First call: the UPSERT succeeds
      .mockResolvedValueOnce({
        rows: [{ count: 2, reset_at: new Date(Date.now() + 60_000) }],
      })
      // Second call: the cleanup DELETE fails
      .mockRejectedValueOnce(new Error('cleanup boom'));

    vi.resetModules();
    const { checkRateLimit } = await import('@/lib/rate-limit');

    const r = await checkRateLimit('1.2.3.4', 'auth');

    // Decision is still valid
    expect(r.success).toBe(true);
    expect(r.remaining).toBe(8); // limit=10, count=2

    // And the failure was logged but not thrown
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      '[rate-limit] cleanup failed, skipping',
      expect.objectContaining({ error: expect.any(Error) })
    );

    randomSpy.mockRestore();
  });

  it('skips cleanup when random >= 0.01', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

    vi.resetModules();
    const { checkRateLimit } = await import('@/lib/rate-limit');

    await checkRateLimit('1.2.3.4', 'auth');

    // Only the UPSERT, no cleanup
    expect(mockExecute).toHaveBeenCalledTimes(1);

    randomSpy.mockRestore();
  });
});

// ─── 5. Bucket configs ────────────────────────────────────────────────────────

describe('LIMITS bucket configs', () => {
  it('exposes register bucket (3/h)', async () => {
    process.env.RATE_LIMIT_REGISTER_REQUESTS = '3';
    process.env.RATE_LIMIT_REGISTER_WINDOW_SECONDS = '3600';
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DATABASE_URL;
    vi.stubEnv('NODE_ENV', 'development');

    vi.resetModules();
    const { checkRateLimit } = await import('@/lib/rate-limit');

    const r = await checkRateLimit('1.2.3.4', 'register');
    expect(r.limit).toBe(3);
  });

  it('exposes inviteToken bucket (30/min)', async () => {
    process.env.RATE_LIMIT_INVITE_REQUESTS = '30';
    process.env.RATE_LIMIT_INVITE_WINDOW_SECONDS = '60';
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DATABASE_URL;
    vi.stubEnv('NODE_ENV', 'development');

    vi.resetModules();
    const { checkRateLimit } = await import('@/lib/rate-limit');

    const r = await checkRateLimit('1.2.3.4', 'inviteToken');
    expect(r.limit).toBe(30);
  });
});
