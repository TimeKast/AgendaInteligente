/**
 * Handler: `user.signed_up` — ISSUE-080 (Slice A).
 *
 * v1.0 scope: log-only ack. The real per-user check-in scheduling
 * (`morning/midday/evening.check_in.due` at the user's `notification_prefs`
 * times, weekly kickoff/review) lives in ISSUE-080b — the design call on
 * α fan-out cron vs β per-user orchestrator is open and gets its own
 * decision record before code lands.
 *
 * We register the handler now so the event surface is wired end-to-end
 * (onboarding → Inngest → handler → log). Each follow-up issue adds
 * step bodies without touching the registration glue.
 *
 * Linked: FT-080, US-080.
 */

import { getInngest } from '../client';

export const userSignedUp = getInngest().createFunction(
  { id: 'user-signed-up', triggers: [{ event: 'user.signed_up' }] },
  async ({ event, logger }) => {
    const { userId } = event.data as { userId: string };
    logger.info(`[user.signed_up] received userId=${userId} — schedules deferred to ISSUE-080b`);
    return { userId, scheduled: false };
  }
);
