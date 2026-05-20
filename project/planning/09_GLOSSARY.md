# 09 — Glossary

> **Source:** [00_DISCOVERY_BRIEF.md](./00_DISCOVERY_BRIEF.md) + [02_FEATURE_MAP.md](./02_FEATURE_MAP.md) + [03_USER_PERSONAS.md](./03_USER_PERSONAS.md)
> **Purpose:** SSOT de vocabulario del dominio. Cuando exista un término aquí, **usarlo verbatim** en código, UI copy, docs y commits.

---

## Convención

| Tipo                                            | Cómo se escribe                                                             |
| ----------------------------------------------- | --------------------------------------------------------------------------- |
| Concepto de UI/dominio (Categoría, Goal, Sheet) | Capitalizado en docs, lowercase en código (`category`, `goal`, `day_sheet`) |
| Acrónimos                                       | Mayúsculas en docs (PWA, STT, RBAC); minúsculas en código de variables      |
| Términos de Reflexión adoptados                 | Marcados con [R] cuando vienen del Reference doc                            |

---

## A

### Activity

Unidad mínima de trabajo en la jerarquía operacional. Pertenece a un Project. Puede tener Subtasks (máximo 1 nivel). Campos clave: title, description, scheduled_date, scheduled_time (opt), deadline, priority (1-5), status, reason_not_done.

- En código: `activity` (table singular), `Activity` (TS type)
- **NO usar:** "tarea", "task" en código (sí en UI Spanish copy)
- **Sinónimo en UI ES:** "tarea" o "actividad" (consistente, no mezclar)
- Brief ref: §4 Activity entity

### Anchored task

Activity con `scheduled_time` no nulo — tiene hora específica obligatoria (ej: reunión 10:00). Contraste con **Pool task**.

### Anti-pattern (de Reflexión)

Comportamiento del agente IA explícitamente prohibido:

- ❌ "Don't forget" / "No olvides" (reminder language)
- ❌ "You should" / "Deberías" (moralización)
- ❌ "Great answer!" / "¡Excelente respuesta!" (coachy)
- ❌ Listas de opciones en respuesta del agente
- ❌ Emojis decorativos del agente

### Avoidance

Campo del DaySheet morning: "la cosa que estoy evitando hoy". Captura honesta del task que el user sabe que no quiere hacer.

---

## C

### Categoría / Category

Nivel superior de organización. Ej: "Personal", "Empresa Genomma", "Side Project Web3". CRUD por user. Contiene Projects.

- En código: `category`
- Brief ref: §4 Category entity

### Check-in

Interacción agente-iniciada con el user a horario configurable. Tipos:

- **Morning** (default 08:00): abre el día, pregunta intención
- **Midday** (default 13:00): chequeo de win #1
- **Evening** (default 21:00): cierre, win/lesson/tomorrow's #1
- **Weekly kickoff** (Sunday): WeekSheet planning
- **Weekly review** (Saturday): WeekSheet review

### Challenge

Repregunta del agente a una respuesta del user. 5 tipos:

1. **Vague-language** [R] — trigger en "mejor/más/pronto/bien"
2. **Repeat detection** [R] — mismo concepto en 3+ sheets consecutivos
3. **Identity check** [R] — contradicción con statement de identidad
4. **Cost reveal** [R] — goal sin costo declarado
5. **Reality test** [R] — commitment con probabilidad <70%

### Coaching motivacional (out of scope)

Tono prohibido para el agente. Ej: "¡Tú puedes!", "¡Vamos!", "¡Increíble trabajo!". Ver `feedback_agent_voice` memory.

### Conversation

Hilo de intercambio user ↔ agente. Atributos: `started_at`, `channel`, `linked_sheet_id`. Una Conversation puede vincularse a un Sheet específico.

- En código: `conversation`

---

## D

### DaySheet

Sheet del scope **Day** [R]. Único por `(user_id, date)`. Campos morning (intention, gratitude, identity_statement, wins_planned, avoidance, energy 3x) + evening (evening_win, evening_lesson, tomorrow_top, insight opt).

- En código: `day_sheet`

### Deadline

Fecha (con hora opt) cuándo una Activity/Project/Goal debe estar completado. **Separado de `scheduled_date`** (cuándo planeo hacerlo).

### Drift detection

Patrón [R] donde Day sheets no sirven a Week, Week no sirve a Quarter, etc. Surfaced por el agente: "Tu Quarter #2 no ha aparecido en un Day sheet hace 9 días".

---

## E

### Energy check

Campo del DaySheet morning: score 1-5 en tres ejes (physical, mental, emotional). Informa sugerencias del agente (no usado en MVP, posible v1.5).

### Embedding

Vector representación de un campo de Sheet, para repeat detection vía cosine similarity. Almacenado en tabla `sheet_embeddings` con `pgvector`.

---

## F

### Feature flag

Boolean por plan en `plans.features` jsonb. Ej: `{ "voice_capture": true, "calendar_integration": false }`. Habilita gating por tier sin re-deploy.

---

## G

### Goal

Entidad **separada de la jerarquía operacional** (Categoría→Proyecto→Actividad). Scope: `quarter | year | 5year | life`. Tiene `outcome_expected`, `deadline`, `review_score` (1-10), `review_notes`.

- En código: `goal`
- Brief ref: §4 Goal entity, BR-6
- **NO confundir con:** Project (Project pertenece a Categoría, Goal no)

### GoalLink

Tabla M2M polymorphic entre Goal y (Project | Activity). Permite a una Goal vincularse a múltiples Projects/Activities y viceversa.

---

## I

### Identity statement

Campo del DaySheet morning [R]: "Hoy soy alguien que \_\_\_". Captura framing de identidad sobre logro.

### Intensity mode

Configuración del agente, 4 niveles [R]:

- 🔥 **Sharp** — challenges fire freely, mínima softening
- ⊙ **Standard** — default; challenge cuando warranted, acknowledge first
- 🌱 **Gentle** — challenge solo en vague clear o contradicción clara; framed as curiosity. Default para nuevos users 14 días.
- 🤍 **Listening** — sin challenges, solo reflejo. Auto-revert a Standard 48h.

### Inbox

Project especial auto-creado por user al signup para Activities sin proyecto explícito. Pertenece a una Category default "Inbox".

---

## L

### LifeSheet (v2)

Sheet del scope **Life** [R]. Mission, "soy alguien que..." (5-7 statements), core values, eulogy, anti-vision, bucket list. **No en MVP.**

### Listening mode → ver Intensity mode

### LLM call

Invocación al modelo (Anthropic Claude Sonnet). Trackeada en `usage_meters.ai_calls_count` para feature gating futuro.

---

## M

### Mic button

Botón flotante 🎙️ bottom-right en pantalla Today. Inicia captura por voz (FT-070).

### Multi-tenant data isolation

BR-1: ningún user accede a data de otro user. Enforcement via `user_id` en cada tabla + Drizzle middleware filter en todas las queries.

---

## N

### NorthStar

Métrica de éxito del producto: **% de usuarios activos semanalmente que completan ≥4 check-ins semanales después del día 30**. Target: >40%.

### NotificationPref

1 row per user. Horarios de check-ins (morning_time, midday_time, evening_time, weekly_kickoff_dow, weekly_review_dow), weekend_enabled toggle, channels (push, email).

---

## O

### Onboarding

Flow de 8 pasos al signup. Última paso = primera conversación corta del agente con 3 preguntas iniciales (NO cuestionario completo) [R §7.1].

### Outcome expected

Campo de Project y Goal. Texto libre describiendo cómo se ve cuando se logra. Usado en review para comparar realidad vs expectativa.

---

## P

### Pattern detection (v1.5)

Conjunto de capabilities del agente que detecta:

1. **Repeat**: mismo concepto en 3+ sheets consecutivos (vía embeddings cosine >0.85)
2. **Drift**: scope alto no aparece en scope bajo (vía structured queries)
3. **Quote-back**: cita user's past words con fecha

### Pool task

Activity sin `scheduled_time`. Vive en "pool del día" o "pool de la semana". User la hace cuando puede. Contraste con **Anchored task**.

### Post-mortem (semanal)

Resumen auto-generado por LLM sábado nocturno. Incluye: % cumplimiento, patrones detectados, sugerencias. Read-only para user. Almacenado en `WeekSheet.review_one_sentence` + summary jsonb.

### Project

Nivel intermedio de la jerarquía operacional. Pertenece a una Categoría. Contiene Activities. Campos: name, description, status (active/paused/completed/killed), deadline, outcome_expected.

- En código: `project`
- **NO confundir con:** Goal

### ProactiveTask

Cron-scheduled action del agente. Tipos: morning_open, midday_check, evening_close, weekly_kickoff, weekly_review, pattern_challenge. Antes de enviar, anti-spam guardrails se evalúan.

### PWA (Progressive Web App)

Posture mobile del producto. Manifest + Service Worker + Web Push API + install prompts. No app nativa en MVP.

---

## Q

### QuarterSheet (v1.5)

Sheet del scope **Quarter** [R]. 13 weeks. 3 wins trimestrales con "what it looks like done + first move". Habits (installing/breaking). Self-talk audit. Wheel of Life 11 dominios. Relationships inventory. Mid-quarter check-in (week 6). End review (week 13).

- En código: `quarter_sheet`

### Quote-back (v1.5)

Patrón [R] del agente: cita las propias palabras del user con fecha. "Hace 3 semanas escribiste: '\_\_\_\_'". Solo se usa cuando el agente tiene la cita real — **nunca inventa quotes**.

---

## R

### Razón de no cumplimiento → reason_not_done

Campo de Activity cuando status = skipped/blocked. Texto + categoría (`reason_category`): `time | priority | blocked | didnt_want | other`. Alimenta retrospectiva.

### Repeat detection → ver Pattern detection

### Review (de un Sheet)

Sección del Sheet que se llena al cierre de su ciclo. DaySheet evening (al final del día), WeekSheet Saturday (review_wins, review_lessons, review_energy 1-10, review_one_sentence), QuarterSheet mid + end.

### Review score (Goal)

Calificación 1-10 de cuánto se cumplió la expectativa del Goal en su deadline.

- 8-10 → status = achieved
- 4-7 → status = partial
- 1-3 → status = abandoned

### RRULE

Recurrence rule iCal RFC 5545. Almacenado como string en Activity.recurrence_rule. Ej: `FREQ=WEEKLY;BYDAY=MO,WE,FR`.

---

## S

### Sheet

Estructura tabular de planeación por scope. 6 tipos: DaySheet, WeekSheet, QuarterSheet, YearSheet, FiveYearSheet, LifeSheet. Cada uno tiene campos específicos. **MVP solo Day + Week.**

### Skipped (Activity status)

Cuando user explícitamente no hizo la activity y no la planea reanudar. Diferente de **Blocked** (depende de algo externo).

### Subtask

Item dentro de una Activity. Máximo 1 nivel — no recursivo (BR-5). Campos mínimos: title, status, position.

- En código: `subtask`

### STT (Speech-to-Text)

Transcripción de audio a texto. Primary: Web Speech API (browser-native, gratis, on-device en algunos browsers). Fallback: OpenAI Whisper API.

---

## T

### Time block

Bloque aspiracional de hora del día: `morning | afternoon | evening`. Una Activity puede tener múltiples time_blocks asignados (X7 resolved).

### Today

Pantalla S-1. Mostrar DaySheet de hoy + lista de activities del día (anchored + pool) + mic button bottom-right.

---

## U

### UsageMeter

Tabla con bucket mensual por user, contando: `ai_calls_count`, `voice_minutes_count`, `whisper_seconds_count`. Tracking activo desde día 1 incluso sin Stripe activo, para informar pricing futuro.

---

## V

### Vague-answer challenge

Behavior core del agente (FT-060) [R]. Detecta palabras vagas en la respuesta del user ("mejor", "más", "pronto", "intenté", "no tuve tiempo") y repregunta concreto: "¿Qué significa eso concretamente? Nombrá una cosa visible desde afuera."

---

## W

### WeekSheet

Sheet del scope **Week** [R]. Único por `(user_id, week_starting)` con `week_starting` siempre = domingo (BR-7). Kickoff fields (one_thing, three_wins, calendar_blocks, people_to_connect, learn_one, avoid_one, self_care) + review fields llenados sábado.

### Web Push API

Standard de notifications via Service Worker. Pipe a FCM (Android) + APNs (iOS via Safari 16+).

### Web Speech API

Standard de browser STT (`window.SpeechRecognition`). Primary capture path. Coverage: Chrome/Edge desktop+Android sólido; Safari iOS 14.5+ con `webkitSpeechRecognition`. Validar coverage real en OQ-4.

### Whisper API

OpenAI STT API. Fallback cuando Web Speech API no disponible o calidad mala. Pricing $0.006/min, despreciable.

### Win

Logro concreto y verificable. DaySheet morning lista `wins_planned[3]`. DaySheet evening pregunta `evening_win`. WeekSheet kickoff lista `three_wins`. Goals tienen `outcome_expected` que es esencialmente una win larga.

---

## Y

### YearSheet (v1.5)

Sheet del scope **Year** [R]. 5 wins anuales. Audacious goal. Anti-goals. Financial targets. Skills to build. Books to read. People to invest in. Experiences. 4 quarters tracker. Mid-year (June) + year-end (Dec) review.

---

## Z (out of vocabulary — términos que NO usar)

| Término                     | Razón de exclusión                                                                 | Usar en su lugar                      |
| --------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------- |
| **Habit / hábito**          | El producto NO es habit tracker; reemplazo conceptual usar Activity con recurrence | Activity recurrente                   |
| **Streak / racha**          | Gamification diferida v2 (X2 resolved)                                             | — (v1) / Streak (v2 si se implementa) |
| **Mood / ánimo**            | Out-of-scope; mood tracking no es feature primaria                                 | Energy check (3 axes en DaySheet)     |
| **Coach / coaching**        | Out-of-scope; el agente NO es coach                                                | Agente / asistente                    |
| **Reminder / recordatorio** | Anti-pattern de Reflexión; "no olvides" lenguaje prohibido en notifications        | Check-in / challenge                  |
| **Kanban / board**          | Out-of-scope NEVER                                                                 | —                                     |
| **Team / equipo**           | Producto es single-user-data NEVER                                                 | —                                     |

---

## Acrónimos

| Acrónimo | Significado                                                                                   |
| -------- | --------------------------------------------------------------------------------------------- |
| AI       | Artificial Intelligence (en docs); el agente en UI Spanish se llama "el agente" o "asistente" |
| BR       | Business Rule                                                                                 |
| FT       | Feature (en namespace FT-NNN)                                                                 |
| FCM      | Firebase Cloud Messaging (push Android)                                                       |
| APNs     | Apple Push Notification service                                                               |
| LLM      | Large Language Model                                                                          |
| MVP      | Minimum Viable Product                                                                        |
| OAuth    | Open Authorization protocol                                                                   |
| ORM      | Object-Relational Mapper (Drizzle)                                                            |
| PWA      | Progressive Web App                                                                           |
| RBAC     | Role-Based Access Control                                                                     |
| RRULE    | iCal recurrence rule (RFC 5545)                                                               |
| SSOT     | Single Source of Truth                                                                        |
| STT      | Speech-to-Text                                                                                |
| SoT      | Source of Truth (en docs de discovery)                                                        |
| TZ       | Timezone (IANA, ej: `America/Mexico_City`)                                                    |
| US       | User Story (en namespace US-NNN)                                                              |

---

_Generated by `/docs` Batch 1 — 2026-05-19_
