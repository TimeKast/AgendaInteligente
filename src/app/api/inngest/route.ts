/**
 * Inngest sync endpoint — ISSUE-080 (Slice A).
 *
 * Registers our Inngest functions with the Inngest Cloud/CLI and serves
 * function executions back to the SDK. Inngest hits this URL on:
 *   - Sync (`PUT`): introspects available functions + their triggers.
 *   - Run (`POST`): invokes a function with a payload + step state.
 *   - Health (`GET`): minimal "you're alive" probe.
 *
 * The `serve()` helper handles signing-key validation automatically when
 * `INNGEST_SIGNING_KEY` is set on the client — no manual auth code.
 *
 * Local dev: run `npx inngest-cli@latest dev -u http://localhost:3000/api/inngest`
 * in a sidecar shell. The dashboard at http://localhost:8288 shows runs
 * and lets you trigger events by hand.
 *
 * Linked: FT-080, US-080.
 */

import { serve } from 'inngest/next';
import { getInngest } from '@/lib/inngest/client';
import { inngestFunctions } from '@/lib/inngest/functions';

export const { GET, POST, PUT } = serve({
  client: getInngest(),
  functions: [...inngestFunctions],
});
