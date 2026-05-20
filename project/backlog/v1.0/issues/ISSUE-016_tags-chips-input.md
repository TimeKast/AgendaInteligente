---
id: ISSUE-016
title: Tags chips input + autocomplete + lowercase normalize
epic: EPIC-ORG
milestone: v1.0
priority: P2
story_points: 2
status: ready
dependencies: [ISSUE-013, ISSUE-014]
user_stories: [US-018]
features: [FT-014]
screens: [SCR-040, SCR-051]
business_rules: []
agents: [frontend-specialist]
skills: [/frontend]
components: [CMP-113]
---

# ISSUE-016 — Tags chips input

## Overview

Add tags as chip-pill UI en ActivityDetail + ActivityQuickAdd. Autocomplete from user's previously-used tags. Normalize lowercase.

## Tasks

- [ ] CMP-113 TagChips component:
  - Render existing tags as pill chips (radius-pill, caption font)
  - "+ tag" input opens text field con autocomplete dropdown
  - Enter or comma → add tag
  - Click chip × → remove
- [ ] Normalization en Zod: lowercase, trim, max 30 chars per tag, max 10 tags por activity
- [ ] Autocomplete: query distinct tags from user's activities (GIN index on tags array)
- [ ] No global tag registry table — tags son solo array de strings en activity row

## Acceptance Criteria

```gherkin
Scenario: Add tags
  Given activity sin tags
  When user types "URGENTE, follow-up"
  Then 2 tags inserted as ["urgente", "follow-up"] (lowercase)

Scenario: Autocomplete
  Given user has activities con tags ["urgente", "review", "client"]
  When user types "urg" en new activity tag input
  Then dropdown shows "urgente" as suggestion

Scenario: Duplicate prevention
  Given activity already has tag "urgente"
  When user tries to add "URGENTE" again
  Then no duplicate added

Scenario: Max limit
  Given activity has 10 tags
  When user tries 11th
  Then UI prevents + error "Máximo 10 tags"
```

## Definition of Done

- [ ] Component works mobile + desktop
- [ ] Autocomplete uses indexed query (GIN)
- [ ] Normalization tested
