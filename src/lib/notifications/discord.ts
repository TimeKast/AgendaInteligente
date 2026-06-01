/**
 * Discord webhook sender for proactive notifications.
 *
 * Reads `notification_prefs.discord_webhook_url` for the user and
 * POSTs an embed-style message. Discord webhooks accept a JSON body
 * with `content` (free text) and `embeds[]` (rich cards).
 *
 * Safety:
 *   - No-op when the URL is unset (user hasn't configured Discord).
 *   - 5s timeout to avoid hanging the calling cron handler.
 *   - Errors logged but NEVER re-thrown — Discord being down should
 *     not break the agent's other channels (push, email).
 *
 * Linked: FT-085, AI-9 (contact_channels in users table).
 */

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { notificationPrefs } from '@/lib/db/schema/notification-prefs';
import { logger } from '@/lib/logger';
import { getAppUrl } from '@/lib/env';

const TIMEOUT_MS = 5000;

export interface DiscordPayload {
  /** Short message header — surfaces as the embed title. */
  title: string;
  /** Body text — embed description. */
  body: string;
  /** Optional app-relative URL (e.g. /chat?context=morning_check). */
  url?: string;
}

/**
 * Send a Discord webhook message for the user. No-op if the user
 * hasn't configured one. Returns whether the send was attempted.
 */
export async function sendDiscord(userId: string, payload: DiscordPayload): Promise<boolean> {
  const rows = await db
    .select({ discordWebhookUrl: notificationPrefs.discordWebhookUrl })
    .from(notificationPrefs)
    .where(eq(notificationPrefs.userId, userId));
  const url = rows[0]?.discordWebhookUrl;
  if (!url) return false;

  const absoluteUrl = payload.url ? `${getAppUrl()}${payload.url}` : undefined;

  const body = {
    embeds: [
      {
        title: payload.title,
        description: payload.body,
        url: absoluteUrl,
        // Warm-charcoal hex from the agenda palette — matches the brand.
        color: 0x2a2826,
      },
    ],
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      logger.warn(
        `[notifications.discord] webhook POST failed for userId=${userId} status=${res.status}`
      );
      return false;
    }
    return true;
  } catch (err) {
    logger.error(`[notifications.discord] webhook POST threw for userId=${userId}`, err);
    return false;
  } finally {
    clearTimeout(timer);
  }
}
