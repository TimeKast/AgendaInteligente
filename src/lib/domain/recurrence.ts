/**
 * Recurrence DSL — BR-11 (ISSUE-024).
 *
 * Pure functions only. No DB, no auth, no I/O. Two surfaces:
 *
 *   1. `parseRecurrenceRule(s)` — validates + parses a DSL string into a
 *      typed `ParsedRule`. Returns `null` on any invalid input (legacy
 *      iCal `FREQ=…` strings included — caller surfaces the migration
 *      hint).
 *
 *   2. `expandRecurrence(rule, fromDate, days, tz)` — emits the local-day
 *      ISO dates (`YYYY-MM-DD`) inside the [fromDate, fromDate + days)
 *      window that match the rule, computed in the user's IANA timezone.
 *      Inclusive of `fromDate`, exclusive of `fromDate + days`. Output is
 *      sorted asc.
 *
 * Why dates as strings (YYYY-MM-DD) and not Date objects:
 *   - The Activity.scheduled_dates column is `date[]`, not `timestamptz`.
 *     A recurring task at 9am UTC vs 9am Asia/Tokyo is the SAME local
 *     date for the Japanese user. Pinning to local-day strings dodges
 *     midnight-rollover bugs.
 *
 * DST handling:
 *   - We never add 24h numerically; we walk `fromDate` forward N
 *     calendar days using Intl's day-of-week / day-of-month resolved
 *     in the target TZ. DST springs/falls don't shift the cadence.
 *
 * Linked: BR-11, FT-026, US-025.
 */

// ──────────────────────────────────────────────────────────────────────────
// Types + constants
// ──────────────────────────────────────────────────────────────────────────

export const WEEKDAY_CODES = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] as const;
export type WeekdayCode = (typeof WEEKDAY_CODES)[number];

/** Mon=1 … Sun=7 (ISO-8601). Matches what Intl returns for `weekday: 'short'` mapped manually. */
const WEEKDAY_TO_ISO: Record<WeekdayCode, number> = {
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
  SU: 7,
};

export type ParsedRule =
  | { kind: 'daily' }
  | { kind: 'weekly'; days: ReadonlySet<WeekdayCode> }
  | { kind: 'monthly_day'; day: number }
  | { kind: 'monthly_last' };

// ──────────────────────────────────────────────────────────────────────────
// Parser
// ──────────────────────────────────────────────────────────────────────────

/**
 * Strict DSL parser. Returns `null` on ANY deviation from the four allowed
 * shapes (caller maps null to a 400 with the migration hint).
 *
 *   daily
 *   weekly:MO,WE,FR        (unique uppercase day codes, comma-separated)
 *   monthly:1..28          (day-of-month — values 29-31 rejected because
 *                           months like February can't satisfy them and we
 *                           prefer predictable skip-month semantics; users
 *                           who want "last day" should use `monthly:last`)
 *   monthly:last
 *
 * Legacy iCal-style strings (anything starting with `FREQ=`) are explicitly
 * rejected so the action layer can surface a migration message.
 */
export function parseRecurrenceRule(input: unknown): ParsedRule | null {
  if (typeof input !== 'string') return null;
  const s = input.trim();
  if (s.length === 0) return null;

  // Reject legacy iCal RRULE so callers can give a helpful hint.
  if (/^FREQ=/i.test(s)) return null;

  if (s === 'daily') return { kind: 'daily' };
  if (s === 'monthly:last') return { kind: 'monthly_last' };

  // weekly:CODES — split into uppercase 2-letter codes, validate each.
  if (s.startsWith('weekly:')) {
    const rest = s.slice('weekly:'.length);
    if (rest.length === 0) return null;
    const codes = rest.split(',');
    if (codes.length === 0) return null;
    const set = new Set<WeekdayCode>();
    for (const code of codes) {
      if (!(WEEKDAY_CODES as readonly string[]).includes(code)) return null;
      if (set.has(code as WeekdayCode)) return null; // no duplicates
      set.add(code as WeekdayCode);
    }
    return { kind: 'weekly', days: set };
  }

  // monthly:N where N is 1..28.
  if (s.startsWith('monthly:')) {
    const rest = s.slice('monthly:'.length);
    if (!/^[1-9]\d*$/.test(rest)) return null;
    const day = Number(rest);
    if (day < 1 || day > 28) return null;
    return { kind: 'monthly_day', day };
  }

  return null;
}

// ──────────────────────────────────────────────────────────────────────────
// Expander
// ──────────────────────────────────────────────────────────────────────────

/**
 * Format `date` as `YYYY-MM-DD` in the IANA `tz` timezone. Uses
 * Intl.DateTimeFormat with en-CA locale (which natively emits ISO date
 * format) so we don't have to manually pad zero-prefixes.
 */
function localISODate(date: Date, tz: string): string {
  // en-CA → "2026-05-19" (ISO date). en-US would be "5/19/2026".
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Get the user-local weekday (1=Mon … 7=Sun) for the given UTC instant in
 * the target timezone.
 */
function localWeekdayISO(date: Date, tz: string): number {
  // en-US 'short' returns Mon, Tue, Wed, etc. — map to ISO.
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
 * Get user-local day-of-month (1..31) for the given UTC instant in the
 * target timezone.
 */
function localDayOfMonth(date: Date, tz: string): number {
  const dd = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    day: '2-digit',
  }).format(date);
  return Number(dd);
}

/**
 * Advance a Date by N calendar days while staying anchored to the same
 * wall-clock time in the user's TZ. We use `setUTCDate(+N)` which is
 * DST-safe because the wall-clock interpretation comes from `tz` at
 * read-time (via Intl), not from the numeric offset.
 */
function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

/**
 * Returns true when `dateStr` (YYYY-MM-DD) is the LAST day of its month.
 */
function isLastDayOfMonth(dateStr: string): boolean {
  const [y, m, d] = dateStr.split('-').map(Number);
  // Day 0 of next month = last day of current month (JS Date quirk).
  const lastDayOfMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return d === lastDayOfMonth;
}

/**
 * Expand a recurrence rule into an array of local-date strings within the
 * window `[fromDate, fromDate + days)`.
 *
 * @param rule    parsed DSL rule (from `parseRecurrenceRule`)
 * @param fromDate window start instant (UTC); included if rule matches
 * @param days    window length in days (1..366 — caller guards)
 * @param tz      IANA timezone for weekday / day-of-month resolution
 * @returns       sorted unique YYYY-MM-DD strings; empty array if no matches
 */
export function expandRecurrence(
  rule: ParsedRule,
  fromDate: Date,
  days: number,
  tz: string
): string[] {
  if (days <= 0) return [];

  const out = new Set<string>();
  for (let i = 0; i < days; i++) {
    const day = addDays(fromDate, i);
    const localStr = localISODate(day, tz);

    switch (rule.kind) {
      case 'daily':
        out.add(localStr);
        break;
      case 'weekly': {
        const iso = localWeekdayISO(day, tz);
        const matches = Array.from(rule.days).some((c) => WEEKDAY_TO_ISO[c] === iso);
        if (matches) out.add(localStr);
        break;
      }
      case 'monthly_day': {
        if (localDayOfMonth(day, tz) === rule.day) out.add(localStr);
        break;
      }
      case 'monthly_last': {
        if (isLastDayOfMonth(localStr)) out.add(localStr);
        break;
      }
    }
  }

  return Array.from(out).sort();
}

/**
 * Convenience: parse + expand in one call. Returns empty array on invalid
 * input (so callers that get a recurring activity from DB with a garbage
 * rule don't crash — they just don't emit instances).
 */
export function expandFromString(rule: string, fromDate: Date, days: number, tz: string): string[] {
  const parsed = parseRecurrenceRule(rule);
  if (parsed === null) return [];
  return expandRecurrence(parsed, fromDate, days, tz);
}
