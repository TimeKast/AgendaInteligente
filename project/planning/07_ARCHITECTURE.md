# 07 — Architecture

> **Source:** [00_DISCOVERY_BRIEF.md §8](./00_DISCOVERY_BRIEF.md) + [05_BUSINESS_RULES.md](./05_BUSINESS_RULES.md) + [06_DATA_MODEL.md](./06_DATA_MODEL.md)
> **Scope:** v1 MVP arquitectura + ganchos para v1.5/v2 sin migrations destructivas

---

## High-level overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                       BROWSER / PWA (Service Worker)                │
│  ┌───────────────┐  ┌─────────────────┐  ┌──────────────────────┐  │
│  │  Next.js RSC  │  │  Web Speech API │  │  Web Push (FCM/APNs) │  │
│  │     UI        │  │     STT primary │  │   Notifications      │  │
│  └───────────────┘  └─────────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
            │ HTTPS                            │ HTTPS
            ▼                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      VERCEL EDGE / NODE RUNTIME                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │             Next.js App Router (Server Components + RSC)       │ │
│  │   ┌──────────────┐  ┌────────────────┐  ┌──────────────────┐  │ │
│  │   │  API Routes  │  │ Server Actions │  │  Middleware:     │  │ │
│  │   │ /api/*       │  │ (mutations)    │  │  - Auth check    │  │ │
│  │   │              │  │                │  │  - Rate limit    │  │ │
│  │   │              │  │                │  │  - Tenant scope  │  │ │
│  │   └──────────────┘  └────────────────┘  └──────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
       │                │                │             │
       ▼                ▼                ▼             ▼
   ┌─────────┐    ┌──────────┐    ┌───────────┐  ┌──────────┐
   │  Neon   │    │ Anthropic│    │ OpenAI    │  │ Google   │
   │ Postgres│    │ Claude   │    │ Whisper   │  │ Calendar │
   │ pgvector│    │ Sonnet   │    │ API       │  │ API      │
   └─────────┘    └──────────┘    └───────────┘  └──────────┘
       │                                                ▲
       ▼                                                │
   ┌─────────┐    ┌──────────┐    ┌───────────┐         │
   │ Upstash │    │ Inngest  │    │ Resend    │         │
   │ Redis   │    │ Jobs     │    │ Email     │         │
   │ (rate   │    │ (cron +  │────┘           │         │
   │  limit) │    │  events) │                │         │
   └─────────┘    └──────────┘────────────────┴─────────┘
                       │
                       │ scheduled
                       ▼
              ┌──────────────────────┐
              │  Background jobs:    │
              │  - Check-in scheduler│
              │  - Anti-spam window  │
              │  - Listening revert  │
              │  - GCal sync 15min   │
              │  - Recurrence expand │
              │  - Silence detect    │
              │  - Weekly post-mortem│
              │  - Embeddings (v1.5) │
              └──────────────────────┘
```

---

## Layered architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Presentation Layer                     │
│  src/app/(protected)/today/page.tsx  (RSC)              │
│  src/app/(protected)/today/_components/MicButton.tsx    │
│  src/app/api/voice/transcribe/route.ts                  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Application Layer                      │
│  src/lib/actions/* (Server Actions)                     │
│  src/lib/services/* (orchestration: voice→parse→save)  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Domain Layer                          │
│  src/lib/domain/* (pure functions, no IO)               │
│   - activity.ts (transitions BR-8, recurrence BR-11)   │
│   - sheet.ts (week_starting calc, periods)             │
│   - goal.ts (BR-9 status derivation)                   │
│   - challenge.ts (5 challenge detectors)               │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                Infrastructure Layer                     │
│  src/lib/db/* (Drizzle schema + queries)                │
│  src/lib/ai/* (Claude client, tool defs, parsing)       │
│  src/lib/integrations/google-calendar.ts                │
│  src/lib/jobs/* (Inngest functions)                     │
│  src/lib/email/* (Resend client)                        │
│  src/lib/push/* (Web Push helpers)                      │
└─────────────────────────────────────────────────────────┘
```

---

## Module / package structure

Following TimeKast SK §6 Project Structure + project-specific additions:

```
src/
├── app/
│   ├── (auth)/                          # Public pages
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (protected)/                     # Authed pages (middleware-gated)
│   │   ├── today/
│   │   │   ├── page.tsx
│   │   │   └── _components/{MicButton,ActivityList,DaySheetView}.tsx
│   │   ├── week/page.tsx
│   │   ├── goals/page.tsx
│   │   ├── chat/page.tsx
│   │   └── settings/
│   │       ├── notifications/page.tsx
│   │       ├── intensity/page.tsx
│   │       ├── integrations/page.tsx
│   │       └── account/page.tsx
│   ├── (legal)/
│   │   ├── terms/page.tsx
│   │   └── privacy/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts  # NextAuth
│   │   ├── voice/transcribe/route.ts    # Whisper fallback
│   │   ├── ai/chat/route.ts             # Streaming chat with Claude
│   │   ├── ai/parse-task/route.ts       # Voice → structured task
│   │   ├── google-calendar/connect/route.ts
│   │   ├── google-calendar/disconnect/route.ts
│   │   ├── push/subscribe/route.ts      # Web Push subscription
│   │   └── inngest/route.ts             # Inngest webhook entrypoint
│   ├── layout.tsx
│   └── page.tsx                          # Landing
│
├── components/
│   ├── ui/                              # shadcn/ui primitives
│   ├── common/{ErrorBoundary,EmptyState,...}
│   ├── layout/{Header,BottomNav,SidebarDesktop}
│   ├── form/                            # Form kit (react-hook-form wrappers)
│   ├── providers/{ThemeProvider,PushProvider,...}
│   ├── activity/{ActivityCard,ActivityForm,SubtaskList,...}
│   ├── sheet/{DaySheetView,WeekSheetView,SheetField,...}
│   ├── goal/{GoalCard,GoalReviewModal,...}
│   └── chat/{Conversation,Message,MicCaptureSheet,VoicePreview}
│
├── lib/
│   ├── actions/                         # Server Actions
│   │   ├── activity.ts                  # create/update/delete activity
│   │   ├── project.ts
│   │   ├── category.ts
│   │   ├── goal.ts
│   │   ├── sheet.ts                     # update sheet field
│   │   ├── notification-pref.ts
│   │   └── account.ts
│   ├── services/                        # Orchestration
│   │   ├── voice-capture.ts             # blob → STT → LLM parse → preview
│   │   ├── morning-check-in.ts          # Schedule + conversation flow
│   │   ├── weekly-review.ts             # Generate post-mortem
│   │   ├── pattern-detection.ts         # v1.5
│   │   └── google-calendar-sync.ts
│   ├── domain/                          # Pure logic
│   │   ├── activity-transitions.ts      # BR-8
│   │   ├── recurrence.ts                # DSL expansion BR-11 (daily | weekly:DOWs | monthly:N|last)
│   │   ├── week-calc.ts                 # Sunday boundary in user TZ
│   │   ├── challenge-detect.ts          # 5 challenge types
│   │   └── goal-status.ts               # BR-9
│   ├── ai/
│   │   ├── client.ts                    # Anthropic SDK setup
│   │   ├── system-prompts/
│   │   │   ├── agent-base.ts            # System prompt (AI-1..AI-8)
│   │   │   ├── morning-ritual.ts
│   │   │   ├── evening-ritual.ts
│   │   │   ├── weekly-review.ts
│   │   │   └── voice-parser.ts
│   │   ├── tools/                       # AI-9 tool definitions
│   │   │   ├── save-sheet-field.ts
│   │   │   ├── update-activity-status.ts
│   │   │   ├── create-activity.ts
│   │   │   └── retrieve-past-quote.ts   # v1.5
│   │   └── eval/                        # Eval set runners (CI)
│   ├── db/
│   │   ├── schema.ts                    # Drizzle schema (SSOT)
│   │   ├── client.ts                    # Drizzle client
│   │   ├── scoped.ts                    # scopedDb(userId) wrapper
│   │   ├── queries/
│   │   │   ├── activities.ts
│   │   │   ├── sheets.ts
│   │   │   ├── goals.ts
│   │   │   └── usage.ts
│   │   └── migrations/                  # drizzle-kit output
│   ├── auth/
│   │   ├── config.ts                    # NextAuth config
│   │   └── helpers.ts                   # getCurrentUser, requireAuth
│   ├── integrations/
│   │   └── google-calendar/
│   │       ├── client.ts
│   │       ├── sync.ts
│   │       └── tokens.ts                # encrypt/decrypt helpers (BR-12)
│   ├── jobs/                            # Inngest functions
│   │   ├── morning-check-in.ts
│   │   ├── midday-check-in.ts
│   │   ├── evening-check-in.ts
│   │   ├── weekly-kickoff.ts
│   │   ├── weekly-review.ts
│   │   ├── listening-mode-revert.ts
│   │   ├── recurrence-materialize.ts
│   │   ├── google-calendar-sync.ts
│   │   ├── silence-detection.ts
│   │   ├── purge-soft-deleted.ts
│   │   └── pattern-detection.ts         # v1.5
│   ├── push/
│   │   ├── subscribe.ts
│   │   └── send.ts                      # Anti-spam guardrails (OPS-1..3)
│   ├── email/
│   │   └── (TimeKast standard)
│   ├── hooks/                           # Custom React hooks
│   │   ├── useMic.ts
│   │   ├── usePushSubscription.ts
│   │   ├── useIntensityMode.ts
│   │   └── useOfflineQueue.ts
│   ├── validations/                     # Zod schemas
│   │   ├── activity.ts
│   │   ├── sheet.ts
│   │   ├── goal.ts
│   │   └── ai-tools.ts
│   └── utils/
│       ├── cn.ts                        # Tailwind merge
│       └── timezone.ts                  # User TZ helpers
│
└── config/
    ├── env.ts                           # Zod-validated env vars
    ├── plans.ts                         # Plan definitions (DB seed)
    └── branding.ts                      # Warm-book palette tokens
```

---

## Key architectural decisions (ADRs)

### ADR-001 — Stack: TimeKast Next.js (no React Native v1)

**Decision:** Next.js 16 App Router + Drizzle + Neon + Vercel.

**Why:**

- TimeKast kit already configured (auth, PWA, tests, deploy)
- PWA cubre F6/F13 sin necesidad de native
- Mobile-native deferred to v2 if metrics justify (FT-370)

**Trade-offs:**

- PWA on iOS Safari tiene quirks (push notifications limited to iOS 16.4+, Web Speech API quirks)
- vs React Native: menos performant en animaciones complejas (no necesitamos)

**Alternatives rejected:**

- React Native + Expo (Reflexión sugería): +6-8 semanas setup, sin payoff hasta tener tracción

---

### ADR-002 — Multi-tenant via `user_id` column + scoped query helper

**Decision:** Single DB, single schema, todas las tablas tenant-owned tienen `user_id`. Helper `scopedDb(userId)` enforces filter.

**Why:**

- Simple a escala 1-100K users
- Row-level security de Postgres es opcional (lo agregamos si nos preocupa defense-in-depth)
- Migrations simples

**Trade-offs:**

- Si necesitamos data isolation regulatoria fuerte (HIPAA-like), considerar schema-per-tenant (no es nuestro caso)

**Alternatives rejected:**

- Schema-per-tenant: complejidad de migrations y queries en producto que no necesita ese nivel de isolation

---

### ADR-003 — Background jobs via Inngest

**Decision:** Inngest para todos los cron + event-driven jobs.

**Why:**

- Per-user scheduling (cada user tiene su `morning_time` propio) requiere flexibilidad que Vercel Cron no da
- Retry + observability out-of-the-box
- Local dev decent (Inngest CLI)

**Trade-offs:**

- Vendor lock-in (mitigation: Inngest functions son TypeScript funcs, port-able)
- Free tier suficiente para v1

**Alternatives rejected:**

- Vercel Cron + Upstash QStash: per-user scheduling tedioso
- BullMQ + Redis self-managed: ops overhead

---

### ADR-004 — LLM: Anthropic Claude Sonnet

**Decision:** Claude Sonnet 4.6 al inicio, upgrade a 4.7 cuando estable.

**Why:**

- Excelente seguimiento de instrucciones (importante para AI-2..AI-8)
- Low refusal rate en challenges directos (Reflexión §9.7)
- Multilingual (ES/EN) sólido
- Tool use estable (AI-9)
- Caching de prompts (system prompts largos del agente se cachean)

**Trade-offs:**

- Más caro que GPT-4o mini para tareas simples (mitigation: usar haiku para parser de voz, sonnet para conversación)

**Alternatives rejected:**

- OpenAI GPT-4o: instruction following inferior en challenges
- Self-hosted Llama: ops overhead, calidad insuficiente para v1

---

### ADR-005 — STT: Web Speech API primary + Whisper fallback

**Decision:** Web Speech API primero (gratis, on-device, low latency); fallback a Whisper API si no disponible.

**Why:**

- Web Speech API es gratis y rápida en Chrome/Edge desktop+Android, Safari iOS 14.5+
- Whisper API ($0.006/min) cubre el resto sin agregar costo significativo

**Coverage de Web Speech API (a validar OQ-4):**

- ✅ Chrome desktop, Chrome Android, Edge desktop
- ✅ Safari iOS 14.5+ (con `webkitSpeechRecognition`)
- ⚠️ Safari macOS (variable)
- ❌ Firefox (always fallback)

**Failure mode:** capture lento si Whisper rate-limited. Mitigation: caps por user via `usage_meters`.

---

### ADR-006 — Encryption: pgcrypto symmetric para OAuth tokens

**Decision:** `pgp_sym_encrypt` con `ENCRYPTION_KEY` env var, columnas BYTEA.

**Why:**

- Mantiene tokens encriptados at-rest
- Simple operacionalmente
- Key rotation procedure documentado

**Trade-offs:**

- Si `ENCRYPTION_KEY` leak, todos los tokens leak. Mitigation: env var via Vercel encrypted env, no en git, rotación periódica.

**Alternatives rejected:**

- AWS KMS / Vercel Edge Config secrets: overkill para v1

---

### ADR-007 — Voice parse pipeline: Whisper (if needed) → Claude Haiku → Tool call

**Decision:** Audio (si Whisper) → texto → Claude Haiku con tool `create_activity_preview` → JSON estructurado → preview modal.

**Why:**

- Haiku es ~5× más barato que Sonnet para parsing simple
- Tool calling garantiza schema (AI-9)
- Latencia <1s end-to-end objetivo

**Implementación:**

```ts
// src/lib/services/voice-capture.ts
async function parseVoiceToTask(audioBlob | text, userId, categoriesContext) {
  const text = audioBlob ? await whisperTranscribe(audioBlob) : text;
  const result = await claude.messages.create({
    model: 'claude-haiku-4-5',
    system: VOICE_PARSER_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: text }],
    tools: [createActivityPreviewTool],
    tool_choice: { type: 'tool', name: 'create_activity_preview' },
  });
  return result.tool_calls[0].input; // typed
}
```

---

### ADR-008 — Real-time chat: Server-Sent Events streaming

**Decision:** Chat usa SSE para streaming de tokens del LLM. No WebSockets en v1.

**Why:**

- SSE más simple para uni-direccional (server → client streaming)
- Vercel Edge runtime soporta SSE nativo
- WebSockets necesarios solo en voice mode bidireccional (v2)

**Trade-offs:** N/A — limitación deseada para v1

---

### ADR-009 — PWA push: Web Push API + FCM/APNs

**Decision:** Service Worker + Web Push API. FCM backend para Android, APNs (vía Safari) para iOS 16.4+.

**Why:**

- Standard web, no SDKs propietarios
- iOS 16.4+ ya soporta Web Push para PWAs instaladas

**Trade-offs:**

- iOS user debe instalar PWA primero para recibir push (limitation de Apple)
- Mitigation: incentivar install en onboarding

---

### ADR-010 — Tenant-scoped queries via TS helper, not RLS

**Decision:** Drizzle helper `scopedDb(userId)` enforced por convención + ESLint custom rule. No Postgres Row-Level Security en v1.

**Why:**

- Más simple. Tests cubren multi-tenancy.
- RLS agrega complejidad de policies y debugging

**Trade-offs:**

- Si un dev hace `db.select()` sin scope, hay leak. Mitigation: ESLint rule + code review + integration tests obligatorios.

**Future:** RLS como defense-in-depth si producto requiere compliance fuerte.

---

## Data flow examples

### Flow 1 — Captura por voz (US-070..073)

```
1. User taps mic button (Today screen)
2. Browser request mic permission (if first time)
3. Web Speech API starts → tokens stream to UI
4. User taps "Listo" or 2s silence
5. Client POST /api/ai/parse-task { text, userId }
6. Server: claude.messages.create(haiku, tools=[create_activity_preview])
7. Tool call result returns JSON: {title, project_id, scheduled_date, ...}
8. Client renders preview modal
9. User taps Confirm → Server Action createActivity(formData)
10. DB INSERT into activities. Return.
11. UI updates with new activity. Toast "Guardado."
```

**Fallback:** if Web Speech API unavailable, step 3 records blob, sends to /api/voice/transcribe (Whisper), then continues at step 4.

---

### Flow 2 — Morning check-in (US-080)

```
1. Inngest cron triggers at user's morning_time (per-user TZ)
2. Inngest function morning-check-in.ts:
   a. Check anti-spam (last 24h count < 4) — OPS-1
   b. Check user not muted, not in re-entry silence
   c. Create ProactiveTask row (status=pending)
   d. Send Web Push notification
   e. Set status=sent, sent_at=now
3. User taps push → deep link to /chat?context=morning_check
4. Server: load conversation context (linked_proactive_task_id), system prompt = morning-ritual
5. Server streams Claude response: "Buenos días. ¿Cuál es la intención de hoy?"
6. User responds → Server processes with challenge detection (Capa 7)
7. Loop through 6 morning questions, each potentially triggering challenges
8. After 6th question, agent calls save_sheet_field tool repeatedly to populate DaySheet
9. Agent closes: "Guardado. Te busco al mediodía."
10. ProactiveTask.responded_at = now
```

---

### Flow 3 — Weekly review (US-084)

```
1. Friday cron: materialize next WeekSheet (BR-7)
2. Saturday cron at evening_time: enqueue weekly-review ProactiveTask
3. Push notification sent
4. User opens → Chat with weekly-review system prompt loaded
5. Agent retrieves 7 DaySheets of past week + scheduled activities + completion stats
6. Agent walks through: review_wins → review_lessons → review_energy → review_one_sentence
7. After user input, agent generates post-mortem (separate LLM call, longer context):
   - % cumplimiento per category/project
   - Patterns detected (top 3 repeated reasons_not_done)
   - Suggestions for next week
8. Post-mortem saved to WeekSheet.review_post_mortem (jsonb)
9. Agent suggests 3 wins for next week based on current quarter goals + uncompleted items
```

---

## Performance targets

| Metric                                    | Target | Measurement       |
| ----------------------------------------- | ------ | ----------------- |
| First Contentful Paint (mobile 3G)        | <2s    | Lighthouse CI     |
| Time to Interactive                       | <3.5s  | Lighthouse CI     |
| Voice parse end-to-end (Web Speech path)  | <1.5s  | Custom telemetry  |
| Voice parse end-to-end (Whisper fallback) | <4s    | Custom telemetry  |
| Chat first token (TTFT)                   | <1s    | Custom telemetry  |
| Chat full response p50                    | <2.5s  | Custom telemetry  |
| DB query p95 (today page)                 | <100ms | Drizzle query log |
| Push delivery (FCM, p95)                  | <30s   | FCM dashboard     |

---

## Reliability targets

| Target                      | Value                                   |
| --------------------------- | --------------------------------------- |
| Uptime SLO                  | 99.5% (≈3.6h downtime/month acceptable) |
| Background job success rate | >99% (Inngest dashboard)                |
| Push delivery success       | >95% per channel                        |
| Backup retention            | Neon auto + S3 weekly 90d (OPS-10)      |

---

## Security posture

| Concern                          | Control                                                                    |
| -------------------------------- | -------------------------------------------------------------------------- |
| OWASP A01 Broken Access Control  | `scopedDb(userId)` + middleware + tests (BR-1, ADR-010)                    |
| OWASP A02 Cryptographic Failures | pgcrypto for OAuth tokens (BR-12); bcrypt password hash; HTTPS only        |
| OWASP A03 Injection              | Drizzle parameterized queries; no raw SQL in app code                      |
| OWASP A04 Insecure Design        | Audit log para impersonation; multi-tenant tests                           |
| OWASP A05 Misconfiguration       | Env validation via Zod (`config/env.ts`); secrets vía Vercel encrypted env |
| OWASP A07 Auth Failures          | NextAuth v5 + rate limit (OPS-9) + bcrypt rounds 12                        |
| OWASP A09 Logging                | Sentry; redact PII from logs; user message content NEVER in error logs     |
| Prompt injection                 | Tool use only for writes (AI-9); validate tool inputs Zod                  |
| Mic / audio privacy              | Audio never persisted in prod (BR-13)                                      |

---

## Observability stack

| Concern             | Tool                                                                |
| ------------------- | ------------------------------------------------------------------- |
| Errors / exceptions | Sentry                                                              |
| Logs                | Vercel Logs (function-level)                                        |
| Product analytics   | PostHog or Plausible (anonymous events)                             |
| LLM observability   | Custom logging to `messages.tool_calls` jsonb + Anthropic dashboard |
| Background jobs     | Inngest dashboard                                                   |
| Uptime              | Vercel built-in                                                     |
| DB performance      | Neon metrics + query log                                            |

---

## Open questions

| OQ                                  | Decision needed by              |
| ----------------------------------- | ------------------------------- |
| OQ-4 (Web Speech API coverage)      | Sprint 7 (voice week)           |
| OQ-5 (conversation retention)       | v1.5 (before pattern detection) |
| OQ-6 (quarter calendar vs adaptive) | v1.5 (before Quarter sheets)    |

---

_Generated by `/docs` Batch 4 — 2026-05-19_
