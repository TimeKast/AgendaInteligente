/**
 * Day math — helpers for the user's local "today" string + label.
 *
 * Pure functions. The "what day is today in the user's TZ" question is
 * a calendar question, not an instant — strings dodge midnight-rollover
 * bugs. Mirrors `week-calc.ts` patterns for consistency.
 *
 * Linked: BR-7 (DaySheet uniqueness per user+date).
 */

const SPANISH_WEEKDAYS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const;

const SPANISH_MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const;

/**
 * `YYYY-MM-DD` of `instant` in `tz`. Uses en-CA which emits ISO format
 * regardless of locale settings.
 */
export function todayInTimezone(instant: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

/**
 * Human-readable Spanish label, e.g. "Martes, 27 de mayo".
 *
 * Built from manual parts instead of `Intl.DateTimeFormat('es-MX')`
 * because Intl emits "martes" / "may" with locale-dependent
 * capitalization + abbreviation that varies across Node versions.
 * Manual control keeps the label stable across deploys.
 */
export function todayLabelEs(instant: Date, tz: string): string {
  const ymd = todayInTimezone(instant, tz);
  const [y, m, d] = ymd.split('-').map(Number);

  // Use UTC to read back the weekday name from a synthetic Date —
  // ymd was already TZ-resolved, so UTC is the right reference frame.
  const synthetic = new Date(Date.UTC(y, m - 1, d));
  const weekdayIdx = synthetic.getUTCDay(); // 0 = Sunday
  return `${SPANISH_WEEKDAYS[weekdayIdx]}, ${d} de ${SPANISH_MONTHS[m - 1]}`;
}

/** First letter (upper) of a name or email. Used as avatar initial. */
export function userInitial(nameOrEmail: string | null | undefined): string {
  if (!nameOrEmail) return '·';
  const ch = nameOrEmail.trim().charAt(0).toUpperCase();
  return ch || '·';
}
