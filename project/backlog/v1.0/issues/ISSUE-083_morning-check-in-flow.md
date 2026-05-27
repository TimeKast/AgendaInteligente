---
id: ISSUE-083
title: Morning check-in flow (Inngest fn + deep link + agent system prompt)
epic: EPIC-CHECKINS
milestone: v1.0
priority: P1
story_points: 4
status: in_progress
slice_a1_completed_date: 2026-05-27
dependencies: [ISSUE-031, ISSUE-050, ISSUE-052, ISSUE-080, ISSUE-082]
user_stories: [US-080, US-030]
features: [FT-080, FT-030]
screens: [SCR-023]
business_rules: []
agents: [backend-specialist, frontend-specialist]
skills: [/backend, /frontend]
---

# ISSUE-083 — Morning check-in flow

## Overview

End-to-end morning ritual flow: Inngest cron at user's morning_time → enqueueAndSend push → user taps deep link → chat opens con context=morning_check → agent walks through 6 questions → DaySheet morning fields populated.

## Tasks

- [ ] Inngest function `morning.check_in.due` handler:
  - Check user not deleted, not muted
  - enqueueAndSend with payload `{ context: 'morning_check', date: today_in_user_tz }`
  - Push body: "Buenos días. ¿Cuál es la intención de hoy?" (idioma per user)
- [ ] Push click → deep link `/chat?context=morning_check&date=YYYY-MM-DD`
- [ ] Chat route (ISSUE-052) reads `context` query param, loads `morning-ritual.ts` system prompt
- [ ] Agent walks through 6 questions sequence:
  1. intention
  2. gratitude
  3. identity_statement
  4. 3 wins (in one or 3 turns — agent decides)
  5. avoidance
  6. energy (3 sliders OR 3 quick numeric prompts)
- [ ] After each user response, agent uses `save_sheet_field` tool to persist
- [ ] After 6th question, agent closes: "Guardado. Te busco al mediodía." + sets DaySheet.morning_completed_at = now
- [ ] If user abandons midway: agent saves partial; resume same day uses same conversation
- [ ] If user reopens conversation later (next day), agent recognizes "we left off" + offers to continue or restart

## Acceptance Criteria

```gherkin
Scenario: Happy path
  Given user con morning_time=08:00
  When 08:00 arrives
  Then push notification delivered con expected copy
  User taps → /chat?context=morning_check opens
  Agent: "Buenos días. ¿Cuál es la intención de hoy?"
  User responds → agent saves intention via tool → asks next
  ... continues through 6 questions
  Agent closes con "Te busco al mediodía"
  DaySheet morning fields populated, morning_completed_at = now

Scenario: User abandons midway
  Given user en question 4 (3 wins)
  When she closes browser
  Then partial fields saved
  When she reopens chat later same day
  Then agent: "Quedamos en los 3 wins de hoy. ¿Seguimos?"

Scenario: Already completed
  Given user already completed morning ritual hoy
  When she opens chat
  Then agent does NOT restart ritual
  Free chat with context aware of completed sheet
```

## Definition of Done

- [ ] Full E2E flow tested
- [ ] Vague-language challenges fire en intensity sharp/standard (interactive with ISSUE-060)
- [ ] DaySheet correctly populated
- [ ] Resume mid-ritual works
- [ ] E2E-005 passing
