---
id: ISSUE-103
title: Settings · Billing placeholder + UsageMeter display (plan info sin Stripe)
epic: EPIC-PWA-SETTINGS
milestone: v1.0
priority: P2
story_points: 3
status: ready
dependencies: [ISSUE-002]
user_stories: [US-110, US-111]
features: [FT-110, FT-111, FT-112, FT-113]
screens: [SCR-036]
business_rules: []
agents: [frontend-specialist, backend-specialist]
skills: [/frontend, /backend]
components: [CMP-086]
---

# ISSUE-103 — Billing placeholder + Usage display

## Overview

Settings · Billing (SCR-036) muestra current plan + UsageMeter stats. Sin Stripe activo en v1. Placeholder copy "Pricing TBD" o "Plan free durante beta". Estructura preparada para v2 EPIC-V2-STRIPE-BILLING.

## Tasks

- [ ] SCR-036 layout:
  - Header serif h2 "Plan"
  - Plan card:
    - Plan name "Free"
    - Status badge "Active"
    - Description "Acceso completo durante beta. Pricing por definir."
    - Member since date
  - Usage section CMP-086 UsageMeter:
    - This month's AI calls: 2,341
    - This month's voice minutes: 8.4
    - This month's Whisper seconds: 234
  - Future plans placeholder:
    - "Pricing en desarrollo. Cuando salga, te avisamos por email."
    - No CTA "Upgrade" hasta v2
- [ ] Server Action `getCurrentUsage(userId)` returns current month bucket from `usage_meters`
- [ ] Inngest cron `usage.meter.bucket.rotate` monthly:
  - At start of month, current month's bucket "closes" (no special action, just stops incrementing)
  - New bucket auto-created on first usage event
- [ ] Migration: ensure `plans` table seeded con 'free' plan (already in ISSUE-002)
- [ ] Server Action `assignFreeAtSignup(userId)` ya en ISSUE-006 onboarding flow

## Acceptance Criteria

```gherkin
Scenario: View billing page
  Given user en /settings/billing
  Then sees plan = Free, member since X date
  Usage card shows current month stats

Scenario: Usage updates live
  Given user just sent 1 LLM call
  When she refreshes /settings/billing
  Then AI calls count incremented

Scenario: Month rotation
  Given new month starts
  When user does first action of month
  Then new usage_meters row created (period_start = first of new month)

Scenario: No upgrade CTA v1
  Given billing screen
  Then NO "Upgrade" or "Subscribe" buttons
  Placeholder text only
```

## Definition of Done

- [ ] Screen functional
- [ ] UsageMeter display accurate
- [ ] Monthly bucket rotation tested
- [ ] No leaky billing UI v1
