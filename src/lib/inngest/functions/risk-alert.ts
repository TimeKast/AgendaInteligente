/**
 * Risk-alert daily cron — ISSUE-087.
 *
 * Finds activities with a deadline within the next 7 days that have
 * NEVER been scheduled (no scheduled_dates). Notifies the user so they
 * can move them onto the calendar before missing the deadline.
 *
 * Idempotency per (activity, deadline): we skip activities that
 * already received a risk_alert task — payload->>'activity_id' check.
 * That keeps re-firing to ONCE per deadline window, even though the
 * cron runs daily.
 *
 * Linked: FT-101, US-101.
 */

import { and, eq, gte, isNull, lte, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { activities } from '@/lib/db/schema/activities';
import { proactiveTasks } from '@/lib/db/schema/proactive-tasks';
import { enqueueAndSend } from '@/lib/notifications/proactive';
import { getInngest } from '../client';

const HORIZON_DAYS = 7;

interface StepLike {
  run<T>(id: string, fn: () => Promise<T> | T): Promise<T>;
}
interface LoggerLike {
  info: (msg: string, ...rest: unknown[]) => void;
  error: (msg: string, ...rest: unknown[]) => void;
}

export async function runRiskAlert({
  step,
  logger,
  now = new Date(),
}: {
  step: StepLike;
  logger: LoggerLike;
  now?: Date;
}): Promise<{ activities: number; sent: number; skipped: number }> {
  const horizon = new Date(now.getTime() + HORIZON_DAYS * 24 * 60 * 60 * 1000);

  const candidates = await step.run('list-at-risk-activities', async () => {
    return db
      .select({
        id: activities.id,
        userId: activities.userId,
        title: activities.title,
        deadline: activities.deadline,
      })
      .from(activities)
      .where(
        and(
          eq(activities.status, 'pending'),
          isNull(activities.deletedAt),
          // scheduled_dates is an array column — "never scheduled" means
          // empty array or NULL.
          sql`(${activities.scheduledDates} IS NULL OR cardinality(${activities.scheduledDates}) = 0)`,
          gte(activities.deadline, now),
          lte(activities.deadline, horizon)
        )
      );
  });

  if (candidates.length === 0) {
    logger.info('[risk.alert] no at-risk activities');
    return { activities: 0, sent: 0, skipped: 0 };
  }

  let sent = 0;
  let skipped = 0;
  for (const a of candidates) {
    const result = await step.run(`risk-${a.id}`, async () => {
      // Dedupe: skip if an earlier risk_alert for this activity exists.
      const prior = await db
        .select({ id: proactiveTasks.id })
        .from(proactiveTasks)
        .where(
          and(
            eq(proactiveTasks.userId, a.userId),
            eq(proactiveTasks.type, 'risk_alert'),
            sql`${proactiveTasks.payload}->>'activity_id' = ${a.id}`
          )
        )
        .limit(1);
      if (prior.length > 0) return { status: 'cancelled' as const };

      const deadlineIso = a.deadline ? a.deadline.toISOString().slice(0, 10) : '?';
      return enqueueAndSend({
        userId: a.userId,
        type: 'risk_alert',
        title: a.title,
        body: `Vence ${deadlineIso} y no tiene tiempo agendado. ¿La movemos?`,
        url: `/activities/${a.id}`,
        payload: { activity_id: a.id, deadline: deadlineIso },
        now,
      });
    });
    if (result.status === 'sent') sent++;
    else skipped++;
  }

  logger.info(`[risk.alert] activities=${candidates.length} sent=${sent} skipped=${skipped}`);
  return { activities: candidates.length, sent, skipped };
}

export const riskAlertDaily = getInngest().createFunction(
  { id: 'risk-alert-daily', triggers: [{ cron: '0 14 * * *' }] },
  runRiskAlert
);
