---
id: ISSUE-025
title: Today screen layout (SCR-020) + ActivityList groupBy time_block
epic: EPIC-TIME
milestone: v1.0
priority: P0
story_points: 5
status: ready
dependencies: [ISSUE-014, ISSUE-017, ISSUE-020, ISSUE-021, ISSUE-022, ISSUE-023]
user_stories: [US-020, US-021, US-022, US-023, US-024, US-025, US-026]
features: [FT-020, FT-022, FT-027]
screens: [SCR-020]
business_rules: []
agents: [frontend-specialist]
skills: [/frontend]
components: [CMP-051]
---

# ISSUE-025 — Today screen complete layout

## Overview

Build the complete Today screen (SCR-020) layout. Combines DaySheet morning view (placeholder hasta EPIC-SHEETS) + ActivityList grouped by time blocks + FAB mic. Most critical screen of the product.

## Tasks

- [ ] Layout per wireframe SCR-020:
  - Header con "Lunes, 19 de mayo" (date format per locale)
  - DaySheet morning section (sheet UI viene de ISSUE-031 en EPIC-SHEETS; here just structural placeholder)
  - ActivityList grouped (CMP-051):
    - "MAÑANA" section: scheduled_time NOT NULL en hours 5-12 OR time_block contains 'morning'
    - "TARDE" section: hours 12-18 OR time_block 'afternoon'
    - "NOCHE" section: hours 18-24 OR time_block 'evening'
    - "EN CUALQUIER MOMENTO" section: scheduled_time IS NULL AND time_blocks empty
  - FAB mic 56px bottom-right
- [ ] Empty states italic serif per DD-pattern-8
- [ ] Drag-to-reorder activities within section (ISSUE-011 dnd-kit pattern reused)
- [ ] Pull-to-refresh mobile (Server Component refresh)
- [ ] Date navigation: tap header date → calendar picker para "go to past day" (read-only edit-able)
- [ ] Performance: paginate if >50 activities en single day

## Acceptance Criteria

```gherkin
Scenario: Today shows activities grouped
  Given user con 5 activities hoy distributed across mornings/afternoons/evenings
  Then Today muestra 3 sections con activities en cada grupo
  Sorted by time within section

Scenario: Empty Today
  Given user sin activities para hoy
  Then empty state italic serif: "No hay nada para hoy todavía. Si querés, agregá con ↓ o dictá con 🎙️."

Scenario: Navigate past day
  Given today is Mon 19 May
  When user taps header + selects "Fri 16 May"
  Then Today view loads with Friday's activities and DaySheet
  And UI indicates "Viendo viernes 16 (pasado)" subtle

Scenario: FAB visibility
  Given Today is scrolled down
  Then FAB mic remains visible above bottom nav
  And tapping it opens voice capture (ISSUE-070 wired)
```

## Definition of Done

- [ ] Screen responsive mobile + desktop
- [ ] Time block grouping logic tested
- [ ] Drag reorder works mobile
- [ ] Performance: Today renders <500ms client even con 30 activities
- [ ] Lighthouse PWA score ≥90 en mobile
