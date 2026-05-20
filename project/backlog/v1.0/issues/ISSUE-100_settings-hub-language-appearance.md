---
id: ISSUE-100
title: Settings hub (SCR-024) + Language/TZ (SCR-032) + Appearance/dark mode toggle (SCR-034)
epic: EPIC-PWA-SETTINGS
milestone: v1.0
priority: P1
story_points: 4
status: ready
dependencies: [ISSUE-006]
user_stories: [US-122, US-124]
features: [FT-122, FT-124]
screens: [SCR-024, SCR-032, SCR-034]
business_rules: [DD-004]
agents: [frontend-specialist]
skills: [/frontend]
components: [CMP-080, CMP-081, CMP-110, CMP-111]
---

# ISSUE-100 — Settings hub + Language/TZ + Appearance

## Overview

Build Settings root screen (SCR-024) as hub linking to all sub-settings. Implement Language/TZ override (SCR-032) y Appearance with light/dark/system toggle (SCR-034). Resolves OQ-3 con light default.

## Tasks

- [ ] SCR-024 Settings hub layout per wireframe:
  - Sections: CUENTA / CHECK-INS / PREFERENCIAS / PLAN / Privacy & data
  - Each row clickable → sub-screen
  - Display current values as subtitle (e.g., "Morning 08:00 · Evening 21:00")
- [ ] CMP-080 SettingsSection + CMP-081 SettingRow reusable
- [ ] SCR-032 Language & TZ:
  - Language: 2 radio (Español / English) — `setPreferredLanguage(lang)` Server Action
  - Timezone: select with auto-detect + IANA TZ list
  - Server Action `setTimezone(tz)` — also re-schedules Inngest checkins
- [ ] SCR-034 Appearance:
  - 3 radio cards: ☀ Claro (default) / 🌙 Oscuro / 💻 Sistema
  - CMP-110 ThemeToggle wired to set `[data-theme]` on `<html>`
  - Italic serif disclaimer: "El producto fue diseñado en modo claro. El oscuro funciona pero la paleta warm pierde un poco de carácter."
  - Persist en `users.theme_preference` (new column? OR localStorage para v1)
- [ ] Dark mode palette already defined en 14_DESIGN_BRIEF.md — apply via CSS vars swap
- [ ] System mode: detects `prefers-color-scheme` and applies live

## Acceptance Criteria

```gherkin
Scenario: Settings hub navigation
  Given user en /settings
  When she taps "Idioma & zona horaria"
  Then navigates to /settings/language
  And current values shown in subtitle of hub row

Scenario: Change language
  Given user.preferred_language='es'
  When she selects English en SCR-032
  Then DB updated + UI re-renders en English immediately
  Next agent conversation responds en English

Scenario: Change timezone re-schedules checkins
  Given user con morning_time=08:00 en America/Mexico_City
  When she changes TZ to Europe/Madrid
  Then Inngest schedules updated
  Next morning push delivered at 08:00 Madrid time

Scenario: Dark mode toggle
  Given light theme active
  When user taps "Oscuro"
  Then [data-theme="dark"] set on html
  Palette swaps via CSS vars
  Persist preference

Scenario: System mode
  Given user selects "Sistema"
  When OS dark mode enabled
  Then app shows dark
  When user toggles OS theme during session
  Then app updates live without reload
```

## Definition of Done

- [ ] All 3 screens functional
- [ ] Dark palette renders correctly (contrast validated)
- [ ] TZ change triggers Inngest reschedule
- [ ] Idioma switch persists + agente picks up new language

## Technical Notes

- DD-004: light is canonical. Dark is optional toggle.
- OQ-3 resolved: light default. Telemetry collects dark adoption rate; if >40%, reconsider default in v1.5.
- Theme persistence: simplest v1 = `users.theme_preference text` column (light | dark | system). Alternativa localStorage if we want to avoid migration en v1 — decide en implementación.
