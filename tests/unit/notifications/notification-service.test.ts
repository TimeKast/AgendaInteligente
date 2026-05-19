/**
 * Notification Service — Unit Tests
 *
 * Tests for lib/notifications/service.ts
 *
 * @see NOTIF-018
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockDeleteFn = vi.fn();

/**
 * Creates a chainable mock that resolves to `result` at the end of the chain.
 * Supports .from(), .where(), .limit(), .set(), .values(), .returning(), .orderBy(), .offset()
 */
function createChain(result: unknown = []) {
  const chain: Record<string, unknown> = {};
  const resolve = () => Promise.resolve(result);

  chain.from = vi.fn(() => chain);
  chain.where = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.set = vi.fn(() => chain);
  chain.values = vi.fn(() => chain);
  chain.returning = vi.fn(() => resolve());
  chain.orderBy = vi.fn(() => chain);
  chain.offset = vi.fn(() => chain);
  // Make thenable
  chain.then = (
    onFulfilled?: (value: unknown) => unknown,
    onRejected?: (reason: unknown) => unknown
  ) => resolve().then(onFulfilled, onRejected);

  return chain;
}

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => mockInsert(...args),
    delete: (...args: unknown[]) => mockDeleteFn(...args),
  },
}));

vi.mock('@/lib/db/schema/notifications', () => ({
  notifications: {
    id: 'id',
    userId: 'user_id',
    title: 'title',
    body: 'body',
    type: 'type',
    category: 'category',
    url: 'url',
    channels: 'channels',
    read: 'read',
    expiresAt: 'expires_at',
    metadata: 'metadata',
    createdAt: 'created_at',
  },
  notificationPreferences: {
    userId: 'user_id',
    category: 'category',
    channel: 'channel',
    enabled: 'enabled',
  },
}));

vi.mock('@/lib/db/schema', () => ({
  users: {
    id: 'id',
    email: 'email',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ type: 'eq', a, b }),
  and: (...args: unknown[]) => ({ type: 'and', args }),
  or: (...args: unknown[]) => ({ type: 'or', args }),
  desc: (col: unknown) => ({ type: 'desc', col }),
  sql: (strings: TemplateStringsArray) => ({ type: 'sql', value: strings[0] }),
  inArray: (col: unknown, vals: unknown[]) => ({ type: 'inArray', col, vals }),
  lt: (a: unknown, b: unknown) => ({ type: 'lt', a, b }),
  isNotNull: (col: unknown) => ({ type: 'isNotNull', col }),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

const mockSendEmail = vi.fn();
vi.mock('@/lib/email', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
  isEmailReady: () => true,
  notificationEmail: (opts: { title: string; body: string }) => ({
    subject: `Notificación: ${opts.title}`,
    html: `<p>${opts.body}</p>`,
  }),
}));

const mockSendPush = vi.fn();
vi.mock('@/lib/notifications/push', () => ({
  sendPush: (...args: unknown[]) => mockSendPush(...args),
}));

vi.mock('@/lib/env', () => ({
  isPushConfigured: () => true,
  getAppUrl: () => 'http://localhost:3000',
  getEnv: (key: string) => {
    const envMap: Record<string, string> = {
      APP_NAME: 'Test App',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    };
    return envMap[key] ?? '';
  },
}));

vi.mock('@/config/notifications', async () => {
  const actual =
    await vi.importActual<typeof import('@/config/notifications')>('@/config/notifications');
  return actual;
});

// ─────────────────────────────────────────────────────────────────────────────
// Import after mocks
// ─────────────────────────────────────────────────────────────────────────────

import { notify, notifyMany } from '@/lib/notifications/service';

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Notification Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Helper: sets up standard mock chain for a single notify() call.
   *
   * Execution order in service.ts:
   *   1. resolveChannels()    → db.select().from(notificationPreferences)
   *   2. db.insert()          → insert notification
   *   3. dispatchToChannels() → db.select().from(users) [if email channel]
   *   4. cleanupForUser()     → db.select({ count })
   *   5. cleanupExpired()     → db.delete()
   */
  function setupNotifyMocks(opts: {
    notifId: string;
    userEmail?: string;
    prefs?: { channel: string; enabled: boolean }[];
    count?: number;
  }) {
    const { notifId, userEmail, prefs = [], count = 0 } = opts;

    // 1. resolveChannels → preferences query
    const prefsChain = createChain(prefs);
    mockSelect.mockReturnValueOnce(prefsChain);

    // 2. insert notification
    const insertChain = createChain([{ id: notifId }]);
    mockInsert.mockReturnValueOnce(insertChain);

    // 3. dispatchToChannels → user email lookup (only if email channel)
    if (userEmail) {
      const userChain = createChain([{ email: userEmail }]);
      mockSelect.mockReturnValueOnce(userChain);
    }

    // 4. cleanupForUser → count query
    const countChain = createChain([{ count }]);
    mockSelect.mockReturnValueOnce(countChain);

    // 5. cleanupExpired → delete
    const deleteChain = createChain();
    mockDeleteFn.mockReturnValue(deleteChain);
  }

  // ── notify() ───────────────────────────────────────────────────────────

  describe('notify()', () => {
    it('creates a notification record in the database', async () => {
      setupNotifyMocks({ notifId: 'notif-1' });

      const result = await notify({
        userId: 'user-1',
        title: 'Test notification',
        body: 'This is a test',
        type: 'info',
        category: 'system',
        channels: ['in_app'],
      });

      expect(result.id).toBe('notif-1');
      expect(result.channels).toBeDefined();
      expect(mockInsert).toHaveBeenCalled();
    });

    it('returns channels in result', async () => {
      setupNotifyMocks({ notifId: 'notif-2', userEmail: 'test@example.com' });

      const result = await notify({
        userId: 'user-1',
        title: 'Test',
        body: 'Body',
        type: 'warning',
        category: 'security',
        channels: ['in_app', 'email'],
      });

      expect(result.id).toBe('notif-2');
      // Security is locked, so in_app should always be included
      expect(result.channels).toContain('in_app');
    });

    it('dispatches email when email channel is enabled', async () => {
      setupNotifyMocks({ notifId: 'notif-3', userEmail: 'user@company.com' });
      mockSendEmail.mockResolvedValue(undefined);

      await notify({
        userId: 'user-1',
        title: 'Email test',
        body: 'Should send email',
        type: 'info',
        category: 'security',
        channels: ['in_app', 'email'],
      });

      expect(mockSendEmail).toHaveBeenCalled();
    });

    it('dispatches push when push channel is enabled', async () => {
      setupNotifyMocks({ notifId: 'notif-4' });
      mockSendPush.mockResolvedValue(undefined);

      await notify({
        userId: 'user-1',
        title: 'Push test',
        body: 'Should send push',
        type: 'info',
        category: 'security',
        channels: ['in_app', 'push'],
      });

      expect(mockSendPush).toHaveBeenCalled();
    });
  });

  // ── resolveChannels (via notify result.channels) ───────────────────────

  describe('channel resolution — defaultChannels as initial-ON, user prefs override', () => {
    it('falls back to defaultChannels when user has no stored prefs', async () => {
      // category 'general' has defaultChannels: ['in_app']
      setupNotifyMocks({ notifId: 'r-1', prefs: [] });

      const result = await notify({
        userId: 'user-1',
        title: 'Default test',
        body: 'No prefs stored',
        type: 'info',
        category: 'general',
        // no channels override
      });

      expect(result.channels).toEqual(['in_app']);
    });

    it('user pref push=true delivers push even when defaults exclude it', async () => {
      // Regression: previously inert (defaults gated push out). Now: prefs override.
      setupNotifyMocks({
        notifId: 'r-2',
        prefs: [{ channel: 'push', enabled: true }],
      });
      mockSendPush.mockResolvedValue(undefined);

      const result = await notify({
        userId: 'user-1',
        title: 'Push opt-in',
        body: 'User activated push manually',
        type: 'info',
        category: 'general',
      });

      expect(result.channels).toContain('push');
      expect(mockSendPush).toHaveBeenCalled();
    });

    it('user pref disables a channel that was ON by default', async () => {
      // Override path: caller asks ['in_app', 'email'] but user opted out of email.
      // dispatchToChannels won't reach the user-email lookup because email gets
      // filtered before dispatch — so we DON'T provide userEmail in the mock helper.
      setupNotifyMocks({
        notifId: 'r-3',
        prefs: [{ channel: 'email', enabled: false }],
      });

      const result = await notify({
        userId: 'user-1',
        title: 'Opt-out test',
        body: 'User disabled email',
        type: 'info',
        category: 'general',
        channels: ['in_app', 'email'],
      });

      expect(result.channels).not.toContain('email');
      expect(result.channels).toContain('in_app');
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('in_app is always delivered, ignoring user opt-out', async () => {
      setupNotifyMocks({
        notifId: 'r-4',
        prefs: [{ channel: 'in_app', enabled: false }],
      });

      const result = await notify({
        userId: 'user-1',
        title: 'in_app forced',
        body: 'Cannot opt out of in_app',
        type: 'info',
        category: 'general',
      });

      expect(result.channels).toContain('in_app');
    });

    it('explicit channels override bypasses defaults but still respects opt-out', async () => {
      setupNotifyMocks({
        notifId: 'r-5',
        prefs: [{ channel: 'push', enabled: false }],
      });

      const result = await notify({
        userId: 'user-1',
        title: 'Override + opt-out',
        body: 'Caller asks push, user said no',
        type: 'info',
        category: 'general',
        channels: ['in_app', 'push'],
      });

      expect(result.channels).not.toContain('push');
      expect(result.channels).toContain('in_app');
      expect(mockSendPush).not.toHaveBeenCalled();
    });
  });

  // ── notifyMany() ───────────────────────────────────────────────────────

  describe('notifyMany()', () => {
    it('creates notifications for multiple users', async () => {
      // Setup mocks for user-1
      setupNotifyMocks({ notifId: 'notif-a' });
      // Setup mocks for user-2
      setupNotifyMocks({ notifId: 'notif-b' });

      const results = await notifyMany({
        userIds: ['user-1', 'user-2'],
        title: 'Batch test',
        body: 'Sent to many',
        type: 'info',
        category: 'system',
      });

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('notif-a');
      expect(results[1].id).toBe('notif-b');
    });

    it('continues on failure for individual users', async () => {
      // First user: resolveChannels succeeds but insert fails
      const prefsChain1 = createChain([]);
      mockSelect.mockReturnValueOnce(prefsChain1);
      mockInsert.mockImplementationOnce(() => {
        throw new Error('DB error');
      });

      // Second user succeeds
      setupNotifyMocks({ notifId: 'notif-ok' });

      const results = await notifyMany({
        userIds: ['user-fail', 'user-ok'],
        title: 'Partial test',
        body: 'Some fail',
        type: 'info',
        category: 'system',
      });

      // Only 1 succeeded
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('notif-ok');
    });
  });
});
