/**
 * Silence-detection cron (OPS-3) — ISSUE-087.
 *
 * Runs daily. Identifies users who haven't been active for 3+ days,
 * sends a single gentle re-entry push ("Acá cuando quieras."), and
 * stamps `silence_re_entry_sent_at` so we don't re-send. The stamp
 * gets cleared elsewhere (in the next user-action hook) so a future
 * silence period re-fires.
 *
 * Anti-spam: goes through `enqueueAndSend` so OPS-1/OPS-2 still gate.
 *
 * Linked: OPS-3, FT-087, US-100.
 */

import { and, eq, isNull, lt } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema/users';
import { enqueueAndSend } from '@/lib/notifications/proactive';
import { getInngest } from '../client';

const SILENCE_DAYS = 3;

interface StepLike {
  run<T>(id: string, fn: () => Promise<T> | T): Promise<T>;
}
interface LoggerLike {
  info: (msg: string, ...rest: unknown[]) => void;
  error: (msg: string, ...rest: unknown[]) => void;
}

export async function runSilenceDetection({
  step,
  logger,
  now = new Date(),
}: {
  step: StepLike;
  logger: LoggerLike;
  now?: Date;
}): Promise<{ users: number; sent: number; skipped: number }> {
  const threshold = new Date(now.getTime() - SILENCE_DAYS * 24 * 60 * 60 * 1000);

  const candidates = await step.run('list-silent-users', async () => {
    return db
      .select({ id: users.id, preferredLanguage: users.preferredLanguage })
      .from(users)
      .where(
        and(
          lt(users.lastActiveAt, threshold),
          isNull(users.silenceReEntrySentAt),
          isNull(users.deletedAt)
        )
      );
  });

  if (candidates.length === 0) {
    logger.info('[silence.detection] no silent users');
    return { users: 0, sent: 0, skipped: 0 };
  }

  let sent = 0;
  let skipped = 0;
  for (const u of candidates) {
    const lang = u.preferredLanguage === 'en' ? 'en' : 'es';
    const result = await step.run(`silence-${u.id}`, async () => {
      const r = await enqueueAndSend({
        userId: u.id,
        type: 'silence_re_entry',
        title: lang === 'en' ? "I'm here when you want" : 'Acá cuando quieras',
        body: lang === 'en' ? '' : '',
        url: '/today',
        now,
      });
      if (r.status === 'sent') {
        await db.update(users).set({ silenceReEntrySentAt: now }).where(eq(users.id, u.id));
      }
      return r;
    });
    if (result.status === 'sent') sent++;
    else skipped++;
  }

  logger.info(
    `[silence.detection] candidates=${candidates.length} sent=${sent} skipped=${skipped}`
  );
  return { users: candidates.length, sent, skipped };
}

export const silenceDetection = getInngest().createFunction(
  { id: 'silence-detection-daily', triggers: [{ cron: '0 13 * * *' }] },
  runSilenceDetection
);
