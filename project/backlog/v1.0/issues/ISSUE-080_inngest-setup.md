---
id: ISSUE-080
title: Inngest setup + /api/inngest route + event schemas + user.signed_up recurring schedule
epic: EPIC-CHECKINS
milestone: v1.0
priority: P1
story_points: 5
status: completed
completed_date: 2026-05-26
dependencies: [ISSUE-001, ISSUE-006]
follow_ups: [ISSUE-080b]
user_stories: [US-005, US-080]
features: [FT-080]
screens: []
business_rules: []
agents: [backend-specialist]
skills: [/backend]
---

# ISSUE-080 — Inngest setup

## Overview

Setup Inngest client, `/api/inngest` route handler, define event schemas, and the master `user.signed_up` event que dispara recurring per-user check-in schedules.

## Tasks

- [ ] Install + config Inngest (already deps en ISSUE-001)
- [ ] Inngest client en [src/lib/inngest/client.ts](../../../../src/lib/inngest/client.ts)
- [ ] Route Handler `POST /api/inngest` con Inngest SDK
- [ ] Event schemas en [src/lib/inngest/events.ts](../../../../src/lib/inngest/events.ts):
  - `user.signed_up` { user_id }
  - `morning.check_in.due` { user_id, date }
  - `midday.check_in.due` { user_id, date }
  - `evening.check_in.due` { user_id, date }
  - `weekly.kickoff.due` { user_id, week_starting }
  - `weekly.review.due` { user_id, week_starting }
  - `weekly.post_mortem.requested` { user_id, week_starting }
  - `listening.mode.expired` (cron, no payload)
  - `silence.detection.due` (cron daily)
  - `recurrence.materialize.due` (cron daily)
  - `gentle.default.expired` (cron daily)
  - `purge.soft_deleted.due` (cron daily)
- [ ] `user.signed_up` handler:
  - Schedules recurring `morning/midday/evening.check_in.due` at user's notification_pref times
  - Schedules recurring `weekly.kickoff.due` Sundays + `weekly.review.due` Saturdays
  - Uses Inngest's cron + per-user scheduling pattern
- [ ] Trigger `user.signed_up` from ISSUE-006 onboarding step 8 atomic transaction

## Acceptance Criteria

```gherkin
Scenario: Onboarding triggers schedules
  Given user completes onboarding
  When user.signed_up fired
  Then Inngest creates schedules for morning/midday/evening/weekly per user's prefs
  And first morning check-in queued for next configured time

Scenario: User updates notification time
  Given user changes morning_time from 08:00 to 07:30
  Then existing schedule cancelled + new one created
  Next morning push delivered at 07:30 user TZ

Scenario: Inngest signing key validation
  Given request to /api/inngest from outside Inngest infra
  Then 403 (signing key mismatch)
```

## Definition of Done

- [x] Inngest functions running locally (Inngest dev CLI)
- [x] All events tested
- [ ] Schedule cancellation when user updates prefs works → **deferred to ISSUE-080b**
- [ ] Inngest dashboard shows scheduled events → smoke test on first deploy

## Implementation Evidence

**Scope split:** original issue covered (a) plumbing + (b) per-user check-in scheduling. Slice A (this PR) ships the plumbing + one concrete cron. Slice B (per-user scheduling design α fan-out vs β orchestrator) deferred to **ISSUE-080b** to give the α/β decision its own ADR.

**Archivos NEW:**

- `src/lib/inngest/client.ts` — lazy singleton `getInngest()` (dev-mode auto when keys missing).
- `src/lib/inngest/events.ts` — 12 Zod schemas + `parseEventData<N>()` (compile + runtime).
- `src/lib/inngest/publish.ts` — typed `publish(name, data)` with validation-first + graceful degradation (no-op + warn when keys missing).
- `src/lib/inngest/functions/user-signed-up.ts` — handler no-op + log (cascading schedules → ISSUE-080b).
- `src/lib/inngest/functions/recurrence-materialize.ts` — cron `0 2 * * *` UTC → `Promise.allSettled` fan-out → `materializeUserRecurrences(userId)`.
- `src/lib/inngest/functions/index.ts` — barrel.
- `src/app/api/inngest/route.ts` — `serve({ client, functions })` exposing GET/POST/PUT.

**Archivos EDIT:**

- `src/lib/actions/onboarding.ts` — `logger.info('user.signed_up stub')` reemplazado por `await publish('user.signed_up', { userId })` post-commit (fuera de la tx — un blip de Inngest no rollbackea onboarding).
- `eslint.config.mjs` — allowlist `src/lib/inngest/**` + `src/app/api/inngest/**` para BR-1 (fan-out lista users, no es tenant data).

**Tests NEW (24 / 24 passing):**

- `tests/unit/inngest-events.test.ts` (14) — surface completo (12 eventos exactos), happy paths por familia, drift rejection (typed-key, missing field, wrong-format date, non-UUID userId).
- `tests/unit/inngest-publish.test.ts` (5) — validation-first, no-op cuando unconfigured, swallow de send errors, type misuse.
- `tests/unit/inngest-recurrence-materialize.test.ts` (4 + step.run granularity assertion) — empty users short-circuit, fan-out N veces, failure isolation (1 falla, 2 ok), step.run IDs `materialize-<userId>`.

**Decisiones de diseño:**

- **createFunction v4 signature**: 2-arg `(options, handler)` con `triggers: [{ event } | { cron }]` array (cambio breaking vs v3 que esperaba 3 args).
- **Graceful degradation por defecto** (vs hard-fail): si keys faltan, `publish()` valida + warn + skip. Razón: onboarding crítico no falla por dev sin Inngest CLI; producción Vercel siempre tendrá las keys.
- **Validation siempre corre** (incluso si Inngest no está configurado): contract bugs aparecen en dev local, no solo en prod.
- **Publish post-tx** (no dentro de `db.transaction`): un fallo de Inngest no rollbackea el onboarding del user; el evento se re-emite manual si fuera necesario.
- **Per-step granularity en cron**: cada `materialize-<userId>` es su propio `step.run` — Inngest retry-by-step replaya solo los users que fallaron.
- **Zod-as-registry** (vs `EventSchemas.fromZod` que ya no existe en v4): registry plano `{ name → schema }` + typed wrapper, sin acoplar al runtime de la SDK.

**Verificación:**

- `pnpm typecheck` ✅
- `pnpm lint` ✅ 0 errors (7 warnings preexistentes, no en archivos nuevos)
- `pnpm test inngest` ✅ 24/24
- `pnpm test onboarding-actions` ✅ 17/17
- `pnpm test` full ✅ 761/763 — 2 flakes preexistentes (`RegisterForm` + `register POST gates` timing en paralelo en Windows; pasan en isolation 24/24 — pattern conocido desde ISSUE-004).

**Scope deferred → ISSUE-080b:**

- Handlers de `morning/midday/evening.check_in.due` (per-user scheduling design α vs β).
- Handlers de `weekly.{kickoff,review,post_mortem}.due` con `notification_prefs.weekly_*` times.
- `listening.mode.expired` / `silence.detection.due` / `gentle.default.expired` / `purge.soft_deleted.due` (system crons).
- Schedule cancellation on `notification_prefs` update.
