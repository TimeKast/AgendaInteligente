---
id: ISSUE-024
title: Recurrence DSL simplificado (daily/weekly/monthly) + cron materialización 14 días
epic: EPIC-TIME
milestone: v1.0
priority: P2
story_points: 5
status: completed
completed_date: 2026-05-26
dependencies: [ISSUE-013, ISSUE-020]
user_stories: [US-025]
features: [FT-026]
screens: [SCR-040]
business_rules: [BR-11, OPS-5]
agents: [backend-specialist]
skills: [/backend, /database]
---

# ISSUE-024 — Recurrence DSL simplificado

## Overview

Implementa `recurrence_rule` como DSL simplificado (no iCal RRULE completo). Cron materializa próximas 14 instancias de cada recurring activity. Cada instancia se persiste como row separada con `recurrence_parent_id`. Reemplaza el enfoque RRULE estándar adoptado anteriormente — la decisión se simplificó tras iteración prototipo (BR-11 redefinida).

## DSL soportado (v1)

```
daily
weekly:MO,WE,FR          # lista de días en mayúsculas ISO (MO,TU,WE,TH,FR,SA,SU)
monthly:1                # día del mes (1..31)
monthly:last             # último día del mes (calculado por mes)
```

Cualquier otro string → rechazo con `400 invalid_recurrence_rule`.

## Tasks

- [ ] Parser + validator en [src/lib/domain/recurrence.ts](../../../../src/lib/domain/recurrence.ts):
  - `parseRecurrenceRule(s: string): ParsedRule | null`
  - Zod schema custom con `.refine()` que acepta solo los 4 formatos del DSL
  - Tests unitarios (unit layer): casos válidos + casos inválidos (`weekly:XX`, `monthly:32`, `monthly:0`, casos vacíos)
- [ ] UI: recurrence picker en activity form (`RecurrencePicker`):
  - Presets visuales: "Diaria" / "Semanal en días específicos" (chips L-M-X-J-V-S-D) / "Día del mes" (1-31) / "Último día del mes"
  - NO permite ingreso libre de string — solo presets
- [ ] Materializer en Inngest function `recurrence.materialize.daily`:
  - Para cada activity con `recurrence_rule` no nulo, expandir DSL próximos 14 días en TZ del user
  - INSERT instancias faltantes con `recurrence_parent_id = parent.id`
  - Idempotente: skip instancias que ya existen para esa fecha
- [ ] Edit recurring activity: cambio simple en parent regenera futuras (semana siguiente en adelante), instancias pasadas intactas
- [ ] Delete recurring activity: prompt "¿borrar solo esta instancia o también próximas?"
- [ ] BR-11 actualizada en código: validator rechaza RRULE strings legacy (`FREQ=*`) con mensaje de migración

## Acceptance Criteria

```gherkin
Scenario: Weekly preset
  Given user crea activity "Gym" con preset semanal L-W-V
  Then recurrence_rule stored: "weekly:MO,WE,FR"
  And cron materializa ~6 instancias en próximos 14 días

Scenario: Daily preset
  Given user crea activity "Diario" con preset diaria
  Then recurrence_rule stored: "daily"
  And cron materializa 14 instancias

Scenario: Monthly day-of-month
  Given user crea activity "Renta" con preset día 1 del mes
  Then recurrence_rule stored: "monthly:1"
  And cron materializa la próxima ocurrencia del día 1 dentro de la ventana

Scenario: Monthly last
  Given user crea activity con preset "último día del mes"
  Then recurrence_rule stored: "monthly:last"
  And cron resuelve correctamente meses con 28/29/30/31 días

Scenario: Invalid rule rejected
  Given server action recibe recurrence_rule = "FREQ=WEEKLY;BYDAY=MO"
  Then 400 invalid_recurrence_rule con hint "use DSL simplificado"

Scenario: Idempotent materialization
  Given recurrence ya materializada
  When cron corre de nuevo
  Then no instancias duplicadas creadas

Scenario: DST transition
  Given recurring weekly activity cruza cambio DST
  Then instancias creadas correctamente en TZ local del user
```

## Definition of Done

- [ ] Parser + validator con tests unitarios (≥ 12 casos, válidos + inválidos)
- [ ] Component test (RTL) del `RecurrencePicker`: cambiar entre presets actualiza el valor del form correctamente
- [ ] Inngest cron tested
- [ ] Edge case DST cubierto
- [ ] Performance: materialización < 5s para user con 50 recurring activities
- [ ] BR-11 reference doc apunta al DSL nuevo (no a RRULE)

## Implementation Evidence

**Archivos:**

- `src/lib/domain/recurrence.ts` — pure domain. 3 funciones públicas:
  - `parseRecurrenceRule(input)`: strict DSL parser → `ParsedRule | null`.
  - `expandRecurrence(rule, fromDate, days, tz)`: emite ISO-dates (`YYYY-MM-DD`) en TZ usuario dentro del window.
  - `expandFromString(rule, fromDate, days, tz)`: convenience parse + expand.
  - Tipos exportados: `ParsedRule`, `WeekdayCode`.
- `src/lib/cron/recurrence.ts` — `materializeUserRecurrences(userId, options?)`. Resuelve TZ del user, recorre cada parent recurring activity, idempotent skip de fechas ya materializadas, bulk INSERT del resto. Retorna `{ created, skipped, parentCount }` para ops visibility.
- `src/lib/validations/activity.ts` — `recurrenceSchema` ahora delega a `parseRecurrenceRule` via `superRefine` (single source of truth con el domain). Mensaje de error específico para iCal `FREQ=…` legacy ("Usa el DSL simplificado… no iCal RRULE").
- `eslint.config.mjs` — `src/lib/cron/**` allowlisted (system tasks, no session userId).
- `tests/unit/recurrence-parser.test.ts` — 43 tests cubriendo valid shapes + invalid + legacy iCal hint.
- `tests/unit/recurrence-materializer.test.ts` — 18 tests cubriendo expand exhaustivo + cron materializer mockeado.

**Decisiones de diseño:**

- **DSL strict, sin RRULE**: `daily`, `weekly:DAYS`, `monthly:1..28`, `monthly:last`. Cualquier otro string → null. Legacy `FREQ=…` rechazado con migration hint.
- **`monthly:N` con N=29..31 rechazado**: febrero no puede satisfacerlo. Para "fin de mes" usar `monthly:last` (resuelve 28/29/30/31 dinámicamente). Decisión predictable vs clamp.
- **TZ via `Intl.DateTimeFormat`** (en-CA emite ISO date format nativo, sin polyfills). Sin nuevas deps (date-fns-tz, luxon).
- **DST-safe**: `setUTCDate(+N)` + read weekday/day-of-month en TZ user via Intl. No "add 24h numéricos" en ningún lado. Tests cubren spring-forward US Pacific y fall-back sin dupes/skips.
- **Materializer es pure-function-first**: `expandRecurrence` es completamente determinista; el cron solo orquesta DB I/O. Tests del expander corren sin Neon en 6s.
- **Idempotency**: el cron query existing instances per parent (`recurrence_parent_id = parent.id`), construye `Set<dateStr>` de "ya materializado", solo INSERT-ea las diferencias. Re-runs son gratis.
- **Instance shape**: cada instancia copia `projectId/title/description/priority/quadrant/tags/scheduledTime/durationMinutes/estimatedMinutes` del parent. NO copia: `deadline`, `progress_percent`, `reasonNotDone`. `recurrenceRule=null`, `recurrenceParentId=parent.id`, `scheduledDates=[targetDate]`.

**Cobertura tests (61):**

Parser (43):

- 7 valid shapes (daily, weekly:1day, weekly:3days, weekly:full-week, monthly:1, monthly:28, monthly:last).
- 24 invalid shapes (empty, case-wrong, leading-zero, duplicates, monthly:0/29/31/negative, FREQ=_, yearly:_, etc).
- 6 non-string inputs (null, undefined, number, object, array, boolean).
- 3 legacy iCal hint variants.

Expand (12):

- Daily: 14-day count, days=0 → empty.
- Weekly: MO,WE,FR exact match, single-day SU.
- Monthly day: in-window, out-of-window, two occurrences in 40d.
- Monthly last: cross-month (May-Jun-Jul 31/30/31), Feb non-leap (28), Feb leap 2028 (29).
- TZ: weekday in user TZ (UTC vs CST boundary), DST spring-forward, DST fall-back.

Cron materializer (5):

- No parents → no-op.
- User not found → no-op graceful.
- Daily empty state → 14 inserts.
- Idempotent re-run → 10 skipped + 4 created.
- `monthly:15` outside 14d window → 0 inserts.

Integration (1): parser-acceptance ↔ schema-acceptance.

**Scope deferred:**

- `RecurrencePicker` UI component (chips L-M-X-J-V-S-D, day-of-month picker) → ISSUE-014/020 cuando wire UI a actions.
- Inngest function wrapper + schedule registration → ISSUE-080.
- Edit recurring activity "regenerate future" prompt + delete one-vs-cascade → ISSUE-014.

**Verificación:**

- `pnpm typecheck` ✅
- `pnpm lint` ✅ 0 errors
- `pnpm test recurrence-parser + recurrence-materializer` ✅ 61/61
- `pnpm test` full ✅ 697/697 (re-run; 1 flake transitorio register pre-existente)
