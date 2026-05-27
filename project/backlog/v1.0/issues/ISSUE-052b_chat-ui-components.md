---
id: ISSUE-052b
title: Chat UI components (CMP-070..073) + useChatStream hook + multi-turn tool loop
epic: EPIC-AI-AGENT
milestone: v1.0
priority: P0
story_points: 5
status: ready
dependencies: [ISSUE-052]
user_stories: [US-050, US-051]
features: [FT-050, FT-051]
screens: [SCR-023]
business_rules: [AI-2, AI-3]
agents: [frontend-specialist]
skills: [/frontend]
components: [CMP-070, CMP-071, CMP-072, CMP-073]
---

# ISSUE-052b — Chat UI + multi-turn tool loop

## Overview

Slice A1 (ISSUE-052) shipped the `POST /api/ai/chat` SSE route with single-turn streaming + post-stream tool dispatch + crisis pre-filter. This issue ships the UI + the LLM follow-up turn after tool results.

## Tasks

- [ ] Multi-turn tool loop in `/api/ai/chat`:
  - When the LLM emits `tool_use`, run `dispatchAll`, then RE-INVOKE
    `client.messages.stream` with the original messages + assistant
    message + tool_result blocks → stream the follow-up reply.
  - Loop until no `tool_use` blocks remain (cap at 4 rounds to bound cost).
- [ ] `useChatStream(conversationId, context)` hook (`src/hooks/use-chat-stream.ts`):
  - Manages message state with optimistic insert
  - Wraps `EventSource` over `POST /api/ai/chat` (returns a `ReadableStream`)
  - Reducer for SSE events: `user_message`, `token`, `tool_result`, `crisis_exit`, `done`, `error`
- [ ] CMP-070 Conversation: scroll container, infinite-up paginate via `listMessages` action.
- [ ] CMP-071 AgentMessage: italic serif ink-soft, no background. Date dividers.
- [ ] CMP-072 UserMessage: sans ink-primary, subtle bg-elevated, right-aligned mobile / left-with-name desktop.
- [ ] CMP-073 ChatInput: sticky bottom, textarea autosize, send button. Mic button stub (wired in EPIC-VOICE).
- [ ] Latency: TTFT <1.5s p95.

## Acceptance Criteria

```gherkin
Scenario: Multi-turn tool loop
  Given LLM emits tool_use(save_sheet_field, ...)
  When chat route processes
  Then dispatchAll runs the tool
  And LLM is RE-invoked with the tool_result
  And the follow-up text streams to the client
  And final agent message persisted with full multi-block content

Scenario: Optimistic insert
  Given user sends a message
  Then user message appears immediately in the UI
  And on `user_message` SSE event the optimistic message gets its real id

Scenario: Infinite scroll history
  Given 200 messages in conversation
  When user scrolls up
  Then older messages load in batches of 50 via listMessages
  And cursor (nextCursor) advances correctly

Scenario: Stream error UI
  Given Anthropic 500s mid-stream
  When SSE `error` event arrives
  Then UI shows "Algo se rompió. Reintentá." with retry button
```

## Definition of Done

- [ ] Multi-turn loop bounded (max 4 rounds)
- [ ] useChatStream hook + 4 components tested with RTL
- [ ] Optimistic UI + rollback on error
- [ ] Infinite scroll smooth on mobile
- [ ] Latency target met (TTFT < 1.5s p95)
- [ ] Date dividers between days
