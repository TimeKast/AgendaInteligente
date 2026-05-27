# `src/lib/ai/` — AI agent runtime

> SSOT for system prompts, the voice-principles linter, crisis detection,
> tool dispatch, and the SSE streaming primitives that back the chat
> route. Issue references: ISSUE-050, ISSUE-050b, ISSUE-050c.

---

## Layout

| Path                                                     | What                                                                    |
| -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `client.ts`                                              | Anthropic SDK singleton + retry wrapper                                 |
| `models.ts`                                              | Model IDs (Sonnet for chat, Haiku for voice-parse) — single import site |
| `telemetry.ts`                                           | Token + latency capture into `usage_meters`                             |
| `voice-linter.ts`                                        | Runtime + offline check for AI-1..6 (voseo, one-Q, praise, emoji, …)    |
| `crisis-detection.ts`                                    | Regex + 11-country crisis lines (AI-8 BLOCKING)                         |
| `crisis-lines.json`                                      | Country → resource mapping (frozen)                                     |
| `sse.ts`                                                 | Server-Sent Events helpers (encoder + event factory)                    |
| `tools/dispatch.ts`                                      | Maps `tool_use` blocks → server actions (scoped to the userId)          |
| `tools/index.ts`                                         | Tool descriptors exposed to the LLM                                     |
| `system-prompts/agent-base.ts`                           | Shared voice + safety preamble (AI-1..8)                                |
| `system-prompts/voice-parser.ts`                         | Haiku prompt: free-text → typed activity slots                          |
| `system-prompts/morning-ritual.ts` / `evening-ritual.ts` | Daily check-ins                                                         |
| `system-prompts/weekly-kickoff.ts` / `weekly-review.ts`  | Sunday kickoff / Saturday review                                        |

---

## Adding a new ritual / prompt

1. Drop a new file in `system-prompts/<ritual>.ts`. Export the prompt
   text + the list of allowed tool names.
2. Compose with `AGENT_BASE` (voice + safety) — never duplicate AI-1..8.
3. Wire it into `app/api/ai/chat/route.ts`'s context resolver so the
   right system prompt is picked per `context=<ritual>` URL param.
4. Add a golden fixture (see below).
5. Run `pnpm ai:eval`. Must stay 100%.

---

## Eval methodology

Tiny harness, no LLM-as-judge framework. We test the cheap and
cheap-to-regress stuff. Two things only:

1. **Voice contract** — `lintAgentReply()` is deterministic. We replay
   candidate replies (real or hand-crafted) against it and assert which
   principles fire.
2. **Forbidden tokens** — voseo (`vos`/`tenés`/`querés`), automatic
   praise (`excelente`/`amazing`), >3 emojis, >3 sentences. All
   surfaced via the linter; the eval just collects results.

### Fixtures

`tests/ai-eval/golden/voice-principles.json` — each entry:

```jsonc
{
  "id": "es-fail-voseo-001", // stable ID
  "lang": "es",
  "reply": "¿Qué tenés pensado hoy?",
  "expect": "fail",
  "principles": ["AI-1"], // required when expect == "fail"
}
```

`expect: "pass"` → linter must return zero violations.
`expect: "fail"` → linter must return at least one violation, AND every
principle in `principles[]` must be among the fired set.

### Runner

```
pnpm ai:eval
```

- Exit `0` only if pass-rate is 100% per suite.
- Voice-principles is a **frozen** contract — any regression blocks the
  prompt change. Don't lower the threshold to ship; fix the prompt.

### What we don't test

- "Quality" of agent replies in absolute terms (no LLM judge).
- Tool-use correctness (covered by component tests on `tools/dispatch`).
- Latency or token budget (covered by `telemetry.ts` + dashboards).

---

## Cost guardrails

Token usage lands in `usage_meters` per request. Watch:

- `chat.tokens_in / chat.tokens_out` — Sonnet is cheap on input but
  output-token spikes flag a prompt that's letting the model ramble
  past the AI-6 sentence budget.
- `voice_parse.tokens_in` — Haiku, should be tiny per request. A spike
  signals the audio upload path is sending raw audio instead of the
  Whisper transcript.

Alert thresholds (manual review for now, no automation):

| Metric             | Yellow  | Red     |
| ------------------ | ------- | ------- |
| Chat output tokens | > 400   | > 800   |
| Voice-parse input  | > 600   | > 1200  |
| Daily $ per user   | > $0.50 | > $1.50 |

When red, first action is `pnpm ai:eval` to confirm the voice
contract hasn't drifted, then inspect the offending prompt.

---

_Linked: ISSUE-050 (chat infra), ISSUE-050b (ritual prompts), ISSUE-050c (this eval)._
