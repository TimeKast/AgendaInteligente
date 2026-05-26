---
id: ISSUE-137
title: Activity.progress_percent — slider en close-day modal + BR-17 enforcement
epic: EPIC-SHEETS
milestone: v1.0
priority: P1
story_points: 2
status: ready
dependencies: [ISSUE-013, ISSUE-139]
user_stories: [US-137]
features: [FT-137]
screens: [SCR-060]
business_rules: [BR-17]
agents: [backend-specialist, frontend-specialist]
skills: [/backend, /frontend]
components: [CMP-140]
---

# ISSUE-137 — `progress_percent` slider en close-day

## Overview

Expone `progress_percent` (0-100) en el flow de close-day como slider visible **solo cuando el user marca una activity como "Avanzada"**. BR-17 enforcement: si status='done', se fuerza a 100; si status='in_progress', persiste el valor del slider; si status='skipped'/'cancelled', queda como histórico pero no se considera "avance real" en reportes.

> El campo `progress_percent smallint NULL CHECK (0..100)` ya se introduce en ISSUE-013 (schema). Este issue cubre **la UI del slider + el flow en close-day + BR-17 enforcement en server action**.

## Tasks

- [ ] Server action `setActivityOutcome({ activityId, outcome: 'done' | 'advanced' | 'skipped', progressPercent?: number, reasonNotDone?: string, reasonCategory?: string })`:
  - `outcome='done'` → status='done', completed_at=now, progress_percent=100 (BR-17 force)
  - `outcome='advanced'` → status='in_progress', progress_percent = `progressPercent` (required, 0-100)
  - `outcome='skipped'` → status='skipped', reason fields opcionales, progress_percent untouched
  - Zod refine: if outcome='advanced' → require progressPercent
- [ ] CMP-140 `ProgressSlider`:
  - Slider 0-100 con step 5 (default 50)
  - Label visible "% avance" + valor actual
  - Solo visible cuando outcome="Avanzada" seleccionado en close-day row
- [ ] Integración en `CloseDayModal` (ver ISSUE-139):
  - Por cada activity row: 3 radio options "Hecha / Avanzada / No la toqué"
  - Si "Avanzada" seleccionado → ProgressSlider aparece debajo (animated)
  - Default value = 50 cuando aparece
- [ ] Stats query update: filtros de "progreso promedio" usan `progress_percent` solo sobre `status='in_progress'` (BR-17)
- [ ] Detail view de activity: campo read-only "Avance: X%" cuando status='in_progress' y progress_percent NOT NULL

## Acceptance Criteria

```gherkin
Scenario: Marcar Avanzada con slider
  Given close-day modal con activity X
  When user selecciona "Avanzada"
  Then ProgressSlider aparece debajo con default 50
  When user mueve a 75 y guarda
  Then action setActivityOutcome(id, 'advanced', 75) llamada
  Activity persiste con status='in_progress', progress_percent=75

Scenario: Marcar Hecha (BR-17)
  Given activity con progress_percent=60 previo
  When user marca "Hecha" en close-day
  Then status='done', completed_at=now, progress_percent forzado a 100

Scenario: Marcar No la toqué
  Given close-day con outcome "No la toqué"
  Then status='skipped', progress_percent NO se modifica (histórico preservado)
  No se requiere reason en este issue (capturada en chat post-close)

Scenario: Validation outcome=advanced sin progress
  Given action recibe outcome='advanced' sin progressPercent
  Then 400 validation_failed con field=progressPercent

Scenario: Range validation
  Given progressPercent = 150
  Then 400 validation_failed (CHECK 0-100)

Scenario: Stats no cuenta status=done para "progreso promedio"
  Given user con 5 activities (3 done con progress=100, 2 in_progress con progress=30,70)
  When query getProgressAverage
  Then resultado = (30+70)/2 = 50 (no incluye los 100 de done) — BR-17

Scenario: Component test (RTL)
  Given CloseDayModal mock con 2 activities
  When user marca "Avanzada" en activity 1
  Then slider aparece (visible en DOM)
  When mueve slider a 80 y submit
  Then action llamada con progressPercent=80
```

## Definition of Done

- [ ] Server action `setActivityOutcome` con tests (≥ 4 casos, incluyendo BR-17 force)
- [ ] CMP-140 ProgressSlider funcional touch-friendly
- [ ] Integración en CloseDayModal (ISSUE-139)
- [ ] BR-17 enforced en server action + stats query
- [ ] Component test (RTL) cubre el flow "Avanzada → slider aparece → persiste"
- [ ] Mobile 375px: slider usable con touch (track ≥ 44px tap target)
