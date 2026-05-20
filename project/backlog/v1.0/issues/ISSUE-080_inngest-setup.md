---
id: ISSUE-080
title: Inngest setup + /api/inngest route + event schemas + user.signed_up recurring schedule
epic: EPIC-CHECKINS
milestone: v1.0
priority: P1
story_points: 5
status: ready
dependencies: [ISSUE-001, ISSUE-006]
user_stories: [US-005, US-080]
features: [FT-080]
screens: []
business_rules: []
agents: [backend-specialist]
skills: [/backend]
---

# ISSUE-080 — Inngest setup

## Overview

Setup Inngest client, `/api/inngest` route handler, define event schemas, and the master `user.signed_up` event que dispara recurring per-user check-in schedules.

## Tasks

- [ ] Install + config Inngest (already deps en ISSUE-001)
- [ ] Inngest client en [src/lib/inngest/client.ts](../../../../src/lib/inngest/client.ts)
- [ ] Route Handler `POST /api/inngest` con Inngest SDK
- [ ] Event schemas en [src/lib/inngest/events.ts](../../../../src/lib/inngest/events.ts):
  - `user.signed_up` { user_id }
  - `morning.check_in.due` { user_id, date }
  - `midday.check_in.due` { user_id, date }
  - `evening.check_in.due` { user_id, date }
  - `weekly.kickoff.due` { user_id, week_starting }
  - `weekly.review.due` { user_id, week_starting }
  - `weekly.post_mortem.requested` { user_id, week_starting }
  - `listening.mode.expired` (cron, no payload)
  - `silence.detection.due` (cron daily)
  - `recurrence.materialize.due` (cron daily)
  - `gentle.default.expired` (cron daily)
  - `purge.soft_deleted.due` (cron daily)
- [ ] `user.signed_up` handler:
  - Schedules recurring `morning/midday/evening.check_in.due` at user's notification_pref times
  - Schedules recurring `weekly.kickoff.due` Sundays + `weekly.review.due` Saturdays
  - Uses Inngest's cron + per-user scheduling pattern
- [ ] Trigger `user.signed_up` from ISSUE-006 onboarding step 8 atomic transaction

## Acceptance Criteria

```gherkin
Scenario: Onboarding triggers schedules
  Given user completes onboarding
  When user.signed_up fired
  Then Inngest creates schedules for morning/midday/evening/weekly per user's prefs
  And first morning check-in queued for next configured time

Scenario: User updates notification time
  Given user changes morning_time from 08:00 to 07:30
  Then existing schedule cancelled + new one created
  Next morning push delivered at 07:30 user TZ

Scenario: Inngest signing key validation
  Given request to /api/inngest from outside Inngest infra
  Then 403 (signing key mismatch)
```

## Definition of Done

- [ ] Inngest functions running locally (Inngest dev CLI)
- [ ] All events tested
- [ ] Schedule cancellation when user updates prefs works
- [ ] Inngest dashboard shows scheduled events
