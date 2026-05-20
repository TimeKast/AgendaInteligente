---
id: EPIC-CALENDAR
title: Google Calendar read-only integration
milestone: v1.0
priority: P1
status: ready
story_points: 15
issues: [ISSUE-090, ISSUE-091, ISSUE-092, ISSUE-093]
features: [FT-090, FT-091, FT-092, FT-093]
user_stories: [US-090, US-091, US-092]
business_rules: [BR-12, OPS-6]
risks: [R-T-002]
screens: [SCR-033, SCR-021]
---

# EPIC-CALENDAR — Google Calendar read-only

## Goal

OAuth flow para conectar Google Calendar con scope `calendar.readonly`. Sync busy slots cada 15 min. Mostrar slots ocupados en WeekSheet planning para evitar overbook. Encrypted token storage (BR-12).

## Why this matters

Decisión X10a del Discovery: must-have v1. R-T-002 (OAuth verification process) requires early start (sprint 1 of dev).

## Dependencies

- EPIC-AUTH (User table + scopedDb + pgcrypto helpers)

## Out of scope (this epic)

- Outlook / iCal (v2 — EPIC-V2-MORE-CALENDARS)
- Calendar write-back (v2)

## Issues

| ID        | Title                                                                           | SP  | Priority |
| --------- | ------------------------------------------------------------------------------- | --- | -------- |
| ISSUE-090 | GoogleCalendarConnection schema + pgcrypto encrypted tokens + OAuth flow        | 5   | P1       |
| ISSUE-091 | CalendarBusySlot schema + sync cron (15 min) via Inngest                        | 4   | P1       |
| ISSUE-092 | Display busy slots en Week planning + warning en activity scheduling            | 4   | P1       |
| ISSUE-093 | Settings · Integrations UI (SCR-033) + connect/disconnect + manual sync trigger | 2   | P2       |
