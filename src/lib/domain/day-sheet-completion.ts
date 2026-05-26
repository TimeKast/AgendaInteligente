/**
 * DaySheet completion predicates — ISSUE-030, E-020.
 *
 * Pure functions consumed by the server action layer to decide when to
 * stamp `morning_completed_at` / `evening_completed_at`. Kept outside the
 * Drizzle schema so tests don't have to spin up a DB module.
 *
 * Morning ritual definition (post-prototype): "complete" = identity
 * statement + at least one planned win + avoidance text are all set.
 * Energy fields are NOT part of the check (removed from schema).
 *
 * Evening ritual definition: close_summary present. The activity-level
 * close-day flow (per-activity outcome) lives in `transitionActivity`
 * and doesn't gate evening completion here.
 *
 * Linked: BR-7, FT-030, FT-031.
 */

interface MorningFields {
  identityStatement?: string | null;
  winsPlanned?: string[] | null;
  avoidance?: string | null;
}

interface EveningFields {
  closeSummary?: string | null;
}

/** True when all three morning fields hold non-empty content. */
export function isMorningCompleted(sheet: MorningFields): boolean {
  if (!nonEmpty(sheet.identityStatement)) return false;
  if (!sheet.winsPlanned || sheet.winsPlanned.length === 0) return false;
  if (!sheet.winsPlanned.some(nonEmpty)) return false;
  if (!nonEmpty(sheet.avoidance)) return false;
  return true;
}

/** True when close_summary is set with non-empty content. */
export function isEveningCompleted(sheet: EveningFields): boolean {
  return nonEmpty(sheet.closeSummary);
}

function nonEmpty(s: string | null | undefined): boolean {
  return typeof s === 'string' && s.trim().length > 0;
}
