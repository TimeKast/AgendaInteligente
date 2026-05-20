---
id: ISSUE-054
title: Intensity modes (Sharp/Standard/Gentle/Listening) + Settings UI + auto-revert cron
epic: EPIC-AI-AGENT
milestone: v1.0
priority: P1
story_points: 5
status: ready
dependencies: [ISSUE-050, ISSUE-080]
user_stories: [US-052]
features: [FT-052, FT-053]
screens: [SCR-031]
business_rules: [OPS-4]
agents: [backend-specialist, frontend-specialist]
skills: [/backend, /frontend]
components: [CMP-082]
---

# ISSUE-054 — Intensity modes + auto-revert

## Overview

Implement 4 intensity modes (Sharp 🔥 / Standard ⊙ / Gentle 🌱 / Listening 🤍). User changes en Settings · Intensity (SCR-031). New users default Gentle for 14 days. Listening auto-reverts to Standard after 48h.

## Tasks

- [ ] Server Action `setIntensityMode(mode)`:
  - Validate mode enum
  - Update User.intensity_mode
  - If mode='listening', set `intensity_expires_at = now + 48h`
  - If mode != 'listening', clear `intensity_expires_at`
- [ ] SCR-031 UI:
  - 4 radio cards (CMP-082 IntensityCard) per design wireframe
  - Each con emoji + label + descripción 1 línea
  - Currently selected highlighted
  - Listening selection muestra warning modal pre-confirm "Se auto-revierte en 48h"
- [ ] System prompt template var `{{intensity_mode}}` controls challenge frequency en agent-base prompt:
  - Sharp: challenge fires aggressive, no softening
  - Standard: challenge cuando warranted, acknowledge first
  - Gentle: challenge solo en clear vague language
  - Listening: NO challenges, reflective only
- [ ] Inngest function `listening.mode.expired` corre cada hora:
  - Query users con `intensity_mode='listening' AND intensity_expires_at < now`
  - Update each to standard + clear expires_at
  - Send push notification "Volviste a Standard. ¿Todo bien?" (respect anti-spam)
- [ ] New user default: `intensity_mode='gentle'` + `intensity_default_until = signup + 14 days`
  - Cron daily: users con `intensity_default_until < now AND intensity_mode='gentle'` → migrate to 'standard' + send push "Pasaste a Standard"

## Acceptance Criteria

```gherkin
Scenario: Change to Listening
  Given user con intensity_mode='standard'
  When she selects Listening + confirms warning
  Then DB updated: intensity_mode='listening', intensity_expires_at = now + 48h

Scenario: Auto-revert
  Given user en listening con intensity_expires_at = -1 hour
  When cron runs
  Then mode reverted to standard
  And user receives push "Volviste a Standard"

Scenario: New user 14-day gentle default
  Given user signs up day 0
  Then intensity_mode='gentle', intensity_default_until = day 14
  When day 15 cron runs
  Then mode migrates to 'standard' + push notification

Scenario: System prompt reflects mode
  Given user con mode='sharp'
  When chat request made
  Then system prompt rendered con instructions: "Challenges fire freely. Minimal softening."
```

## Definition of Done

- [ ] All 4 modes documented + tested in agent behavior
- [ ] Auto-revert cron tested
- [ ] 14-day gentle migration tested
- [ ] UI accessible (keyboard nav, screen reader)
