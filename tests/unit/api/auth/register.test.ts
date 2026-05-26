/**
 * Register Route Handler Tests — KIT-022
 *
 * Coverage:
 * - Gate (registration off / credentials off → 403)
 * - Rate limit (429)
 * - Body validation (Zod, 400)
 * - Email enumeration protection (existing email → 200 generic, no leak)
 * - Successful registration (insert + role + humanId)
 * - Retry pattern: 23505 users_human_id_unique → retry; users_email_unique → 200 generic
 * - DATABASE_URL missing → 503
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// ─── Mocks (hoisted) ──────────────────────────────────────────────────────────

const mockCheckRateLimit = vi.fn();
const mockGetClientIP = vi.fn(() => '1.2.3.4');
const mockRateLimitExceededResponse = vi.fn(() =>
  NextResponse.json({ error: 'rate-limited' }, { status: 429 })
);
const mockHashPassword = vi.fn();
const mockGetNextHumanId = vi.fn();
const mockIsDatabaseConfigured = vi.fn(() => true);
const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};

// Auth-features lookup table — overridden per test
let mockAuthFeatures = {
  features: { registration: true, passwordReset: true, emailVerification: false },
  providers: { credentials: true, email: false, google: false, github: false },
};

// Drizzle chainable mocks
const mockSelectChain = {
  from: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
};
const mockInsertChain = {
  values: vi.fn(),
  returning: vi.fn(),
};
const mockDb = {
  select: vi.fn(() => mockSelectChain),
  insert: vi.fn(() => mockInsertChain),
};

vi.mock('@/lib/db/drizzle', () => ({ db: mockDb }));
vi.mock('@/lib/db/schema', () => ({ users: { id: 'id', email: 'email' } }));
vi.mock('@/lib/auth/utils', () => ({
  hashPassword: (...args: unknown[]) => mockHashPassword(...args),
}));
vi.mock('@/lib/utils/human-id', () => ({
  getNextHumanId: (...args: unknown[]) => mockGetNextHumanId(...args),
  HUMAN_ID_PREFIXES: { USER: 'USR' },
}));
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: mockCheckRateLimit,
  getClientIP: mockGetClientIP,
  rateLimitExceededResponse: mockRateLimitExceededResponse,
}));
vi.mock('@/lib/env', () => ({
  isDatabaseConfigured: () => mockIsDatabaseConfigured(),
}));
vi.mock('@/lib/logger', () => ({ logger: mockLogger }));
vi.mock('@/config/auth-features', () => ({
  authFeatures: new Proxy(
    {},
    {
      get(_, key: string) {
        return mockAuthFeatures[key as keyof typeof mockAuthFeatures];
      },
    }
  ),
}));
vi.mock('@/config/roles', () => ({ getDefaultRole: () => 'user' }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildRequest(body: unknown): Request {
  return new Request('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function defaultBody(overrides: Partial<{ email: string; password: string; name: string }> = {}) {
  return {
    email: 'new@test.com',
    // ISSUE-004 added a weak-password blocklist; "password123" is now in it,
    // so the kit fixture upgrades to a passphrase that passes the validator.
    password: 'Strong-passphrase-2026!',
    name: 'Test User',
    ...overrides,
  };
}

function setSelectResult(rows: { id: string }[]) {
  // db.select().from(users).where(...).limit(1) — final await resolves to rows
  mockSelectChain.from.mockReturnValue(mockSelectChain);
  mockSelectChain.where.mockReturnValue(mockSelectChain);
  mockSelectChain.limit.mockResolvedValue(rows);
}

function setInsertSuccess(id = 'user-uuid-123') {
  mockInsertChain.values.mockReturnValue(mockInsertChain);
  mockInsertChain.returning.mockResolvedValue([{ id }]);
}

function setInsertError(error: {
  code?: string;
  constraint?: string;
  cause?: { code?: string; constraint?: string };
}) {
  mockInsertChain.values.mockReturnValue(mockInsertChain);
  mockInsertChain.returning.mockRejectedValue(error);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthFeatures = {
    features: { registration: true, passwordReset: true, emailVerification: false },
    providers: { credentials: true, email: false, google: false, github: false },
  };
  mockIsDatabaseConfigured.mockReturnValue(true);
  mockCheckRateLimit.mockResolvedValue({
    success: true,
    limit: 3,
    remaining: 2,
    reset: 0,
  });
  mockHashPassword.mockResolvedValue('hashed-pw');
  mockGetNextHumanId.mockResolvedValue('USR-0042');
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/auth/register — gates', () => {
  it('returns 403 when registration flag is off', async () => {
    mockAuthFeatures.features.registration = false;
    const { POST } = await import('@/app/api/auth/register/route');

    const res = await POST(buildRequest(defaultBody()));

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('RegistrationDisabled');
    expect(mockCheckRateLimit).not.toHaveBeenCalled();
  });

  it('returns 403 when credentials provider is off', async () => {
    mockAuthFeatures.providers.credentials = false;
    const { POST } = await import('@/app/api/auth/register/route');

    const res = await POST(buildRequest(defaultBody()));

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('RegistrationDisabled');
  });

  it('returns 503 when database is not configured', async () => {
    mockIsDatabaseConfigured.mockReturnValue(false);
    const { POST } = await import('@/app/api/auth/register/route');

    const res = await POST(buildRequest(defaultBody()));

    expect(res.status).toBe(503);
  });
});

describe('POST /api/auth/register — rate limit', () => {
  it('returns 429 when rate limit exceeded', async () => {
    mockCheckRateLimit.mockResolvedValue({
      success: false,
      limit: 3,
      remaining: 0,
      reset: 0,
    });
    const { POST } = await import('@/app/api/auth/register/route');

    const res = await POST(buildRequest(defaultBody()));

    expect(res.status).toBe(429);
    expect(mockRateLimitExceededResponse).toHaveBeenCalledTimes(1);
  });

  it('uses the `register` bucket', async () => {
    setSelectResult([]);
    setInsertSuccess();
    const { POST } = await import('@/app/api/auth/register/route');

    await POST(buildRequest(defaultBody()));

    expect(mockCheckRateLimit).toHaveBeenCalledWith('1.2.3.4', 'register');
  });
});

describe('POST /api/auth/register — body validation', () => {
  it('returns 400 for missing fields', async () => {
    const { POST } = await import('@/app/api/auth/register/route');

    const res = await POST(buildRequest({ email: 'a@b.com' }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('ValidationFailed');
  });

  it('returns 400 for password shorter than 8 chars', async () => {
    const { POST } = await import('@/app/api/auth/register/route');

    const res = await POST(buildRequest(defaultBody({ password: 'short' })));

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid email', async () => {
    const { POST } = await import('@/app/api/auth/register/route');

    const res = await POST(buildRequest(defaultBody({ email: 'not-an-email' })));

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid JSON body', async () => {
    const { POST } = await import('@/app/api/auth/register/route');

    const res = await POST(buildRequest('{ not json'));

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/register — secure-by-default enumeration', () => {
  it('returns 200 generic when email already exists (does NOT insert)', async () => {
    setSelectResult([{ id: 'existing-user-id' }]);
    const { POST } = await import('@/app/api/auth/register/route');

    const res = await POST(buildRequest(defaultBody({ email: 'existing@test.com' })));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true });
    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(mockHashPassword).not.toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('register attempt for existing email'),
      expect.objectContaining({ email: 'existing@test.com' })
    );
  });

  it('returns 200 generic on users_email_unique race (23505)', async () => {
    // SELECT did not find — but INSERT loses race against another concurrent
    // request that just inserted the same email
    setSelectResult([]);
    setInsertError({ code: '23505', constraint: 'users_email_unique' });
    const { POST } = await import('@/app/api/auth/register/route');

    const res = await POST(buildRequest(defaultBody({ email: 'race@test.com' })));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true });
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('race on users_email_unique'),
      expect.any(Object)
    );
  });
});

describe('POST /api/auth/register — happy path', () => {
  it('creates user with default role + USR humanId + hashed password', async () => {
    setSelectResult([]);
    setInsertSuccess('new-user-id');
    const { POST } = await import('@/app/api/auth/register/route');

    const res = await POST(
      buildRequest(defaultBody({ email: 'NEW@TEST.com', name: '  Spaced Name  ' }))
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true });

    // hashPassword was called with the plain password (defaultBody fixture)
    expect(mockHashPassword).toHaveBeenCalledWith('Strong-passphrase-2026!');

    // Inserted with normalized email (lowercase), trimmed name, default role, hashed pw, USR humanId
    expect(mockInsertChain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new@test.com',
        name: 'Spaced Name',
        role: 'user',
        password: 'hashed-pw',
        humanId: 'USR-0042',
      })
    );

    // Audit log
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('user registered'),
      expect.objectContaining({ userId: 'new-user-id' })
    );
  });
});

describe('POST /api/auth/register — humanId retry on 23505', () => {
  it('retries getNextHumanId when users_human_id_unique conflicts', async () => {
    setSelectResult([]);
    mockGetNextHumanId.mockResolvedValueOnce('USR-0001').mockResolvedValueOnce('USR-0002');

    // First insert fails with humanId collision, second succeeds
    mockInsertChain.values.mockReturnValue(mockInsertChain);
    mockInsertChain.returning
      .mockRejectedValueOnce({ code: '23505', constraint: 'users_human_id_unique' })
      .mockResolvedValueOnce([{ id: 'after-retry-id' }]);

    const { POST } = await import('@/app/api/auth/register/route');

    const res = await POST(buildRequest(defaultBody()));

    expect(res.status).toBe(200);
    expect(mockGetNextHumanId).toHaveBeenCalledTimes(2);
    expect(mockInsertChain.returning).toHaveBeenCalledTimes(2);
  });

  it('returns 500 after exhausting MAX_HUMAN_ID_RETRIES', async () => {
    setSelectResult([]);
    mockInsertChain.values.mockReturnValue(mockInsertChain);
    mockInsertChain.returning.mockRejectedValue({
      code: '23505',
      constraint: 'users_human_id_unique',
    });

    const { POST } = await import('@/app/api/auth/register/route');

    const res = await POST(buildRequest(defaultBody()));

    expect(res.status).toBe(500);
    expect(mockGetNextHumanId).toHaveBeenCalledTimes(5);
  });

  it('reads PG error from cause when wrapped by Drizzle', async () => {
    setSelectResult([]);
    mockGetNextHumanId.mockResolvedValueOnce('USR-A').mockResolvedValueOnce('USR-B');
    mockInsertChain.values.mockReturnValue(mockInsertChain);
    mockInsertChain.returning
      .mockRejectedValueOnce({
        // top-level lacks code/constraint; cause has them (Drizzle pattern)
        cause: { code: '23505', constraint: 'users_human_id_unique' },
      })
      .mockResolvedValueOnce([{ id: 'wrapped-ok' }]);

    const { POST } = await import('@/app/api/auth/register/route');

    const res = await POST(buildRequest(defaultBody()));

    expect(res.status).toBe(200);
    expect(mockGetNextHumanId).toHaveBeenCalledTimes(2);
  });
});

describe('POST /api/auth/register — unexpected errors', () => {
  it('returns 500 on non-23505 db errors', async () => {
    setSelectResult([]);
    setInsertError({ code: '42P01', constraint: undefined });
    const { POST } = await import('@/app/api/auth/register/route');

    const res = await POST(buildRequest(defaultBody()));

    expect(res.status).toBe(500);
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('insert failed'),
      expect.any(Object)
    );
  });
});
