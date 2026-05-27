---
id: ISSUE-054b
title: Intensity Settings UI (SCR-031 CMP-082) + push notifications on auto-revert
epic: EPIC-AI-AGENT
milestone: v1.0
priority: P2
story_points: 2
status: ready
dependencies: [ISSUE-054]
user_stories: [US-052]
features: [FT-052, FT-053]
screens: [SCR-031]
business_rules: [OPS-4]
agents: [frontend-specialist]
skills: [/frontend]
components: [CMP-082]
---

# ISSUE-054b — Intensity Settings UI

## Overview

Slice A1 shipped `setIntensityMode` server action + listening-mode-expired cron + gentle-default-expired cron + 8 tests. This issue ships the UI + the push notifications fired on auto-revert.

## Tasks

- [ ] **SCR-031 page `/settings/intensity`:**
  - 4 IntensityCard items (CMP-082): sharp / standard / gentle / listening
  - Each card: emoji + label + 1-line description
  - Currently selected highlighted via accent border
  - Listening selection triggers warning modal: "Se auto-revierte en 48h"
- [ ] CMP-082 IntensityCard component:
  - Radio semantics (`role="radio"`, `aria-checked`)
  - Keyboard nav (arrow keys to move, Space to select)
- [ ] Push notification on listening-mode-expired:
  - Extend `runListeningModeExpired` to enqueue a push event per reverted user
  - Copy ES: "Volviste a Standard. ¿Todo bien?"
  - Copy EN: "You're back to Standard. Doing OK?"
- [ ] Push notification on gentle-default-expired:
  - Copy ES: "Pasaste a Standard."
  - Copy EN: "You're now on Standard."
- [ ] Mobile-first responsive (375px baseline)

## Acceptance Criteria

```gherkin
Scenario: Listening warning modal
  Given user on standard
  When taps Listening card
  Then modal "Se auto-revierte en 48h. ¿Continuar?" shows
  When confirms
  Then mode changes + modal closes

Scenario: Push on auto-revert
  Given user with intensity_expires_at = -1 hour
  When cron runs
  Then mode reverted AND push notification queued
```

## Definition of Done

- [ ] Mobile + desktop tested
- [ ] Component tests for IntensityCard (RTL)
- [ ] Push notifications verified (Inngest dashboard)
- [ ] Accessibility audit (keyboard nav, screen reader)
