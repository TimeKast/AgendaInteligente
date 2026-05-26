# 06 — Data Model

> **Source:** [00_DISCOVERY_BRIEF.md §4](./00_DISCOVERY_BRIEF.md) + [05_BUSINESS_RULES.md](./05_BUSINESS_RULES.md)
> **Namespace:** `E-NNN`
> **Format:** SSOT lógico. Drizzle schema real vive en [src/lib/db/schema.ts](../../src/lib/db/schema.ts) cuando se implemente.
> **Scope:** v1 (MVP) + estructura para v1.5/v2 sin migrations destructivas.

---

## ERD overview

```
┌─────────┐         ┌──────────────────┐
│  User   │ 1 ─── 1 │ NotificationPref │
└─────────┘         └──────────────────┘
   │
   │ 1
   │
   ├──── ∗ ──── Category
   │                │
   │                │ 1
   │                ├──── ∗ ──── Project ──── ∗ ──── Activity ──── ∗ ──── Subtask (1 level)
   │                                              │
   │                                              │ (M2M via GoalLink)
   │                                              │
   ├──── ∗ ──── Goal ────────────────────────────┘
   │
   ├──── ∗ ──── DaySheet
   ├──── ∗ ──── WeekSheet
   ├──── ∗ ──── MonthSheet
   ├──── ∗ ──── QuarterSheet (v1.5)
   ├──── ∗ ──── YearSheet (v1.5)
   ├──── ∗ ──── FiveYearSheet (v2)
   ├──── ∗ ──── LifeSheet (v2)
   │
   ├──── ∗ ──── PlanSnapshot  (1:1 opcional con WeekSheet | MonthSheet)
   │
   ├──── ∗ ──── Conversation ──── ∗ ──── Message
   ├──── ∗ ──── ProactiveTask
   ├──── ∗ ──── SheetEmbedding (v1.5, polymorphic)
   ├──── ∗ ──── CalendarConnection  (N:1; multi-cuenta, multi-provider)
   ├──── 1 ──── Subscription ──── ∗ ──── 1 ──── Plan
   └──── ∗ ──── UsageMeter (bucketed monthly)
```

---

## Entities

### E-001 — User

Cuenta del usuario. Multi-tenant root.

| Field                      | Type                                        | Notes                                                |
| -------------------------- | ------------------------------------------- | ---------------------------------------------------- |
| `id`                       | uuid pk                                     | Default `gen_random_uuid()`                          |
| `email`                    | text NOT NULL UNIQUE                        | Lowercase normalized                                 |
| `email_verified_at`        | timestamptz NULL                            | NextAuth standard                                    |
| `name`                     | text NULL                                   | From OAuth or onboarding                             |
| `image`                    | text NULL                                   | OAuth avatar URL                                     |
| `password_hash`            | text NULL                                   | bcrypt; null if OAuth-only                           |
| `google_oauth_id`          | text NULL UNIQUE                            | sub claim of Google OAuth                            |
| `preferred_language`       | text NOT NULL DEFAULT 'es'                  | 'es' \| 'en' (enum constraint)                       |
| `timezone`                 | text NOT NULL DEFAULT 'America/Mexico_City' | IANA TZ                                              |
| `intensity_mode`           | text NOT NULL DEFAULT 'gentle'              | enum: sharp \| standard \| gentle \| listening       |
| `intensity_expires_at`     | timestamptz NULL                            | For listening auto-revert (OPS-4)                    |
| `intensity_default_until`  | timestamptz NULL                            | Gentle default expires for new users 14d post-signup |
| `onboarding_context`       | text NULL                                   | Captured at signup: "what frustrates them"           |
| `onboarding_completed_at`  | timestamptz NULL                            | NULL = still in onboarding                           |
| `last_active_at`           | timestamptz NULL                            | For silence detection (OPS-3)                        |
| `silence_re_entry_sent_at` | timestamptz NULL                            | Reset on user action                                 |
| `deleted_at`               | timestamptz NULL                            | Soft delete (BR-14)                                  |
| `created_at`               | timestamptz NOT NULL DEFAULT now()          |                                                      |
| `updated_at`               | timestamptz NOT NULL DEFAULT now()          | Updated by app code                                  |

**Indexes:** `email` (unique), `google_oauth_id` (unique partial WHERE NOT NULL), `last_active_at` (for cron OPS-3), `deleted_at` (for purge cron BR-14)

**Constraints:**

- `password_hash IS NOT NULL OR google_oauth_id IS NOT NULL` (must have one auth method)
- `intensity_mode IN ('sharp','standard','gentle','listening')`

**Linked:** BR-1, BR-14, AI-1

---

### E-002 — NotificationPref

Preferencias de check-in 1-to-1 con User.

| Field                 | Type                               | Notes                                                                                                                                                                                           |
| --------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `user_id`             | uuid pk FK → users.id              | ON DELETE CASCADE                                                                                                                                                                               |
| `morning_time`        | time NOT NULL DEFAULT '08:00'      | User TZ aware                                                                                                                                                                                   |
| `midday_time`         | time NOT NULL DEFAULT '13:00'      |                                                                                                                                                                                                 |
| `evening_time`        | time NOT NULL DEFAULT '21:00'      |                                                                                                                                                                                                 |
| `weekly_kickoff_dow`  | smallint NOT NULL DEFAULT 0        | 0=Sunday … 6=Saturday                                                                                                                                                                           |
| `weekly_kickoff_time` | time NOT NULL DEFAULT '18:00'      |                                                                                                                                                                                                 |
| `weekly_review_dow`   | smallint NOT NULL DEFAULT 6        | 6=Saturday                                                                                                                                                                                      |
| `weekly_review_time`  | time NOT NULL DEFAULT '20:00'      |                                                                                                                                                                                                 |
| `weekend_skip`        | boolean NOT NULL DEFAULT false     | Toggle simple: si `true`, NO se envían check-ins sábado/domingo. Renombrado desde `weekend_enabled` para alinear semánticamente (skip-true = no enviar). Default `false` → manda 7 días/semana. |
| `days_off`            | date[] NOT NULL DEFAULT '{}'       | Fechas absolutas en las que el agente NO debe enviar check-ins (vacaciones, días puntuales). NO recurring — para recurring usar `weekend_skip` u opciones futuras.                              |
| `push_enabled`        | boolean NOT NULL DEFAULT true      |                                                                                                                                                                                                 |
| `email_enabled`       | boolean NOT NULL DEFAULT false     | Email fallback                                                                                                                                                                                  |
| `muted_until`         | timestamptz NULL                   | Temporary mute (US-087)                                                                                                                                                                         |
| `updated_at`          | timestamptz NOT NULL DEFAULT now() |                                                                                                                                                                                                 |

**Indexes:** GIN on `days_off` (filtrar rápido en cron de scheduling)

**Channels v1:** solo push (PWA) + email. Discord movido a v2 (cualquier mención de Discord como canal en planning original queda diferida a v2 scope).

**Linked:** FT-085, US-085, OPS-1..4

---

### E-003 — Category

Nivel 1 de organización jerárquica.

| Field        | Type                               | Notes                          |
| ------------ | ---------------------------------- | ------------------------------ |
| `id`         | uuid pk                            |                                |
| `user_id`    | uuid NOT NULL FK → users.id        | ON DELETE CASCADE              |
| `name`       | text NOT NULL                      |                                |
| `color`      | text NOT NULL DEFAULT '#5C5C5C'    | Hex                            |
| `icon`       | text NULL                          | Lucide icon name               |
| `position`   | int NOT NULL DEFAULT 0             | For ordering                   |
| `is_inbox`   | boolean NOT NULL DEFAULT false     | Single per user; not deletable |
| `deleted_at` | timestamptz NULL                   | Soft delete                    |
| `created_at` | timestamptz NOT NULL DEFAULT now() |                                |
| `updated_at` | timestamptz NOT NULL DEFAULT now() |                                |

**Indexes:** `(user_id, position)` for sorted listing; UNIQUE `(user_id, is_inbox) WHERE is_inbox = true` (exactly one Inbox per user)

**Constraints:**

- `UNIQUE (user_id, name) WHERE deleted_at IS NULL`
- `is_inbox = true → name = 'Inbox'`

**Linked:** BR-3, BR-4

---

### E-004 — Project

Nivel 2 de organización.

| Field              | Type                               | Notes                                         |
| ------------------ | ---------------------------------- | --------------------------------------------- |
| `id`               | uuid pk                            |                                               |
| `user_id`          | uuid NOT NULL FK → users.id        | ON DELETE CASCADE                             |
| `category_id`      | uuid NOT NULL FK → categories.id   | ON DELETE RESTRICT (BR-3)                     |
| `name`             | text NOT NULL                      |                                               |
| `description`      | text NULL                          |                                               |
| `status`           | text NOT NULL DEFAULT 'active'     | enum: active \| paused \| completed \| killed |
| `deadline`         | date NULL                          |                                               |
| `outcome_expected` | text NULL                          | What "done" looks like                        |
| `is_inbox`         | boolean NOT NULL DEFAULT false     | One per user, in Inbox category               |
| `deleted_at`       | timestamptz NULL                   |                                               |
| `created_at`       | timestamptz NOT NULL DEFAULT now() |                                               |
| `completed_at`     | timestamptz NULL                   |                                               |
| `updated_at`       | timestamptz NOT NULL DEFAULT now() |                                               |

**Indexes:** `(user_id, category_id)`, `(user_id, status)`, UNIQUE `(user_id, is_inbox) WHERE is_inbox = true`

**Constraints:** `status IN ('active','paused','completed','killed')`

**Linked:** BR-2, BR-3, FT-011

---

### E-005 — Activity

Unidad de trabajo.

| Field                  | Type                               | Notes                                                                                                                                                                             |
| ---------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                   | uuid pk                            |                                                                                                                                                                                   |
| `user_id`              | uuid NOT NULL FK → users.id        | ON DELETE CASCADE                                                                                                                                                                 |
| `project_id`           | uuid NOT NULL FK → projects.id     | ON DELETE RESTRICT (BR-2)                                                                                                                                                         |
| `title`                | text NOT NULL                      |                                                                                                                                                                                   |
| `description`          | text NULL                          |                                                                                                                                                                                   |
| `scheduled_dates`      | date[] NOT NULL DEFAULT '{}'       | Reemplaza `scheduled_date`. `{}` = pool / backlog. v1 típicamente 0 o 1 elemento; multi-día soportado sin migration destructiva.                                                  |
| `scheduled_time`       | time NULL                          | NULL = no anchor. Aplica al día agendado (sin fecha; combinada con cada `scheduled_dates[i]`).                                                                                    |
| `duration_minutes`     | int NULL                           | Duración programada cuando la tarea está anchored en grid (`scheduled_time` set). NULL si pool o sin anchor.                                                                      |
| `deadline`             | timestamptz NULL                   | Different from scheduled                                                                                                                                                          |
| `estimated_minutes`    | int NULL                           | Estimación al crear; `duration_minutes` es el bloque agendado real.                                                                                                               |
| `priority`             | smallint NOT NULL DEFAULT 3        | 1-5, 5 highest                                                                                                                                                                    |
| `quadrant`             | smallint NULL                      | Eisenhower 1\|2\|3\|4. Materializado (no derivable) — user puede moverlo drag-and-drop sin cambiar priority/urgency. NULL = no clasificada.                                       |
| `progress_percent`     | smallint NULL                      | 0..100. Usado en close-day cuando user marca "Avanzada" en vez de "Hecha". NULL si no aplica.                                                                                     |
| `recurrence_rule`      | text NULL                          | DSL simplificado (NO RRULE completo). Sintaxis: `daily` \| `weekly:MO,WE,FR` \| `monthly:1` \| `monthly:last`. Validación Zod en `lib/validations/activity.ts`. v2 puede ampliar. |
| `recurrence_parent_id` | uuid NULL FK → activities.id       | If this is a materialized instance                                                                                                                                                |
| `status`               | text NOT NULL DEFAULT 'pending'    | pending \| in_progress \| done \| skipped \| blocked                                                                                                                              |
| `completed_at`         | timestamptz NULL                   |                                                                                                                                                                                   |
| `reason_not_done`      | text NULL                          | When skipped/blocked                                                                                                                                                              |
| `reason_category`      | text NULL                          | enum: time \| priority \| blocked \| didnt_want \| other                                                                                                                          |
| `tags`                 | text[] NOT NULL DEFAULT '{}'       | Lowercase normalized                                                                                                                                                              |
| `deleted_at`           | timestamptz NULL                   |                                                                                                                                                                                   |
| `created_at`           | timestamptz NOT NULL DEFAULT now() |                                                                                                                                                                                   |
| `updated_at`           | timestamptz NOT NULL DEFAULT now() |                                                                                                                                                                                   |

**Removed in prototype iteration:**

- `scheduled_date` (single date) — reemplazado por `scheduled_dates` array.
- `time_blocks` — la combinación `scheduled_time + duration_minutes` cubre todos los casos de uso del prototipo (no se requieren bloques semánticos morning/afternoon/evening).

**Indexes:**

- GIN on `scheduled_dates` for daily queries (`scheduled_dates @> ARRAY[?]::date[]`)
- `(user_id, status, deadline)` for risk detection
- `(user_id, project_id)`
- `(user_id, quadrant)` for matrix views
- `(recurrence_parent_id)` for cascade of materialized instances
- GIN on `tags`

**Constraints:**

- `priority BETWEEN 1 AND 5`
- `quadrant IS NULL OR quadrant BETWEEN 1 AND 4`
- `progress_percent IS NULL OR progress_percent BETWEEN 0 AND 100`
- `duration_minutes IS NULL OR duration_minutes > 0`
- `status IN (...)`
- `reason_category IN (...) OR reason_category IS NULL`
- `(status IN ('skipped','blocked')) OR reason_not_done IS NULL` (only set when not done — soft rule, app enforces)
- App-level: `scheduled_dates` se normaliza a fechas únicas y ordenadas asc antes de persistir.

**Linked:** BR-2, BR-5, BR-8, BR-11, FT-012..028

---

### E-006 — Subtask

Item dentro de Activity. 1 nivel only (BR-5).

| Field          | Type                               | Notes             |
| -------------- | ---------------------------------- | ----------------- |
| `id`           | uuid pk                            |                   |
| `activity_id`  | uuid NOT NULL FK → activities.id   | ON DELETE CASCADE |
| `title`        | text NOT NULL                      |                   |
| `status`       | text NOT NULL DEFAULT 'pending'    | pending \| done   |
| `position`     | int NOT NULL DEFAULT 0             |                   |
| `completed_at` | timestamptz NULL                   |                   |
| `created_at`   | timestamptz NOT NULL DEFAULT now() |                   |

**Indexes:** `(activity_id, position)`

**Constraints:** `status IN ('pending','done')`

**Linked:** BR-5, FT-013

---

### E-010 — Goal

Entidad separada de la jerarquía operacional.

| Field              | Type                               | Notes                                              |
| ------------------ | ---------------------------------- | -------------------------------------------------- |
| `id`               | uuid pk                            |                                                    |
| `user_id`          | uuid NOT NULL FK → users.id        | ON DELETE CASCADE                                  |
| `title`            | text NOT NULL                      |                                                    |
| `description`      | text NULL                          |                                                    |
| `scope`            | text NOT NULL                      | enum: quarter \| year \| 5year \| life             |
| `deadline`         | date NULL                          | Required for quarter/year, optional for 5year/life |
| `outcome_expected` | text NULL                          |                                                    |
| `notes_cost`       | text NULL                          | From cost reveal challenge (US-061)                |
| `status`           | text NOT NULL DEFAULT 'active'     | active \| achieved \| partial \| abandoned         |
| `review_score`     | smallint NULL                      | 1-10                                               |
| `review_notes`     | text NULL                          |                                                    |
| `reviewed_at`      | timestamptz NULL                   |                                                    |
| `deleted_at`       | timestamptz NULL                   |                                                    |
| `created_at`       | timestamptz NOT NULL DEFAULT now() |                                                    |
| `updated_at`       | timestamptz NOT NULL DEFAULT now() |                                                    |

**Indexes:** `(user_id, scope, status)`, `(user_id, deadline)` for review_pending detection

**Constraints:**

- `scope IN ('quarter','year','5year','life')`
- `status IN ('active','achieved','partial','abandoned')`
- `review_score IS NULL OR review_score BETWEEN 1 AND 10`

**Linked:** BR-6, BR-9, FT-040..043

---

### E-011 — GoalLink

M2M polymorphic Goal ↔ {Project | Activity}.

| Field         | Type                               | Notes                                                   |
| ------------- | ---------------------------------- | ------------------------------------------------------- |
| `id`          | uuid pk                            |                                                         |
| `goal_id`     | uuid NOT NULL FK → goals.id        | ON DELETE CASCADE                                       |
| `target_type` | text NOT NULL                      | enum: project \| activity                               |
| `target_id`   | uuid NOT NULL                      | FK enforced in app code (polymorphic, no DB constraint) |
| `created_at`  | timestamptz NOT NULL DEFAULT now() |                                                         |

**Indexes:** `(goal_id, target_type, target_id)` UNIQUE; `(target_type, target_id)` reverse lookup

**Constraints:** `target_type IN ('project','activity')`

**Linked:** BR-6, FT-041

---

### E-020 — DaySheet

Sheet del scope Day. Set de campos consolidado tras iteración del prototipo (se removieron `intention`, `gratitude` y los tres `energy_*` por ser redundantes con `identity_statement` o de bajo valor en la sesión matutina).

| Field                       | Type                               | Notes                                                                                                                                                                                             |
| --------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                        | uuid pk                            |                                                                                                                                                                                                   |
| `user_id`                   | uuid NOT NULL FK → users.id        | ON DELETE CASCADE                                                                                                                                                                                 |
| `date`                      | date NOT NULL                      | User-TZ-local date                                                                                                                                                                                |
| **Morning fields:**         |                                    |                                                                                                                                                                                                   |
| `notes_dreams`              | text NULL                          | Optional: notes from previous night                                                                                                                                                               |
| `identity_statement`        | text NULL                          | "Hoy soy alguien que…"                                                                                                                                                                            |
| `wins_planned`              | text[] NULL                        | Up to 3 (wins del día, se llenan en sesión matutina; el cierre NO los re-pregunta)                                                                                                                |
| `avoidance`                 | text NULL                          |                                                                                                                                                                                                   |
| `morning_completed_at`      | timestamptz NULL                   |                                                                                                                                                                                                   |
| **Evening / close fields:** |                                    |                                                                                                                                                                                                   |
| `close_summary`             | text NULL                          | One-liner reflexión al cerrar el día. Es el único campo de cierre — el outcome de cada activity vive en la propia Activity (status + `progress_percent` + `reason_not_done` + `reason_category`). |
| `evening_completed_at`      | timestamptz NULL                   |                                                                                                                                                                                                   |
| `created_at`                | timestamptz NOT NULL DEFAULT now() |                                                                                                                                                                                                   |
| `updated_at`                | timestamptz NOT NULL DEFAULT now() |                                                                                                                                                                                                   |

**Removed in prototype iteration:** `intention`, `gratitude`, `energy_physical`, `energy_mental`, `energy_emotional`, `evening_win`, `evening_lesson`, `tomorrow_top`, `insight`. El cierre se redujo a `close_summary` + outcome individual por activity (ver párrafo siguiente).

**Cierre del día (close-day modal):** cuando el user cierra el día, por cada Activity con `?::date = ANY(scheduled_dates)` para `date` del sheet, se registra un outcome individual en la propia Activity:

- "Hecha" → `status = 'done'`, `completed_at = now()`
- "Avanzada" → `status` permanece (típicamente `in_progress` o `pending`) + `progress_percent` set
- "Pendiente / saltada" → `status = 'skipped'` + `reason_not_done` + `reason_category`

No hay sección "wins" en el modal de cierre — los wins viven en `wins_planned` del morning.

**Indexes:** UNIQUE `(user_id, date)` (BR-7); `(user_id, date DESC)` for "last N days" queries

**Constraints:** `array_length(wins_planned, 1) <= 3 OR wins_planned IS NULL`

**Linked:** BR-7, FT-030, FT-031

---

### E-021 — WeekSheet

Sheet del scope Week. Week starts Sunday in user TZ.

| Field                  | Type                               | Notes                                   |
| ---------------------- | ---------------------------------- | --------------------------------------- |
| `id`                   | uuid pk                            |                                         |
| `user_id`              | uuid NOT NULL FK → users.id        | ON DELETE CASCADE                       |
| `week_starting`        | date NOT NULL                      | Sunday in user TZ                       |
| **Kickoff fields:**    |                                    |                                         |
| `one_thing`            | text NULL                          | "If only one thing happens…"            |
| `three_wins`           | text[] NULL                        |                                         |
| `calendar_blocks`      | jsonb NULL                         | `[{win_index, day, time_block, time?}]` |
| `people_to_connect`    | jsonb NULL                         | `[{name, why}]`                         |
| `learn_one`            | text NULL                          |                                         |
| `avoid_one`            | text NULL                          |                                         |
| `self_care`            | jsonb NULL                         | `{rest, move, eat, sleep}`              |
| `kickoff_completed_at` | timestamptz NULL                   |                                         |
| **Review fields:**     |                                    |                                         |
| `review_wins`          | text[] NULL                        |                                         |
| `review_lessons`       | text[] NULL                        |                                         |
| `review_energy`        | smallint NULL                      | 1-10                                    |
| `review_one_sentence`  | text NULL                          |                                         |
| `review_post_mortem`   | jsonb NULL                         | Auto-generated analysis                 |
| `reviewed_at`          | timestamptz NULL                   |                                         |
| `created_at`           | timestamptz NOT NULL DEFAULT now() |                                         |
| `updated_at`           | timestamptz NOT NULL DEFAULT now() |                                         |

**Indexes:** UNIQUE `(user_id, week_starting)` (BR-7); `(user_id, week_starting DESC)`

**Constraints:** `review_energy BETWEEN 1 AND 10`; `array_length(three_wins, 1) <= 3 OR three_wins IS NULL`

**Linked:** BR-7, FT-034, FT-035

---

### E-026 — MonthSheet

Sheet del scope Month. Planning mensual ligero. Snapshot mechanism via [E-027 PlanSnapshot](#e-027--plansnapshot).

| Field            | Type                               | Notes                                                                                          |
| ---------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| `id`             | uuid pk                            |                                                                                                |
| `user_id`        | uuid NOT NULL FK → users.id        | ON DELETE CASCADE                                                                              |
| `month_starting` | date NOT NULL                      | Siempre día 1 del mes en TZ del user                                                           |
| `goals`          | text NULL                          | Texto libre o JSON estructurado de objetivos del mes (decisión schema final en implementación) |
| `themes`         | text[] NOT NULL DEFAULT '{}'       | 3-5 temas / focus areas                                                                        |
| `close_summary`  | text NULL                          | Reflexión al cerrar el mes                                                                     |
| `closed_at`      | timestamptz NULL                   |                                                                                                |
| `created_at`     | timestamptz NOT NULL DEFAULT now() |                                                                                                |
| `updated_at`     | timestamptz NOT NULL DEFAULT now() |                                                                                                |

**Indexes:** UNIQUE `(user_id, month_starting)`; `(user_id, month_starting DESC)`

**Constraints:**

- App-level: `month_starting` debe ser día 1 del mes en TZ del user (`EXTRACT(DAY FROM month_starting) = 1`)
- `array_length(themes, 1) BETWEEN 3 AND 5 OR array_length(themes, 1) IS NULL` (soft — UI sugiere, DB no bloquea)

**Relación:** 1:1 opcional con `PlanSnapshot` vía `plan_snapshot.reference_id` con `scope='month'`.

**Linked:** BR-7 (extendido — ver nota), FT-???

> ⚠️ **Nota BR-7:** este sheet extiende BR-7 ("Sheets únicos por (user_id, period)") a scope `month`. Actualmente BR-7 enumera day/week/quarter/year — pendiente de reconciliar en 05_BUSINESS_RULES.md.

---

### E-027 — PlanSnapshot

Congela el estado planificado de un Week o Month al inicio del período, para comparar contra ejecución real. La UI usa el snapshot para mostrar "moved-from indicator" cuando una activity cambia de fecha vs el plan original.

| Field          | Type                               | Notes                                                                                                                  |
| -------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `id`           | uuid pk                            |                                                                                                                        |
| `user_id`      | uuid NOT NULL FK → users.id        | ON DELETE CASCADE                                                                                                      |
| `scope`        | text NOT NULL                      | enum: `week` \| `month`                                                                                                |
| `reference_id` | uuid NOT NULL                      | FK lógica a `week_sheet.id` (si scope=week) o `month_sheet.id` (si scope=month). Polymorphic; FK enforced en app code. |
| `frozen_at`    | timestamptz NOT NULL DEFAULT now() | Momento del freeze                                                                                                     |
| `payload`      | jsonb NOT NULL                     | Snapshot de actividades del período: `[{activity_id, title, scheduled_dates, priority, quadrant, project_id, ...}]`    |
| `created_at`   | timestamptz NOT NULL DEFAULT now() |                                                                                                                        |

**Indexes:** UNIQUE `(user_id, scope, reference_id)` — exactamente 1 snapshot por (user, scope, period)

**Constraints:** `scope IN ('week','month')`

**Lifecycle:**

- Crear: cuando el user "compromete" el plan al inicio del Week/Month (kickoff). Una sola snapshot por (user, scope, reference).
- Read-only: el payload no se actualiza tras `frozen_at` — la comparación con realidad la hace la UI cruzando `payload` con el estado actual de las Activities.

**Linked:** FT-??? (week kickoff freeze, monthly plan freeze)

---

### E-022 — QuarterSheet (v1.5)

Sheet del scope Quarter.

| Field               | Type                               | Notes                                         |
| ------------------- | ---------------------------------- | --------------------------------------------- |
| `id`                | uuid pk                            |                                               |
| `user_id`           | uuid NOT NULL FK → users.id        |                                               |
| `quarter_starting`  | date NOT NULL                      | First day of quarter in user TZ               |
| `three_wins`        | jsonb NULL                         | `[{title, looks_like_done, first_move}]`      |
| `habits_installing` | text[] NULL                        |                                               |
| `habits_breaking`   | text[] NULL                        |                                               |
| `self_talk_audit`   | jsonb NULL                         | `[{lie, replacement}]`                        |
| `wheel_of_life`     | jsonb NULL                         | `{domain: score_1_to_10, …}` (11 domains)     |
| `relationships`     | jsonb NULL                         | `{investing_in: [...], drifting_from: [...]}` |
| `mid_check_at`      | timestamptz NULL                   | Week 6                                        |
| `mid_check_notes`   | text NULL                          |                                               |
| `end_review_at`     | timestamptz NULL                   | Week 13                                       |
| `end_review_notes`  | text NULL                          |                                               |
| `created_at`        | timestamptz NOT NULL DEFAULT now() |                                               |

**Indexes:** UNIQUE `(user_id, quarter_starting)`

**Linked:** FT-200 (v1.5)

---

### E-023 — YearSheet (v1.5)

| Field                 | Type              | Notes                                   |
| --------------------- | ----------------- | --------------------------------------- |
| `id`                  | uuid pk           |                                         |
| `user_id`             | uuid NOT NULL FK  |                                         |
| `year`                | smallint NOT NULL | e.g., 2026                              |
| `five_wins`           | jsonb NULL        | `[{title, first_move}]`                 |
| `audacious_goal`      | jsonb NULL        | `{title, why_uncertain}`                |
| `anti_goals`          | text[] NULL       | Won't pursue                            |
| `skills_to_build`     | text[] NULL       | Max 3                                   |
| `books_to_read`       | text[] NULL       |                                         |
| `people_to_invest_in` | text[] NULL       |                                         |
| `experiences_trips`   | text[] NULL       |                                         |
| `stop_doing`          | text[] NULL       |                                         |
| `financial_targets`   | jsonb NULL        | (many fields, ver Reflexión Appendix A) |
| `mid_year_review_at`  | timestamptz NULL  | Late June                               |
| `mid_year_notes`      | text NULL         |                                         |
| `year_end_review_at`  | timestamptz NULL  | Late December                           |
| `year_end_notes`      | text NULL         |                                         |

**Indexes:** UNIQUE `(user_id, year)`

**Linked:** FT-201 (v1.5)

---

### E-024 — FiveYearSheet (v2)

Estructura paralela; v2.

### E-025 — LifeSheet (v2)

Estructura paralela; v2.

---

### E-030 — Conversation

Hilo de mensajes user ↔ agente.

| Field                      | Type                                | Notes                                               |
| -------------------------- | ----------------------------------- | --------------------------------------------------- |
| `id`                       | uuid pk                             |                                                     |
| `user_id`                  | uuid NOT NULL FK → users.id         | ON DELETE CASCADE                                   |
| `channel`                  | text NOT NULL DEFAULT 'in_app_chat' | in_app_chat \| in_app_voice (\| whatsapp \| sms v2) |
| `started_at`               | timestamptz NOT NULL DEFAULT now()  |                                                     |
| `ended_at`                 | timestamptz NULL                    | NULL = open conversation                            |
| `linked_sheet_type`        | text NULL                           | day \| week \| quarter \| year \| 5year \| life     |
| `linked_sheet_id`          | uuid NULL                           | Polymorphic (no FK)                                 |
| `linked_proactive_task_id` | uuid NULL FK → proactive_tasks.id   | If triggered by check-in                            |

**Indexes:** `(user_id, started_at DESC)`

**Linked:** FT-050

---

### E-031 — Message

Mensaje individual en una Conversation.

| Field              | Type                                | Notes                                                       |
| ------------------ | ----------------------------------- | ----------------------------------------------------------- |
| `id`               | uuid pk                             |                                                             |
| `conversation_id`  | uuid NOT NULL FK → conversations.id | ON DELETE CASCADE                                           |
| `role`             | text NOT NULL                       | user \| agent                                               |
| `content`          | text NOT NULL                       |                                                             |
| `audio_url`        | text NULL                           | If user message was voice                                   |
| `challenges_fired` | text[] NOT NULL DEFAULT '{}'        | Subset of {vague_language, repeat, identity, cost, reality} |
| `tool_calls`       | jsonb NULL                          | If agent called tools (AI-9)                                |
| `created_at`       | timestamptz NOT NULL DEFAULT now()  |                                                             |

**Indexes:** `(conversation_id, created_at)`

**Constraints:** `role IN ('user','agent')`

**Linked:** FT-050, AI-9

---

### E-040 — ProactiveTask

Scheduled action del agente (check-ins, pattern challenges).

| Field             | Type                               | Notes                                                                                                                                                              |
| ----------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`              | uuid pk                            |                                                                                                                                                                    |
| `user_id`         | uuid NOT NULL FK → users.id        | ON DELETE CASCADE                                                                                                                                                  |
| `type`            | text NOT NULL                      | morning_open \| midday_check \| evening_close \| weekly_kickoff \| weekly_review \| pattern_challenge \| risk_alert \| project_kill_suggestion \| silence_re_entry |
| `scheduled_for`   | timestamptz NOT NULL               |                                                                                                                                                                    |
| `payload`         | jsonb NULL                         | Context: which activity/goal/pattern referenced                                                                                                                    |
| `status`          | text NOT NULL DEFAULT 'pending'    | pending \| sent \| responded \| dismissed \| cancelled \| cancelled_anti_spam                                                                                      |
| `sent_at`         | timestamptz NULL                   |                                                                                                                                                                    |
| `responded_at`    | timestamptz NULL                   |                                                                                                                                                                    |
| `quote_reference` | jsonb NULL                         | (v1.5) For quote-back: `{sheet_type, sheet_id, field, snippet, date}`                                                                                              |
| `created_at`      | timestamptz NOT NULL DEFAULT now() |                                                                                                                                                                    |

**Indexes:** `(user_id, scheduled_for)` for cron picker; `(user_id, sent_at)` for anti-spam window queries (OPS-1)

**Constraints:** `status IN (...)`, `type IN (...)`

**Linked:** FT-080..087, OPS-1..4

---

### E-050 — SheetEmbedding (v1.5)

Embeddings de campos clave para pattern detection.

| Field         | Type                               | Notes                                   |
| ------------- | ---------------------------------- | --------------------------------------- |
| `id`          | uuid pk                            |                                         |
| `user_id`     | uuid NOT NULL FK → users.id        | ON DELETE CASCADE                       |
| `sheet_type`  | text NOT NULL                      | day \| week \| quarter \| year          |
| `sheet_id`    | uuid NOT NULL                      | Polymorphic                             |
| `field_name`  | text NOT NULL                      | e.g., 'intention', 'one_thing'          |
| `field_value` | text NOT NULL                      | Original text (denormalized for query)  |
| `embedding`   | vector(1536) NOT NULL              | pgvector; OpenAI text-embedding-3-small |
| `created_at`  | timestamptz NOT NULL DEFAULT now() |                                         |

**Indexes:** `(user_id, sheet_type, field_name)`; HNSW or IVFFlat on `embedding` for cosine search

**Linked:** FT-210, FT-211 (v1.5)

---

### E-060 — CalendarConnection

OAuth tokens encriptados. Reemplaza la antigua `GoogleCalendarConnection` 1:1 con una relación N:1 — un mismo user puede conectar 2+ cuentas (típicamente trabajo + personal) y, a futuro, providers distintos.

| Field                 | Type                               | Notes                                                                                                                                   |
| --------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                  | uuid pk                            |                                                                                                                                         |
| `user_id`             | uuid NOT NULL FK → users.id        | ON DELETE CASCADE                                                                                                                       |
| `provider`            | text NOT NULL                      | enum: `google` \| `apple` \| `outlook`. v1 sólo `google`; `apple`/`outlook` diferidos a v1.5.                                           |
| `external_account_id` | text NOT NULL                      | Identificador estable de la cuenta externa (ej: email de la cuenta Google). Permite distinguir 2+ conexiones del mismo user.            |
| `access_token`        | bytea NOT NULL                     | `pgp_sym_encrypt` (BR-12)                                                                                                               |
| `refresh_token`       | bytea NOT NULL                     | `pgp_sym_encrypt` (BR-12)                                                                                                               |
| `expires_at`          | timestamptz NOT NULL               | OAuth token expiry                                                                                                                      |
| `calendar_ids`        | text[] NOT NULL DEFAULT '{}'       | Which calendars de esta cuenta a sync                                                                                                   |
| `enabled`             | boolean NOT NULL DEFAULT true      | Toggle por-conexión sin desconectar (pausa sync sin borrar tokens)                                                                      |
| `connected_at`        | timestamptz NOT NULL DEFAULT now() |                                                                                                                                         |
| `last_synced_at`      | timestamptz NULL                   |                                                                                                                                         |
| `last_sync_error`     | text NULL                          |                                                                                                                                         |
| `account_label`       | text NULL                          | Label opcional editable por el user (ej. "Trabajo", "Personal"). Si NULL, UI muestra `external_account_id`.                             |
| `color`               | text NULL                          | Hex color (`#RRGGBB`) para distinguir visualmente eventos de cada cuenta en /week + /month. Default null → UI hashea desde provider/id. |

**Indexes:** UNIQUE `(user_id, provider, external_account_id)`; `(user_id, enabled)` for active-connections queries

**Constraints:** `provider IN ('google','apple','outlook')`; `color ~ '^#[0-9A-Fa-f]{6}$' OR color IS NULL`

**Relación:** N:1 con User (vs 1:1 anterior). [E-061 CalendarBusySlot](#e-061--calendarbusyslot-cache) gana columna `connection_id` FK → calendar_connections.id (ver E-061 update).

**Linked:** BR-12, FT-090

---

### E-061 — CalendarBusySlot (cache)

Cached busy slots, refreshed every 15 min.

| Field           | Type                                       | Notes                                                       |
| --------------- | ------------------------------------------ | ----------------------------------------------------------- |
| `id`            | uuid pk                                    |                                                             |
| `user_id`       | uuid NOT NULL FK                           |                                                             |
| `connection_id` | uuid NOT NULL FK → calendar_connections.id | ON DELETE CASCADE. Permite saber de qué cuenta vino el slot |
| `calendar_id`   | text NOT NULL                              | Provider calendar ID (Google/Apple/Outlook)                 |
| `start_at`      | timestamptz NOT NULL                       |                                                             |
| `end_at`        | timestamptz NOT NULL                       |                                                             |
| `event_title`   | text NULL                                  | For display                                                 |
| `synced_at`     | timestamptz NOT NULL DEFAULT now()         |                                                             |

**Indexes:** `(user_id, start_at, end_at)`; `(connection_id, start_at)`

---

### E-070 — Plan

Definición de tier (estructura sin pricing activo).

| Field           | Type                               | Notes                                                            |
| --------------- | ---------------------------------- | ---------------------------------------------------------------- |
| `id`            | uuid pk                            |                                                                  |
| `slug`          | text NOT NULL UNIQUE               | 'free' \| 'pro'                                                  |
| `name`          | text NOT NULL                      |                                                                  |
| `description`   | text NULL                          |                                                                  |
| `features`      | jsonb NOT NULL DEFAULT '{}'        | Feature flags by plan                                            |
| `limits`        | jsonb NOT NULL DEFAULT '{}'        | `{max_projects, max_ai_calls_per_month, max_voice_minutes, ...}` |
| `price_monthly` | numeric(10,2) NULL                 | NULL until pricing decided                                       |
| `price_yearly`  | numeric(10,2) NULL                 |                                                                  |
| `active`        | boolean NOT NULL DEFAULT true      |                                                                  |
| `created_at`    | timestamptz NOT NULL DEFAULT now() |                                                                  |

**Seed v1:** 1 row `slug='free'` with no limits enforced yet.

---

### E-071 — Subscription

User's current plan.

| Field                    | Type                               | Notes                           |
| ------------------------ | ---------------------------------- | ------------------------------- |
| `id`                     | uuid pk                            |                                 |
| `user_id`                | uuid NOT NULL FK → users.id        | ON DELETE CASCADE               |
| `plan_id`                | uuid NOT NULL FK → plans.id        |                                 |
| `status`                 | text NOT NULL DEFAULT 'active'     | active \| cancelled \| past_due |
| `current_period_start`   | timestamptz NULL                   |                                 |
| `current_period_end`     | timestamptz NULL                   |                                 |
| `stripe_subscription_id` | text NULL                          | v2                              |
| `stripe_customer_id`     | text NULL                          | v2                              |
| `created_at`             | timestamptz NOT NULL DEFAULT now() |                                 |
| `updated_at`             | timestamptz NOT NULL DEFAULT now() |                                 |

**Indexes:** UNIQUE `(user_id) WHERE status = 'active'`; `(status, updated_at)` for grace period cron (BR-10)

**Linked:** BR-10, FT-110, FT-111

---

### E-072 — UsageMeter

Per-user, per-month bucket of usage.

| Field                   | Type                               | Notes              |
| ----------------------- | ---------------------------------- | ------------------ |
| `id`                    | uuid pk                            |                    |
| `user_id`               | uuid NOT NULL FK → users.id        | ON DELETE CASCADE  |
| `period_start`          | date NOT NULL                      | First day of month |
| `ai_calls_count`        | int NOT NULL DEFAULT 0             |                    |
| `ai_tokens_input`       | bigint NOT NULL DEFAULT 0          | For cost tracking  |
| `ai_tokens_output`      | bigint NOT NULL DEFAULT 0          |                    |
| `voice_minutes_count`   | numeric(10,2) NOT NULL DEFAULT 0   |                    |
| `whisper_seconds_count` | int NOT NULL DEFAULT 0             |                    |
| `updated_at`            | timestamptz NOT NULL DEFAULT now() |                    |

**Indexes:** UNIQUE `(user_id, period_start)`

**Linked:** FT-112

---

## NextAuth tables (auto-managed)

Drizzle NextAuth adapter creates:

- `accounts` — OAuth links
- `sessions` — active sessions
- `verification_tokens` — magic link / email verify

These live alongside our schema but are managed by NextAuth conventions. See [src/lib/db/schema.ts](../../src/lib/db/schema.ts).

---

## Migration strategy

### v1 launch migrations

1. `000_init` — Auth (users, accounts, sessions, verification_tokens) + Plans + Subscriptions + UsageMeters
2. `001_organization` — Categories, Projects, Activities (con `scheduled_dates`, `quadrant`, `progress_percent`, `duration_minutes`), Subtasks
3. `002_sheets` — DaySheet, WeekSheet, MonthSheet
4. `003_plan_snapshot` — PlanSnapshot (scope week + month)
5. `004_goals` — Goal, GoalLink
6. `005_conversations` — Conversation, Message, ProactiveTask
7. `006_calendar` — CalendarConnection (multi-provider, multi-cuenta), CalendarBusySlot
8. `007_seed` — Plan 'free' default; trigger to auto-create Inbox category+project for new users

### v1.5 migrations

8. `007_quarter_year_sheets`
9. `008_pgvector` — `CREATE EXTENSION pgvector` + SheetEmbedding table

### v2 migrations

10. `009_5year_life_sheets`
11. `010_stripe` — add stripe_subscription_id, customer_id columns (existing rows OK with NULL)
12. `011_whatsapp_sms` — add channel options to Conversation enum

---

## Data lifecycle

| Entity                               | Hard delete trigger                                      | Soft delete? |
| ------------------------------------ | -------------------------------------------------------- | ------------ |
| User                                 | Cron 30d after `deleted_at` (BR-14)                      | Yes          |
| Category                             | Cron 30d after `deleted_at`                              | Yes (BR-4)   |
| Project                              | Cron 30d after `deleted_at`                              | Yes          |
| Activity                             | Cron 30d after `deleted_at`                              | Yes          |
| Subtask                              | CASCADE from Activity                                    | No           |
| Goal                                 | Cron 30d after `deleted_at`                              | Yes          |
| DaySheet, WeekSheet, MonthSheet, etc | CASCADE from User only                                   | No           |
| PlanSnapshot                         | CASCADE from User; referencia lógica week/month sheet    | No           |
| CalendarConnection                   | CASCADE from User                                        | No           |
| Conversation, Message                | CASCADE from User only; retention TBD (OQ-5)             | No           |
| ProactiveTask                        | Cron 90d after `created_at` if status='sent'/'dismissed' | No           |
| CalendarBusySlot                     | TTL 15 min refresh                                       | No           |
| UsageMeter                           | Keep forever (analytics)                                 | No           |

---

## Sensitive data classification

| Field                                               | Sensitivity | Treatment                                                 |
| --------------------------------------------------- | ----------- | --------------------------------------------------------- |
| `users.password_hash`                               | High        | bcrypt; never logged                                      |
| `users.email`                                       | Medium      | Logged in error reports as hash                           |
| `calendar_connection.access_token`, `refresh_token` | High        | pgcrypto encrypted (BR-12) — aplica a todos los providers |
| `conversations.*` user messages content             | Medium      | Logged for AI eval, redacted in errors                    |
| `usage_meters.*`                                    | Low         | No PII; safe to log                                       |
| `messages.audio_url`                                | High        | NULL in production (BR-13); audio never persisted         |

---

_Generated by `/docs` Batch 4 — 2026-05-19_
