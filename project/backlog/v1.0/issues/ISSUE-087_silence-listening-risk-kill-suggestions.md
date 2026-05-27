---
id: ISSUE-087
title: Silence re-entry (OPS-3) + listening auto-revert (OPS-4) + risk_alert + project_kill_suggestion
epic: EPIC-CHECKINS
milestone: v1.0
priority: P1
story_points: 5
status: completed
completed_date: 2026-05-27
dependencies: [ISSUE-022, ISSUE-054, ISSUE-080, ISSUE-082]
user_stories: [US-100, US-101]
features: [FT-087, FT-101, FT-102]
screens: []
business_rules: [OPS-3, OPS-4]
agents: [backend-specialist]
skills: [/backend]
---

# ISSUE-087 — Silence detection + risk alerts + project kill suggestions

## Overview

Four Inngest functions related to proactive intelligence:

1. Silence re-entry (OPS-3): 3+ días silence → 1 gentle push, then quiet
2. Listening auto-revert (OPS-4): hourly cron reverts intensity
3. Risk alert: activities con deadline próximo sin tiempo agendado → suggest reschedule
4. Project kill suggestion: project con 0 activities done en 21 días → suggest pause/kill

## Tasks

- [ ] Inngest fn `silence.detection.due` cron daily:
  - Query users con `last_active_at < now - 3 days AND silence_re_entry_sent_at IS NULL AND deleted_at IS NULL`
  - For each: enqueueAndSend con type=silence_re_entry, push body: "Acá cuando quieras." (gentle)
  - Set `silence_re_entry_sent_at = now`
- [ ] On user action (any API call): reset `silence_re_entry_sent_at = NULL` + update `last_active_at = now`
- [ ] Inngest fn `listening.mode.expired` cron hourly: revert + push (covered en ISSUE-054)
- [ ] Inngest fn `risk.alert.daily` cron daily:
  - Query activities con `deadline BETWEEN now AND now + 7 days AND status='pending' AND scheduled_date IS NULL`
  - For each unique activity (max 1 per activity ever per deadline): enqueueAndSend type=risk_alert con activity_id payload
  - Push body: "[Activity] vence en N días y no tiene tiempo agendado. ¿La movemos?"
  - Deep link → activity detail
- [ ] Inngest fn `project.kill.suggestion.weekly` cron weekly Mondays:
  - Query projects status=active con 0 activities done en últimos 21 días
  - Skip if already suggested last 30 days (track via field on project)
  - enqueueAndSend type=project_kill_suggestion
  - Push body: "[Project] no se ha movido en 3 semanas. ¿Pausamos o matamos?"

## Acceptance Criteria

```gherkin
Scenario: Silence after 3 days
  Given user last active = 4 days ago
  When silence.detection cron runs
  Then 1 push delivered "Acá cuando quieras"
  silence_re_entry_sent_at = now
  Next day cron → no second push

Scenario: User returns
  Given silence_re_entry_sent_at set
  When user does any action
  Then silence_re_entry_sent_at cleared
  Future silences will re-fire

Scenario: Risk alert
  Given activity con deadline = today + 3 days, scheduled_date = null
  When daily cron runs
  Then push delivered con activity reference

Scenario: Project kill no movement
  Given project P with 0 done activities en 21 días
  When weekly cron runs
  Then push: "P no se ha movido en 3 semanas. ¿Pausamos o matamos?"
  User dismisses → no re-suggest 30 días

Scenario: OPS-1 anti-spam enforced
  Given all 4 cron functions fire same day
  Then max 4 pushes total send (OPS-1)
  Remaining cancelled with status='cancelled_anti_spam'
```

## Definition of Done

- [ ] All 4 Inngest functions tested
- [ ] Anti-spam integration verified
- [ ] OPS-3, OPS-4 fully implemented
- [ ] Risk alert + kill suggestion deep links work
