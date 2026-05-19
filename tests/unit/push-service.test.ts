/**
 * Push Notification Service — Unit Tests
 *
 * Tests for lib/notifications/push.ts
 *
 * @see NOTIF-006
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

const mockSendNotification = vi.fn();

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: (...args: unknown[]) => mockSendNotification(...args),
  },
}));

const mockIsPushConfigured = vi.fn();
const mockGetVapidConfig = vi.fn();

vi.mock('@/lib/env', () => ({
  isPushConfigured: () => mockIsPushConfigured(),
  getVapidConfig: () => mockGetVapidConfig(),
}));

// ── DB Mock ──────────────────────────────────────────────────────────────────

const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDeleteFn = vi.fn();

/**
 * Creates a chainable mock that resolves to `result` at the end of the chain.
 * Supports .from(), .where(), .limit(), .set(), .values(), .returning()
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
  // Make thenable so `const [row] = await db.select()...` works
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
    update: (...args: unknown[]) => mockUpdate(...args),
    delete: (...args: unknown[]) => mockDeleteFn(...args),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  pushSubscriptions: {
    id: 'id',
    userId: 'user_id',
    endpoint: 'endpoint',
    keys: 'keys',
    userAgent: 'user_agent',
    createdAt: 'created_at',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ type: 'eq', a, b }),
  and: (...args: unknown[]) => ({ type: 'and', args }),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// Import after mocks
// ─────────────────────────────────────────────────────────────────────────────

import { sendPush, subscribePush, unsubscribePush } from '@/lib/notifications/push';

// ─────────────────────────────────────────────────────────────────────────────
// Test Data
// ─────────────────────────────────────────────────────────────────────────────

const FAKE_SUBS = [
  {
    id: 'sub-1',
    userId: 'user-1',
    endpoint: 'https://push.example.com/sub1',
    keys: { p256dh: 'key1-p256dh', auth: 'key1-auth' },
    userAgent: 'Mozilla/5.0',
    createdAt: new Date(),
  },
  {
    id: 'sub-2',
    userId: 'user-1',
    endpoint: 'https://push.example.com/sub2',
    keys: { p256dh: 'key2-p256dh', auth: 'key2-auth' },
    userAgent: null,
    createdAt: new Date(),
  },
];

const VAPID_CONFIG = {
  publicKey: 'test-public-key',
  privateKey: 'test-private-key',
  subject: 'mailto:test@example.com',
};

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Push Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPushConfigured.mockReturnValue(true);
    mockGetVapidConfig.mockReturnValue(VAPID_CONFIG);
  });

  // ── sendPush ─────────────────────────────────────────────────────────────

  describe('sendPush', () => {
    it('sends to all user subscriptions', async () => {
      mockSelect.mockReturnValue(createChain(FAKE_SUBS));
      mockSendNotification.mockResolvedValue({});

      await sendPush({
        userId: 'user-1',
        title: 'Test',
        body: 'Hello push',
      });

      // Should call web-push for each subscription
      expect(mockSendNotification).toHaveBeenCalledTimes(2);

      // Verify first call payload
      expect(mockSendNotification).toHaveBeenCalledWith(
        { endpoint: FAKE_SUBS[0].endpoint, keys: FAKE_SUBS[0].keys },
        expect.stringContaining('"title":"Test"')
      );

      // Verify second call payload
      expect(mockSendNotification).toHaveBeenCalledWith(
        { endpoint: FAKE_SUBS[1].endpoint, keys: FAKE_SUBS[1].keys },
        expect.stringContaining('"body":"Hello push"')
      );
    });

    it('is no-op when VAPID is not configured', async () => {
      mockIsPushConfigured.mockReturnValue(false);

      await sendPush({
        userId: 'user-1',
        title: 'Test',
        body: 'Body',
      });

      // Should not query DB or send
      expect(mockSelect).not.toHaveBeenCalled();
      expect(mockSendNotification).not.toHaveBeenCalled();
    });

    it('auto-deletes subscriptions that return 410 Gone', async () => {
      mockSelect.mockReturnValue(createChain([FAKE_SUBS[0]]));
      mockSendNotification.mockRejectedValue({ statusCode: 410 });

      const deleteChain = createChain();
      mockDeleteFn.mockReturnValue(deleteChain);

      await sendPush({
        userId: 'user-1',
        title: 'Test',
        body: 'Body',
      });

      // Should call delete for the expired subscription
      expect(mockDeleteFn).toHaveBeenCalled();
    });

    it('auto-deletes subscriptions that return 404', async () => {
      mockSelect.mockReturnValue(createChain([FAKE_SUBS[0]]));
      mockSendNotification.mockRejectedValue({ statusCode: 404 });

      const deleteChain = createChain();
      mockDeleteFn.mockReturnValue(deleteChain);

      await sendPush({
        userId: 'user-1',
        title: 'Test',
        body: 'Body',
      });

      expect(mockDeleteFn).toHaveBeenCalled();
    });

    it('does not delete on other errors', async () => {
      mockSelect.mockReturnValue(createChain([FAKE_SUBS[0]]));
      mockSendNotification.mockRejectedValue({ statusCode: 500 });

      await sendPush({
        userId: 'user-1',
        title: 'Test',
        body: 'Body',
      });

      expect(mockDeleteFn).not.toHaveBeenCalled();
    });

    it('does nothing when user has no subscriptions', async () => {
      mockSelect.mockReturnValue(createChain([]));

      await sendPush({
        userId: 'user-1',
        title: 'Test',
        body: 'Body',
      });

      expect(mockSendNotification).not.toHaveBeenCalled();
    });

    it('includes url and icon in payload when provided', async () => {
      mockSelect.mockReturnValue(createChain([FAKE_SUBS[0]]));
      mockSendNotification.mockResolvedValue({});

      await sendPush({
        userId: 'user-1',
        title: 'Test',
        body: 'Body',
        url: '/documents/123',
        icon: '/icon.png',
      });

      const payloadStr = mockSendNotification.mock.calls[0][1] as string;
      const payload = JSON.parse(payloadStr);
      expect(payload.url).toBe('/documents/123');
      expect(payload.icon).toBe('/icon.png');
    });
  });

  // ── subscribePush ────────────────────────────────────────────────────────

  describe('subscribePush', () => {
    it('inserts new subscription when endpoint does not exist', async () => {
      // Select returns empty (no existing)
      mockSelect.mockReturnValue(createChain([]));

      const insertChain = createChain();
      mockInsert.mockReturnValue(insertChain);

      await subscribePush('user-1', {
        endpoint: 'https://push.example.com/new',
        keys: { p256dh: 'new-p256dh', auth: 'new-auth' },
      });

      expect(mockInsert).toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('updates existing subscription when endpoint already exists', async () => {
      // Select returns existing subscription
      mockSelect.mockReturnValue(createChain([{ id: 'existing-id' }]));

      const updateChain = createChain();
      mockUpdate.mockReturnValue(updateChain);

      await subscribePush(
        'user-1',
        {
          endpoint: 'https://push.example.com/existing',
          keys: { p256dh: 'updated-p256dh', auth: 'updated-auth' },
        },
        'Mozilla/5.0'
      );

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockInsert).not.toHaveBeenCalled();
    });
  });

  // ── unsubscribePush ──────────────────────────────────────────────────────

  describe('unsubscribePush', () => {
    it('deletes subscription by userId and endpoint', async () => {
      const deleteChain = createChain();
      mockDeleteFn.mockReturnValue(deleteChain);

      await unsubscribePush('user-1', 'https://push.example.com/sub1');

      expect(mockDeleteFn).toHaveBeenCalled();
    });
  });
});
