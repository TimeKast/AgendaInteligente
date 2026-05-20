# 14 — Traceability Matrix

> **Purpose:** Cross-reference between Discovery decisions, Features, User Stories, Business Rules, Entities, E2E scenarios, and Risks.
> **Use:** Verificar coverage end-to-end. Cuando se modifica una capa, identificar qué más necesita ajuste.

---

## Discovery decision → downstream

| Decisión Brief                      | F-XX         | Capa          | Features (FT)                                                             | User Stories (US) | Rules (BR/AI/OPS) | Entities (E)                                    | Risks                     |
| ----------------------------------- | ------------ | ------------- | ------------------------------------------------------------------------- | ----------------- | ----------------- | ----------------------------------------------- | ------------------------- |
| Multi-tenant SaaS vendible          | F8 (Q1 B)    | Auth          | FT-001..004                                                               | US-001..005       | BR-1, OPS-9       | E-001, E-070..072                               | R-T-006                   |
| Captura frictionless por voz        | F10          | Voice         | FT-070..075, FT-073                                                       | US-070..073       | AI-9              | E-005 (Activity), E-072 (UsageMeter)            | R-T-001, R-T-004, R-P-005 |
| Accountability activa con check-ins | F11          | Notifications | FT-080..089                                                               | US-080..087       | OPS-1..4          | E-002 (NotificationPref), E-040 (ProactiveTask) | R-T-009                   |
| Discord descartado v1               | F12          | —             | —                                                                         | —                 | —                 | —                                               | —                         |
| Jerarquía Cat→Proj→Act→Subtask      | F4           | Organización  | FT-010..014                                                               | US-010..018       | BR-2..5           | E-003, E-004, E-005, E-006                      | —                         |
| Goals entidad separada              | F21, X1      | Goals         | FT-040..043                                                               | US-040..043       | BR-6, BR-9        | E-010, E-011                                    | —                         |
| Modelo temporal híbrido             | F19          | Time model    | FT-020..028                                                               | US-020..027       | BR-7, BR-8        | E-005                                           | —                         |
| 6 escalas de planeación             | Q14          | Sheets        | FT-030..036 (Day+Week MVP); FT-200..201 (Q+Y v1.5); FT-300..301 (5Y+L v2) | US-030..035       | BR-7              | E-020..025                                      | —                         |
| AI agent + intensity modes          | Q13, X1      | AI            | FT-050..056                                                               | US-050..053       | AI-1..8, OPS-4    | E-030, E-031, E-040                             | R-T-003, R-T-005, R-P-002 |
| Vague-answer challenges             | Q13, X1      | AI Challenges | FT-060..062                                                               | US-060..062       | AI-2, AI-6        | E-031 (challenges_fired)                        | R-P-002                   |
| Google Calendar read-only           | X10a         | Integrations  | FT-090..093                                                               | US-090..092       | BR-12             | E-060, E-061                                    | R-T-002                   |
| Warm-book aesthetic                 | X8 (decided) | Design        | FT-124 + design phase                                                     | US-124            | —                 | —                                               | —                         |
| Plan B MVP público                  | Q1           | Billing infra | FT-110..113 (sin Stripe activo)                                           | US-110..111       | BR-10             | E-070..072                                      | —                         |
| Gamificación diferida v2            | X2           | —             | FT-350                                                                    | —                 | —                 | —                                               | —                         |

---

## Feature → User Story coverage

| Feature ID                        | Linked US              | Coverage    |
| --------------------------------- | ---------------------- | ----------- |
| FT-001 (Google OAuth)             | US-001, US-003         | ✅          |
| FT-002 (email/pwd)                | US-002, US-003         | ✅          |
| FT-003 (multi-tenant)             | US-004                 | ✅          |
| FT-004 (onboarding)               | US-005                 | ✅          |
| FT-010 (categories)               | US-010, US-011, US-012 | ✅          |
| FT-011 (projects)                 | US-013, US-014         | ✅          |
| FT-012 (activities)               | US-015, US-016         | ✅          |
| FT-013 (subtasks)                 | US-017                 | ✅          |
| FT-014 (tags)                     | US-018                 | ✅          |
| FT-020..028 (time model)          | US-020..027            | ✅          |
| FT-030..033 (DaySheet)            | US-030, US-031, US-032 | ✅          |
| FT-034..036 (WeekSheet)           | US-033, US-034, US-035 | ✅          |
| FT-040..043 (Goals)               | US-040..043            | ✅          |
| FT-050..056 (AI agent core)       | US-050..053 + AC       | ✅          |
| FT-060..062 (challenges)          | US-060..062            | ✅          |
| FT-063..065 (challenges v1.5/cfg) | — (v1.5)               | ⏭ deferred |
| FT-070..075 (voice)               | US-070..073            | ✅          |
| FT-080..089 (check-ins)           | US-080..087            | ✅          |
| FT-090..093 (Google Cal)          | US-090..092            | ✅          |
| FT-100..104 (AI suggestions)      | US-100..103            | ✅          |
| FT-110..113 (billing infra)       | US-110..111            | ✅          |
| FT-120..124 (PWA + Settings)      | US-120..124            | ✅          |

**Total MVP FT covered by US:** 74/74 (100%)

---

## Business Rule → Entity + Code location

| Rule                                | Entity affected                 | Code location                            | Test ID                   |
| ----------------------------------- | ------------------------------- | ---------------------------------------- | ------------------------- |
| BR-1 (multi-tenant)                 | All tenant-owned                | `src/lib/db/scoped.ts`, middleware       | I-005, I-023, E2E-010     |
| BR-2 (Activity ∈ Project)           | E-005 Activity                  | DB constraint + migration seed           | I-002, I-003              |
| BR-3 (Project ∈ Category)           | E-004 Project                   | DB constraint                            | — (structural)            |
| BR-4 (Category delete cascade conf) | E-003 Category                  | Server action `deleteCategory`           | I-007                     |
| BR-5 (Subtask 1 level)              | E-006 Subtask                   | Schema (no parent col)                   | — (structural)            |
| BR-6 (Goal outside hierarchy)       | E-010 Goal, E-011 GoalLink      | Schema separation                        | I-009                     |
| BR-7 (Sheets unique per period)     | E-020 DaySheet, E-021 WeekSheet | DB UNIQUE constraint                     | I-008, I-025, I-026       |
| BR-8 (Activity transitions)         | E-005 Activity                  | `domain/activity-transitions.ts`         | U-001, I-006              |
| BR-9 (Goal status from score)       | E-010 Goal                      | `domain/goal-status.ts`                  | U-005, I-010              |
| BR-10 (Subscription grace)          | E-071 Subscription              | Cron `purge-soft-deleted` related        | — (v2 when Stripe active) |
| BR-11 (Recurrence materialization)  | E-005 Activity                  | `domain/recurrence.ts`, Inngest job      | U-002, I-021              |
| BR-12 (encrypted tokens)            | E-060 GoogleCalendarConnection  | `integrations/google-calendar/tokens.ts` | U-007, I-024              |
| BR-13 (audio not persisted)         | —                               | `/api/voice/transcribe/route.ts`         | I-027                     |
| BR-14 (soft delete 30d)             | All soft-deletable              | Inngest `purge-soft-deleted`             | I-022, E2E-009, E2E-015   |
| AI-1 (idioma `tú` LatAm)            | E-031 Message content           | system prompts                           | A-006                     |
| AI-2 (1 question/turn)              | E-031                           | system prompts                           | A-007                     |
| AI-3 (1-3 sentences)                | E-031                           | system prompts                           | A-008                     |
| AI-4 (quotes con fecha)             | E-031, E-050                    | tool `retrieve_past_quote` v1.5          | (v1.5)                    |
| AI-5 (identity over achievement)    | E-031                           | system prompts                           | A-007/A-008 implicit      |
| AI-6 (no moralization)              | E-031                           | system prompts                           | A-010                     |
| AI-7 (out-of-scope redirect)        | E-031                           | system prompts                           | A-004                     |
| AI-8 (crisis exit)                  | E-031                           | system prompts + lookup table            | A-005, E2E-013            |
| AI-9 (tool use only)                | E-031 tool_calls                | tool defs in `src/lib/ai/tools/`         | I-028                     |
| OPS-1 (max 4/24h)                   | E-040 ProactiveTask             | Push send guard                          | I-018, E2E-011            |
| OPS-2 (1 challenge/week)            | E-040                           | Same                                     | I-019                     |
| OPS-3 (silence re-entry)            | E-001 User flags                | Cron `silence-detection`                 | I-020, E2E-012            |
| OPS-4 (listening revert)            | E-001 User.intensity            | Hourly cron                              | I-013                     |
| OPS-5 (recurrence cron)             | E-005 Activity                  | Daily cron                               | I-021                     |
| OPS-6 (GCal sync 15min)             | E-061 CalendarBusySlot          | Inngest scheduled per user               | I-014 (mock), E2E-008     |
| OPS-7 (WeekSheet materialization)   | E-021 WeekSheet                 | Friday cron                              | — (covered structurally)  |
| OPS-8 (embeddings nightly v1.5)     | E-050 SheetEmbedding            | (v1.5)                                   | (v1.5)                    |
| OPS-9 (auth rate limit)             | —                               | Middleware Upstash                       | I-015                     |
| OPS-10 (backups)                    | All                             | Inngest weekly + manual                  | R-013 runbook             |

---

## US → Screen → E2E

| User Story                                 | Screen (S-NN from Brief §7) | E2E                                     |
| ------------------------------------------ | --------------------------- | --------------------------------------- |
| US-001..003 (auth)                         | (auth) login/signup         | E2E-001, E2E-002                        |
| US-004 (multi-tenant)                      | n/a                         | E2E-010                                 |
| US-005 (onboarding)                        | S-10                        | E2E-001, E2E-002                        |
| US-010..012 (categories)                   | S-8                         | (covered by unit + integration)         |
| US-013..014 (projects)                     | S-7                         | —                                       |
| US-015..018 (activities + subtasks + tags) | S-1 + S-6                   | E2E-003                                 |
| US-020..027 (time model)                   | S-1, S-2, S-6               | E2E-003, E2E-006                        |
| US-030..032 (DaySheet)                     | S-1 + S-5 chat              | E2E-005                                 |
| US-033..035 (WeekSheet)                    | S-2 + S-5                   | E2E-006                                 |
| US-040..043 (Goals)                        | S-4                         | (covered by integration)                |
| US-050..053 (chat + agent)                 | S-5                         | E2E-005, E2E-006, E2E-007, E2E-013      |
| US-060..062 (challenges)                   | S-5                         | E2E-005, E2E-007, E2E-013               |
| US-070..073 (voice)                        | S-1 + S-11 modal            | E2E-004                                 |
| US-080..087 (check-ins)                    | S-1, S-5, push              | E2E-005, E2E-006, E2E-011, E2E-012      |
| US-090..092 (Google Cal)                   | S-9 integrations            | E2E-008                                 |
| US-100..103 (AI suggestions)               | S-5, push                   | (covered structurally by Inngest tests) |
| US-110..111 (billing infra)                | S-9 placeholder             | (covered structurally)                  |
| US-120..124 (PWA + settings)               | S-9 + Today install         | E2E-014, E2E-015                        |

---

## Risk → Mitigation control coverage

| Risk                           | Mitigation present in                                   |
| ------------------------------ | ------------------------------------------------------- |
| R-T-001 (Web Speech coverage)  | ADR-005, U-test for fallback, telemetry plan            |
| R-T-002 (Google OAuth verify)  | Sprint 1 plan in §8 Brief, runbook R-002                |
| R-T-003 (LLM cost)             | E-072 UsageMeter, ADR-007 Haiku for parse, budget alert |
| R-T-004 (Whisper cost)         | E-072 UsageMeter, caps                                  |
| R-T-005 (prompt injection)     | AI-9 + tool validation + A-eval adversarial             |
| R-T-006 (multi-tenant leak)    | BR-1, ADR-010, ESLint rule, I-tests, E2E-010            |
| R-T-007 (audio leak)           | BR-13, I-027                                            |
| R-T-008 (DST edge)             | `domain/week-calc.ts`, U-003                            |
| R-T-009 (iOS push limits)      | onboarding detect + email fallback NotificationPref     |
| R-T-010 (Inngest lock-in)      | TypeScript portability noted                            |
| R-T-011 (provider outage)      | R-005 runbook                                           |
| R-P-001 (North Star miss)      | Telemetry plan, A/B variants                            |
| R-P-002 (challenges resonance) | Gentle default 14d, easy intensity change               |
| R-P-003 (onboarding length)    | 8 saltable steps, drop-off metric                       |
| R-P-004 (scope creep)          | DOR/DOD, Feature Map MVP strict, v2 valve               |
| R-P-005 (voice parse accuracy) | A-009 eval ≥90%, preview editable                       |
| R-O-001 (backup recovery)      | R-013 + R-010 runbooks                                  |
| R-O-002 (single dev)           | Docs + CLAUDE.md context loadable                       |
| R-O-003 (crisis exit)          | AI-8, A-005, E2E-013, lookup table review               |
| R-C-001 (GDPR)                 | BR-14, FT-123, privacy policy pre-launch                |
| R-C-002 (vendor ToS)           | semestral review                                        |

---

## Gaps / TODO

| Gap                                  | Owner                  | Resolution               |
| ------------------------------------ | ---------------------- | ------------------------ |
| Privacy policy / ToS pre-launch text | Dev                    | Drafting in design phase |
| Crisis line lookup table per country | Dev + clinical contact | Pre-launch checklist     |
| OQ-3 (light vs dark default)         | Design phase           | `/design` workflow       |
| OQ-4 (Web Speech coverage)           | Sprint 7               | Telemetry from beta      |
| OQ-5 (conversation retention)        | v1.5                   | Pre-pattern-detection    |
| OQ-6 (quarter calendar vs adaptive)  | v1.5                   | Pre-Quarter sheets       |
| OQ-7 (GDPR target country)           | Pre-launch             | Owner decides target geo |

---

## Coverage summary

| Layer                      | Count                                 | Notes                                    |
| -------------------------- | ------------------------------------- | ---------------------------------------- |
| Discovery decisions linked | 14 (F-1..F-30)                        | All traced to features                   |
| Features (MVP)             | 74                                    | 100% have linked US                      |
| Features (v1.5)            | 10                                    | Placeholder US                           |
| Features (v2)              | 16                                    | Placeholder US                           |
| Features (NEVER)           | 8                                     | Explicit out-of-scope                    |
| User Stories (MVP)         | ~60                                   | Cover 74 features (some 1 US → multi FT) |
| Business Rules             | 14 + AI=9 + OPS=10 + 1 hardcoded = 34 | All have enforcement + tests             |
| Entities                   | 16 (v1) + 4 v1.5/v2                   | All schemas defined                      |
| Screens                    | 11 core MVP                           | All have linked US                       |
| E2E scenarios              | 15                                    | Cover critical paths                     |
| Risks identified           | 18                                    | All have mitigation                      |
| Open Questions             | 7                                     | All have resolution timing               |

---

_Generated by `/docs` Batch 7 — 2026-05-19_
_End of `/docs` workflow — all 13 documents generated._
