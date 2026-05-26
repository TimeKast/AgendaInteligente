---
id: ISSUE-021
title: time_blocks multi-select (morning / afternoon / evening) — DEPRECATED
epic: EPIC-TIME
milestone: v1.0
priority: P1
story_points: 0
status: deprecated
deprecation_reason: |
  La iteración prototipo invalidó el modelo time_blocks aspiracionales. La combinación
  `scheduled_time` + `duration_minutes` cubre todos los casos de uso del prototipo sin
  requerir bloques semánticos morning/afternoon/evening. Ver 06_DATA_MODEL.md §E-005
  ("Removed in prototype iteration") y BR-16. Las pool tasks se agrupan ahora por sección
  "Backlog / pool" sin sub-bloques.
dependencies: [ISSUE-020]
user_stories: [US-022]
features: []
screens: []
business_rules: []
agents: []
skills: []
---

# ISSUE-021 — DEPRECATED (prototipo)

## Estado

**DEPRECATED** — no implementar.

## Razón

La iteración del prototipo eliminó el concepto de `time_blocks` (morning/afternoon/evening) como atributo de Activity. La combinación `scheduled_time` (NULL o time) + `duration_minutes` cubre el 100% de los casos:

- **Anchored:** `scheduled_time != null` + `duration_minutes != null` → bloque dibujado en grid horario
- **Pool / sin hora:** `scheduled_time = null` → aparece en sección "Backlog / pool" del día, sin sub-bloques

Ver `06_DATA_MODEL.md §E-005` (sección "Removed in prototype iteration") y BR-16.

## Referencias migradas

- US-022 mantiene contrato semántico ("agrupar pool tasks por momento del día") pero la implementación se cubre en ISSUE-025 (Today screen layout) usando el grid horario, sin columna `time_blocks` en DB.
- FT-022 obsoleto.

## Acción del equipo

- NO crear columna `time_blocks text[]` en la migration de Activity (ISSUE-013).
- NO implementar UI de chips Morning/Afternoon/Evening.
- Si surge necesidad real de agrupar pool tasks por momento, re-abrir como issue nuevo bajo iteración v1.5.
