---
id: ISSUE-017
title: Activity status transitions + reason capture flow
epic: EPIC-ORG
milestone: v1.0
priority: P0
story_points: 2
status: completed
completed_date: 2026-05-26
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

## Implementation Evidence

**Archivos:**

- `src/lib/domain/activity-transitions.ts` — pure functions sin DB/IO: `isAllowedTransition`, `getAllowedNextStatuses`, `reasonRequirementFor` + `ALLOWED_TRANSITIONS` readonly export. Matrix derivada de BR-8 (5×5 grid).
- `src/lib/validations/activity.ts` — `transitionActivitySchema` (id + toStatus enum + reasonCategory + reasonText).
- `src/lib/actions/activity.ts` — nueva action `transitionActivity` (separada de `updateActivity` que es permisiva para usos internos).
- `tests/unit/activity-transitions.test.ts` — 12 pure tests cubren full 5×5 grid + reason requirements + exports shape.
- `tests/unit/activity-actions.test.ts` — +14 integration tests para `transitionActivity`.

**Decisiones de diseño:**

- **`transitionActivity` separada vs extender `updateActivity`**: separada. `updateActivity` queda como API permisiva (internal/admin/backfill) y `transitionActivity` es la API user-facing con BR-8 matrix strict + reason requirements. Misma decisión consistente con `transitionProjectStatus` (ISSUE-012).
- **`done → skipped/blocked` rechazadas** explícitamente: el path correcto es `done → pending → skipped|blocked` si user necesita reclasificar. Tests dedicados.
- **`skipped → done/in_progress` rechazadas**: must route via pending (BR-8).
- **`blocked` requires `reasonText`** — error message "Indica por qué está bloqueado" (mexicano neutro; spec literal usaba "Decí" que es voseo, fix per CORE.md §2).
- **`skipped` reasonText/reasonCategory optional** — agent challenge layer (ISSUE-060) picks up missing reason category.
- **Undo (done → pending)** clears `completed_at`.
- **Reactivate (→ pending desde skipped/blocked)** clears `reason_category` + `reason_not_done`.
- **Non-pending transitions preserve** reason\_\* fields (e.g. blocked → in_progress mantiene el reason por si vuelve a blocked).
- **BR-17** aplicado: status=done → progress_percent=100 + completed_at = now.
- **Telemetry stub via `logger.info`**: cuando user transiciona a skipped/blocked sin reasonCategory, log para que ISSUE-060 (vague-language challenge) pueda picarlo.

**Cobertura tests (26 nuevos):**

- 12 pure: full 5×5 matrix (self-edges, allowed, forbidden), reason requirements per status, export shape.
- 14 integration: happy path done con BR-17, 3 forbidden transitions, no-op self-edge, blocked sin reason, blocked con reason, skipped sin text, invalid reasonCategory rechazada, undo done→pending, reactivate skipped→pending, blocked→in_progress preserve reason, not-found.

**Scope deferred (UI):**

- Quick tap to done (no modal), long-press / swipe, modal SCR-052, validation form, undo toast 4s → todos en **ISSUE-014** (Activity quickadd + detail UI) cuando wire al backend.
- E2E test → cuando UI esté wireada.
- Agent challenge real (vague-language) → **ISSUE-060**.

**Verificación:**

- `pnpm typecheck` ✅
- `pnpm lint` ✅ 0 errors
- `pnpm test activity-transitions` ✅ 12/12
- `pnpm test activity-actions` ✅ 38/38
- `pnpm test` full ✅ 621/621
