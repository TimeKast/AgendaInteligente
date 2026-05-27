/**
 * Functions barrel — ISSUE-080 (Slice A).
 *
 * Collects every Inngest function so the `/api/inngest` route registers
 * them all in one place. Order doesn't matter; the SDK introspects each
 * function's triggers at sync time.
 *
 * Add new handlers here AND the parent issue should land a single test
 * proving the function shows up in `functions.map(f => f.id())`.
 */

import { userSignedUp } from './user-signed-up';
import { recurrenceMaterialize } from './recurrence-materialize';
import { weeksheetMaterialize } from './weeksheet-materialize';
import { dailyCheckinFanout } from './daily-checkin-fanout';
import { weeklyFanout } from './weekly-fanout';
import { listeningModeExpired } from './listening-mode-expired';
import { gentleDefaultExpired } from './gentle-default-expired';
import { calendarSyncCron, calendarSyncOnDemand } from './calendar-sync';
import { silenceDetection } from './silence-detection';
import { riskAlertDaily } from './risk-alert';
import { projectKillSuggestion } from './project-kill-suggestion';
import {
  morningCheckInHandler,
  middayCheckInHandler,
  eveningCheckInHandler,
  weeklyKickoffHandler,
  weeklyReviewHandler,
} from './check-in-handlers';

export const inngestFunctions = [
  userSignedUp,
  recurrenceMaterialize,
  weeksheetMaterialize,
  dailyCheckinFanout,
  weeklyFanout,
  listeningModeExpired,
  gentleDefaultExpired,
  calendarSyncCron,
  calendarSyncOnDemand,
  silenceDetection,
  riskAlertDaily,
  projectKillSuggestion,
  morningCheckInHandler,
  middayCheckInHandler,
  eveningCheckInHandler,
  weeklyKickoffHandler,
  weeklyReviewHandler,
] as const;
