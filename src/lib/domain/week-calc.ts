/**
 * Week math — ISSUE-032 (BR-7 sheet uniqueness).
 *
 * Pure functions. Resolves "what Sunday does this date belong to, in the
 * user's TZ" without numerical 24h arithmetic (DST-safe).
 *
 * Convention: weeks start on Sunday (US/LatAm). If we ever want ISO weeks
 * (Mon-start), `weekStartingFor` is the single place to flip.
 *
 * Why a string return type (not Date):
 *   - `WeekSheet.week_starting` column is `date`, not `timestamptz`.
 *   - The "Sunday of this week in TZ X" question is a calendar question,
 *     not an instant. Strings dodge midnight-rollover bugs.
 *
 * Linked: BR-7, FT-034.
 */

/**
 * Format a UTC Date as `YYYY-MM-DD` in `tz` (en-CA emits ISO date format).
 */
function localISODate(date: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Get user-local weekday for the given UTC instant.
 *
 * Returns ISO weekday number (1=Mon … 7=Sun). We convert Sunday's ISO 7
 * to our "Sun-first" offset (0 = Sunday, …, 6 = Saturday) at call sites.
 */
function localWeekdayISO(date: Date, tz: string): number {
  const weekdayShort = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
  }).format(date);
  const map: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };
  const day = map[weekdayShort];
  if (day === undefined) throw new Error(`Unexpected weekday: ${weekdayShort}`);
  return day;
}

/**
 * Advance a Date by N calendar days at the UTC level. The wall-clock
 * interpretation comes from `tz` at read-time, so DST springs/falls
 * don't shift the cadence.
 */
function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

/**
 * Returns the `YYYY-MM-DD` of the Sunday that opens the week containing
 * `date` in `tz`. If `date` itself is a Sunday in `tz`, returns the same
 * local date.
 *
 * Implementation: read the local weekday in `tz`, compute how many
 * calendar days back to the previous Sunday (0..6), walk back, then
 * format in `tz`. The loop is unrolled — single subtraction.
 *
 * Examples (TZ America/Mexico_City):
 *   2026-05-19 Tue  →  2026-05-17 Sun
 *   2026-05-18 Mon  →  2026-05-17 Sun
 *   2026-05-17 Sun  →  2026-05-17 Sun  (same date)
 *   2026-03-08 DST  →  resolves correctly (no offset shift bug)
 */
export function weekStartingFor(date: Date, tz: string): string {
  const isoWeekday = localWeekdayISO(date, tz); // 1=Mon..7=Sun
  // Convert to Sun-first offset: Sun=0, Mon=1, ..., Sat=6.
  const sunFirst = isoWeekday === 7 ? 0 : isoWeekday;
  const back = addDays(date, -sunFirst);
  return localISODate(back, tz);
}

/**
 * Returns the next Saturday after `weekStartingStr` (used for review
 * scheduling). Pure date math — no TZ awareness needed because we're
 * adding 6 days to a calendar date.
 */
export function weekEndingFor(weekStartingStr: string): string {
  const [y, m, d] = weekStartingStr.split('-').map(Number);
  const sunday = new Date(Date.UTC(y, m - 1, d));
  const saturday = addDays(sunday, 6);
  // Format directly from UTC components — `weekStartingStr` already
  // encodes the user-local date, so the UTC view of "Sunday + 6" is
  // the same calendar Saturday.
  return `${saturday.getUTCFullYear()}-${String(saturday.getUTCMonth() + 1).padStart(2, '0')}-${String(
    saturday.getUTCDate()
  ).padStart(2, '0')}`;
}
