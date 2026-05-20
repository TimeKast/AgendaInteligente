# 02 — Feature Map

> **Source:** [00_DISCOVERY_BRIEF.md §3 Core Features](./00_DISCOVERY_BRIEF.md)
> **Namespace:** `FT-NNN`
> **Status legend:** `MVP` (v1) · `V1.5` (post-MVP iter) · `V2` (deferred) · `NEVER` (out of scope)

---

## Priority matrix

| Priority | Definition                                                            |
| -------- | --------------------------------------------------------------------- |
| **P0**   | Sin esta feature, el producto no funciona. Hard blocker para release. |
| **P1**   | Diferenciador crítico. Sin esta, el producto pierde su North Star.    |
| **P2**   | Funcional importante pero no diferenciador.                           |
| **P3**   | Nice-to-have. Mejora UX pero no blocker.                              |

---

## MVP v1 — Foundation (8-10 semanas)

### Capa 1 — Auth & Multi-tenant

| ID     | Feature                     | Priority | Brief ref     | Notes                                                                          |
| ------ | --------------------------- | -------- | ------------- | ------------------------------------------------------------------------------ |
| FT-001 | Auth con Google OAuth       | P0       | F-1           | NextAuth v5 standard                                                           |
| FT-002 | Auth con email + password   | P0       | F-1           | NextAuth credentials provider + bcrypt                                         |
| FT-003 | Multi-tenant data isolation | P0       | F-1, BR-1     | `user_id` en todas las tablas + middleware enforcement                         |
| FT-004 | Onboarding 8-step flow      | P0       | §2 Onboarding | Idioma, TZ, push perm, mic perm, 3 preguntas iniciales, Google Calendar opt-in |

### Capa 2 — Organización jerárquica

| ID     | Feature                        | Priority | Brief ref | Notes                                                               |
| ------ | ------------------------------ | -------- | --------- | ------------------------------------------------------------------- |
| FT-010 | Categorías CRUD                | P0       | F-2       | Personal/empresa/etc. Color, icon, posición                         |
| FT-011 | Proyectos CRUD bajo categoría  | P0       | F-2       | Status (active/paused/completed/killed), deadline, outcome_expected |
| FT-012 | Actividades CRUD bajo proyecto | P0       | F-2       | Inbox auto-creado para tasks huérfanas                              |
| FT-013 | Subtareas (1 nivel)            | P1       | F-2, BR-5 | Sin anidamiento recursivo                                           |
| FT-014 | Tags libres en actividades     | P2       | F-2       | Array de strings, sin entidad propia                                |

### Capa 3 — Modelo temporal y planeación

| ID     | Feature                                                | Priority | Brief ref              | Notes                                                                      |
| ------ | ------------------------------------------------------ | -------- | ---------------------- | -------------------------------------------------------------------------- |
| FT-020 | Asignar actividad a un día (scheduled_date)            | P0       | F-11                   | Default "esta semana" pool si null                                         |
| FT-021 | Hora opcional anclable (scheduled_time)                | P1       | F-11                   | Solo para tareas que requieren hora específica                             |
| FT-022 | Time blocks aspiracionales (morning/afternoon/evening) | P2       | F-11                   | Múltiples bloques permitidos por actividad                                 |
| FT-023 | Deadline separado de scheduled_date                    | P1       | F-11                   | Deadline = cuándo es tarde; scheduled = cuándo planeás hacerla             |
| FT-024 | Estimated minutes                                      | P2       | F-11                   | Para análisis de riesgo (FT-046)                                           |
| FT-025 | Priority 1-5                                           | P1       | F-11                   | 5 = highest                                                                |
| FT-026 | Recurrencia (RRULE)                                    | P2       | F-11                   | iCal RRULE standard                                                        |
| FT-027 | Estado: pending/in_progress/done/skipped/blocked       | P0       | F-11, BR-1 transitions |                                                                            |
| FT-028 | Razón de no cumplimiento                               | P1       | F-13                   | reason_not_done + reason_category (time/priority/blocked/didnt_want/other) |

### Capa 4 — Sheets estructurados (Day + Week en MVP)

| ID     | Feature                                      | Priority | Brief ref | Notes                                                                                      |
| ------ | -------------------------------------------- | -------- | --------- | ------------------------------------------------------------------------------------------ |
| FT-030 | DaySheet — morning fields                    | P1       | F-4       | intention, gratitude, identity_statement, wins_planned[3], avoidance, energy (3x 1-5)      |
| FT-031 | DaySheet — evening fields                    | P1       | F-4       | evening_win, evening_lesson, tomorrow_top, insight (opt)                                   |
| FT-032 | DaySheet — vista read-only del día           | P1       | F-4       | Estilo "página del workbook"                                                               |
| FT-033 | DaySheet — edición manual de cualquier campo | P2       | F-4       | Por si user quiere ajustar fuera de check-in                                               |
| FT-034 | WeekSheet — kickoff fields (Sunday)          | P1       | F-5       | one_thing, three_wins, calendar_blocks, people_to_connect, learn_one, avoid_one, self_care |
| FT-035 | WeekSheet — review fields (Saturday)         | P1       | F-5       | review_wins, review_lessons, review_energy (1-10), review_one_sentence                     |
| FT-036 | WeekSheet — vista grilla 7 días              | P1       | F-5       | Plan vs ejecutado por día                                                                  |

### Capa 5 — Goals (entidad separada)

| ID     | Feature                                            | Priority | Brief ref  | Notes                                                              |
| ------ | -------------------------------------------------- | -------- | ---------- | ------------------------------------------------------------------ |
| FT-040 | Goal CRUD                                          | P1       | F-10, BR-6 | scope: quarter/year/5year/life. status, deadline, outcome_expected |
| FT-041 | Goal — link many-to-many con proyectos/actividades | P1       | F-10       | Tabla `GoalLink` (target_type polymorphic)                         |
| FT-042 | Goal review con calificación 1-10                  | P1       | F-10       | review_score, review_notes, reviewed_at                            |
| FT-043 | Lista de goals activos por scope                   | P1       | §7 S-4     | Pantalla Goals con tabs por scope                                  |

### Capa 6 — AI Agent core

| ID     | Feature                                  | Priority | Brief ref       | Notes                                                                                          |
| ------ | ---------------------------------------- | -------- | --------------- | ---------------------------------------------------------------------------------------------- |
| FT-050 | Conversación con agente (chat UI)        | P0       | F-6, §7 S-5     | Threading por día, paginación histórica                                                        |
| FT-051 | System prompt v1 con personalidad neutra | P0       | F-6, AI-1..AI-8 | Una pregunta por turno, 1-3 oraciones, identidad sobre logro                                   |
| FT-052 | Intensity mode toggle                    | P1       | F-6             | Sharp / Standard (default) / Gentle (default nuevo user 14 días) / Listening (auto-revert 48h) |
| FT-053 | Listening mode auto-revert               | P1       | F-6             | Cron job cada hora chequea `intensity_expires_at`                                              |
| FT-054 | Idioma del agente (ES/EN auto-detectado) | P0       | AI-1            | `preferred_language` en User; cita palabras pasadas en idioma original                         |
| FT-055 | Out-of-scope redirect                    | P1       | AI-7            | "No soy la herramienta para esto. ¿Volvemos a [sheet]?"                                        |
| FT-056 | Crisis exit protocol                     | P1       | AI-8            | Salir de personaje + línea de crisis local                                                     |

### Capa 7 — Vague-answer challenges

| ID     | Feature                                                               | Priority | Brief ref | Notes                                                                                                                 |
| ------ | --------------------------------------------------------------------- | -------- | --------- | --------------------------------------------------------------------------------------------------------------------- |
| FT-060 | Vague-language challenge (5 trigger words: better/more/soon/fine/try) | P1       | F-7       | "¿Qué significa eso concretamente?"                                                                                   |
| FT-061 | Cost reveal challenge (goal sin costo declarado)                      | P1       | F-7       | "¿Qué tenés que dejar de hacer para lograr esto?"                                                                     |
| FT-062 | Reality test challenge (commitment nuevo)                             | P1       | F-7       | "¿Probabilidad real de hacerlo en 30 días? Si <70%, scope down"                                                       |
| FT-063 | Repeat detection challenge                                            | V1.5     | F-21      | Requiere embeddings, diferido a v1.5                                                                                  |
| FT-064 | Identity check challenge                                              | V1.5     | F-21      | Requiere histórico significativo, diferido a v1.5                                                                     |
| FT-065 | Frecuencia de challenges según intensity_mode                         | P1       | F-7       | Sharp: todos. Standard: con acknowledgment. Gentle: solo vague-language y contradicciones claras. Listening: ninguno. |

### Capa 8 — Captura por voz

| ID     | Feature                                         | Priority | Brief ref   | Notes                                                                    |
| ------ | ----------------------------------------------- | -------- | ----------- | ------------------------------------------------------------------------ |
| FT-070 | Mic button en pantalla Today                    | P1       | F-3, §7 S-1 | Botón flotante bottom-right                                              |
| FT-071 | Streaming STT con Web Speech API                | P1       | F-3         | Transcripción visible mientras hablás                                    |
| FT-072 | Fallback Whisper API cuando Web Speech falla    | P1       | F-3         | Server route `/api/voice/transcribe`                                     |
| FT-073 | LLM parse de transcripción → tarea estructurada | P1       | F-3         | Claude tool-call: extract title, project, date, time, priority, deadline |
| FT-074 | Modal preview con confirmar/editar              | P1       | F-3         | 1-tap confirm, edit fields antes de guardar                              |
| FT-075 | Permission management (mic)                     | P1       | F-3         | Pedida on-demand al primer tap, no en onboarding                         |

### Capa 9 — Check-ins automáticos

| ID     | Feature                                                     | Priority | Brief ref | Notes                                                                           |
| ------ | ----------------------------------------------------------- | -------- | --------- | ------------------------------------------------------------------------------- |
| FT-080 | Morning check-in scheduler                                  | P1       | F-8       | Inngest job per-user al `notification_pref.morning_time`                        |
| FT-081 | Midday check-in (condicional)                               | P1       | F-8       | Solo si DaySheet tiene wins_planned y alguno no está done                       |
| FT-082 | Evening check-in scheduler                                  | P1       | F-8       | Inngest job al `notification_pref.evening_time`                                 |
| FT-083 | Weekly kickoff (Sunday)                                     | P1       | F-8       | Genera WeekSheet, abre conversación                                             |
| FT-084 | Weekly review (Saturday evening)                            | P1       | F-8, F-15 | Calcula completion %, genera resumen auto (LLM), guarda en WeekSheet.review\_\* |
| FT-085 | NotificationPref CRUD (horarios + canales + weekend toggle) | P1       | F-8       | UI en Settings                                                                  |
| FT-086 | Anti-spam guardrails (max 4/24h, max 1 challenge/week)      | P1       | F-9       | Enforcement en scheduler antes de enviar                                        |
| FT-087 | Silence re-entry (3+ días → 1 push gentle, después pausa)   | P1       | F-9       | Cron diario                                                                     |
| FT-088 | Web Push notifications (Service Worker + FCM/APNs)          | P0       | F-17, §10 | TimeKast PWA base                                                               |
| FT-089 | Deep links de push a pantalla relevante                     | P1       | §10       | `today?focus=midday`, `chat?context=evening`, etc                               |

### Capa 10 — Google Calendar integration

| ID     | Feature                                       | Priority | Brief ref | Notes                             |
| ------ | --------------------------------------------- | -------- | --------- | --------------------------------- |
| FT-090 | Google Calendar OAuth connection flow         | P1       | F-12      | Scope `calendar.readonly`         |
| FT-091 | Sync busy slots cada 15 min                   | P1       | F-12      | Background job, almacena en cache |
| FT-092 | Mostrar busy slots en WeekSheet planning view | P1       | F-12      | Evitar overbooking al planear     |
| FT-093 | Disconnect Google Calendar                    | P2       | F-12      | Settings → Integrations           |

### Capa 11 — AI sugerencias

| ID     | Feature                                                     | Priority | Brief ref | Notes                                                               |
| ------ | ----------------------------------------------------------- | -------- | --------- | ------------------------------------------------------------------- |
| FT-100 | Sugerir prioridad en captura por voz                        | P2       | F-14      | LLM extrae priority del audio si user lo dijo, no impone            |
| FT-101 | Detectar tareas en riesgo (deadline vs tiempo)              | P1       | F-14      | Cron diario; sugiere ajustes                                        |
| FT-102 | Recomendar matar proyecto estancado (sin movimiento N días) | P2       | F-14      | Sugiere, requiere aprobación user                                   |
| FT-103 | Análisis post-mortem semanal auto-generado                  | P1       | F-15      | LLM resume sábado nocturno, % cumplimiento + patrones + sugerencias |
| FT-104 | Resumen diario nocturno (1 línea)                           | P2       | F-15      | "Hoy completaste 6/8, mejor que ayer"                               |

### Capa 12 — Billing infrastructure (estructura sin pricing)

| ID     | Feature                                              | Priority | Brief ref | Notes                                        |
| ------ | ---------------------------------------------------- | -------- | --------- | -------------------------------------------- |
| FT-110 | Tabla `plans` con feature flags y limits jsonb       | P1       | F-16      | Estructura para tiers, sin Stripe activo     |
| FT-111 | Tabla `subscriptions` por user                       | P1       | F-16      | Status, periods                              |
| FT-112 | Tabla `usage_meters` (LLM calls, voice minutes, etc) | P1       | F-16      | Tracking desde día 1, informa pricing futuro |
| FT-113 | Bootstrap user a plan `free` default                 | P1       | F-16      | Migration seed                               |

### Capa 13 — PWA + Settings

| ID     | Feature                                                                       | Priority | Brief ref         | Notes                                  |
| ------ | ----------------------------------------------------------------------------- | -------- | ----------------- | -------------------------------------- |
| FT-120 | Service worker + manifest + install prompts                                   | P0       | F-17              | TimeKast PWA default                   |
| FT-121 | Offline mode: lectura de hoy + creación local con sync                        | P2       | §10               | IndexedDB sync queue                   |
| FT-122 | Settings page (intensity, language, TZ, notifications, integrations, account) | P1       | §7 S-9            |                                        |
| FT-123 | Account deletion (GDPR-like) con export de datos                              | P1       | §4 Sensitive data | Soft delete 30 días, después purge     |
| FT-124 | Toggle dark mode                                                              | P2       | OQ-3              | Warm-book light default, dark opcional |

---

## V1.5 — Post-MVP iter (4-6 semanas después de v1)

### Capa 14 — Quarter / Year sheets

| ID     | Feature                                                                                                  | Priority | Brief ref | Notes                                        |
| ------ | -------------------------------------------------------------------------------------------------------- | -------- | --------- | -------------------------------------------- |
| FT-200 | QuarterSheet completo (3 wins, habits, self-talk audit, wheel of life, relationships, mid/end review)    | P2       | F-18      | Reflexión §Appendix A Quarter                |
| FT-201 | YearSheet completo (5 wins, audacious goal, anti-goals, financial targets, experiences, mid/year review) | P2       | F-19      | Reflexión §Appendix A Year                   |
| FT-202 | Sheet linkage automática (Day → Week → Quarter → Year)                                                   | P2       | F-20      | Wins de scope alto se sugieren en scope bajo |

### Capa 15 — Pattern detection (pgvector)

| ID     | Feature                                                    | Priority | Brief ref | Notes                                           |
| ------ | ---------------------------------------------------------- | -------- | --------- | ----------------------------------------------- |
| FT-210 | Embeddings de campos clave en sheets                       | P2       | F-21      | pgvector, OpenAI ada-002 o Anthropic embeddings |
| FT-211 | Repeat detection (cosine > 0.85 en 3+ sheets consecutivos) | P2       | F-21      | Nightly job                                     |
| FT-212 | Drift detection (week #1 no aparece en day sheets)         | P2       | F-21      | Structured query, no embeddings                 |
| FT-213 | Quote-back en challenges con cita de fecha                 | P2       | F-22      | "Hace 3 semanas escribiste..."                  |
| FT-214 | Proactive challenge weekly (1 challenge fuerte/semana)     | P2       | F-21      | Selecciona el de mayor signal                   |

---

## V2 — Deferred (sin compromiso de fecha)

| ID     | Feature                                              | Priority | Brief ref | Notes                                                  |
| ------ | ---------------------------------------------------- | -------- | --------- | ------------------------------------------------------ |
| FT-300 | 5-Year sheet                                         | P3       | F-23      | Vivid vision, capabilities, network, financial freedom |
| FT-301 | Life sheet                                           | P3       | F-24      | Mission, eulogy, core values, anti-vision, bucket list |
| FT-310 | WhatsApp bot (Twilio o Meta Business API)            | P2       | F-25      | Multi-channel conversación                             |
| FT-311 | Telegram bot                                         | P3       | F-26      | Alternativa barata a WhatsApp                          |
| FT-312 | Voice mode bidireccional real-time (Vapi/ElevenLabs) | P2       | F-27      | Latency <800ms                                         |
| FT-320 | Stripe billing activo + pricing tiers                | P1       | F-28      | Antes de cualquier monetización pública                |
| FT-321 | Feature gating por plan                              | P1       | F-28      | Middleware check + UI disabled states                  |
| FT-330 | Outlook Calendar (Microsoft Graph)                   | P3       | F-29      | OAuth flow paralelo                                    |
| FT-331 | Apple Calendar (CalDAV)                              | P3       | F-29      | App-specific passwords                                 |
| FT-340 | Calendar write-back (push tareas como eventos)       | P2       | F-30      | Scope sensitive, requiere OAuth verification           |
| FT-350 | Gamificación (streaks, % mensual, achievements)      | P3       | F-31      | Diferido por decisión X2                               |
| FT-360 | iOS Shortcut + Siri capture                          | P3       | F-32      | API key user-specific                                  |
| FT-370 | React Native + Expo mobile-native                    | P3       | F-33      | Solo si métricas justifican                            |

---

## NEVER — Out of scope

| Item                               | Razón                                                          |
| ---------------------------------- | -------------------------------------------------------------- |
| Equipos / shared workspaces        | Producto es multi-user pero single-user-data (X1, X3 resolved) |
| Kanban boards                      | No es project planner profesional, es agenda personal          |
| Free-form journaling               | Sheets son estructurados, no es diario libre                   |
| Social / sharing / feed            | No es producto social                                          |
| Therapy / mood tracking primary    | Out-of-scope del agente (AI-7), redirige                       |
| Goal generation por IA             | IA refina, no genera (X4 resolved)                             |
| Affirmations                       | Inconsistente con voz "asistente profesional neutro"           |
| Múltiples personalidades de agente | Solo una voz para coherencia de producto                       |

---

## Coverage summary

| Capa                              | MVP Features | V1.5 Features | V2 Features |
| --------------------------------- | ------------ | ------------- | ----------- |
| Auth & Multi-tenant               | 4            | 0             | 0           |
| Organización jerárquica           | 5            | 0             | 0           |
| Modelo temporal                   | 9            | 0             | 0           |
| Sheets (Day+Week MVP)             | 7            | 3             | 2           |
| Goals                             | 4            | 0             | 0           |
| AI Agent core                     | 7            | 0             | 0           |
| Vague-answer challenges           | 4            | 2             | 0           |
| Captura por voz                   | 6            | 0             | 0           |
| Check-ins automáticos             | 10           | 0             | 0           |
| Google Calendar                   | 4            | 0             | 4           |
| AI sugerencias                    | 5            | 0             | 0           |
| Billing infrastructure            | 4            | 0             | 2           |
| PWA + Settings                    | 5            | 0             | 0           |
| Pattern detection                 | 0            | 5             | 0           |
| Multi-channel (WA/Telegram/Voice) | 0            | 0             | 3           |
| Gamification                      | 0            | 0             | 1           |
| Cross-calendar                    | 0            | 0             | 3           |
| Mobile-native                     | 0            | 0             | 1           |
| **Total**                         | **74**       | **10**        | **16**      |

---

_Generated by `/docs` Batch 1 — 2026-05-19_
