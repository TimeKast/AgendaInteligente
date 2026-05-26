---
id: ISSUE-034
title: Friday cron — materialize next WeekSheet (OPS-7)
epic: EPIC-SHEETS
milestone: v1.0
priority: P1
story_points: 2
status: completed
completed_date: 2026-05-26
dependencies: [ISSUE-032, ISSUE-080]
user_stories: [US-033]
features: [FT-034]
screens: []
business_rules: [BR-7, OPS-7]
agents: [backend-specialist]
skills: [/backend]
---

# ISSUE-034 — Friday cron materializes next WeekSheet

## Overview

Inngest cron Viernes pre-create empty WeekSheet for next week so that Sunday kickoff (FLW-006) tiene row ya disponible.

## Tasks

- [ ] Inngest function `weekly.materialize.next` triggered Fridays at midnight UTC (Saturday for users en east TZs)
- [ ] For each active user (not deleted, not muted indefinitely): create WeekSheet for week_starting = next Sunday in user TZ
- [ ] Idempotent: if already exists, skip
- [ ] Domain helper `getNextWeekStarting(now, userTimezone)` retorna next Sunday correctamente
- [ ] Telemetry: count created vs skipped per run

## Acceptance Criteria

```gherkin
Scenario: Friday job creates next WeekSheet
  Given alice's TZ = America/Mexico_City
  When cron runs Viernes
  Then WeekSheet row created con (alice.id, next Sunday's date)
  And all kickoff/review fields = NULL

Scenario: Idempotent
  Given WeekSheet already exists
  When job runs again
  Then no duplicate, no error

Scenario: Deleted user skipped
  Given user con deleted_at set
  Then job skips that user
```

## Definition of Done

- [x] Inngest function tested locally (vi mocks for fan-out + DB)
- [x] Tested for users en distintos TZs (MX vs Tokyo + UTC mix)
- [ ] Documented en runbook for ops → smoke test on first deploy con Inngest CLI

## Implementation Evidence

**Archivos NEW:**

- `src/lib/inngest/functions/weeksheet-materialize.ts` — `runWeeksheetMaterialize({ step, logger, now? })` handler + `createFunction({ triggers: [{ cron: '0 0 * * 5' }] })`. Fan-out con `Promise.allSettled`, per-user `step.run('materialize-<id>')` para retry granularity.
- `tests/unit/inngest-weeksheet-materialize.test.ts` — 5 tests (empty users, per-TZ fan-out MX vs Tokyo, created vs skipped counts, failure isolation, step.run IDs).

**Archivos EDIT:**

- `src/lib/domain/week-calc.ts` — agrega `getNextWeekStarting(now, tz)`: delegates a `weekStartingFor(now + 7d, tz)` para reusar todo el path DST-safe (setUTCDate + Intl read).
- `src/lib/db/queries/sheets.ts` — agrega `tryCreateWeekSheet(userId, weekStartingStr): Promise<{ created }>`. Variante focused para el cron — INSERT ... ON CONFLICT DO NOTHING RETURNING id (no row read-back). Mantiene `getOrCreateWeekSheet` intacto para la UI de ISSUE-033.
- `src/lib/inngest/functions/index.ts` — registra `weeksheetMaterialize` en el barrel.
- `tests/unit/week-calc.test.ts` — +6 tests para `getNextWeekStarting`: Fri/Sun/Sat → next Sunday, cross-month, cross-year, DST spring-forward (Pacific Mar 8 2026).

**Decisiones de diseño:**

- **Cron `0 0 * * 5`** = Friday 00:00 UTC. Cubre Americas (Thu evening local) + Asia/Pacific (Fri afternoon local). Siempre al menos 1 día antes del Sunday kickoff.
- **`tryCreateWeekSheet` separado de `getOrCreateWeekSheet`**: el cron no necesita la fila completa — saber si se creó es la única info útil para telemetría. Evita un SELECT extra por user.
- **Inyección de `now` opcional**: handler acepta `now?: Date` (default `new Date()`) para que los tests prueben TZ-matrix sin tocar el reloj del sistema.
- **No filtrar por `muted_until`**: materializar el row es cheap + idempotente. Mute controla notificaciones, no la existencia del sheet. Un user muteado igual necesita el row cuando se desmutea.
- **Per-user `step.run`** (mismo pattern que recurrence cron): Inngest replay solo replica los users que fallaron, no toda la corrida.
- **`tryCreateWeekSheet` race-safe**: INSERT ... ON CONFLICT DO NOTHING — bajo concurrencia, exactamente una INSERT gana, las demás reciben `{ created: false }`.

**Verificación:**

- `pnpm typecheck` ✅
- `pnpm lint` ✅ 0 errors
- `pnpm test week-calc weeksheet` ✅ 32/32 (27 week-calc + 5 weeksheet-materialize)
- `pnpm test` full ✅ **774/774** (sin flake esta corrida)

**Telemetry shape:**

```
[weekly.materialize.next] users=42 created=10 skipped=32 failed=0
```

Created = nuevas filas (primera Friday después del onboarding del user). Skipped = WeekSheet ya existía (idempotent re-run o segundo cron del trimestre). Failed = excepción al insertar (log con userId para diagnose).
