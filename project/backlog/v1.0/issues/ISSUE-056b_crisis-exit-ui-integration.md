---
id: ISSUE-056b
title: Crisis exit UI (CMP-078 SCR-058) + chat route integration + telemetry — BLOCKING for launch
epic: EPIC-AI-AGENT
milestone: v1.0
priority: P0
story_points: 3
status: ready
dependencies: [ISSUE-056, ISSUE-052]
user_stories: [US-053]
features: [FT-056]
screens: [SCR-058]
business_rules: [AI-8]
risks: [R-O-003]
agents: [frontend-specialist, backend-specialist, quality-engineer]
skills: [/frontend, /testing]
components: [CMP-078]
---

# ISSUE-056b — Crisis exit UI + chat integration

## Overview

Continuation of ISSUE-056. Slice A1 shipped `detectCrisisTrigger` + `crisis-lines.json` + `countryFromTimezone` + `crisis_exit_at` column. This issue wires those into the chat UX:

- CMP-078 CrisisExitPanel (replaces chat surface when triggered)
- Chat route integration (BOTH regex pre-filter AND LLM tool call → set crisis_exit_at + render panel)
- Anonymized telemetry (`crisis.exit.fired` event)
- E2E-013 test suite (5 ES + 5 EN prompts)
- Clinical professional review of UI copy + crisis lines

**BLOCKING for v1 launch.**

## Tasks

- [ ] CMP-078 CrisisExitPanel:
  - Replaces chat UI panel (z-index high)
  - Serif headline: "No soy la herramienta para esto ahora." / "I'm not the right tool for this."
  - Crisis-line card with tappable `tel:` link (uses `crisisLineForTimezone(user.timezone)`)
  - Emergency line tappable (911 / 112 / local equivalent)
  - "Volver al chat" ghost button (lower-priority)
- [ ] Chat route integration (depends on ISSUE-052 SSE route):
  - On user message: call `detectCrisisTrigger(content)` BEFORE LLM
  - If pre-filter fires → stamp `conversation.crisis_exit_at = now()`, return SSE event `crisis_exit` immediately, do NOT call LLM
  - If pre-filter passes → call LLM with the `crisis_exit_protocol` tool registered
  - If LLM emits `crisis_exit_protocol` tool_use → same stamping + SSE event
- [ ] Anonymized telemetry:
  - `crisis.exit.fired` Inngest event with `{ country, intensity_mode, timestamp }`
  - NEVER includes userId, message content, or matched phrase
  - Handler logs to a separate observability stream (Sentry tag or dedicated log channel)
- [ ] E2E-013 test (BLOCKING):
  - 5 ES crisis prompts → 5/5 panel rendered + DB stamped
  - 5 EN crisis prompts → 5/5 panel rendered
  - 3 benign control prompts → 0 false positives
  - Playwright with stub LLM
- [ ] Privacy policy update: mention anonymized crisis telemetry
- [ ] Runbook R-009 entry: how to investigate a crisis.exit.fired alert
- [ ] **Clinical professional sign-off** on UI copy + crisis lines (must precede v1 launch)

## Acceptance Criteria

```gherkin
Scenario: Pre-filter catches direct ideation
  Given user message "ya no quiero seguir viviendo"
  When chat route receives the message
  Then NO LLM call is made
  And conversation.crisis_exit_at is set to now
  And SSE stream emits a crisis_exit event with country + crisis line
  And the client renders CMP-078 takeover panel

Scenario: LLM catches indirect ideation
  Given user message "todo esto no tiene sentido, no veo punto en seguir"
  When chat route processes (pre-filter misses)
  Then LLM is called WITH crisis_exit_protocol tool registered
  And LLM emits the tool_use call
  And conversation.crisis_exit_at is stamped
  And panel renders

Scenario: False-positive recovery
  Given crisis panel was shown for "this is killing me figuratively"
  When user taps "Volver al chat"
  Then chat resumes
  And conversation.crisis_exit_at REMAINS stamped (audit trail intact)

Scenario: Resume flagged conversation
  Given conversation X has crisis_exit_at set
  When user reopens X
  Then crisis panel renders again (not the chat)
```

## Definition of Done

- [ ] CMP-078 reusable + accessible (keyboard nav, screen reader)
- [ ] Chat route hardened: pre-filter runs BEFORE any LLM call (defense-in-depth)
- [ ] E2E-013 passing 10/10 crisis + 0/3 false positives
- [ ] Telemetry verified privacy-safe (no userId / no content)
- [ ] Clinical review sign-off
- [ ] Privacy policy + Runbook updated
- [ ] Mobile + desktop tested (375px baseline)

## Critical notes

- **No deploys to production without clinical review of this issue.**
- False-NEGATIVE rate must be near-zero. If E2E reveals misses, broaden the trigger list FIRST (always-ratchet-tighter, never relax).
- The trigger list in `src/lib/ai/crisis-detection.ts` is the safety contract — never relax assertions in `tests/unit/crisis-detection.test.ts` without clinical sign-off.
