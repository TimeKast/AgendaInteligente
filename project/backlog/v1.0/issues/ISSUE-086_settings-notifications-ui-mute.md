---
id: ISSUE-086
title: Settings · Notifications UI (SCR-030) + mute picker (SCR-057)
epic: EPIC-CHECKINS
milestone: v1.0
priority: P1
story_points: 3
status: ready
dependencies: [ISSUE-080, ISSUE-081, ISSUE-082]
user_stories: [US-085, US-087]
features: [FT-085]
screens: [SCR-030, SCR-057]
business_rules: []
agents: [frontend-specialist]
skills: [/frontend]
components: [CMP-083, CMP-085]
---

# ISSUE-086 — Notifications settings UI

## Overview

Build Settings · Notifications screen (SCR-030) con time pickers per check-in slot, channels toggles, weekend toggle, mute button. Mute picker modal (SCR-057) con presets.

## Tasks

- [ ] SCR-030 layout per design wireframe:
  - Section HORARIOS DIARIOS: morning/midday/evening time pickers
  - Toggle weekend_enabled
  - Section SEMANA: weekly_kickoff/review DOW + time
  - Section CANALES: push toggle + email toggle
  - "Mutear notificaciones..." button opens SCR-057
- [ ] CMP-083 NotificationTimeRow: label + native time picker + auto-save on change
- [ ] SCR-057 MutePicker modal:
  - Radio options: 1h / 4h / Hoy / 3 días / Indefinido
  - Confirm → set NotificationPref.muted_until accordingly
- [ ] Inverse: "Mutado hasta X" banner en Today si muted_until > now, con "Reactivar" CTA
- [ ] Schedule cancellation/recreation cuando user changes time (Inngest re-schedule)

## Acceptance Criteria

```gherkin
Scenario: Change morning time
  Given user en SCR-030
  When she changes morning_time from 08:00 to 07:30
  Then saved con optimistic save + Toast "Guardado"
  Inngest schedule updated
  Next morning push at 07:30

Scenario: Mute hoy
  Given user opens MutePicker selects "Hoy"
  Then muted_until = end of today user TZ
  Banner appears en Today
  No pushes envíados hasta mañana

Scenario: Reactivar
  Given muted_until set
  When user taps "Reactivar"
  Then muted_until = null
  Pushes resume per schedule
```

## Definition of Done

- [ ] All toggles + pickers functional
- [ ] Optimistic save + undo Toast pattern
- [ ] Mute respect en all push paths (ISSUE-082 helper)
