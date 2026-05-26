---
id: ISSUE-086
title: Settings · Notifications UI (SCR-030) + mute picker + days_off + weekend_skip
epic: EPIC-CHECKINS
milestone: v1.0
priority: P1
story_points: 5
status: ready
dependencies: [ISSUE-080, ISSUE-081, ISSUE-082]
user_stories: [US-085, US-085b, US-087]
features: [FT-085, FT-143, FT-144]
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

- [ ] Schema update `notification_preferences`:
  - `days_off date[] NOT NULL DEFAULT '{}'` — fechas específicas sin check-ins (FT-143)
  - `weekend_skip boolean NOT NULL DEFAULT false` — granular weekend toggle (FT-144) — reemplaza/precisa `weekend_enabled` previo
  - Migration aditiva (no destructiva)
- [ ] SCR-030 layout per design wireframe:
  - Section HORARIOS DIARIOS: morning/midday/evening time pickers
  - Section SEMANA: weekly_kickoff/review DOW + time
  - Section CANALES: push toggle + email toggle
  - Section "No molestar":
    - Toggle "Saltar fines de semana" (`weekend_skip`) con copy explicativo "Aplica a check-ins diarios (morning/midday/evening). Weekly kickoff/review respetan DOW configurado."
    - Sub-sección "Días específicos sin check-ins" con `DaysOffPicker` multi-fecha + chips removibles (`DayOffChip`) para cada fecha en `days_off`
    - "Mutear notificaciones..." button opens SCR-057
- [ ] CMP-083 NotificationTimeRow: label + native time picker + auto-save on change
- [ ] `DaysOffPicker`: multi-fecha calendar picker (mobile-friendly), confirm appendea fechas (no duplicados, ordenadas asc)
- [ ] `DayOffChip`: chip con fecha en formato corto + X para remover (action removeDayOff)
- [ ] SCR-057 MutePicker modal:
  - Radio options: 1h / 4h / Hoy / 3 días / Indefinido
  - Confirm → set NotificationPref.muted_until accordingly
- [ ] Inverse: "Mutado hasta X" banner en Today si muted_until > now, con "Reactivar" CTA
- [ ] Scheduler Inngest debe leer `days_off` y `weekend_skip` antes de disparar morning/midday/evening:
  - Si fecha actual ∈ `days_off` → skip
  - Si fecha actual cae en sábado/domingo Y `weekend_skip = true` → skip (solo daily check-ins, NO weekly)
- [ ] Schedule cancellation/recreation cuando user cambia time (Inngest re-schedule)

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

Scenario: Agregar día específico sin check-ins
  Given user en SCR-030 sección "No molestar"
  When tap "+ Agregar día" en DaysOffPicker y selecciona 2026-12-25
  Then days_off persiste = ['2026-12-25']
  Y chip aparece en lista
  Cuando el scheduler corre el 2026-12-25, skip morning/midday/evening

Scenario: Remover día específico
  Given days_off = ['2026-12-25']
  When tap X en el chip
  Then days_off = []
  Scheduler vuelve a disparar normal en esa fecha

Scenario: Toggle weekend_skip
  Given weekend_skip = false
  When user toggle on
  Then weekend_skip = true
  Sábado y domingo siguientes: morning/midday/evening NO se envían
  Weekly kickoff/review SÍ respetan DOW configurado (no afectados)

Scenario: Component test DaysOffPicker (RTL)
  Given setup con días vacíos
  When user selecciona 3 fechas en picker y confirma
  Then action updateNotificationPref llamada con days_off = [3 fechas ordenadas asc, deduplicadas]
  Y 3 chips renderizan en la UI
```

## Definition of Done

- [ ] Migration `days_off` + `weekend_skip` aplicada
- [ ] All toggles + pickers funcionales
- [ ] Optimistic save + undo Toast pattern
- [ ] Mute, days_off y weekend_skip respetados en todos los push paths (ISSUE-082 helper)
- [ ] Component test (RTL) del `DaysOffPicker` (add/remove flow)
- [ ] Component test (RTL) del toggle `weekend_skip` (UI + persistencia)
