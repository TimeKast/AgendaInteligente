---
id: ISSUE-030
title: DaySheet schema (set consolidado prototipo) + getOrCreate + UNIQUE (BR-7)
epic: EPIC-SHEETS
milestone: v1.0
priority: P0
story_points: 3
status: completed
completed_date: 2026-05-26
dependencies: [ISSUE-002]
user_stories: [US-030b, US-031b]
features: [FT-030, FT-031]
screens: [SCR-020, SCR-060]
business_rules: [BR-7]
agents: [backend-specialist]
skills: [/database, /backend]
entities: [E-020]
---

# ISSUE-030 — DaySheet schema + getOrCreate

## Overview

Migration crea tabla `day_sheets` con set de campos consolidado tras iteración prototipo. UNIQUE `(user_id, date)` (BR-7). Implementa `getOrCreateDaySheet(userId, date)` con atomic upsert. Auto-set de timestamps de completion cuando se llenan los campos esperados.

## Cambio vs versión anterior (prototipo)

**REMOVED del schema** (no se persisten):

- `intention`
- `gratitude`
- `energy_physical`, `energy_mental`, `energy_emotional`
- `evening_win`, `evening_lesson`, `tomorrow_top`
- `insight`

**ADDED:**

- `close_summary` text NULL — one-liner del cierre del día (reemplaza evening_win + evening_lesson + tomorrow_top + insight)
- `notes_dreams` text NULL — opcional, notas previo a la sesión matutina

**Mantenidos:**

- `identity_statement` text NULL
- `wins_planned` text[] NULL — max 3
- `avoidance` text NULL
- `morning_completed_at`, `evening_completed_at` timestamps

Razón: prototipo validó que `intention` era redundante con `identity_statement` y que `energy_*` y los campos evening detallados se reemplazan por close-day modal con outcome per-activity + un solo `close_summary`. Ver `06_DATA_MODEL.md §E-020` y `15_DESIGN.md §SCR-060`.

## Tasks

- [ ] Migration: crear `day_sheets` table por E-020 actualizado
  - UNIQUE `(user_id, date)`
  - CHECK `array_length(wins_planned, 1) <= 3 OR wins_planned IS NULL`
  - Index `(user_id, date DESC)` para queries "últimos N días"
  - NO crear columnas: `intention`, `gratitude`, `energy_*`, `evening_win`, `evening_lesson`, `tomorrow_top`, `insight`
  - NO crear CHECK constraints sobre `energy_*`
- [ ] Helper [src/lib/db/queries/sheets.ts](../../../../src/lib/db/queries/sheets.ts):
  ```ts
  async function getOrCreateDaySheet(userId: string, date: Date): Promise<DaySheet>;
  ```
  Usa `INSERT ... ON CONFLICT (user_id, date) DO NOTHING RETURNING *` con fallback SELECT
- [ ] Domain helpers:
  - `isMorningCompleted(daySheet)` → true cuando `identity_statement`, `wins_planned` (≥1), `avoidance` están seteados
  - `isEveningCompleted(daySheet)` → true cuando `close_summary` está seteado (el detalle per-activity vive en Activity, no aquí)
  - Auto-set `morning_completed_at = now()` en update que cumpla la condición
  - Auto-set `evening_completed_at = now()` cuando se setea `close_summary` por primera vez

## Acceptance Criteria

```gherkin
Scenario: First access today
  Given no existe DaySheet para user A hoy
  When getOrCreateDaySheet(A, today) se llama
  Then nuevo row creado y retornado

Scenario: Concurrent access
  Given 2 llamadas paralelas a getOrCreateDaySheet(A, today)
  Then exactamente 1 row existe (sin duplicado)
  And ambas llamadas retornan el mismo row

Scenario: BR-7 enforced
  Given DaySheet existe para (userA, today)
  When INSERT directo con (userA, today) duplicado
  Then UNIQUE constraint violation

Scenario: morning_completed_at auto-set
  Given DaySheet con identity_statement, wins_planned=['x'], avoidance seteados en un solo update
  Then morning_completed_at = now() automáticamente

Scenario: evening_completed_at auto-set on close_summary
  Given DaySheet sin close_summary
  When update setea close_summary = "buen día"
  Then evening_completed_at = now()

Scenario: Legacy fields no aceptados
  Given server action recibe payload con `intention`, `energy_physical` o `evening_win`
  Then Zod parser ignora esos campos (strip) o rechaza con 400 según política del schema (decisión: strip silencioso)
```

## Definition of Done

- [ ] Migration aplicada y reversible
- [ ] Helper testeado bajo concurrencia (unit)
- [ ] Completion timestamps auto-set testeados
- [ ] BR-7 enforced a nivel DB (UNIQUE constraint)
- [ ] Zod schema en `src/lib/db/schema/day-sheets.ts` deriva con `$inferSelect`/`$inferInsert` (no campos removidos)

## Implementation Evidence

**Archivos:**

- `src/lib/db/schema/day-sheets.ts` — E-020 consolidado (12 cols, FK users CASCADE). Sin legacy: intention, gratitude, energy\_\*, evening_win, evening_lesson, tomorrow_top, insight. Con: identity_statement, wins_planned[], avoidance, close_summary, notes_dreams, morning_completed_at, evening_completed_at.
- `src/lib/db/scoped.ts` — `daySheets` registrada (7 tablas en TENANT_TABLES).
- `src/lib/db/migrations/0012_workable_baron_zemo.sql` — autogen + CHECK `array_length(wins_planned) <= 3 OR NULL`. UNIQUE `(user_id, date)` (BR-7) + index `(user_id, date DESC)` para "últimos N días".
- `src/lib/db/queries/sheets.ts` NEW — `getOrCreateDaySheet(userId, dateStr)` con `onConflictDoNothing.returning()` + fallback SELECT para concurrencia.
- `src/lib/domain/day-sheet-completion.ts` NEW — pure: `isMorningCompleted`, `isEveningCompleted` (whitespace-aware).
- `src/lib/validations/day-sheet.ts` NEW — `updateDaySheetSchema` con `winsPlanned` max 3, todas las fields opcionales. Strip silencioso de legacy via Zod default unknown-keys behaviour.
- `src/lib/actions/day-sheet.ts` NEW — `updateDaySheet`: merge state → compute completion → solo stamp si no había. No-op cuando sin fields.
- `eslint.config.mjs` — `src/lib/db/queries/**` allowlisted (DB primitives consumed by actions).

**Decisiones de diseño:**

- **Stamp-once timestamps**: `morning_completed_at` y `evening_completed_at` se setean en la primera vez que las condiciones se cumplen; updates posteriores que mantienen el state no re-stampean. Eso preserva el "primer momento que el user completó el ritual" para analytics + UI ("hiciste tu morning hoy a las 7:34").
- **Strip silencioso de legacy**: el spec lo pidió explícitamente. Zod default behaviour (sin `.strict()`) descarta unknown keys sin error. Tests verifican que `intention`, `energy_physical`, `evening_win`, `tomorrow_top` se ignoran sin contaminar el payload.
- **No-op shortcut**: cuando user llama `updateDaySheet({ date })` sin otros fields, retorna el existing row sin emitir UPDATE. Idempotent UI behavior.
- **Concurrency**: `onConflictDoNothing.returning()` retorna rows insertadas (vacío en conflicto). Si vacío → fallback SELECT. La UNIQUE constraint en DB garantiza 1 sola row; el helper retorna la misma para ambos callers concurrentes.

**Cobertura tests (21):**

Completion (10):

- Morning: happy path, 3 wins cap, empty identity rejection, null wins, empty array wins, all-whitespace wins, null avoidance, empty object.
- Evening: happy path, null/undefined/empty/whitespace.

Action (11):

- Patch semantics: single field, no-op when only date, strip silentemente legacy.
- Validation: winsPlanned > 3 rechazado, malformed date rechazado.
- Auto-completion: morning single-call complete, morning cross-call last-field, no re-stamp morning, evening on first close_summary, no re-stamp evening, both at once.

**Scope deferred:**

- UI wire del morning ritual SCR + close-day modal SCR-060 → ISSUE-031 (DaySheet UI inline edit) cuando wire to actions.
- Concurrency test real contra Neon (con 2 connections paralelas) → defer hasta integration suite.

**Verificación:**

- `pnpm typecheck` ✅
- `pnpm lint` ✅ 0 errors
- `pnpm test day-sheet-completion + day-sheet-actions` ✅ 21/21
- `pnpm test` full ✅ 718/718 estable
- `pnpm db:migrate` ✅ aplicado a Neon dev branch
