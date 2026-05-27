---
id: ISSUE-085
title: Weekly kickoff (Sunday) + weekly review (Saturday) + post-mortem auto-gen
epic: EPIC-CHECKINS
milestone: v1.0
priority: P1
story_points: 5
status: in_progress
slice_a1_completed_date: 2026-05-27
dependencies: [ISSUE-033, ISSUE-084]
user_stories: [US-083, US-084, US-102]
features: [FT-083, FT-084, FT-103]
screens: [SCR-023, SCR-021]
business_rules: []
agents: [backend-specialist]
skills: [/backend]
components: [CMP-065]
---

# ISSUE-085 — Weekly kickoff + review + post-mortem

## Overview

Sunday weekly kickoff (default 18:00) walks user through WeekSheet kickoff fields. Saturday review (default 20:00) walks through review\_\* fields + LLM-generates post-mortem read-only card.

## Tasks

- [ ] Inngest functions:
  - `weekly.kickoff.due` Sunday at `weekly_kickoff_time`
  - `weekly.review.due` Saturday at `weekly_review_time`
- [ ] Chat handler for context=weekly_kickoff:
  - System prompt `weekly-kickoff.ts`
  - 8 questions sequence: one_thing → three_wins → calendar_blocks (con busy slots si Google Cal conectado) → people_to_connect → learn_one → avoid_one → self_care (4 dimensions)
  - Tool calls populate WeekSheet
- [ ] Chat handler for context=weekly_review:
  - System prompt `weekly-review.ts`
  - Phase 1: walk through 7 DaySheets, ask about each win not done
  - Phase 2: review_wins, review_lessons, review_energy slider 1-10, review_one_sentence
  - Phase 3: LLM-generate post-mortem (separate call with broader context: %compliance, top reasons_not_done, suggestions)
- [ ] Helper `generateWeeklyPostMortem(userId, week_starting)`:
  - Aggregate stats: % wins done, % activities completed, top 3 reasons_not_done, energy trend
  - LLM call to summarize patterns + suggest 3 wins next week (linked to active quarter goals si exist)
  - Save to WeekSheet.review_post_mortem jsonb
- [ ] CMP-065 PostMortemCard:
  - Read-only rich card en chat + WeekSheet view
  - Sections: %, patterns, suggestions, next week 3 wins
  - User can ask clarifications en free chat after

## Acceptance Criteria

```gherkin
Scenario: Sunday kickoff completion
  Given user opens chat from Sunday push
  When she completes all 8 questions
  Then WeekSheet kickoff fields populated
  And kickoff_completed_at = now
  Optional: agent suggests "¿Distribuyo las 3 wins en los 7 días?"

Scenario: Saturday review with post-mortem
  Given user opens chat Saturday
  When she completes review questions
  Then LLM generates post-mortem
  Card shown con %, patterns, suggestions
  WeekSheet.review_post_mortem populated, reviewed_at = now

Scenario: Post-mortem references real data
  Given user had 2 wins skipped with reason "no tuve tiempo"
  Then post-mortem mentions: "2 wins postergadas con 'no tiempo' — pero estimated_minutes < 1h"
  Suggestion: "Movés esas a horario protegido?"

Scenario: Post-mortem suggests next week
  Given user has active quarter goal "Lanzar MVP"
  And linked activities incomplete
  Then post-mortem suggests next week's #1 from quarter context
```

## Definition of Done

- [ ] Both flows tested E2E (E2E-006)
- [ ] Post-mortem helpful (subjective — beta tested with 1-2 users)
- [ ] WeekSheet view shows post-mortem card en SCR-021
