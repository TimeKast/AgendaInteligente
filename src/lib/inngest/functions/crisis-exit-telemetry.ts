/**
 * Crisis exit telemetry handler — ISSUE-056b (backend slice).
 *
 * Listens for `crisis.exit.fired` and emits an observability log line
 * that on-call can scrape for trend analysis. The payload is ALREADY
 * anonymized at the publisher (no userId, no message content) — the
 * handler must never reach back into the DB to "enrich" it. Doing so
 * would defeat the privacy contract baked into the event schema.
 *
 * What we use the telemetry for:
 *   - Detect rising-rate trends per country (potential community event
 *     or product copy that's triggering more reports).
 *   - Detect ratio shift between `regex_prefilter` and `llm_tool`
 *     triggers — if the LLM layer starts firing more, the regex list
 *     in `crisis-detection.ts` may need broadening.
 *
 * What we do NOT use it for:
 *   - Per-user follow-up (we don't have the userId on purpose).
 *   - Marketing / analytics / product funnels.
 *
 * Linked: AI-8, R-O-003, FT-056.
 */

import { getInngest } from '../client';
import type { EventData } from '../events';

export const crisisExitTelemetry = getInngest().createFunction(
  {
    id: 'crisis-exit-telemetry',
    name: 'Crisis exit telemetry (anonymous)',
    triggers: [{ event: 'crisis.exit.fired' }],
  },
  async ({ event, logger }) => {
    const data = event.data as EventData<'crisis.exit.fired'>;
    // Structured single-line log so log search / Sentry can group on it.
    // No userId field appears here — keep it that way.
    logger.warn('[crisis.exit.fired]', {
      country: data.country,
      intensityMode: data.intensityMode,
      trigger: data.trigger,
      timestamp: data.timestamp,
    });
    return { logged: true };
  }
);
