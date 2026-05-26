---
id: ISSUE-080b
title: Per-user check-in scheduling (morning/midday/evening + weekly) + cancellation on pref change
epic: EPIC-CHECKINS
milestone: v1.0
priority: P1
story_points: 5
status: ready
dependencies: [ISSUE-080]
user_stories: [US-080, US-085, US-087]
features: [FT-080, FT-085]
screens: []
business_rules: [BR-15, BR-16, BR-17, BR-18, BR-19, BR-20]
agents: [backend-specialist, architect]
skills: [/backend]
---

# ISSUE-080b — Per-user check-in scheduling

## Overview

Continuation of ISSUE-080. Slice A shipped the plumbing (client, route, 12 event schemas, `user.signed_up` publish, recurrence materializer cron). This issue ships the per-user time-aware schedules — the hard part deferred from Slice A.

## Open design decision (must resolve before coding)

**Pattern α — Fan-out cron**

- Global cron every ~5 minutes (`*/5 * * * *`).
- Each tick queries users whose `notification_prefs.morning_time` falls in the current window in their `users.timezone` AND today is not in `days_off` AND `weekend_skip` doesn't apply AND `muted_until` is past.
- Emits `morning.check_in.due` per matched user.
- **Pros:** stateless; cancellation is automatic (next tick reads fresh prefs); fault-tolerant (a missed tick = next tick catches up); minimal moving parts.
- **Cons:** 5-min granularity (not exact-second); fan-out cost scales with active users (manageable until ~10k users); needs dedupe key per (user, day, slot) to prevent double-fire on retry.

**Pattern β — Per-user orchestrator**

- `user.signed_up` triggers a long-running daily-loop function: `step.sleepUntil(nextMorningTime)` → emit `morning.check_in.due` → `step.sleepUntil(nextMidday)` → ... → `step.sleepUntil(tomorrow_morning)` and continue.
- Pref change → emit `notification_prefs.changed` → orchestrator cancels itself and a new instance starts.
- **Pros:** exact-time delivery; cleaner mental model per user; native Inngest pattern.
- **Cons:** state-heavy; cancellation semantics tricky; missed wake-ups (e.g. Inngest outage spanning a sleepUntil) need recovery logic; weekly schedules (Sunday kickoff, Saturday review) overlap the daily orchestrator.

**Recommended:** α — fan-out cron. Reasons:

1. 5-min granularity is acceptable for human check-ins (8:00 vs 8:03 is invisible UX).
2. Cancellation-on-pref-change is FREE — no orchestrator to invalidate.
3. Same pattern scales to `silence.detection.due`, `purge.soft_deleted.due`, etc.
4. Inngest's per-user-orchestrator pattern is more useful for stateful workflows (kickoff → wait for response → branch), not stateless time-based fires.

ADR-NNN to be written before coding starts.

## Tasks

- [ ] Resolve α vs β with a short ADR in `project/planning/adr/` (or inline in this issue if 1 paragraph suffices).
- [ ] Implement daily fan-out function `daily.check_in.fanout` (cron `*/5 * * * *`):
  - Per slot (morning/midday/evening), query users matching the time window in TZ.
  - Respect `days_off`, `weekend_skip`, `muted_until`.
  - Emit `<slot>.check_in.due` event per matched user with `{ userId, date }`.
  - Dedupe key: `(userId, date, slot)` in a `check_in_log` table OR using Inngest's event idempotency key.
- [ ] Implement weekly fan-out function `weekly.fanout` (cron e.g. `0 * * * *` hourly):
  - Match users whose `weekly_kickoff_dow` + `weekly_kickoff_time` falls in this hour.
  - Same idempotency pattern.
  - Emit `weekly.kickoff.due` / `weekly.review.due` per match.
- [ ] System crons (`listening.mode.expired`, `silence.detection.due`, `gentle.default.expired`, `purge.soft_deleted.due`):
  - Each gets its own `inngest.createFunction` with its own cron.
  - Handlers are thin wrappers around pure-domain functions (TBD per feature).
- [ ] Tests: TZ matrix (UTC vs America/Mexico_City vs Europe/Madrid), DST edges, `weekend_skip` + `days_off` skip behavior, `muted_until` skip, idempotency under retry.

## Acceptance Criteria

```gherkin
Scenario: Morning check-in fires at user's local time
  Given userA has timezone America/Mexico_City and morning_time = 08:00
  And current UTC time is 14:02 (corresponds to 08:02 MX local)
  When the fan-out cron runs
  Then exactly one `morning.check_in.due` event is published with { userId: userA, date: today_MX }
  And re-running the cron at 14:04 (same 5-min window) does NOT re-emit

Scenario: Pref change reflects on next tick
  Given userA had morning_time = 08:00, schedule running
  When userA updates morning_time to 07:30 at 14:00 UTC
  Then no extra Inngest call needed (orchestrator cancellation not used)
  And next morning at 13:30 UTC (07:30 MX local), the fan-out emits the event

Scenario: weekend_skip honored
  Given userA has weekend_skip = true
  When the fan-out tick falls on Saturday/Sunday in user TZ
  Then no morning/midday/evening events emitted for userA on those days

Scenario: muted_until honored
  Given userA has muted_until = tomorrow 09:00 UTC
  When the fan-out tick falls before that
  Then no check-in events emitted for userA

Scenario: days_off honored
  Given userA has '2026-12-25' in days_off
  When the fan-out tick falls on that local date
  Then no events emitted for userA
```

## Definition of Done

- [ ] ADR α vs β written and linked here
- [ ] All check-in cadence events publish at user-local times (TZ matrix tested)
- [ ] Idempotency holds under retry (no double-fires)
- [ ] `weekend_skip` / `days_off` / `muted_until` all honored
- [ ] All test scenarios pass
- [ ] Inngest dashboard shows scheduled per-user firings during a smoke test
