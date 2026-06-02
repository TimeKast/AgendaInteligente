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
const SLOT_MINUTES = 30;
const CALENDAR_END_MIN = CALENDAR_END_HOUR * 60 + 30; // include 22:30

/** Return minutes-since-midnight for `d` interpreted in `tz`. */
function minutesInTz(d: Date, tz: string): number {
  const hm = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
  const [hh, mm] = hm.split(':').map(Number);
  return hh * 60 + mm;
}

function formatSlot(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
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

    // Snap start DOWN, end UP to a multiple of SLOT_MINUTES so a 9:30→10:30
    // event yields exactly the {09:30, 10:00} slots — not {09:00, 10:00}.
    const startMin = minutesInTz(r.startAt, timezone);
    const endMin = minutesInTz(r.endAt, timezone);
    const bucketStart = Math.floor(startMin / SLOT_MINUTES) * SLOT_MINUTES;
    const bucketEnd = Math.ceil(endMin / SLOT_MINUTES) * SLOT_MINUTES;

    const title = (r.eventTitle ?? 'Bloqueado').slice(0, 60);
    const rangeStr = fmtRange(r.startAt, r.endAt, timezone);
    const source = r.accountLabel || r.externalAccountId || r.calendarId;

    for (let m = bucketStart; m < bucketEnd; m += SLOT_MINUTES) {
      if (m < CALENDAR_START_HOUR * 60 || m > CALENDAR_END_MIN) continue;
      out.push({
        id: `${r.id}-${m}`,
        hour: formatSlot(m),
        title,
        timeRange: rangeStr,
        source,
      });
    }
  }
  return out;
}
