---
id: ISSUE-041b
title: GoalLink UI — CMP-057 picker + bidirectional display en Activity/Project/Goal detail
epic: EPIC-GOALS
milestone: v1.0
priority: P1
story_points: 1
status: ready
dependencies: [ISSUE-041]
user_stories: [US-041]
features: [FT-041]
screens: [SCR-040, SCR-041, SCR-043]
business_rules: [BR-6]
agents: [frontend-specialist]
skills: [/frontend]
components: [CMP-057]
---

# ISSUE-041b — GoalLink UI

## Overview

Continuation of ISSUE-041. Slice A shipped the backend (schema + linkGoal/unlinkGoal/listLinkedGoals + polymorphic ownership guards + 18 tests). This issue ships the UI: picker component + bidirectional integration en ActivityDetail/GoalDetail screens.

**Dependency note:** este issue requiere que existan ActivityDetail (ISSUE-013/SCR-041) y GoalDetail (ISSUE-042/SCR-043). Si no existen al tomar este issue, primero implementarlos.

## Tasks

- [ ] **CMP-057 GoalLinkPicker:**
  - Multi-select dropdown de goals activos del user (consume `listLinkedGoals` + un new `listMyGoals` query)
  - Search/filter input por title (client-side filtering una vez cargados los goals — usualmente <50 por user)
  - Cada item: scope chip ("Q" para quarter, "A" para year, "5Y", "VIDA") + title
  - Multi-select: tap toggles link state; pending state durante el server roundtrip
  - Empty state: "No hay metas activas. Crea una primero."
- [ ] **Integration ActivityDetail / ProjectDetail:**
  - Sección "Goals vinculados" debajo del header
  - Lista compact: chips con title + scope, × icono para unlink
  - Botón "+ Vincular meta" abre CMP-057 picker en modal/sheet
  - Optimistic UI: el chip aparece inmediatamente, rollback on error
  - Toast: "Meta vinculada" / "Meta desvinculada" con undo 4s
- [ ] **Integration GoalDetail (SCR-043):**
  - Sección "Linked" lista los projects + activities vinculados a esta meta
  - Cada item: target_type icon (📁 project / ✓ activity) + title + tap → navigate al detail correspondiente
  - Reuse `listLinkedGoals` pattern invertido: nuevo helper `listLinkedTargetsForGoal(goalId)` (TBD si requiere nueva action o vive como query directa)

## Acceptance Criteria

```gherkin
Scenario: Link activity to goal via picker
  Given user en ActivityDetail
  And tiene 3 goals activos (Q1 "Lanzar MVP", Year "Aprender alemán", 5y "Independencia")
  When tap "+ Vincular meta" + selecciona "Lanzar MVP"
  Then chip "Q · Lanzar MVP" aparece optimista
  And toast "Meta vinculada" con undo
  And el goal_link persiste tras refresh

Scenario: Unlink via chip
  Given chip "Q · Lanzar MVP" visible en ActivityDetail
  When tap × en el chip
  Then chip se desvanece optimista
  And toast "Meta desvinculada" con undo 4s
  And link row eliminado tras window

Scenario: Bidirectional display
  Given activity X vinculada a goal G
  When user navega a GoalDetail de G
  Then sección "Linked" muestra activity X
  And tap navega a ActivityDetail de X

Scenario: Empty state picker
  Given user sin goals activos
  When abre el picker
  Then muestra empty state "No hay metas activas. Crea una primero." + CTA "Crear meta"

Scenario: Search picker
  Given 8 goals activos
  When user tipea "alemán" en el search
  Then la lista se filtra a goals cuyo title contiene "alemán"
```

## Definition of Done

- [ ] CMP-057 reusable (mismo component para Activity, Project, Goal detail contexts)
- [ ] Optimistic UI + rollback on error tested (component tests con RTL)
- [ ] Bidirectional display validated (E2E: link → navigate → unlink → navigate back)
- [ ] Accessibility: dropdown keyboard navigation + aria-label en chip × button
- [ ] Search/filter funciona sin lag con hasta 50 goals (perf check)

## Notas técnicas

- **Query helper deferred**: `listMyGoals(scope?, status?)` puede vivir aquí (nueva server action) o como query directa via scopedDb si la UI es simple. Decisión al implementar.
- **`listLinkedTargetsForGoal`**: reverse del listLinkedGoals — given a goalId, retorna `{ projects: Project[], activities: Activity[] }`. Posiblemente nueva action en `goal-link.ts` o split en dos.
- **Multi-select**: cada link toggle es un server roundtrip (no batch) — optimistic UI maneja la latencia.
