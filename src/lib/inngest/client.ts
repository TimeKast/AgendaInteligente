/**
 * Inngest client — ISSUE-080 (Slice A).
 *
 * Single shared instance. Constructed lazily so missing env keys in local
 * dev / test don't crash module import — they just disable publishing.
 *
 * Event-key resolution:
 *   - If `INNGEST_EVENT_KEY` is set, the client publishes to Inngest Cloud.
 *   - If unset, the client runs in dev mode (Inngest CLI on localhost) and
 *     `safeSend()` becomes a no-op + warn log. This keeps `pnpm dev` happy
 *     without forcing every contributor to register an Inngest account.
 *
 * Linked: FT-080, US-080.
 */

import { Inngest } from 'inngest';
import { getEnv, isInngestConfigured } from '@/lib/env';

let cached: Inngest | null = null;

/**
 * Lazily build (or reuse) the singleton Inngest client.
 *
 * For publishing events, prefer the typed `publish()` in `./publish.ts` —
 * it validates payloads against the event registry. Call `getInngest()`
 * directly only when wiring `serve()` or `createFunction()`.
 */
export function getInngest(): Inngest {
  if (cached) return cached;
  const e = getEnv();
  cached = new Inngest({
    id: 'agenda-inteligente',
    // When eventKey is undefined, the SDK treats us as dev-mode and points
    // at the local Inngest CLI (http://localhost:8288 by default).
    ...(e.INNGEST_EVENT_KEY ? { eventKey: e.INNGEST_EVENT_KEY } : {}),
    ...(e.INNGEST_SIGNING_KEY ? { signingKey: e.INNGEST_SIGNING_KEY } : {}),
    isDev: !isInngestConfigured(),
  });
  return cached;
}

/** Test-only hook to reset the cached client between vi runs. */
export function _resetInngestForTests(): void {
  cached = null;
}
