/**
 * Calendar busy-slot loader for /today.
 *
 * Returns the user's external calendar events overlapping a given
 * local-TZ date, bucketed into HH:00 hour entries — the shape the
 * TodayActivitiesBoard's calendar grid consumes.
 *
 * Events that span multiple hours emit one bucket per hour (so the
 * board's blockedHours set marks every covered slot).
 *
 * Lives in /lib/db/queries (BR-1 allowlist).
 */

import { and, eq, gte, lt } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { calendarBusySlots } from '@/lib/db/schema/calendar-busy-slots';
import { calendarConnections } from '@/lib/db/schema/calendar-connections';

export interface ExternalEventForBoard {
  id: string;
  hour: string; // HH:00 in user TZ
  title: string;
  timeRange: string; // "10:00 – 11:00"
  /** Human-readable source label, e.g. account_label or calendar_id. */
  source: string;
}

const CALENDAR_START_HOUR = 6;
const CALENDAR_END_HOUR = 22;

function fmtHourInTz(d: Date, tz: string): string {
  const hh = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
  // Intl returns "HH:mm" — clamp minutes to :00 for the bucket.
  return hh.slice(0, 2) + ':00';
}

function fmtRange(start: Date, end: Date, tz: string): string {
  const s = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(start);
  const e = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(end);
  return `${s} – ${e}`;
}

export async function loadTodaysBusySlots(
  userId: string,
  todayDate: string,
  timezone: string
): Promise<ExternalEventForBoard[]> {
  // Day boundaries in the user's TZ converted to UTC for the DB query.
  // We compute by constructing midnight strings in the TZ and reading
  // back via Date — close enough; off-by-1-second on DST boundaries
  // doesn't matter for a "today's calendar" view.
  const dayStartLocal = new Date(`${todayDate}T00:00:00`);
  const tzOffsetMin = new Date().getTimezoneOffset(); // server TZ; ignore
  void tzOffsetMin; // not used — we use the user's TZ via Intl below
  // Simpler: query a window slightly wider than 24h and filter in app.
  const startBound = new Date(`${todayDate}T00:00:00.000Z`);
  startBound.setUTCDate(startBound.getUTCDate() - 1);
  const endBound = new Date(`${todayDate}T00:00:00.000Z`);
  endBound.setUTCDate(endBound.getUTCDate() + 2);

  const rows = await db
    .select({
      id: calendarBusySlots.id,
      calendarId: calendarBusySlots.calendarId,
      startAt: calendarBusySlots.startAt,
      endAt: calendarBusySlots.endAt,
      eventTitle: calendarBusySlots.eventTitle,
      accountLabel: calendarConnections.accountLabel,
      externalAccountId: calendarConnections.externalAccountId,
    })
    .from(calendarBusySlots)
    .innerJoin(calendarConnections, eq(calendarConnections.id, calendarBusySlots.connectionId))
    .where(
      and(
        eq(calendarBusySlots.userId, userId),
        gte(calendarBusySlots.startAt, startBound),
        lt(calendarBusySlots.startAt, endBound)
      )
    );

  void dayStartLocal;

  // Defensive dedupe against the historical sync-duplicates bug (fixed in
  // src/lib/integrations/calendar/sync.ts but old rows linger until the next
  // sync). Group by (calendar_id, end_at) — the same event in different
  // sync stages — keep the earliest startAt (the truest representation).
  const dedup = new Map<string, (typeof rows)[number]>();
  for (const r of rows) {
    const key = `${r.calendarId}|${r.endAt.getTime()}`;
    const existing = dedup.get(key);
    if (!existing || r.startAt.getTime() < existing.startAt.getTime()) {
      dedup.set(key, r);
    }
  }

  const out: ExternalEventForBoard[] = [];
  for (const r of dedup.values()) {
    // Check this slot falls on `todayDate` in the user's TZ.
    const startLocalDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(r.startAt);
    if (startLocalDate !== todayDate) continue;

    const startHour = parseInt(fmtHourInTz(r.startAt, timezone).slice(0, 2), 10);
    const endHour = parseInt(fmtHourInTz(r.endAt, timezone).slice(0, 2), 10);
    // Inclusive start hour, exclusive end hour. If the event ends EXACTLY
    // at HH:00, that hour isn't blocked. If it ends at HH:30, block up to HH.
    const endHourEffective = r.endAt.getTime() % (60 * 60 * 1000) === 0 ? endHour : endHour + 1;

    const title = (r.eventTitle ?? 'Bloqueado').slice(0, 60);
    const rangeStr = fmtRange(r.startAt, r.endAt, timezone);
    const source = r.accountLabel || r.externalAccountId || r.calendarId;

    for (let h = startHour; h < endHourEffective; h++) {
      if (h < CALENDAR_START_HOUR || h > CALENDAR_END_HOUR) continue;
      out.push({
        id: `${r.id}-${h}`,
        hour: `${h.toString().padStart(2, '0')}:00`,
        title,
        timeRange: rangeStr,
        source,
      });
    }
  }
  return out;
}
