---
id: ISSUE-052
title: Chat UI (SCR-023) — message list + input + SSE streaming
epic: EPIC-AI-AGENT
milestone: v1.0
priority: P0
story_points: 8
status: ready
dependencies: [ISSUE-050, ISSUE-051]
user_stories: [US-050, US-051]
features: [FT-050, FT-051]
screens: [SCR-023]
business_rules: [AI-2, AI-3]
agents: [frontend-specialist, backend-specialist]
skills: [/frontend, /backend]
components: [CMP-070, CMP-071, CMP-072, CMP-073]
---

# ISSUE-052 — Chat UI + SSE streaming

## Overview

Build chat screen (SCR-023) con message list (infinite scroll up), input bar (sticky bottom), SSE streaming de Claude responses. Use serif italic para agent / sans para user (DD-006, no bubble convencional).

## Tasks

- [ ] `/api/ai/chat` Route Handler con SSE streaming
  - Input: { conversation_id?, context, linked_sheet?, message }
  - Stream tokens vía SSE
  - Inserts user message inmediato + agent message progresivamente
  - On stream end, finalize agent message + log challenges_fired + tool_calls
- [ ] Frontend hook `useChatStream(conversationId, context)`:
  - Manages message state
  - Listens to SSE events
  - Optimistic user message insert
- [ ] CMP-070 Conversation: scroll container, infinite-up con `before` param
- [ ] CMP-071 AgentMessage: italic serif ink-soft, no background. Include date dividers.
- [ ] CMP-072 UserMessage: sans ink-primary, subtle bg-elevated padding, right-aligned mobile / left-with-name desktop
- [ ] CMP-073 ChatInput: sticky bottom, textarea autosize, send button, mic button (wired en EPIC-VOICE)
- [ ] Latency target: TTFT (time-to-first-token) <1s, p95 <3s

## Acceptance Criteria

```gherkin
Scenario: Send message + streaming response
  Given chat open
  When user types "estar más enfocado" + sends
  Then user message appears immediately (optimistic)
  And agent response streams in word-by-word (SSE)
  And final message persisted en DB

Scenario: Infinite scroll history
  Given conversation con 200 messages
  When user scrolls up
  Then older messages load in batches of 50
  And smooth scroll

Scenario: Latency target
  Given stable connection
  When user sends message
  Then first agent token arrives < 1.5s (p95)

Scenario: Stream error
  Given Anthropic API returns 500 midway
  Then SSE error event sent
  And UI shows "Algo se rompió. Reintentá." con retry button
  Partial agent message persisted with error flag
```

## Definition of Done

- [ ] SSE streaming working end-to-end
- [ ] Infinite scroll smooth en mobile
- [ ] Date dividers ("Lunes 19 de mayo") entre messages of different días
- [ ] Tests for error handling + retry
- [ ] Lighthouse mobile ≥85 on chat page
