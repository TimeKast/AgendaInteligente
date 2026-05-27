---
id: ISSUE-051
title: Conversation + Message schema + chat threading per día
epic: EPIC-AI-AGENT
milestone: v1.0
priority: P0
story_points: 3
status: completed
completed_date: 2026-05-26
dependencies: [ISSUE-002, ISSUE-005]
user_stories: [US-050]
features: [FT-050]
screens: [SCR-023]
business_rules: []
agents: [backend-specialist]
skills: [/database, /backend]
entities: [E-030, E-031]
---

# ISSUE-051 — Conversation + Message schema

## Overview

Migration adds `conversations` y `messages` tables. Threading conventions: 1 conversation per "context-day" pair (e.g., morning_check on 2026-05-19 = 1 conversation). Reads support infinite scroll histórico.

## Tasks

- [ ] Migration: create `conversations` table per E-030
  - channel CHECK IN ('in_app_chat', 'in_app_voice') — extender en v2
  - linked_sheet_type CHECK IN ('day','week','quarter','year','5year','life', NULL)
  - linked_sheet_id (no FK — polymorphic)
- [ ] Migration: create `messages` table per E-031
  - role CHECK IN ('user', 'agent')
  - challenges_fired text[]
  - tool_calls jsonb
- [ ] Index `(conversation_id, created_at)` para fast pagination
- [ ] Index `(user_id, started_at DESC)` para chat history list
- [ ] Server Actions:
  - `getOrCreateConversation(userId, context, linkedSheet?)`: idempotent per (user, context, date)
  - `appendMessage(conversationId, role, content, ...)`
  - `closeConversation(conversationId)`: sets ended_at = now
- [ ] Helper `listMessages(conversationId, { limit, before })` para paginación

## Acceptance Criteria

```gherkin
Scenario: Morning conversation threading
  Given user A en 2026-05-19, no morning conversation yet
  When getOrCreateConversation(A, 'morning_check', { date: 2026-05-19 })
  Then new Conversation row created con channel='in_app_chat'
  And linked_sheet_type='day', linked_sheet_id=daySheetId

Scenario: Resume mid-conversation
  Given conversation from earlier today
  When user re-opens chat
  Then same conversation returned (no new row)

Scenario: Tool calls persisted
  Given agent calls save_sheet_field tool
  When message saved
  Then message.tool_calls jsonb has the call details
```

## Definition of Done

- [ ] Migrations applied
- [ ] CRUD + helpers tested
- [ ] Pagination performant (<100ms p95 for 50-msg page)
- [ ] scopedDb used throughout
