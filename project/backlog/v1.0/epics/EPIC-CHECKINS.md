---
id: EPIC-CHECKINS
title: Check-ins automáticos (Inngest scheduler + anti-spam + push)
milestone: v1.0
priority: P1
status: ready
story_points: 28
issues: [ISSUE-080, ISSUE-081, ISSUE-082, ISSUE-083, ISSUE-084, ISSUE-085, ISSUE-086, ISSUE-087]
features:
  [FT-080, FT-081, FT-082, FT-083, FT-084, FT-085, FT-086, FT-087, FT-088, FT-089, FT-103, FT-104]
user_stories: [US-080, US-081, US-082, US-083, US-084, US-085, US-086, US-087, US-102, US-103]
business_rules: [OPS-1, OPS-2, OPS-3]
risks: [R-T-009]
screens: [SCR-030, SCR-057, SCR-055]
---

# EPIC-CHECKINS — Check-ins automáticos

## Goal

Per-user scheduled check-ins (morning/midday/evening + weekly kickoff/review) que persiguen al user. Anti-spam guardrails (OPS-1..3). Web Push notifications. Weekly post-mortem auto-generation.

## Why this matters

North Star Pillar 2: accountability activa. Sin check-ins, agente queda passive. R-T-009 (iOS push limits) requires mitigation.

## Dependencies

- EPIC-AUTH (NotificationPref + Inngest event `user.signed_up`)
- EPIC-SHEETS (DaySheet + WeekSheet to populate)
- EPIC-AI-AGENT (chat para que check-ins abran)
- EPIC-PWA-SETTINGS (Web Push subscription handling — but core push infra puede arrancar acá)

## Issues

| ID        | Title                                                                                                            | SP  | Priority |
| --------- | ---------------------------------------------------------------------------------------------------------------- | --- | -------- |
| ISSUE-080 | Inngest setup + `/api/inngest` route + event schemas + `user.signed_up` recurring schedule                       | 5   | P1       |
| ISSUE-081 | Web Push subscription endpoint + service worker integration                                                      | 3   | P0       |
| ISSUE-082 | ProactiveTask schema + send-push helper con anti-spam (OPS-1) enforcement                                        | 3   | P1       |
| ISSUE-083 | Morning check-in flow (Inngest fn + deep link + agent system prompt)                                             | 4   | P1       |
| ISSUE-084 | Midday check-in (conditional on wins_planned pending) + evening check-in                                         | 4   | P1       |
| ISSUE-085 | Weekly kickoff (Sunday) + weekly review (Saturday) + post-mortem auto-gen (FT-103)                               | 5   | P1       |
| ISSUE-086 | Settings · Notifications UI (SCR-030) + mute picker (SCR-057)                                                    | 3   | P1       |
| ISSUE-087 | Silence re-entry (OPS-3) + listening auto-revert (OPS-4) + risk_alert + project_kill_suggestion (FT-101, FT-102) | 5   | P1       |
