---
id: ISSUE-091
title: CalendarBusySlot schema + sync cron (15 min) via Inngest
epic: EPIC-CALENDAR
milestone: v1.0
priority: P1
story_points: 4
status: completed
completed_date: 2026-05-26
dependencies: [ISSUE-080, ISSUE-090, ISSUE-090b]
user_stories: [US-091]
features: [FT-091]
screens: []
business_rules: [OPS-6]
agents: [backend-specialist]
skills: [/backend]
entities: [E-061]
---

# ISSUE-091 — Calendar busy slot sync

## Overview

Inngest function cada 15 minutos sync Google Calendar busy slots para users con conexión activa. Store en `calendar_busy_slots` cache table for fast read.

## Tasks

- [ ] Migration: create `calendar_busy_slots` table per E-061
- [ ] Inngest function `google_calendar.sync.due` per-user every 15 min:
  - Get user's GoogleCalendarConnection (decrypt tokens)
  - Call Google Calendar API: `freebusy.query` for selected calendar_ids con timeMin = now, timeMax = now + 30 days
  - Or `events.list` con singleEvents=true para detail
  - Upsert CalendarBusySlot rows (delete + reinsert window OK for simplicity)
  - Set `last_synced_at = now`
  - If 401 / 403: mark connection as invalid + push to user "Tu conexión expiró. Reconectá."
- [ ] Schedule cancelled cuando user disconnects
- [ ] Manual trigger: `POST /api/google-calendar/sync-now` enqueues immediate sync

## Acceptance Criteria

```gherkin
Scenario: Sync happens
  Given user has active connection
  When 15 min cron runs
  Then events fetched from Google
  CalendarBusySlot rows upserted with current data
  last_synced_at = now

Scenario: Manual trigger
  Given user clicks "Sincronizar ahora"
  Then 202 + Inngest event fired
  Sync completes within ~10s

Scenario: Token expired
  Given refresh_token also invalid (revoked)
  When sync attempts
  Then connection marked invalid
  Push to user: "Reconectá Google Calendar"

Scenario: 30-day horizon
  Given today is May 19
  Then busy slots fetched up to June 18
```

## Definition of Done

- [ ] Cron tested per user TZ
- [ ] Cache table populated correctly
- [ ] Failure handling tested
- [ ] Manual trigger works
