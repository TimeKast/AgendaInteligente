---
id: ISSUE-017
title: Activity status transitions + reason capture flow
epic: EPIC-ORG
milestone: v1.0
priority: P0
story_points: 2
status: ready
dependencies: [ISSUE-013, ISSUE-014]
user_stories: [US-026, US-027]
features: [FT-027, FT-028]
screens: [SCR-020, SCR-052]
business_rules: [BR-8]
agents: [backend-specialist, frontend-specialist]
skills: [/backend, /frontend]
components: [CMP-052, CMP-033]
---

# ISSUE-017 — Activity status transitions + reason capture

## Overview

Implement transition validator (BR-8) y reason capture flow. Skipped/blocked statuses requieren reason capture (modal SCR-052). Quick tap = pending → done.

## Tasks

- [ ] Domain function en [src/lib/domain/activity-transitions.ts](../../../../src/lib/domain/activity-transitions.ts):
  - `transitionActivity(activity, toStatus, reason?)` que valida transiciones permitidas (BR-8)
  - Rejects invalid (e.g., done → skipped)
  - Sets `completed_at = now` cuando done
- [ ] Server Action `transitionActivity(id, toStatus, reasonCategory?, reasonText?)`
- [ ] UI:
  - Activity card: tap checkbox → quick pending → done (no modal)
  - Long-press / swipe → SCR-052 modal con opciones
  - Modal includes reason form si toStatus en {skipped, blocked}
  - Blocked requires reason text (validation); skipped reason opcional
  - Done: marcar completed_at
- [ ] If user dismisses reason modal sin elegir reason → status changed pero reason queda null
- [ ] Telemetry event firing: agent challenge check in next turn si intensity_mode allows + reason missing/vague

## Acceptance Criteria

```gherkin
Scenario: Quick tap to done
  Given activity status=pending
  When user taps checkbox
  Then status → done, completed_at = now
  And UI strikes through title

Scenario: Skip con reason
  Given activity status=pending
  When user swipes + selects "Skipped"
  Then modal SCR-052 expands con reason form
  When she selects "No tuve tiempo" + saves
  Then status=skipped, reason_category='time', reason_not_done='No tuve tiempo'

Scenario: Blocked requires reason
  Given user selects "Blocked"
  When form submitted sin reason text
  Then validation error "Decí por qué está bloqueado"

Scenario: Invalid transition rejected
  Given activity status=done
  When transitionActivity(id, 'skipped') called
  Then error "Transición no permitida"

Scenario: Undo
  Given activity just marked done
  When user taps undo toast within 4s
  Then status reverted, completed_at cleared
```

## Definition of Done

- [ ] All BR-8 transitions tested unit
- [ ] UI flow tested E2E
- [ ] Telemetry hooked for future challenge integration
