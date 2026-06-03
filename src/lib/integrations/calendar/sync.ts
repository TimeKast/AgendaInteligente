/**
 * Calendar busy-slot sync — ISSUE-091.
 *
 * `syncConnection(userId, connectionId)` is the unit of work the cron
 * and the manual-trigger route both call. Pure-ish: it talks to Google
 * + DB but doesn't touch Inngest scheduling primitives — keeps the
 * function testable with mocked deps.
 *
 * Algorithm:
 *   1. Resolve a valid access token (refresh if expired) via
 *      `getValidAccessToken` (ISSUE-090b).
 *   2. Query Google freebusy for the connection's calendar_ids,
 *      timeMin=now, timeMax=now+30d.
 *   3. Delete the existing rows for (connection_id, start_at >= now)
 *      so we don't leak stale entries from previous syncs.
 *   4. Bulk-insert the fresh busy intervals.
 *   5. Update `last_synced_at` on the connection.
 *
 * On 401/403 from Google after refresh: mark the connection
 * `last_sync_error = invalid_grant`. The user gets a push from the UI
 * layer (ISSUE-090c) prompting reconnect.
 *
 * Linked: OPS-6, FT-091, BR-22.
 */

import { and, eq, gt } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { calendarBusySlots } from '@/lib/db/schema/calendar-busy-slots';
import { calendarConnections } from '@/lib/db/schema/calendar-connections';
import { GoogleApiError, listEvents } from './google';
import { getValidAccessToken } from './refresh';
import { ConnectionNotFoundError } from './refresh';

const SYNC_WINDOW_DAYS = 30;

export interface SyncResult {
  connectionId: string;
  /** Number of rows deleted from the cache before re-insert. */
  deleted: number;
  /** Number of fresh rows inserted. */
  inserted: number;
  /** True if Google said the grant is gone — caller marks the row invalid. */
  reconnectRequired: boolean;
  error?: string;
}

export async function syncConnection(
  userId: string,
  connectionId: string,
  options: { now?: Date; windowDays?: number } = {}
): Promise<SyncResult> {
  const now = options.now ?? new Date();
  const windowDays = options.windowDays ?? SYNC_WINDOW_DAYS;

  // Resolve the connection record (need calendar_ids).
  const rows = await db
    .select()
    .from(calendarConnections)
    .where(and(eq(calendarConnections.id, connectionId), eq(calendarConnections.userId, userId)));
  if (rows.length === 0) {
    throw new ConnectionNotFoundError(connectionId);
  }
  const connection = rows[0];

  if (!connection.enabled) {
    return { connectionId, deleted: 0, inserted: 0, reconnectRequired: false };
  }
  if (connection.calendarIds.length === 0) {
    return { connectionId, deleted: 0, inserted: 0, reconnectRequired: false };
  }

  // Fetch a fresh access token (refresh if needed).
  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(userId, connectionId, { now });
  } catch (err) {
    if (err instanceof GoogleApiError && (err.status === 400 || err.status === 401)) {
      await markReconnectRequired(connectionId, err.message);
      return {
        connectionId,
        deleted: 0,
        inserted: 0,
        reconnectRequired: true,
        error: err.message,
      };
    }
    throw err;
  }

  const timeMin = now;
  const timeMax = new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000);

  // Fetch full event details per calendar — events.list returns title +
  // description, freebusy would only return intervals. The bucket loop
  // below accumulates rows and the bulk insert at the bottom commits.
  type RawEvent = {
    calendarId: string;
    startAt: Date;
    endAt: Date;
    title: string | null;
    description: string | null;
  };
  const fetched: RawEvent[] = [];
  try {
    for (const calId of connection.calendarIds) {
      const events = await listEvents(accessToken, calId, { timeMin, timeMax });
      for (const evt of events) {
        // listEvents already filtered out all-day + cancelled; dateTime is
        // present on every survivor.
        const startStr = evt.start.dateTime!;
        const endStr = evt.end.dateTime!;
        fetched.push({
          calendarId: calId,
          startAt: new Date(startStr),
          endAt: new Date(endStr),
          title: evt.summary?.trim() ? evt.summary.trim().slice(0, 500) : null,
          description: evt.description?.trim() ? evt.description.trim().slice(0, 2000) : null,
        });
      }
    }
  } catch (err) {
    if (err instanceof GoogleApiError && (err.status === 401 || err.status === 403)) {
      await markReconnectRequired(connectionId, err.message);
      return {
        connectionId,
        deleted: 0,
        inserted: 0,
        reconnectRequired: true,
        error: err.message,
      };
    }
    throw err;
  }

  // Wipe rows for this connection whose end is still in the future. We
  // filter on `end_at > now` (not `start_at >= now`) so ongoing events get
  // cleaned out too. Past events stay for historical audit.
  const deleted = await db
    .delete(calendarBusySlots)
    .where(
      and(eq(calendarBusySlots.connectionId, connectionId), gt(calendarBusySlots.endAt, timeMin))
    )
    .returning({ id: calendarBusySlots.id });

  const newRows = fetched.map((evt) => ({
    userId,
    connectionId,
    calendarId: evt.calendarId,
    startAt: evt.startAt,
    endAt: evt.endAt,
    eventTitle: evt.title,
    eventDescription: evt.description,
    syncedAt: now,
  }));

  if (newRows.length > 0) {
    await db.insert(calendarBusySlots).values(newRows);
  }

  await db
    .update(calendarConnections)
    .set({ lastSyncedAt: now, lastSyncError: null })
    .where(eq(calendarConnections.id, connectionId));

  return {
    connectionId,
    deleted: deleted.length,
    inserted: newRows.length,
    reconnectRequired: false,
  };
}

async function markReconnectRequired(connectionId: string, reason: string): Promise<void> {
  await db
    .update(calendarConnections)
    .set({
      enabled: false,
      lastSyncError: `Reconnect required: ${reason}`.slice(0, 500),
    })
    .where(eq(calendarConnections.id, connectionId));
}
