/**
 * Proactive task enqueue + send — ISSUE-082 (OPS-1, OPS-2).
 *
 * `enqueueAndSend` is the single entry point for ALL agent-initiated
 * pushes. Routes called from check-in fan-outs, cron tasks, etc.,
 * delegate here so the anti-spam guarantees are centralized.
 *
 * Gate order (each writes its own status row for telemetry):
 *   1. OPS-1: ≥4 successful `sent` tasks in last 24h → cancelled_anti_spam.
 *   2. OPS-2: any pattern_challenge / risk_alert / project_kill_suggestion
 *      sent_at within last 7 days → cancelled_anti_spam (max 1/week).
 *   3. NotificationPref.muted_until > now → cancelled_muted.
 *   4. User.intensity_mode = 'listening' AND task is a challenge →
 *      cancelled_listening.
 *
 * On success: status = 'sent', sent_at = now, push delivered via the
 * kit's `sendPush` helper. Failures from `sendPush` are logged but
 * status stays 'sent' (the kit auto-removes 410-Gone subscriptions).
 *
 * Linked: OPS-1, OPS-2, FT-086, FT-087.
 */

import { and, count, eq, gt, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema/users';
import { notificationPrefs } from '@/lib/db/schema/notification-prefs';
import {
  proactiveTasks,
  CHALLENGE_TYPES,
  type ProactiveTaskType,
  type ProactiveTaskStatus,
} from '@/lib/db/schema/proactive-tasks';
import { sendPush } from '@/lib/notifications/push';
import { logger } from '@/lib/logger';

const ANTI_SPAM_24H_LIMIT = 4;
const CHALLENGE_WEEK_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const ANTI_SPAM_24H_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface EnqueueInput {
  userId: string;
  type: ProactiveTaskType;
  title: string;
  body: string;
  url?: string;
  payload?: Record<string, unknown>;
  /** Optional override for "now" — used in tests. */
  now?: Date;
}

export interface EnqueueResult {
  status: ProactiveTaskStatus;
  taskId: string;
  /** Reason string mirrored from `status` for human-readable logs. */
  reason?:
    | 'over_24h_limit'
    | 'challenge_within_week'
    | 'muted'
    | 'listening_skips_challenges'
    | 'ok';
}

/**
 * The single safe path to fire a proactive notification. Records the
 * decision atomically (one DB row per attempt, success or cancellation).
 */
export async function enqueueAndSend(input: EnqueueInput): Promise<EnqueueResult> {
  const now = input.now ?? new Date();

  // ── Gate 1: OPS-1 24h limit ──────────────────────────────────────
  const windowStart24 = new Date(now.getTime() - ANTI_SPAM_24H_WINDOW_MS);
  const sentCount = await db
    .select({ c: count() })
    .from(proactiveTasks)
    .where(
      and(
        eq(proactiveTasks.userId, input.userId),
        eq(proactiveTasks.status, 'sent'),
        gt(proactiveTasks.sentAt, windowStart24)
      )
    );
  if ((sentCount[0]?.c ?? 0) >= ANTI_SPAM_24H_LIMIT) {
    return await record(input, now, 'cancelled_anti_spam', 'over_24h_limit');
  }

  // ── Gate 2: OPS-2 weekly challenge limit ─────────────────────────
  if ((CHALLENGE_TYPES as readonly string[]).includes(input.type)) {
    const windowStart7 = new Date(now.getTime() - CHALLENGE_WEEK_WINDOW_MS);
    const recentChallenge = await db
      .select({ id: proactiveTasks.id })
      .from(proactiveTasks)
      .where(
        and(
          eq(proactiveTasks.userId, input.userId),
          eq(proactiveTasks.status, 'sent'),
          inArray(proactiveTasks.type, CHALLENGE_TYPES),
          gt(proactiveTasks.sentAt, windowStart7)
        )
      )
      .limit(1);
    if (recentChallenge.length > 0) {
      return await record(input, now, 'cancelled_anti_spam', 'challenge_within_week');
    }
  }

  // ── Gate 3 + 4: muted_until + listening grace ────────────────────
  // Single round-trip: read both the user's intensity mode AND
  // notification prefs in one query.
  const prefRows = await db
    .select({
      mutedUntil: notificationPrefs.mutedUntil,
      intensityMode: users.intensityMode,
    })
    .from(notificationPrefs)
    .innerJoin(users, eq(users.id, notificationPrefs.userId))
    .where(eq(notificationPrefs.userId, input.userId));
  const prefs = prefRows[0];

  if (prefs?.mutedUntil && prefs.mutedUntil > now) {
    return await record(input, now, 'cancelled_muted', 'muted');
  }

  if (
    prefs?.intensityMode === 'listening' &&
    (CHALLENGE_TYPES as readonly string[]).includes(input.type)
  ) {
    return await record(input, now, 'cancelled_listening', 'listening_skips_challenges');
  }

  // ── Send + record ────────────────────────────────────────────────
  const inserted = await db
    .insert(proactiveTasks)
    .values({
      userId: input.userId,
      type: input.type,
      scheduledFor: now,
      payload: input.payload ?? null,
      status: 'pending',
    })
    .returning({ id: proactiveTasks.id });
  const taskId = inserted[0].id;

  try {
    await sendPush({
      userId: input.userId,
      title: input.title,
      body: input.body,
      url: input.url,
    });
  } catch (err) {
    logger.error('[proactive.enqueueAndSend] sendPush threw', err);
    // We still mark as 'sent' — the kit's push helper handles per-
    // subscription failures internally and we don't want a transient
    // outage to mis-classify the attempt. Ops will see this in logs.
  }

  await db
    .update(proactiveTasks)
    .set({ status: 'sent', sentAt: now })
    .where(eq(proactiveTasks.id, taskId));

  return { status: 'sent', taskId, reason: 'ok' };
}

/** Internal: write the cancelled row in one shot. */
async function record(
  input: EnqueueInput,
  now: Date,
  status: ProactiveTaskStatus,
  reason: NonNullable<EnqueueResult['reason']>
): Promise<EnqueueResult> {
  const inserted = await db
    .insert(proactiveTasks)
    .values({
      userId: input.userId,
      type: input.type,
      scheduledFor: now,
      payload: input.payload ?? null,
      status,
    })
    .returning({ id: proactiveTasks.id });
  return { status, taskId: inserted[0].id, reason };
}

/**
 * Mark a proactive task as `responded` when the user opens its deep
 * link. Idempotent: re-marking on an already-responded row is a no-op.
 */
export async function markResponded(taskId: string, options: { now?: Date } = {}): Promise<void> {
  const now = options.now ?? new Date();
  await db
    .update(proactiveTasks)
    .set({ status: 'responded', respondedAt: now })
    .where(and(eq(proactiveTasks.id, taskId), eq(proactiveTasks.status, 'sent')));
}
