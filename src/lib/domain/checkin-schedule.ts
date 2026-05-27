/**
 * Check-in schedule resolver — ISSUE-080b.
 *
 * Pure functions. The fan-out crons (daily 5-min, weekly hourly) tick
 * regardless of users; these helpers decide PER USER whether the
 * current tick should publish a check-in event.
 *
 * Design choice — α fan-out cron (vs β per-user orchestrator):
 *   - Stateless: every tick reads fresh prefs → pref-change-on-the-fly
 *     reflects on the next tick at zero cost (no orchestrator to cancel).
 *   - Same pattern scales to silence/purge/etc crons.
 *   - Tradeoff: 5-min granularity. Acceptable for human check-ins; 8:00
 *     vs 8:03 is invisible UX.
 *
 * Linked: FT-080, FT-085, BR-15..20, US-085, US-087.
 */

export const DAILY_SLOTS = ['morning', 'midday', 'evening'] as const;
export type DailySlot = (typeof DAILY_SLOTS)[number];

export const WEEKLY_KINDS = ['kickoff', 'review'] as const;
export type WeeklyKind = (typeof WEEKLY_KINDS)[number];

/** Minimal prefs shape the resolver consumes (decoupled from Drizzle types). */
export interface CheckInPrefs {
  morningTime: string; // 'HH:MM' or 'HH:MM:SS'
  middayTime: string;
  eveningTime: string;
  weeklyKickoffDow: number; // 0..6 (Sun..Sat)
  weeklyKickoffTime: string;
  weeklyReviewDow: number;
  weeklyReviewTime: string;
  weekendSkip: boolean;
  /** Array of YYYY-MM-DD strings (user-local dates). */
  daysOff: string[];
  mutedUntil: Date | null;
}

/** Parsed local view of `now` for a given TZ. */
interface LocalParts {
  isoDate: string; // YYYY-MM-DD
  weekday: number; // 0..6 (Sun..Sat)
  hour: number; // 0..23
  minute: number; // 0..59
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/**
 * Resolve `now` (UTC instant) into `{ isoDate, weekday, hour, minute }`
 * in the given IANA TZ. Uses `Intl.DateTimeFormat` so DST shifts the
 * wall-clock answer without us doing any math.
 */
export function localPartsAt(now: Date, tz: string): LocalParts {
  const dateFmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const isoDate = dateFmt.format(now);

  const weekdayShort = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
  }).format(now);
  const weekday = WEEKDAY_INDEX[weekdayShort];
  if (weekday === undefined) {
    throw new Error(`Unexpected weekday short: ${weekdayShort}`);
  }

  // `en-GB` is reliable 24h-clock without AM/PM.
  const timeFmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = timeFmt.format(now); // "08:02" or "24:02" on some locales
  // Some impls emit "24:00" instead of "00:00" — normalize.
  const [hStr, mStr] = parts.split(':');
  const hour = parseInt(hStr, 10) % 24;
  const minute = parseInt(mStr, 10);

  return { isoDate, weekday, hour, minute };
}

/** Parse 'HH:MM' or 'HH:MM:SS' into total minutes since midnight. */
function parseTimeToMinutes(t: string): number {
  const [hh, mm] = t.split(':');
  return parseInt(hh, 10) * 60 + parseInt(mm, 10);
}

const WINDOW_MINUTES = 5;

/**
 * True iff the current local minute-of-day falls within the
 * [slot, slot + WINDOW_MINUTES) interval. The cron fires every
 * 5 min — this window matches that cadence so each slot is hit
 * exactly once per day per cron run cluster.
 */
function inSlotWindow(localMin: number, slotMin: number): boolean {
  return localMin >= slotMin && localMin < slotMin + WINDOW_MINUTES;
}

/** True iff `daysOff` array contains the user-local YYYY-MM-DD. */
function isDayOff(prefs: CheckInPrefs, localIsoDate: string): boolean {
  return prefs.daysOff.includes(localIsoDate);
}

/** True iff weekday is Sat (6) or Sun (0) and weekend_skip is set. */
function isWeekendSkipped(prefs: CheckInPrefs, weekday: number): boolean {
  return prefs.weekendSkip && (weekday === 0 || weekday === 6);
}

/** True iff `mutedUntil` is set and in the future relative to `now`. */
function isMuted(prefs: CheckInPrefs, now: Date): boolean {
  return prefs.mutedUntil !== null && prefs.mutedUntil > now;
}

/**
 * Decide if a daily check-in should fire RIGHT NOW for this user.
 * Returns the `isoDate` (user-local) for the caller to use in the
 * event payload + idempotency key, or `null` if the slot doesn't fire.
 */
export function shouldFireDailyCheckIn(
  slot: DailySlot,
  prefs: CheckInPrefs,
  tz: string,
  now: Date
): { isoDate: string } | null {
  const local = localPartsAt(now, tz);

  if (isWeekendSkipped(prefs, local.weekday)) return null;
  if (isDayOff(prefs, local.isoDate)) return null;
  if (isMuted(prefs, now)) return null;

  const slotTimeStr =
    slot === 'morning'
      ? prefs.morningTime
      : slot === 'midday'
        ? prefs.middayTime
        : prefs.eveningTime;
  const slotMin = parseTimeToMinutes(slotTimeStr);
  const localMin = local.hour * 60 + local.minute;

  if (!inSlotWindow(localMin, slotMin)) return null;
  return { isoDate: local.isoDate };
}

/**
 * Decide if a weekly check-in (kickoff or review) should fire now.
 * Weekly cron ticks hourly — the window matches that (60 min). User can
 * customize day-of-week + time-of-day per check-in.
 *
 * Weekend_skip / days_off / muted_until still apply (a user on vacation
 * doesn't want a Sunday kickoff either).
 *
 * Returns `{ weekStarting }` — the Sunday opening this week in user TZ
 * — for the event payload.
 */
export function shouldFireWeeklyCheckIn(
  kind: WeeklyKind,
  prefs: CheckInPrefs,
  tz: string,
  now: Date
): { weekStarting: string } | null {
  const local = localPartsAt(now, tz);

  if (isWeekendSkipped(prefs, local.weekday)) return null;
  if (isDayOff(prefs, local.isoDate)) return null;
  if (isMuted(prefs, now)) return null;

  const targetDow = kind === 'kickoff' ? prefs.weeklyKickoffDow : prefs.weeklyReviewDow;
  if (local.weekday !== targetDow) return null;

  const slotTimeStr = kind === 'kickoff' ? prefs.weeklyKickoffTime : prefs.weeklyReviewTime;
  const slotMin = parseTimeToMinutes(slotTimeStr);
  const localMin = local.hour * 60 + local.minute;

  // 60-min window (matches the hourly cron cadence).
  if (localMin < slotMin || localMin >= slotMin + 60) return null;

  // weekStarting = Sunday of this user-local week. Walk back by
  // `weekday` days, then re-resolve the local date for that instant.
  // Math: subtract weekday * 86400 seconds in UTC, then re-format.
  // This is DST-safe because the day-of-month change happens via
  // setUTCDate, not arithmetic on local time.
  const weekStart = new Date(now);
  weekStart.setUTCDate(weekStart.getUTCDate() - local.weekday);
  const weekStartLocal = localPartsAt(weekStart, tz);

  return { weekStarting: weekStartLocal.isoDate };
}

/** Test-only — exposed for the cron handlers + tests. */
export const _internals = {
  parseTimeToMinutes,
  WINDOW_MINUTES,
  WEEKDAY_INDEX,
};
