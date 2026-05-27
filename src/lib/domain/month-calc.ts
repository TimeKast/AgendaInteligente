/**
 * Month math — ISSUE-131 (BR-19).
 *
 * Pure functions. The MonthSheet's `month_starting` column is always
 * `YYYY-MM-01` in the user's TZ. Inputs may come in as any date in
 * the month; we normalize.
 *
 * DST-safe by construction: we never do numerical 24h arithmetic —
 * day component comes from `Intl.DateTimeFormat` reads in the user TZ.
 *
 * Linked: BR-19, ISSUE-131.
 */

/** Format a UTC `Date` as `YYYY-MM-DD` in `tz` (en-CA → ISO date). */
function localISODate(date: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Returns the first-of-the-month `YYYY-MM-DD` for the month containing
 * `date` in `tz`. Example: ('2026-05-19', 'America/Mexico_City') →
 * '2026-05-01'.
 *
 * Implementation: read the local year+month components in the user's
 * TZ. We don't trust the UTC components (could span a different month
 * after TZ shift) — `Intl` gives us the truth.
 */
export function monthStartingFor(date: Date, tz: string): string {
  const iso = localISODate(date, tz); // "YYYY-MM-DD" in user TZ
  return `${iso.slice(0, 7)}-01`;
}

/**
 * Normalize any `YYYY-MM-DD` to the first-of-the-month form. Useful
 * when callers already have a local date string and want to ensure
 * it's a valid `month_starting`.
 */
export function normalizeToMonthStarting(yyyyMmDd: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd)) {
    throw new Error(`Invalid date format: ${yyyyMmDd} (expected YYYY-MM-DD)`);
  }
  return `${yyyyMmDd.slice(0, 7)}-01`;
}

/**
 * Returns the first-of-the-next-month `YYYY-MM-DD` for use in date-
 * range queries (e.g. "activities in month X"): `WHERE date >=
 * month_starting AND date < nextMonthStarting`.
 */
export function nextMonthStartingFor(monthStartingStr: string): string {
  const [y, m] = monthStartingStr.split('-').map(Number);
  const nextY = m === 12 ? y + 1 : y;
  const nextM = m === 12 ? 1 : m + 1;
  return `${nextY}-${String(nextM).padStart(2, '0')}-01`;
}
