---
id: ISSUE-013
title: Activity schema + base CRUD (incluye quadrant, scheduled_dates[], progress_percent, duration_minutes)
epic: EPIC-ORG
milestone: v1.0
priority: P0
story_points: 5
status: ready
dependencies: [ISSUE-012]
user_stories: [US-015, US-016]
features: [FT-012, FT-135, FT-136, FT-137]
screens: [SCR-040, SCR-051]
business_rules: [BR-2, BR-8, BR-15, BR-16, BR-17]
agents: [backend-specialist]
skills: [/database, /backend]
entities: [E-005]
---

# ISSUE-013 — Activity entity + base CRUD (con campos prototipo)

## Overview

Crea entidad Activity con todos los campos base (title, description, project link, priority, status, tags) **más los campos validados por prototipo**: `quadrant`, `scheduled_dates[]` (reemplaza `scheduled_date` single), `duration_minutes`, `progress_percent`. NO se incluye `time_blocks` (deprecated por prototipo — `scheduled_time + duration_minutes` cubre todos los casos).

## Schema fields

| Field                  | Type                         | Notas                                                                                                                                                                                                  |
| ---------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `scheduled_dates`      | date[] NOT NULL DEFAULT '{}' | Reemplaza el `scheduled_date date` original. Normalizado (unique + asc, BR-15). `{}` = pool/backlog. v1 típicamente 0 o 1 elemento; multi-día soportado sin migration destructiva. UI en ISSUE-136-NEW |
| `scheduled_time`       | time NULL                    | NULL = no anchor. Aplica al día agendado (combinada con cada `scheduled_dates[i]`).                                                                                                                    |
| `duration_minutes`     | int NULL                     | Duración programada del bloque anchored. NULL si pool o sin anchor. Requiere `scheduled_time NOT NULL` (BR-16).                                                                                        |
| `estimated_minutes`    | int NULL                     | Estimación al crear; distinta de `duration_minutes` real agendada                                                                                                                                      |
| `quadrant`             | smallint NULL                | Eisenhower 1\|2\|3\|4. Materializado (no derivado). NULL = no clasificada. UI en ISSUE-135-NEW                                                                                                         |
| `progress_percent`     | smallint NULL                | 0..100. Usado en close-day cuando user marca "Avanzada". NULL si no aplica. Si status='done' → forzado a 100 (BR-17). UI en ISSUE-137-NEW                                                              |
| `recurrence_rule`      | text NULL                    | DSL simplificado (ver ISSUE-024)                                                                                                                                                                       |
| `recurrence_parent_id` | uuid NULL FK → activities.id | ON DELETE CASCADE                                                                                                                                                                                      |
| `reason_not_done`      | text NULL                    | (existente)                                                                                                                                                                                            |
| `reason_category`      | text NULL                    | (existente)                                                                                                                                                                                            |

NO crear columnas legacy: `scheduled_date` (single date), `time_blocks` text[].

## Tasks

- [ ] Migration: crear `activities` table per E-005 actualizado
  - FK `project_id NOT NULL ON DELETE RESTRICT` (BR-2)
  - CHECK `status IN (...)`
  - CHECK `priority BETWEEN 1 AND 5`
  - CHECK `quadrant IS NULL OR quadrant BETWEEN 1 AND 4`
  - CHECK `progress_percent IS NULL OR progress_percent BETWEEN 0 AND 100`
  - CHECK `duration_minutes IS NULL OR duration_minutes > 0`
  - CHECK `duration_minutes IS NULL OR scheduled_time IS NOT NULL` (BR-16)
  - GIN index en `tags`
- [ ] Indexes:
  - GIN en `scheduled_dates` para queries `scheduled_dates @> ARRAY[?]::date[]`
  - `(user_id, status, deadline)`
  - `(user_id, project_id)`
  - `(user_id, quadrant)` para matrix views
- [ ] Server Actions: `createActivity`, `updateActivity`, `deleteActivity` (transitions van en ISSUE-017)
- [ ] Default `project_id` = Inbox del user si se omite
- [ ] Zod validation:
  - `title` 1-200, `description` max 2000
  - `scheduled_dates`: `.transform((arr) => [...new Set(arr)].sort())` (BR-15)
  - `.refine()` para BR-16 (duration_minutes requires scheduled_time)
  - `.refine()` para BR-17 (si status='done', set progress_percent=100 antes de persistir)

## Acceptance Criteria

```gherkin
Scenario: Create activity con scheduled_dates múltiples
  Given user crea activity con scheduled_dates = ["2026-05-21", "2026-05-19", "2026-05-21"]
  When createActivity es llamado
  Then row tiene scheduled_dates = ["2026-05-19", "2026-05-21"] (deduplicado + ordenado, BR-15)

Scenario: Create activity sin scheduled_dates
  Given user crea activity sin dates
  Then row tiene scheduled_dates = '{}' (pool/backlog)

Scenario: duration_minutes sin scheduled_time rechazado (BR-16)
  Given payload con duration_minutes=30 y scheduled_time=null
  Then 400 validation_failed con field hint

Scenario: Quadrant validation
  Given payload con quadrant=5
  Then 400 validation_failed (CHECK constraint blockea backup)

Scenario: progress_percent fuera de rango
  Given payload con progress_percent=150
  Then 400 validation_failed

Scenario: status=done forces progress_percent=100 (BR-17)
  Given activity con progress_percent=60 y status='in_progress'
  When updateActivity transiciona a status='done'
  Then progress_percent persiste como 100

Scenario: Default to Inbox
  Given user crea activity sin project_id
  Then activity asignada al Inbox project del user

Scenario: Validation
  Given title vacío
  Then 400 validation_failed con field=title

Scenario: Project deletion guarded
  Given project P con activities
  When intento delete P sin cascade
  Then RESTRICT prevents (BR-2)
```

## Definition of Done

- [ ] Migration aplicada
- [ ] Server Actions con tests (unit) que cubran los 7 scenarios arriba
- [ ] GIN index en `scheduled_dates` validado con `EXPLAIN ANALYZE` en query `scheduled_dates @> ARRAY['2026-05-19'::date]`
- [ ] BR-15, BR-16, BR-17 reference docs apuntan a este issue
- [ ] Tags array funciona con GIN index queries
