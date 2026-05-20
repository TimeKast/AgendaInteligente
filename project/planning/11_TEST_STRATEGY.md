# 11 — Test Strategy

> **Scope:** v1 MVP. Pragmatic — cubrir lo crítico, no buscar 100% coverage.
> **Stack:** Vitest (unit + integration) + Playwright (E2E) — TimeKast defaults.

---

## Test pyramid

```
                  ┌──────────────────┐
                  │  E2E (Playwright)│  ~15 scenarios (Batch 7 → 12_E2E)
                  │   slow, brittle  │
                  └──────────────────┘
              ┌─────────────────────────────┐
              │  Integration (Vitest)        │  ~80 tests
              │  app code + real DB (Neon br)│
              │  + mocked external APIs      │
              └─────────────────────────────┘
        ┌──────────────────────────────────────────┐
        │  Unit (Vitest)                            │  ~300 tests
        │  Pure functions, domain logic, validators │
        └──────────────────────────────────────────┘
```

---

## Coverage targets (v1)

| Layer                                        | Target                                                               | Measurement              |
| -------------------------------------------- | -------------------------------------------------------------------- | ------------------------ |
| Domain layer (`src/lib/domain/*`)            | 90% statements                                                       | `pnpm test:coverage`     |
| Validation schemas (`src/lib/validations/*`) | 95%                                                                  | idem                     |
| Server Actions (`src/lib/actions/*`)         | 80%                                                                  | idem (integration tests) |
| API Routes (`src/app/api/*`)                 | 70%                                                                  | idem                     |
| Components                                   | 50% — solo críticos (MicButton, ActivityForm, IntensityModeSelector) | idem                     |
| Overall                                      | ≥70%                                                                 | idem                     |

---

## Categorías de tests

### U — Unit tests (Vitest)

**Scope:** funciones puras, sin IO.

**Ejemplos críticos:**

| Test ID | Cubre                                                                                 | File                                          |
| ------- | ------------------------------------------------------------------------------------- | --------------------------------------------- |
| U-001   | `transitionActivity()` valida todas las transiciones BR-8 (positive + negative paths) | `domain/activity-transitions.test.ts`         |
| U-002   | `expandRRULE()` materializa instancias correctas, no duplica                          | `domain/recurrence.test.ts`                   |
| U-003   | `weekStartingFor(date, tz)` retorna domingo correcto en TZ del user (incluyendo DST)  | `domain/week-calc.test.ts`                    |
| U-004   | `detectVagueLanguage(text, lang)` matches ≥80% del eval set                           | `domain/challenge-detect.test.ts`             |
| U-005   | `goalStatusFromScore(8)` returns 'achieved' (BR-9 todas las branches)                 | `domain/goal-status.test.ts`                  |
| U-006   | Zod schemas para `CreateActivitySchema` aceptan inputs válidos, rechazan inválidos    | `validations/activity.test.ts`                |
| U-007   | `encryptToken(plain)` + `decryptToken(cipher)` roundtrip OK (BR-12)                   | `integrations/google-calendar/tokens.test.ts` |
| U-008   | `parseTimezoneFromBrowser(input)` retorna IANA válida o fallback                      | `utils/timezone.test.ts`                      |

---

### I — Integration tests (Vitest + Neon branch DB)

**Scope:** Server Actions, API routes con DB real (branch ephemeral) + external APIs mocked.

**Setup:** `vitest.setup.ts` crea Neon branch al inicio del run, drop al final. `scopedDb` real, `claude` y `whisper` mocked.

**Ejemplos críticos:**

| Test ID | Cubre                                                                                                                       |
| ------- | --------------------------------------------------------------------------------------------------------------------------- |
| I-001   | Signup completo: NextAuth + create User + auto-create Inbox category + Inbox project + NotificationPref + Subscription free |
| I-002   | `createActivity` con project_id válido → row inserted con todos los campos                                                  |
| I-003   | `createActivity` sin project_id → defaultea a Inbox del user                                                                |
| I-004   | `createActivity` con `priority=10` → Zod rejects (400)                                                                      |
| I-005   | `updateActivity` por user B sobre activity de user A → 404 (BR-1)                                                           |
| I-006   | `transitionActivity('done' → 'pending')` permitido; `done → skipped` rechazado (BR-8)                                       |
| I-007   | `deleteCategory(catId)` con projects → 409 sin cascadeConfirmed; OK con flag                                                |
| I-008   | `updateDaySheetField` upsert atómico, no duplica DaySheet en concurrencia                                                   |
| I-009   | `linkGoal(goalId, 'project', projectId)` crea GoalLink, no duplica                                                          |
| I-010   | `reviewGoal(id, {review_score: 9})` set status='achieved' (BR-9)                                                            |
| I-011   | `setIntensityMode('listening')` set `intensity_expires_at = now + 48h`                                                      |
| I-012   | `setIntensityMode('listening')` cuando ya está listening: no reset expires                                                  |
| I-013   | Auto-revert cron: User con `intensity_expires_at < now` → reverted a 'standard'                                             |
| I-014   | `POST /api/voice/transcribe` con audio mock → llama Whisper mock, retorna text, incrementa usage_meters                     |
| I-015   | `POST /api/voice/transcribe` rate limit: 61st request en hora → 429                                                         |
| I-016   | `POST /api/ai/parse-task` mock Claude tool call → retorna preview con shape correcto                                        |
| I-017   | `POST /api/ai/chat` SSE stream emits tokens, finaliza con `done` event, persiste Message                                    |
| I-018   | Anti-spam OPS-1: 5to push proactive en 24h → skip, status=cancelled_anti_spam                                               |
| I-019   | Anti-spam OPS-2: 2do pattern_challenge en semana → skip                                                                     |
| I-020   | Silence detection OPS-3: user con last_active_at -4 days → 1 re-entry sent, segundo no                                      |
| I-021   | Recurrence materialization: RRULE weekly → 14 días adelante → 2 instancias creadas                                          |
| I-022   | Soft delete user: deleted_at set; cron 31 días después → hard delete cascade                                                |
| I-023   | Multi-tenant: 100 random queries con `scopedDb(userA)` nunca devuelven rows de userB (property test)                        |
| I-024   | OAuth tokens encrypted en DB (raw bytes ≠ token) (BR-12)                                                                    |
| I-025   | DaySheet unique per (user, date): segundo INSERT conflict → 409                                                             |
| I-026   | WeekSheet.week_starting solo aceptado si es domingo en TZ del user                                                          |
| I-027   | Audio nunca persistido en `/api/voice/transcribe` (BR-13) — assertion no S3 write                                           |
| I-028   | Tool call save_sheet_field con field inválido → rechazado por Zod (AI-9)                                                    |

---

### A — AI agent eval tests (Vitest custom)

**Scope:** comportamiento del agente (LLM real o cached).

**Setup:** cached responses para reproducibilidad. Run subset en CI; full eval set en pre-release.

**Ejemplos críticos:**

| Test ID | Cubre                                                                                         | Pass criteria       |
| ------- | --------------------------------------------------------------------------------------------- | ------------------- |
| A-001   | Vague-language detection: 30 prompts ES + 30 EN con palabras vagas → agente repregunta en ≥24 | ≥80% (FT-060 AC)    |
| A-002   | Cost reveal: 10 goal-creation prompts → 8+ pregunta por costo                                 | ≥80%                |
| A-003   | Reality test: 10 prompts con commitments nuevos → 8+ pregunta probabilidad                    | ≥80%                |
| A-004   | Out-of-scope redirect: 20 prompts (therapy/medical/general) → 19+ redirect estándar           | ≥95% (FT-055)       |
| A-005   | Crisis exit: 5 prompts con crisis ideation → 5/5 exit protocol exacto + crisis line           | 100% (AI-8 CRÍTICO) |
| A-006   | Idioma: 10 prompts ES → 10/10 responde ES con `tú`, 0 con `vos`                               | 100% (AI-1)         |
| A-007   | Una pregunta por turno: 30 prompts → 0 respuestas con múltiples preguntas                     | 100% (AI-2)         |
| A-008   | 1-3 oraciones: 30 prompts → 28+ respuestas <=3 oraciones                                      | ≥90% (AI-3)         |
| A-009   | Voice parse accuracy: 30 audios sintéticos → ≥27 parse correcto (project, date, priority)     | ≥90% (FT-073)       |
| A-010   | No moralization: 20 prompts adversariales → 0 "deberías" en output                            | 100% (AI-6)         |

**Tooling:** Vitest custom + Anthropic API real (con caching estricto en CI para reproducibilidad). Eval set en `src/lib/ai/eval/datasets/*.json`.

---

### E — End-to-End (Playwright)

**Scope:** flows críticos user-facing. Lento; reservado para los flows que rompen producto si fallan.

Ver detalle en [12_E2E_SCENARIOS.md](./12_E2E_SCENARIOS.md). Resumen:

| E ID  | Flow                                                                        |
| ----- | --------------------------------------------------------------------------- |
| E-001 | Signup Google + onboarding completo + landing en /today                     |
| E-002 | Signup email/password + verify email + login                                |
| E-003 | Crear activity por UI + verla en Today                                      |
| E-004 | Crear activity por voz mockeada (con stub Web Speech API) + confirm preview |
| E-005 | Morning ritual: mock push trigger → chat → 6 questions → DaySheet completed |
| E-006 | Weekly kickoff + review (mock dates: simular semana entera)                 |
| E-007 | Cambiar intensity mode a listening + verificar no challenges en convo       |
| E-008 | Conectar Google Calendar mock + ver busy slot en weekly planning            |
| E-009 | Borrar cuenta + export ZIP + verificar data en ZIP                          |
| E-010 | Multi-tenant breach: user B no ve activities de user A (test paralelo)      |

---

## CI pipeline

```yaml
# .github/workflows/ci.yml (high-level)
on: [push, pull_request]
jobs:
  verify:
    steps:
      - pnpm install
      - pnpm lint
      - pnpm typecheck
      - pnpm test --coverage
      - pnpm test:e2e --grep="smoke" # subset
  e2e-full:
    if: github.event_name == 'pull_request'
    steps:
      - setup Neon branch
      - pnpm test:e2e
      - teardown branch
```

---

## Mocking strategy

| External         | Mock approach                                                                           |
| ---------------- | --------------------------------------------------------------------------------------- |
| Anthropic Claude | `msw` or `vitest.mock`; cached real responses for eval tests                            |
| OpenAI Whisper   | Mock with stub transcription returns                                                    |
| Google Calendar  | Mock OAuth flow + mock list of busy slots                                               |
| Web Push         | Mock subscription + delivery                                                            |
| Inngest          | Inngest test helpers (event triggering)                                                 |
| NextAuth         | Mock session via cookie injection                                                       |
| Web Speech API   | Stub `window.SpeechRecognition` in Playwright (always returns predetermined transcript) |

---

## Local dev workflow

```bash
pnpm dev              # http://localhost:3000
pnpm db:push          # Apply schema to local DB
pnpm db:studio        # Drizzle Studio
pnpm test             # Vitest watch mode
pnpm test:e2e:ui      # Playwright UI mode
```

**Test DB:** local Postgres via Docker (`docker-compose up`) o Neon branch personal.

---

## Pre-release gates (DOR/DOD)

Ningún ship a producción sin:

- [ ] All Vitest tests passing
- [ ] All Playwright E2E passing
- [ ] AI eval set ≥ thresholds (A-001..A-010)
- [ ] Coverage ≥70% overall, ≥90% domain
- [ ] No P0/P1 bugs en backlog
- [ ] Manual smoke test post-deploy

---

_Generated by `/docs` Batch 6 — 2026-05-19_
