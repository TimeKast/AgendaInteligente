---
id: ISSUE-133
title: Pantalla `/stats` — dashboard de KPIs (consistencia, completion, top projects, streak)
epic: EPIC-ORG
milestone: v1.0
priority: P2
story_points: 5
status: ready
dependencies: [ISSUE-013, ISSUE-030, ISSUE-134]
user_stories: [US-133]
features: [FT-133]
screens: [SCR-044]
business_rules: []
agents: [backend-specialist, frontend-specialist]
skills: [/backend, /frontend]
components: [CMP-136, CMP-137]
---

# ISSUE-133 — Dashboard `/stats`

## Overview

Nueva ruta `/stats` con dashboard read-only de KPIs de consistencia y ejecución. Visual-only en v1.0 (sin escritura, sin gamification). Bar chart simple por semana/mes. KPIs definidos en este issue (v1.0 baseline).

## KPIs v1.0

| KPI                        | Definición                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------------- |
| **Consistencia check-ins** | % de últimos 30 días con `morning_completed_at IS NOT NULL` AND `evening_completed_at IS NOT NULL` |
| **Completion rate**        | `count(activities WHERE status='done' AND scheduled_dates @> [last 30 days])` / `count(scheduled)` |
| **Top 5 projects**         | Top 5 projects por count de activities con status='done' en últimos 30 días                        |
| **Días de streak actual**  | Streak consecutivo de días con `morning_completed_at IS NOT NULL` (rompe si un día queda en NULL)  |

## Tasks

- [ ] Server query `getUserStats(userId, periodDays=30)`:
  - Retorna `{ consistencyPct, completionRatePct, topProjects: [{id, name, count}], currentStreakDays }`
  - Cached con `unstable_cache` o `revalidate=300` (5 min)
- [ ] Ruta `app/(agendaInteligente)/stats/page.tsx`
- [ ] CMP-136 `StatsKpiCard`:
  - Title + valor grande (%) + sub-label
  - Variantes: percentage, count, streak
- [ ] CMP-137 `BarChart` (Recharts wrapper):
  - Eje X: semanas (últimas 8) o días (últimos 30) — toggle
  - Eje Y: count completion
  - Tooltip on hover con detalle
- [ ] Layout `/stats`:
  - Grid 2×2 de StatsKpiCard arriba (4 KPIs)
  - BarChart en el bottom
  - Toggle period: 7d / 30d / 90d
- [ ] NO incluir streaks/badges gamificados (diferido v2 — DD-014)
- [ ] Accesible desde bottom nav (overflow "Más" si no cabe en 7) o desde Settings

## Acceptance Criteria

```gherkin
Scenario: Default view 30d
  Given user con datos de últimos 60 días
  When abre /stats
  Then default period = 30d
  4 KPI cards renderizan con valores no-zero
  BarChart muestra últimas 4 semanas

Scenario: Change period
  Given default 30d
  When tap "7d"
  Then KPIs recalculan
  BarChart re-renderiza con 7 días

Scenario: Empty state (user nuevo)
  Given user con 0 días de datos
  Then KPIs muestran "—" o "Sin datos aún"
  BarChart muestra estado vacío con copy

Scenario: Top projects
  Given user con 3 projects con done activities
  Then top projects list muestra 3 (no 5, no error)
  Cada uno con su count

Scenario: Streak break
  Given user con morning_completed_at en 4 días seguidos
  Y luego 1 día sin
  Then currentStreakDays = 0 (reseteado tras break)

Scenario: Read-only
  Given user en /stats
  Then no hay botones de escritura
  No hay edits inline

Scenario: Component test (RTL)
  Given mock query con consistencyPct=85
  Then card "Consistencia check-ins" renderiza "85%"
```

## Definition of Done

- [ ] Server query con tests unitarios para cada KPI (≥ 4 tests, incluyendo edge case streak break)
- [ ] Component test (RTL) ≥ 2 tests (toggle period + empty state)
- [ ] BarChart con Recharts (ya instalado per kit)
- [ ] Mobile 375px responsive — KPIs en columna single en mobile
- [ ] Cache 5 min validado (no recalcula on every request)
- [ ] NO incluye gamification (verificado en code review)
