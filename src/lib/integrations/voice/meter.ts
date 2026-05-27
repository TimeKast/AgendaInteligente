/**
 * Voice/Whisper usage meter — ISSUE-072 (OPS-9).
 *
 * Bumps `usage_meters.whisper_seconds_count` + `voice_minutes_count`
 * for the current monthly period. Mirrors the `recordTokens` shape
 * but operates on the voice meters.
 *
 * Linked: OPS-9, BR-13.
 */

import { sql } from 'drizzle-orm';
import { usageMeters } from '@/lib/db/schema/billing';
import { scopedDb } from '@/lib/db/scoped';
import { currentPeriodStart } from '@/lib/ai/telemetry';

export async function recordVoiceUsage(
  userId: string,
  durationSeconds: number,
  options: { now?: Date } = {}
): Promise<void> {
  if (durationSeconds <= 0) return;
  const periodStart = currentPeriodStart(options.now ?? new Date());
  const sdb = scopedDb(userId);

  const minutesDecimal = (durationSeconds / 60).toFixed(2);

  await (
    sdb.insert('usageMeters', {
      periodStart,
      whisperSecondsCount: durationSeconds,
      voiceMinutesCount: minutesDecimal,
    }) as unknown as {
      onConflictDoUpdate: (opts: { target: unknown[]; set: Record<string, unknown> }) => {
        execute: () => Promise<unknown>;
      };
    }
  )
    .onConflictDoUpdate({
      target: [usageMeters.userId, usageMeters.periodStart],
      set: {
        whisperSecondsCount: sql`${usageMeters.whisperSecondsCount} + ${durationSeconds}`,
        voiceMinutesCount: sql`${usageMeters.voiceMinutesCount} + ${minutesDecimal}::numeric`,
      },
    })
    .execute();
}
