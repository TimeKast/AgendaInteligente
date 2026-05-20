# 00 — Discovery Brief: AgendaInteligente (working name)

> **Status:** Discovery complete — ready for `/proposal` and `/docs`
> **Date:** 2026-05-19
> **Mode:** D0 (from scratch) + D1 (with reference doc `reflexion-product-definition.md`)
> **Sources:**
>
> - **SoT:** User brain dump + Q1-Q15 interview (5 rounds)
> - **Reference:** [`reflexion-product-definition.md`](../../reflexion-product-definition.md) — different product (Reflexión/Ayra), patterns extracted, conflicts resolved in favor of AgendaInteligente

---

## 1. General Idea

### Pitch (1 line)

> Una agenda personal con un agente de IA que **te persigue** para que no te mientas sobre lo que vas a hacer ni sobre por qué no lo hiciste.

### Problem

El usuario tiene muchas responsabilidades, olvida tareas y no hace planeación recurrente. Cuando ha planeado, ha rendido mucho mejor — pero no sostiene el hábito. Las apps existentes son **pasivas**: registras tareas y, si no estás encima, dejas de usarlas. Esto las vuelve cementerios de buenos propósitos.

### Solution

Una PWA mobile-first multi-usuario con **dos diferenciadores hard**:

1. **Captura frictionless por voz** — botón "🎙️" grande, dictás como a Siri ("agenda llamar a Juan mañana 10am, proyecto Genomma"), la IA parsea y propone la tarea estructurada; vos confirmás con un tap.
2. **Accountability activa** — la app **te busca** a horas configurables (mañana / mediodía / noche / semanal / mensual / trimestral / anual / 5 años / vida) y te fuerza un check-in. Cuando no cumplís, repregunta concreto ("¿qué hiciste en lugar de eso?") para convertir excusas en datos accionables.

### North Star

> **"La app que no te deja mentirte sobre tu propio tiempo."**
>
> Métrica de éxito: % de usuarios activos semanalmente que completan ≥4 check-ins semanales después del día 30. Objetivo benchmark: >40% (vs <15% de apps tipo Todoist).

### Differentiators vs Todoist/TickTick/Notion/Sunsama/Motion

| Diferenciador                               | AgendaInteligente                              | Apps comunes         |
| ------------------------------------------- | ---------------------------------------------- | -------------------- |
| Captura por voz como prioridad              | ✅ Voz primaria                                | ⚠️ Tipear primary    |
| Loop semanal forzado                        | ✅ Domingo review obligatorio                  | ❌ Opcional          |
| AI challenge vs vague answers               | ✅ "¿Qué hiciste en lugar de eso?"             | ❌                   |
| 6 escalas de planeación                     | ✅ Day → Week → Quarter → Year → 5-Year → Life | ❌ Solo daily/weekly |
| Goals como entidad separada con review 1-10 | ✅                                             | ⚠️ A veces           |
| AI sugiere reorganización + reporta riesgo  | ✅ Sugiere, no decide                          | ⚠️ Motion decide     |

---

## 2. Users and Roles

### Primary persona

Profesional 25-45 con múltiples frentes (trabajo + side projects + vida personal + estudios), articulado, ha probado Notion/Todoist/journaling y ninguno le duró un mes. Necesita estructura externa que lo empuje, no más herramientas que esperen su input.

### Roles

| Rol               | Permisos                                                                                             | Justificación                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **User**          | CRUD completo sobre su propia data: categorías, proyectos, actividades, goals, sheets, integraciones | Default todos los usuarios registrados           |
| **Admin** (super) | Acceso a métricas globales, gestión de planes/tiers, soporte                                         | Bootstrap vía `pnpm db:seed` (TimeKast standard) |

**Sin equipos. Sin shared workspaces. Sin colaboración.** El producto es multi-user pero **single-user-data** — cada cuenta lleva LO SUYO ordenado. Es Things 3, no Asana. _(Resolución de conflicto X1 con Reflexión: aceptamos no-team, mantenemos productividad personal)_.

### Onboarding

1. **Signup** (Google OAuth o email+password)
2. **Idioma** auto-detectado (ES/EN, default ES)
3. **Timezone** auto-detectada
4. **Push notification permission** con framing honesto: "Te voy a buscar 1-4 veces al día. Podés apagar cualquiera."
5. **Microphone permission** (opcional)
6. **Primera conversación corta** (3 preguntas, NO cuestionario completo — patrón de Reflexión §7.1):
   - "¿Qué te frustra hoy de cómo manejás tu agenda?" (texto libre, se guarda como contexto del agente)
   - "¿Cuándo querés que abra tu día — mañana?" (default 8:00)
   - "¿Cuándo cerramos el día?" (default 21:00)
7. **Conectar Google Calendar** (opcional, skipeable)
8. **Cierre:** "Mañana a las 8 abro tu primer día. Hasta entonces."

### Auth

- **Providers v1:** Google OAuth + email/password (NextAuth v5 ya en TimeKast)
- Sin magic link, sin Apple, sin GitHub en v1
- Sesiones JWT (TimeKast default)

---

## 3. Core Features

### MVP v1 (8-10 semanas)

| ID   | Feature                                                        | Descripción                                                                                                                                                                                                                     |
| ---- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-1  | **Auth + multi-tenant data isolation**                         | Google + email/password. Cada usuario ve solo su data.                                                                                                                                                                          |
| F-2  | **Jerarquía organizacional**                                   | Categoría (personal/empresa/etc) → Proyecto → Actividad → Subtarea (1 nivel).                                                                                                                                                   |
| F-3  | **Captura por voz (Web Speech API + Whisper fallback)**        | Botón 🎙️ → audio → transcripción → LLM parsea → preview tarea → user confirma.                                                                                                                                                  |
| F-4  | **Day Sheet**                                                  | Vista del día con: intención, gratitud, identidad ("hoy soy alguien que..."), 3 wins, avoidance, energy (físico/mental/emocional 1-5). Llenado conversacional con AI agent.                                                     |
| F-5  | **Week Sheet**                                                 | "Si solo una cosa pasa esta semana, ¿cuál?", 3 wins semanales, calendar blocks aspiracionales, personas a contactar, qué aprender, qué evitar, plan self-care. Review sábado: wins logradas, lecciones, energy 1-10, una frase. |
| F-6  | **AI Agent core (intensity modes)**                            | Personalidad consistente (asistente profesional neutro, directo, conciso). 4 modos: 🔥 Sharp / ⊙ Standard (default) / 🌱 Gentle (default nuevos users 14 días) / 🤍 Listening (sin challenges, auto-revierte 48h).              |
| F-7  | **Vague-answer challenge (configurable por intensity)**        | Cuando user dice "mejor", "más", "intenté", "no tuve tiempo" → IA repregunta concreto. Frecuencia controlada por intensity mode.                                                                                                |
| F-8  | **Check-ins automáticos configurables**                        | Horarios personalizables por user. Default: morning (8:00) + midday (13:00) + evening (21:00) + weekly Sunday kickoff + Saturday review. Push notification con framing de challenge, NO "no olvides".                           |
| F-9  | **Anti-spam guardrails**                                       | Máx 4 push agent-initiated por 24h. Máx 1 challenge fuerte por semana. Si user 3+ días silencio → 1 re-entry, después pausa.                                                                                                    |
| F-10 | **Goals (entidad separada)**                                   | Goal = título + descripción + deadline + categoría + relación many-to-many con proyectos/actividades. Review: calificación 1-10 de cuánto se cumplió la expectativa.                                                            |
| F-11 | **Modelo temporal híbrido**                                    | Tareas asignadas a un día. Hora opcional (anclable). Tareas sin hora viven en "pool del día".                                                                                                                                   |
| F-12 | **Google Calendar read-only**                                  | OAuth scope `calendar.readonly`. Mostrar slots ocupados al user para evitar overbooking al planear.                                                                                                                             |
| F-13 | **Razón de no cumplimiento**                                   | Cuando una tarea no se completa → IA pregunta por qué. Categorías: tiempo / prioridad / bloqueado / no quise / otro. Esto alimenta retrospectiva.                                                                               |
| F-14 | **AI sugerencias (no decisiones)**                             | Sugiere prioridad cuando captura nueva tarea por voz. Detecta riesgo (deadline vs tiempo restante vs disponibilidad). Recomienda matar proyecto sin movimiento. **Todo requiere aprobación del user.**                          |
| F-15 | **Análisis post-mortem semanal (auto)**                        | Domingo nocturno, IA genera resumen: % cumplimiento, patrones detectados, sugerencias. Usuario lo lee.                                                                                                                          |
| F-16 | **Multi-tenant billing infrastructure (sin pricing definido)** | Tablas `plans`, `subscriptions`, `usage_meters`. Sin Stripe activo en v1. Permite definir tiers/pricing después sin migrar.                                                                                                     |
| F-17 | **PWA con install prompts + push notifications**               | Service worker, manifest, install promo (ya en TimeKast kit).                                                                                                                                                                   |

### v1.5 (4-6 semanas después de v1)

| ID   | Feature                                                                                                               |
| ---- | --------------------------------------------------------------------------------------------------------------------- |
| F-18 | Quarter sheet (3 wins trimestrales, habits, self-talk audit, wheel of life 11 dominios)                               |
| F-19 | Year sheet (5 wins anuales, audacious goal, anti-goals, financial targets, experiences)                               |
| F-20 | Goal → Project → Activity linkage automática (cuando agendás actividad, sugiere relacionarla a goal/project activo)   |
| F-21 | Pattern detection (embeddings de sheets con pgvector): "llevás 3 semanas con la misma #1, ¿qué la mantiene atascada?" |
| F-22 | Quote-back con cita de fecha: "Hace 3 semanas escribiste: '\_\_\_\_'"                                                 |

### v2 (post-MVP, sin compromiso de fecha)

| ID   | Feature                                                                                             |
| ---- | --------------------------------------------------------------------------------------------------- |
| F-23 | 5-Year sheet (vivid vision, capabilities, network, financial freedom horizon)                       |
| F-24 | Life sheet (mission, "soy alguien que...", core values, eulogy, anti-vision, bucket list)           |
| F-25 | WhatsApp bot (Twilio o 360dialog)                                                                   |
| F-26 | Telegram bot                                                                                        |
| F-27 | Voice mode bidireccional real-time (Vapi o ElevenLabs)                                              |
| F-28 | Stripe + pricing activo + tiers feature-gated                                                       |
| F-29 | Outlook + iCal + Apple Calendar                                                                     |
| F-30 | Calendar write-back (push tareas ancladas como eventos al calendario externo)                       |
| F-31 | Gamificación (streaks, % mensual visible) — **diferida desde MVP por decisión X2**                  |
| F-32 | iOS Shortcut + Siri ("Hey Siri, agendá...")                                                         |
| F-33 | Stack mobile-native si métricas justifican (React Native + Expo) — backend Next.js ya estaría listo |

### Out of scope (NUNCA)

- ❌ Equipos / shared workspaces / colaboración multi-user-real
- ❌ Kanban boards al estilo Trello/Asana
- ❌ Free-form journaling (notas largas sin estructura)
- ❌ Social / sharing / feed / community
- ❌ Therapy / mood tracking como feature principal
- ❌ Goal generation por IA ("inventame mis goals") — IA refina, NO genera goals (X4 resolved)
- ❌ Affirmations / coaching motivacional
- ❌ Múltiples personalidades de agente — solo una

---

## 4. Data Model

> Drizzle schema vivirá en [`src/lib/db/schema.ts`](../../src/lib/db/schema.ts) (SSOT). Lo siguiente es la estructura lógica, NO el SQL definitivo.

### Core entities

```
User
  id, email, name, image
  google_oauth_id (nullable)
  password_hash (nullable, NextAuth standard)
  preferred_language: 'es' | 'en'
  timezone
  intensity_mode: 'sharp' | 'standard' | 'gentle' | 'listening'
  intensity_expires_at (for listening auto-revert)
  onboarding_context (text — what frustrates them, captured at signup)
  plan_id (FK to Plan)
  created_at, updated_at

NotificationPref (1 per user)
  user_id (FK)
  morning_time (default 08:00)
  midday_time (default 13:00)
  evening_time (default 21:00)
  weekly_kickoff_dow (default Sunday)
  weekly_review_dow (default Saturday)
  weekend_enabled: bool
  channels: { push: bool, email: bool }
  muted_until (nullable)

Category
  id, user_id, name, color, icon, position
  // ej: "Personal", "Empresa Genomma", "Side Project X"

Project
  id, user_id, category_id (FK), name, description
  status: 'active' | 'paused' | 'completed' | 'killed'
  deadline (nullable)
  outcome_expected (text — para review)
  created_at, completed_at

Activity (== task)
  id, user_id, project_id (FK, nullable for inbox), title, description
  scheduled_date (nullable — "esta semana" pool si null)
  scheduled_time (nullable — hora anclada opcional)
  time_block: 'morning' | 'afternoon' | 'evening' | null  // pool aspiracional
  deadline (nullable, separate from scheduled)
  estimated_minutes (nullable)
  priority: 1 | 2 | 3 | 4 | 5 (5 = highest)
  recurrence_rule (RRULE string, nullable)
  status: 'pending' | 'in_progress' | 'done' | 'skipped' | 'blocked'
  completed_at (nullable)
  reason_not_done (nullable — when status = skipped/blocked)
  reason_category (nullable: 'time' | 'priority' | 'blocked' | 'didnt_want' | 'other')
  tags (text[])
  created_at, updated_at

Subtask  // 1 level only
  id, activity_id (FK), title, status, position

Goal  // ENTIDAD SEPARADA, no nivel intermedio
  id, user_id, title, description
  scope: 'quarter' | 'year' | '5year' | 'life'  // 4 niveles de goal
  deadline (nullable)
  outcome_expected (text)
  status: 'active' | 'achieved' | 'partial' | 'abandoned'
  review_score (1-10, nullable until reviewed)
  review_notes (text)
  reviewed_at (nullable)

GoalLink  // many-to-many goal <-> project/activity
  goal_id, target_type ('project' | 'activity'), target_id

// Sheets — structured planning entries per scope
DaySheet
  id, user_id, date (unique per user)
  notes_dreams (text, optional — morning)
  intention (text)
  gratitude (text)
  identity_statement (text — "hoy soy alguien que...")
  wins_planned (text[] — pulled from week's 3)
  avoidance (text)
  energy_physical, energy_mental, energy_emotional (1-5)
  evening_win (text)
  evening_lesson (text)
  tomorrow_top (text)
  insight (text, optional)
  morning_completed_at (timestamp, nullable)
  evening_completed_at (timestamp, nullable)

WeekSheet
  id, user_id, week_starting (Sunday date, unique per user)
  one_thing (text — if only one thing happens this week...)
  three_wins (text[3])
  calendar_blocks (jsonb — [{win, when}])
  people_to_connect (jsonb — [{name, why}])
  learn_one (text)
  avoid_one (text)
  self_care (jsonb — {rest, move, eat, sleep})
  // Saturday review
  review_wins (text[])
  review_lessons (text[])
  review_energy (1-10)
  review_one_sentence (text)
  reviewed_at (nullable)

QuarterSheet, YearSheet, FiveYearSheet, LifeSheet
  // v1.5 / v2 — estructuras paralelas con campos por scope (ver Reflexión Appendix A)

// AI agent + conversation
Conversation
  id, user_id, started_at, ended_at
  channel: 'in_app_chat' | 'in_app_voice'  // future: 'whatsapp' | 'sms'
  linked_sheet_id (nullable, polymorphic via linked_sheet_type)
  linked_sheet_type ('day' | 'week' | etc, nullable)

Message
  id, conversation_id, role: 'user' | 'agent'
  content (text)
  audio_url (nullable, for voice messages)
  challenges_fired (text[] — types fired: 'vague_language' | 'repeat' | 'identity' | 'cost' | 'reality')
  created_at

ProactiveTask  // scheduled agent-initiated check-ins/challenges
  id, user_id
  scheduled_for (timestamp)
  type: 'morning_open' | 'midday_check' | 'evening_close' | 'weekly_kickoff' | 'weekly_review' | 'pattern_challenge'
  payload (jsonb — context: which activity/goal/pattern to reference)
  status: 'pending' | 'sent' | 'responded' | 'dismissed' | 'cancelled'
  sent_at, responded_at

// Pattern detection (v1.5)
SheetEmbedding
  sheet_id, sheet_type, field_name
  embedding (vector(1536))  // pgvector
  created_at

// Integrations
GoogleCalendarConnection
  user_id, access_token (encrypted), refresh_token (encrypted)
  expires_at, calendar_ids (text[])
  connected_at, last_synced_at

// Billing (estructura sin pricing definido — F16)
Plan
  id, slug ('free' | 'pro'), name, description
  features (jsonb — feature flags by plan)
  limits (jsonb — {max_projects, max_ai_calls_per_month, max_voice_minutes, etc})
  price_monthly (nullable), price_yearly (nullable)
  active: bool

Subscription
  user_id, plan_id, status ('active' | 'cancelled' | 'past_due')
  current_period_start, current_period_end
  stripe_subscription_id (nullable — for v2 when Stripe activates)

UsageMeter
  user_id, period_start (month bucket)
  ai_calls_count, voice_minutes_count, whisper_seconds_count
  // tracks usage from day 1 even without Stripe — informs future pricing
```

### Sensitive data

- `google_oauth.access_token`, `refresh_token` → **encriptados at-rest** (Drizzle encrypted columns o pgcrypto)
- `password_hash` → bcrypt vía NextAuth standard
- Audio temporal de voice capture → **NO se guarda en producción**, solo transcripción (Whisper API stateless)
- Conversación con agente → guardada para long-memory pattern detection. Usuario puede exportar/borrar (GDPR).

---

## 5. Integrations

| #   | Servicio                                | Uso                                                                                            | Tier | OAuth scopes                                                |
| --- | --------------------------------------- | ---------------------------------------------------------------------------------------------- | ---- | ----------------------------------------------------------- |
| 1   | **Anthropic Claude (Sonnet 4.6 o 4.7)** | Agente conversacional, parseo de captura por voz, post-mortem semanal, challenges, sugerencias | MVP  | API key, sin OAuth                                          |
| 2   | **OpenAI Whisper API**                  | Fallback transcripción cuando Web Speech API no disponible/calidad mala                        | MVP  | API key                                                     |
| 3   | **Google Calendar API**                 | Read-only de busy slots para sugerir bloques libres                                            | MVP  | `calendar.readonly` (NO sensible, no requiere verification) |
| 4   | **Google OAuth** (NextAuth)             | Auth con Google                                                                                | MVP  | `email`, `profile`                                          |
| 5   | **Resend o Postmark**                   | Email para magic-link-fallback, password reset, weekly digest opcional                         | MVP  | API key (Resend default en TimeKast)                        |
| 6   | **Sentry**                              | Error tracking                                                                                 | MVP  | Ya configurado en TimeKast                                  |
| 7   | **PostHog o Plausible**                 | Product analytics anonimizado                                                                  | MVP  | API key                                                     |
| 8   | **Upstash Redis**                       | Rate limiting NextAuth + scheduling cache                                                      | MVP  | TimeKast default                                            |
| 9   | **Inngest**                             | Background jobs (check-ins programados, post-mortem nocturno, pattern detection nightly)       | MVP  | API key                                                     |
| 10  | **Stripe / LemonSqueezy**               | Billing                                                                                        | v2   | Webhooks                                                    |
| 11  | **Twilio / Meta WhatsApp Business**     | WhatsApp bot                                                                                   | v2   | Phone verification                                          |
| 12  | **Vapi o ElevenLabs Conversational AI** | Voice mode real-time bidireccional                                                             | v2   | API key                                                     |
| 13  | **Microsoft Graph (Outlook Calendar)**  | Outlook integration                                                                            | v2   | OAuth                                                       |
| 14  | **Apple CalDAV**                        | iCal                                                                                           | v2   | App-specific passwords                                      |

---

## 6. Business Rules

### Invariantes

- **BR-1** Un usuario ve **solo su propia data** — sin excepciones, sin "ver agendas de amigos", sin admin-impersonation visible al user.
- **BR-2** Una actividad **debe** pertenecer a un proyecto, o estar en "Inbox" (proyecto especial auto-creado por user al signup).
- **BR-3** Un proyecto **debe** pertenecer a una categoría.
- **BR-4** Categoría no puede borrarse si tiene proyectos. Soft-delete con cascade requiere confirmación.
- **BR-5** Subtask: máximo 1 nivel de anidamiento. Una subtask no puede tener sub-subtasks.
- **BR-6** Goal vive **fuera** de la jerarquía categoría/proyecto/actividad. Se vincula many-to-many vía `GoalLink`.
- **BR-7** Una `DaySheet` es única por `(user_id, date)`. Una `WeekSheet` única por `(user_id, week_starting)` con week_starting siempre = domingo (configurable por timezone).

### Estados y transiciones

```
Activity.status:
  pending → in_progress → done
                       ↘ skipped (con reason_not_done obligatorio si IA pregunta)
                       ↘ blocked (con reason texto)

Goal.status:
  active → achieved (con review_score 8-10)
        → partial  (con review_score 4-7)
        → abandoned (con review_score 1-3 o explicit kill)

Subscription.status:
  active → cancelled (mantiene acceso hasta period_end)
        → past_due (3 días grace, después downgrade a free)

User.intensity_mode:
  - 'gentle' es default para nuevos users (14 días)
  - 'listening' auto-revierte a 'standard' después de 48h
  - 'sharp' y 'standard' persisten hasta cambio manual
```

### Triggers / Jobs

| Job                                | Frecuencia                                    | Acción                                                                                                 |
| ---------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `morning_check_in`                 | Per-user, al `notification_pref.morning_time` | Crea `ProactiveTask` type=morning_open, envía push, espera response                                    |
| `midday_check_in`                  | Per-user, al `notification_pref.midday_time`  | Solo si DaySheet de hoy tiene `wins_planned` y al menos uno no está `done`                             |
| `evening_check_in`                 | Per-user, al `notification_pref.evening_time` | Crea ProactiveTask type=evening_close                                                                  |
| `weekly_kickoff`                   | Sunday morning per user TZ                    | Genera WeekSheet, abre conversación                                                                    |
| `weekly_review`                    | Saturday evening per user TZ                  | Calcula completion %, genera resumen automático (LLM call), guarda en WeekSheet.review\_\*; envía push |
| `pattern_detection_nightly` (v1.5) | 03:00 UTC                                     | Para users activos: embeddings de sheets de última semana, busca repeats con cosine similarity > 0.85  |
| `auto_revert_listening_mode`       | Cada hora                                     | Revierte intensity_mode a 'standard' si expires_at < now                                               |
| `silence_re_entry`                 | Daily                                         | Users con last_activity > 3 días → 1 push "te extrañé hoy", marca silence_handled=true                 |
| `subscription_grace_check`         | Daily                                         | Subs past_due > 3 días → downgrade a free, mantiene data                                               |

### AI behavior rules (system prompt anchors)

- **AI-1** El agente habla en el idioma del user (es/en). En español usa `tú`, NUNCA `vos`. Registro neutro LatAm.
- **AI-2** Una pregunta por turno. Nunca listas.
- **AI-3** Respuestas: 1-3 oraciones, casi siempre.
- **AI-4** Cita las palabras del user con fecha cuando aplica.
- **AI-5** Identidad sobre logro: "¿Quién fuiste hoy?" antes de "¿Qué hiciste?"
- **AI-6** Nunca moraliza, nunca dice "deberías".
- **AI-7** Fuera de scope (terapia, médico, legal, crisis): salir de personaje y redirigir.
- **AI-8** Crisis (auto/hetero-lesión): "No soy la herramienta para esto ahora. Por favor contactá una línea de crisis." Provee línea local si conocida.

### AI scope (Q9 resolved)

| Capacidad                           | Comportamiento                                                               |
| ----------------------------------- | ---------------------------------------------------------------------------- |
| Parsear voz → tarea estructurada    | 💡 Sugiere preview, user confirma 1-tap                                      |
| Sugerir prioridad de nueva tarea    | 📊 Solo info — excepto si user dictó por voz "alta prioridad" → AI lo parsea |
| Reorganizar orden del día           | 📊 Solo info — sin cambios automáticos                                       |
| Detectar tareas en riesgo           | 💡 Sugiere ajustes (mover deadline, reducir scope, eliminar)                 |
| Generar plan semanal completo       | 💡 Sugiere — **[V2-CANDIDATE]**, posiblemente diferido                       |
| Análisis post-mortem semanal        | 🤖 Decide y genera (read-only para user)                                     |
| Recomendar matar proyecto estancado | 💡 Sugiere                                                                   |
| Resumen diario nocturno (1 línea)   | 🤖 Decide y genera                                                           |
| Vague-answer challenges             | 🤖 Decide según intensity_mode                                               |

---

## 7. UI/UX

### Plataforma

- **PWA mobile-first** — funciona en iOS Safari, Android Chrome, desktop Chrome/Edge/Firefox
- Install prompt activo
- Offline básico: lectura de hoy + creación de tareas (sync cuando vuelve online)
- Notificaciones push (Web Push API) — fallback email si user las rechaza

### Estructura de navegación (mobile bottom nav)

```
[ 🏠 Today ]  [ 📅 Week ]  [ 🎯 Goals ]  [ 💬 Chat ]  [ ⚙️ Settings ]
```

### Pantallas core MVP

| #    | Pantalla                           | Propósito                                                                                               |
| ---- | ---------------------------------- | ------------------------------------------------------------------------------------------------------- |
| S-1  | **Today**                          | DaySheet del día + lista de actividades del día (anchored + pool). Big mic button bottom-right.         |
| S-2  | **Week**                           | WeekSheet de la semana + grilla 7 días con previsualización. Vista del plan vs ejecutado.               |
| S-3  | **Quarter / Year / 5-Year / Life** | (v1: solo placeholders) — v1.5 sheets completos                                                         |
| S-4  | **Goals**                          | Lista de goals activos por scope (Quarter/Year/5-Year/Life). Botón "Review goal" cuando deadline pasa.  |
| S-5  | **Chat**                           | Conversación con el agente. Histórico paginado. Botón mic + input text.                                 |
| S-6  | **Activity detail**                | Vista/edit de una actividad. Subtasks. Linkage a goals. Razón si skipped.                               |
| S-7  | **Project detail**                 | Lista de actividades del proyecto. Status. Deadline. Outcome expected.                                  |
| S-8  | **Category list**                  | CRUD de categorías.                                                                                     |
| S-9  | **Settings**                       | Notification times, intensity mode, language, timezone, integrations, account, billing (placeholder v1) |
| S-10 | **Onboarding flow**                | 8 pasos descritos en §2                                                                                 |
| S-11 | **Voice capture sheet**            | Modal con waveform + transcript en tiempo real + preview de tarea parseada por AI                       |

### Flows clave

**F-A — Captura por voz:**

1. Tap mic 🎙️ → Permission check (1x) → graba
2. Speech-to-text streaming (Web Speech API) → texto visible mientras hablas
3. Tap "Listo" → LLM call con prompt "Parse this as a task. Extract: title, project (best guess from categories), date, time, priority, deadline. Return JSON."
4. Modal preview: "Llamar a Juan / Empresa Genomma / Mañana 10:00 / Alta. ¿Confirmás?"
5. Tap Confirm → save. Tap Edit → editar campos antes de confirmar.

**F-B — Morning check-in:**

1. 8:00 push: "Buenos días. ¿Cuál es la intención de hoy — una sola frase?"
2. Tap → abre Chat → AI hace 6 preguntas (intention → gratitude → identity → 3 wins → avoidance → energy)
3. Cada respuesta puede dispararse challenge según intensity mode
4. Al terminar: "Guardado. Te busco al mediodía."
5. DaySheet morning completed_at se llena

**F-C — Weekly review (sábado 8pm):**

1. Push: "Sábado. ¿Cerramos la semana?"
2. AI lista wins originales vs done count
3. Pregunta por cada incompleta: "¿Qué pasó con X?" → user responde → IA repregunta concreto si vago (challenge mode)
4. Pregunta: "Energy de la semana 1-10"
5. Pregunta: "Una frase de la semana"
6. AI genera resumen automático y lo presenta read-only
7. Sugiere los 3 wins de la próxima semana (con base en lo que no cerró + goals activos)

### Accesibilidad

- WCAG AA mínimo
- Soporte de screen reader en todos los componentes interactivos
- Toggle de motion-reduce (CSS prefers-reduced-motion)
- Contraste de paleta warm validado contra fondo cream

---

## 8. Infrastructure

### Stack (decisión X5 — TimeKast confirmed)

| Capa                 | Tecnología                                                 | Justificación                        |
| -------------------- | ---------------------------------------------------------- | ------------------------------------ |
| Framework            | Next.js 16 App Router + Turbopack                          | TimeKast default                     |
| Lenguaje             | TypeScript strict                                          | TimeKast default                     |
| ORM                  | Drizzle                                                    | TimeKast default                     |
| DB                   | Neon Postgres (serverless) + pgvector extension            | TimeKast default + embeddings (v1.5) |
| Auth                 | NextAuth v5                                                | TimeKast default                     |
| UI                   | Tailwind CSS v4 + Lucide React                             | TimeKast default                     |
| Hosting              | Vercel                                                     | TimeKast default                     |
| Testing              | Vitest + Playwright                                        | TimeKast default                     |
| Background jobs      | Inngest                                                    | Nuevo — para check-ins programados   |
| LLM                  | Anthropic Claude Sonnet 4.6 (upgrade a 4.7 cuando estable) | Nuevo                                |
| Voice STT (primary)  | Web Speech API (browser-native, gratis)                    | Nuevo                                |
| Voice STT (fallback) | OpenAI Whisper API                                         | Nuevo                                |
| Email                | Resend                                                     | TimeKast default                     |
| Rate limit           | Upstash Redis                                              | TimeKast default                     |
| Error tracking       | Sentry                                                     | TimeKast default                     |

### Deployment

- **Production:** Vercel (main branch → vercel.com)
- **Preview:** Vercel preview deployments por PR
- **DB:** Neon con branching para preview deployments
- **Secrets:** Vercel env vars + Vercel KV para runtime

### Timeline propuesto

- **Semana 1-2:** Setup proyecto + auth + categorías/proyectos/actividades CRUD + multi-tenant data isolation tests
- **Semana 3-4:** DaySheet + WeekSheet schemas + UI + check-in scheduler (Inngest)
- **Semana 5-6:** AI agent core (Claude integration) + intensity modes + vague-answer challenges
- **Semana 7-8:** Captura por voz (Web Speech + Whisper fallback) + PWA push notifications
- **Semana 9:** Google Calendar read-only + post-mortem semanal auto-gen
- **Semana 10:** Polish + onboarding + landing + bugs

**v1 launch:** ~10 semanas single dev con Claude Code asistido (estimado).

---

## 9. Branding

### Nombre

**"AgendaInteligente"** es **placeholder**. Naming real diferido. Pre-launch checklist:

- Verificar dominio `.com`, `.app`, `.day` disponible
- Verificar trademark en US/MX
- Verificar handle en X/Instagram/TikTok

**Brainstorm shortlist** (no comprometido):

- Loop / Cadence / Stride / Tempo / Pulse / Mira (mirar atrás) / Brújula

### Voz / Tono (decisión Q12 confirmed)

**Asistente profesional neutro.** Específicamente:

- ✅ Conciso, sin floritura
- ✅ Directo: "Listo." "Guardado." "¿Y mañana?"
- ✅ Específico sobre general: "¿Qué hiciste en lugar de eso?" en lugar de "Cuéntame más."
- ✅ Cita palabras del user con fecha
- ✅ Sin moralización ("deberías"), sin coaching motivacional ("¡tú puedes!")
- ❌ Sin emojis decorativos (sí para UI states funcionales: 🎙️ 🔥 ⊙ 🌱 🤍)
- ❌ Sin exclamaciones excesivas
- ❌ Sin "¡felicidades!", "¡increíble!", "¡vamos!"

**Sample microcopy:**

- Onboarding cierre: "Mañana a las 8 abro tu primer día. Hasta entonces."
- Save confirmation: "Guardado." (no "¡Guardado con éxito! ✅")
- Empty state weekly: "No hay sheets de semanas anteriores todavía. La de esta semana se cierra el sábado."
- Error: "Algo se rompió de nuestro lado. Reintentá." (blame system, never user)

### Idiomas

- **MVP:** Español (LatAm neutro, `tú`) + Inglés
- Detección auto desde navegador en onboarding, override manual en settings

---

## 10. Mobile/PWA

### Posture

- **PWA mobile-first.** No app nativa en MVP.
- **Offline:** lectura de hoy + creación local de tareas con sync. Sin sync de check-ins offline (no tiene sentido).
- **Install prompts:** activos vía TimeKast PWA system (ya configurado).
- **Update toasts:** activos.
- **Service worker:** caché de shell + página de hoy.

### Notificaciones

- **Web Push API** (FCM/APNs vía Service Worker)
- Deep links: tap push → abre app en pantalla relevante (Today / Chat con contexto)

### Voice capture

- **Primary:** Web Speech API (`window.SpeechRecognition`)
- **Fallback:** record audio blob → upload a /api/voice/transcribe → Whisper API
- **Permiso:** se pide on-demand al primer tap del mic, no en onboarding

### Eventual mobile-native (v2)

Si métricas de retención justifican React Native + Expo, el backend Next.js + Postgres se mantiene tal cual. El cliente nativo consume las mismas API routes. **Sin lock-in.**

---

## 11. Visual Direction

### Decisión X8 — Warm-book aesthetic (decidida por discovery-expert, user aprobó "me da igual, recomendá")

> **🟡 NOTE:** Esta es la única decisión del brief que NO viene 100% del user. Se documenta como `[INFERRED + USER OK'D]`. Revisable en `/design` phase.

### Posture

**Minimalista premium con calidez de libro.** Diferenciador visual real vs grises/azules genéricos de Todoist/TickTick.

### Paleta

```
--ink-primary:   #2A2826  (warm charcoal — text principal, dark UI)
--ink-soft:      #4A4540  (subtitles, secondary)
--ink-hint:      #7A6E64  (warm taupe — hints, placeholders)
--slate:         #5B6B6B  (labels, system text)
--rule:          #C9BAA5  (warm ecru — borders, dividers)
--cream:         #FBF7EF  (background light)

Per-scope accents (used in scope chips, sheet headers):
  Day:    #5C5C5C  (medium gray)
  Week:   #1F1F1F  (near-black)
  Quarter:#5C7B5C  (sage green)
  Year:   #A85530  (burnt orange)
  5-Year: #3F5E78  (steel blue)
  Life:   #7B3F4A  (wine red)
```

### Tipografía

- **Headlines / sheet titles:** Lora o Source Serif (book serif, weight 500)
- **Body / UI:** Inter (humanist sans)
- **Section labels:** Inter all-caps small (12px, letter-spacing 0.05em)
- **Italic serif** para hints reflexivos y placeholders evocativos

### Densidad

- Mobile: max-width 420px content area, padding generoso
- Whitespace amplio entre secciones
- Sin tablas densas en mobile — preferir cards stack

### Referencias visuales

- Sunsama (calm, weekly review feel)
- Things 3 (typography hierarchy)
- The Daily Stoic app (warm book aesthetic mobile)
- Reflexión doc §11 (warm charcoal palette)

### Mode

- **Light mode default** (cream background coherente con warm-book)
- **Dark mode:** ink-primary background, cream text, scope accents desaturados

---

## Appendix A — Reconciliation Checklist

| Section                                       | Cross-check                                                                                                                             | OK  |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --- |
| §1 General Idea vs §3 Core Features           | North Star "no te deja mentirte" se materializa en F-7 (vague-answer challenges), F-13 (razón no cumplimiento), F-15 (post-mortem auto) | ✅  |
| §2 Users single-user-data vs §3 F-2 jerarquía | Categoría es organizativa, no compartible — coherente con X1 resolved                                                                   | ✅  |
| §3 F-16 billing infra vs §5 Stripe v2         | DB structure existe pero Stripe no se activa en MVP — coherente con Q11 deferred                                                        | ✅  |
| §4 Data Model GoalLink polymorphic vs §6 BR-6 | Goal vive fuera jerarquía, se vincula M2M — consistente                                                                                 | ✅  |
| §4 SheetEmbedding pgvector vs §8 Neon         | pgvector es extensión Neon nativa — viable                                                                                              | ✅  |
| §5 Google Calendar scope vs §6 BR             | `calendar.readonly` no es sensible, no requiere OAuth verification — riesgo M1 mitigado                                                 | ✅  |
| §6 AI-1 idioma `tú` vs §9 Branding            | Consistente, refuerza CORE.md del kit                                                                                                   | ✅  |
| §7 6 escalas navegación vs §3 v1 scope        | UI muestra Today + Week en v1, placeholders Quarter+ → coherente con timeline §8                                                        | ✅  |
| §8 Timeline 10 semanas vs §3 F-1..F-17        | 17 features en 10 semanas es agresivo pero viable solo con Claude Code asistido + buena disciplina de scope cuts                        | 🟡  |
| §10 PWA vs §11 warm aesthetic                 | PWA + warm-book es factible, no conflicto técnico                                                                                       | ✅  |

### Drift declarado (Resolved During Discovery)

| Drift item                                                                                                                                                                   | Origin                                             | Resolution                                                                         |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Granularidad de planeación: brain dump dijo "diaria/semanal/mensual/anual"; brief dice 6 escalas (sin month, con quarter/5year/life)                                         | User Q14 = "Toma las 6 escalas"                    | **Resolved by user**                                                               |
| Estética: brain dump no especificó; Q12 dijo "iOS-native"; brief dice warm-book                                                                                              | User X8 = "Me da igual, recomendá"                 | **[INFERRED + USER OK'D]** — flag para revisión en `/design`                       |
| Gamificación: Q5 dijo "siempre funciona"; brief la difiere a v2                                                                                                              | User X2 = "Dejemos gamification para más adelante" | **Resolved by user**                                                               |
| Voz del agente: brain dump no especificó; Q12 dijo "asistente profesional neutro"; brief integra patrones de Reflexión (vague-answer challenge, quote-back, intensity modes) | User Q13 = "Mezcla de los 2"                       | **Resolved by user** — patrones de Reflexión adoptados como aumentos, no overrides |

### Open Questions (post-Discovery, para `/proposal` o `/docs`)

| OQ   | Pregunta                                                                                            | Cuándo resolver                   |
| ---- | --------------------------------------------------------------------------------------------------- | --------------------------------- |
| OQ-1 | Nombre real del producto                                                                            | Antes de `/design`                |
| OQ-2 | Pricing tier exacto (límites, $ free vs paid)                                                       | Antes de v1 launch                |
| OQ-3 | ¿Mode dark default vs light default? Warm-book sugiere light, pero target tech-savvy usa dark       | `/design`                         |
| OQ-4 | ¿Web Speech API tiene coverage suficiente para target browsers? Validar fallback rate esperado      | Sprint 7 (semana de voice)        |
| OQ-5 | ¿AI agent debe acordarse de conversaciones de hace 6+ meses? Decisión de retention vs costo storage | Antes de v1.5 (pattern detection) |
| OQ-6 | ¿Quarter starts Jan/Apr/Jul/Oct (calendar quarters) o adaptive desde user signup date?              | v1.5                              |
| OQ-7 | Compliance: ¿algún país objetivo requiere GDPR-equivalent explícito en MVP?                         | Pre-launch                        |

---

## Quality metrics (Discovery self-assessment)

| Metric                                    | Target   | Actual                                                          |
| ----------------------------------------- | -------- | --------------------------------------------------------------- |
| Source Fidelity (zero unauthorized drift) | 100%     | ✅ 100% — todos los drifts declarados arriba                    |
| Drift Introduced                          | 0 silent | ✅ 0 silent (3 declared)                                        |
| Open Questions remaining                  | Minimize | 7 declared (manageable)                                         |
| High-Risk Assumptions flagged             | All      | ✅ M1 (Google OAuth), M2 (LLM cost), M3 (Whisper cost) declared |
| Section Completeness                      | ≥80%     | ✅ 11/11 = 100%                                                 |

---

## Next steps

1. **`/proposal`** — generar deck de cliente (no aplica si proyecto es personal, opcional)
2. **`/docs`** — generar docs/planning/01-14\_\*.md (personas, user stories, business rules formales, data model SQL, architecture, API contracts, test strategy, runbooks)
3. **`/design`** — generar `15_DESIGN.md` (pantallas detalladas, wireframes, flows visuales) — aquí se resuelve OQ-3 (dark vs light default)
4. **`/backlog`** — generar issues ejecutables por milestone (v1 / v1.5 / v2)
5. **`/implement`** — ejecutar issues con código + tests + docs

---

_Generated by `/discovery` (TimeKast Factory) — 2026-05-19 — discovery-expert persona_
