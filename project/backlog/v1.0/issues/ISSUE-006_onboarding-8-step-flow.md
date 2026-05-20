---
id: ISSUE-006
title: Onboarding 8-step flow + auto-create Inbox + first conversation context
epic: EPIC-AUTH
milestone: v1.0
priority: P0
story_points: 3
status: ready
dependencies: [ISSUE-003, ISSUE-004, ISSUE-005]
user_stories: [US-005]
features: [FT-004]
screens: [SCR-010, SCR-011, SCR-012, SCR-013, SCR-014, SCR-015, SCR-016, SCR-017]
business_rules: [BR-2, BR-3]
agents: [frontend-specialist, backend-specialist]
skills: [/frontend, /backend]
---

# ISSUE-006 — Onboarding 8-step flow

## Overview

Implement the 8-step onboarding flow (SCR-010 through SCR-017) that runs immediately after signup. Last step transitions to `/today`. Auto-create Inbox Category + Inbox Project + NotificationPref + Subscription 'free' atomically.

## Tasks

- [ ] Routes:
  - `/onboarding/language` (SCR-010)
  - `/onboarding/timezone` (SCR-011)
  - `/onboarding/push` (SCR-012)
  - `/onboarding/mic` (SCR-013)
  - `/onboarding/context` (SCR-014)
  - `/onboarding/schedule` (SCR-015)
  - `/onboarding/calendar` (SCR-016)
  - `/onboarding/done` (SCR-017)
- [ ] `(onboarding)` route group with OnboardingLayout (CMP-090) overriding AppShell:
  - Progress dots top (CMP-091)
  - "Saltar" link top-right (excepto step 1)
  - Single column max-width 480px
- [ ] Middleware: if `users.onboarding_completed_at IS NULL`, redirect away from `/today` to next onboarding step
- [ ] Inverse middleware: if `onboarding_completed_at IS NOT NULL`, redirect away from `/onboarding/*` to `/today`
- [ ] Per-step Server Action that:
  - Updates the relevant User/NotificationPref field
  - On step 8 (`done`): atomically create Inbox Category + Inbox Project + Subscription 'free' + set `onboarding_completed_at = now`
  - Trigger Inngest event `user.signed_up` para schedule recurring check-ins
- [ ] Frustration capture (SCR-014) stores text en `users.onboarding_context` (used as agent system prompt context later)
- [ ] Google Calendar opt-in (SCR-016) NOT obligatorio — store user choice; if "Conectar ahora" → redirect to OAuth then back to `/onboarding/done`

## Acceptance Criteria

```gherkin
Scenario: Full onboarding completion
  Given new user just signed up via Google
  When she completes all 8 steps in order
  Then User row updated con language, timezone, intensity_default_until, onboarding_context, onboarding_completed_at
  And NotificationPref row created con check-in times
  And Inbox Category (is_inbox=true) created
  And Inbox Project (is_inbox=true) created en Inbox Category
  And Subscription free created
  And user lands en /today
  And Inngest event `user.signed_up` fired

Scenario: User skips optional steps
  Given user on /onboarding/mic
  When she taps "Saltar"
  Then she moves to /onboarding/context without mic permission granted
  And no error blocks her

Scenario: Required step (language) not skippable
  Given user on /onboarding/language
  When trying to navigate away without selecting
  Then she stays on this step

Scenario: Resume mid-onboarding
  Given user partially completed onboarding (e.g., language + timezone)
  When she closes browser and re-opens app
  Then she lands on /onboarding/push (next pending step)
  And previously selected values persist

Scenario: Already onboarded user
  Given alice has onboarding_completed_at set
  When she visits /onboarding/language
  Then redirected to /today
```

## Definition of Done

- [ ] All 8 routes accessible, navigable forward
- [ ] Backward navigation OK (browser back)
- [ ] Atomic creation of related rows en step 8 (single transaction)
- [ ] Tests for middleware (onboarding incomplete vs complete)
- [ ] Tests for Inngest event fired
- [ ] E2E-001 + E2E-002 passing
- [ ] Microcopy follows voice (italic serif placeholders, no coachy)

## Technical Notes

- Each step is its own page (not single SPA with state) — allows refresh-safe progression
- Step state lives in DB rows progressively updated — not React state
- Atomic step 8: use `db.transaction(async (tx) => { ... })`
- The 3 questions from frustration capture: just 1 textarea in v1; expand to 3 conversational questions in v1.5 si métricas lo justifican
