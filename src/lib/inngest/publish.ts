/**
 * Typed publisher — ISSUE-080 (Slice A).
 *
 * `publish(name, data)` validates the payload against the registered Zod
 * schema before handing it to `inngest.send()`. This catches:
 *   - Shape drift between emitter and registry (e.g. typo'd field).
 *   - Caller passing `undefined` / `null` where the contract expects a UUID.
 *
 * Graceful degradation: if `INNGEST_EVENT_KEY` is unset (local dev without
 * Inngest CLI), `publish()` logs a warning and returns. Validation still
 * runs so contract bugs surface during dev, not only in production.
 *
 * Linked: FT-080.
 */

import { getInngest } from './client';
import { type EventName, type EventData, parseEventData } from './events';
import { isInngestConfigured } from '@/lib/env';
import { logger } from '@/lib/logger';

/**
 * Publish a typed event. Validates the payload first; throws on shape
 * mismatch. Send errors are caught and logged (no throw) so a transient
 * Inngest outage doesn't poison the calling user flow.
 */
export async function publish<N extends EventName>(name: N, data: EventData<N>): Promise<void> {
  // Validation runs even when Inngest isn't configured — contract bugs
  // should surface during local dev, not silently pass to production.
  const parsed = parseEventData(name, data);

  if (!isInngestConfigured()) {
    logger.warn(`[inngest] not configured — skipping publish of "${name}"`);
    return;
  }

  try {
    await getInngest().send({ name, data: parsed });
  } catch (err) {
    logger.error(`[inngest] publish failed for "${name}":`, err);
  }
}
