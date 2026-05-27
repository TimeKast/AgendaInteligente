/**
 * Event registry — ISSUE-080 (Slice A).
 *
 * Single source of truth for every event name + payload shape the app emits.
 * Each entry is a Zod schema — used for both compile-time types (via
 * `z.infer`) and runtime validation inside typed publishers.
 *
 * Why a flat registry instead of `EventSchemas.fromZod` (inngest v3):
 *   - inngest@4 removed the typed-schemas builder. Bindings are now inferred
 *     from the actual `.send()` call shape, which leaves no enforcement at
 *     call sites.
 *   - This registry restores enforcement: publishers below `parse()` the
 *     payload before handing it to the SDK, so a malformed `data` blows up
 *     in the action that emitted the event, not silently downstream.
 *
 * Slice scope: schemas only. Handlers for the per-user check-in scheduling
 * (`morning/midday/evening.check_in.due`, the `weekly.*.due` family,
 * `listening.mode.expired`, `silence.detection.due`, `gentle.default.expired`,
 * `purge.soft_deleted.due`) live in their own future issues (ISSUE-080b +
 * per-feature epics). Declaring them here so the contract is fixed once and
 * each follow-up issue only adds a handler.
 *
 * Linked: FT-080.
 */

import { z } from 'zod';

const userId = z.string().uuid();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');

/**
 * Event registry — keys are event names, values are payload schemas.
 *
 * Naming convention (TimeKast Factory):
 *   - lifecycle:  `user.signed_up`
 *   - check-in:   `<scope>.check_in.due`
 *   - weekly:     `weekly.<phase>.due`
 *   - cron:       `<topic>.<verb>.due` (no payload)
 */
export const eventSchemas = {
  // ─── Lifecycle ─────────────────────────────────────────────────────
  'user.signed_up': z.object({ userId }),

  // ─── Per-user daily check-ins (handlers in ISSUE-080b) ────────────
  'morning.check_in.due': z.object({ userId, date }),
  'midday.check_in.due': z.object({ userId, date }),
  'evening.check_in.due': z.object({ userId, date }),

  // ─── Weekly cadence (handlers in ISSUE-034 + ISSUE-080b) ──────────
  'weekly.kickoff.due': z.object({ userId, weekStarting: date }),
  'weekly.review.due': z.object({ userId, weekStarting: date }),
  'weekly.post_mortem.requested': z.object({ userId, weekStarting: date }),

  // ─── System crons (no payload — schedule encoded in handler) ──────
  'listening.mode.expired': z.object({}),
  'silence.detection.due': z.object({}),
  'recurrence.materialize.due': z.object({}),
  'gentle.default.expired': z.object({}),
  'purge.soft_deleted.due': z.object({}),

  // ─── Calendar sync (ISSUE-091) — on-demand trigger ─────────────────
  'calendar.sync.requested': z.object({
    userId,
    connectionId: z.string().uuid(),
  }),

  // ─── Crisis exit telemetry (ISSUE-056b) — PRIVACY-CRITICAL ────────
  // PRIVACY CONTRACT: this payload deliberately omits userId, message
  // content, matched phrase, IP, or any field that could re-identify
  // the user. Country comes from TZ inference; intensityMode is the
  // user's setting at the moment of trigger; trigger is which layer
  // fired (pre-filter regex vs LLM tool call). The handler logs to
  // observability; we use it to detect false-negative trends, not to
  // audit individuals. Adding a field here requires a privacy review.
  'crisis.exit.fired': z.object({
    country: z.string().min(2).max(2).nullable(),
    intensityMode: z.enum(['sharp', 'standard', 'gentle', 'listening']),
    trigger: z.enum(['regex_prefilter', 'llm_tool']),
    timestamp: z.string().datetime(),
  }),
} as const;

/** Compile-time event-name union (derived from the registry keys). */
export type EventName = keyof typeof eventSchemas;

/** Compile-time payload type for a given event name. */
export type EventData<N extends EventName> = z.infer<(typeof eventSchemas)[N]>;

/**
 * Validate an event payload against its registered schema.
 * Throws a descriptive `ZodError` if the payload doesn't match.
 */
export function parseEventData<N extends EventName>(name: N, data: unknown): EventData<N> {
  return eventSchemas[name].parse(data) as EventData<N>;
}
