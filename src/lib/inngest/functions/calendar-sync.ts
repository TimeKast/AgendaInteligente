/**
 * Calendar busy-slot sync cron — ISSUE-091.
 *
 * Two triggers:
 *   - Cron `*\/15 * * * *` for the background sweep.
 *   - Event `calendar.sync.requested` for the manual "Sync now" button.
 *
 * Strategy: list every enabled connection (fan-out via Promise.allSettled,
 * one step.run per connection). Single-user failures don't tumble the
 * batch; per-user errors land in connection.last_sync_error.
 *
 * Linked: OPS-6, FT-091.
 */

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { calendarConnections } from '@/lib/db/schema/calendar-connections';
import { syncConnection } from '@/lib/integrations/calendar/sync';
import { getInngest } from '../client';

interface StepLike {
  run<T>(id: string, fn: () => Promise<T> | T): Promise<T>;
}
interface LoggerLike {
  info: (msg: string, ...rest: unknown[]) => void;
  error: (msg: string, ...rest: unknown[]) => void;
}

interface CalendarSyncEvent {
  data?: { userId?: string; connectionId?: string };
}

/**
 * Handler body — same function powers both the cron and the on-demand
 * event. When `event.data.connectionId` is set, we sync only that
 * connection (manual trigger); otherwise we fan-out over all enabled
 * connections (cron sweep).
 */
export async function runCalendarSync({
  step,
  logger,
  event,
}: {
  step: StepLike;
  logger: LoggerLike;
  event?: CalendarSyncEvent;
}): Promise<{ connections: number; ok: number; failed: number; reconnect: number }> {
  const targetedId = event?.data?.connectionId;

  const connections = await step.run('list-enabled-connections', async () => {
    if (targetedId) {
      return db
        .select({ id: calendarConnections.id, userId: calendarConnections.userId })
        .from(calendarConnections)
        .where(eq(calendarConnections.id, targetedId));
    }
    return db
      .select({ id: calendarConnections.id, userId: calendarConnections.userId })
      .from(calendarConnections)
      .where(eq(calendarConnections.enabled, true));
  });

  if (connections.length === 0) {
    logger.info('[calendar.sync] no connections to sync');
    return { connections: 0, ok: 0, failed: 0, reconnect: 0 };
  }

  const results = await Promise.allSettled(
    connections.map((c) => step.run(`sync-${c.id}`, () => syncConnection(c.userId, c.id)))
  );

  let ok = 0;
  let failed = 0;
  let reconnect = 0;
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === 'fulfilled') {
      if (r.value.reconnectRequired) reconnect++;
      else ok++;
    } else {
      failed++;
      logger.error(`[calendar.sync] failed for connectionId=${connections[i].id}`, r.reason);
    }
  }

  logger.info(
    `[calendar.sync] connections=${connections.length} ok=${ok} reconnect=${reconnect} failed=${failed}`
  );
  return { connections: connections.length, ok, failed, reconnect };
}

export const calendarSyncCron = getInngest().createFunction(
  { id: 'calendar-sync-cron', triggers: [{ cron: '*/15 * * * *' }] },
  runCalendarSync
);

export const calendarSyncOnDemand = getInngest().createFunction(
  { id: 'calendar-sync-on-demand', triggers: [{ event: 'calendar.sync.requested' }] },
  runCalendarSync
);
