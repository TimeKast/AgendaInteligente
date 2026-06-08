/**
 * Activity status transition matrix — BR-8 enforcement (ISSUE-017).
 *
 * Pure functions only. No DB, no auth, no I/O. The server action layer
 * (`src/lib/actions/activity.ts`) imports `isAllowedTransition` and
 * `requiresReason` to validate before persisting; the UI imports
 * `getAllowedNextStatuses` to render only valid action buttons.
 *
 * Matrix per BR-8 (06_DATA_MODEL.md §BR-8) + cancelled (ISSUE-tbd):
 *
 *   pending     → in_progress | done | skipped | blocked | cancelled
 *   in_progress → done | blocked | pending | cancelled
 *   done        → pending                       (undo only — no skip/block/cancel)
 *   skipped     → pending | cancelled
 *   blocked     → in_progress | pending | cancelled
 *   cancelled   → pending                       (un-cancel only)
 *
 * Forbidden transitions (notable):
 *   - done → skipped/blocked/cancelled  (re-classifying a finished task makes
 *                                        no sense; path is done → pending → X)
 *   - skipped → in_progress/done/blocked  (must go through pending)
 *   - cancelled → in_progress/done/skipped/blocked  (must go through pending)
 */

import type { ActivityStatus } from '@/lib/db/schema/activities';

const ALLOWED: Record<ActivityStatus, ReadonlySet<ActivityStatus>> = {
  pending: new Set<ActivityStatus>(['in_progress', 'done', 'skipped', 'blocked', 'cancelled']),
  in_progress: new Set<ActivityStatus>(['done', 'blocked', 'pending', 'cancelled']),
  done: new Set<ActivityStatus>(['pending']),
  skipped: new Set<ActivityStatus>(['pending', 'cancelled']),
  blocked: new Set<ActivityStatus>(['in_progress', 'pending', 'cancelled']),
  cancelled: new Set<ActivityStatus>(['pending']),
};

/**
 * True when the (from, to) edge is in the BR-8 matrix.
 * Self-edges (from === to) return false — caller should no-op separately.
 */
export function isAllowedTransition(from: ActivityStatus, to: ActivityStatus): boolean {
  if (from === to) return false;
  return ALLOWED[from]?.has(to) ?? false;
}

/**
 * Set of statuses the UI should expose from the current state.
 * Excludes `from` itself.
 */
export function getAllowedNextStatuses(from: ActivityStatus): ActivityStatus[] {
  return Array.from(ALLOWED[from] ?? new Set<ActivityStatus>());
}

/**
 * Which transitions require a reason payload from the user.
 *
 *   - `blocked`: text reason REQUIRED (UI form must have textarea).
 *   - `skipped`: reason_category recommended (UI shows a quick-pick); text
 *     optional. The action allows skipped without reason but flags it for
 *     the agent challenge layer (ISSUE-060).
 *   - Everything else: no reason input.
 */
export function reasonRequirementFor(to: ActivityStatus): {
  textRequired: boolean;
  categoryAllowed: boolean;
} {
  if (to === 'blocked') return { textRequired: true, categoryAllowed: true };
  if (to === 'skipped') return { textRequired: false, categoryAllowed: true };
  return { textRequired: false, categoryAllowed: false };
}

/**
 * Re-export for tests + downstream consumers that want the raw matrix.
 * The export is `readonly` to discourage runtime mutation.
 */
export const ALLOWED_TRANSITIONS: Readonly<Record<ActivityStatus, ReadonlySet<ActivityStatus>>> =
  ALLOWED;
