# 04 — User Stories

> **Source:** [02_FEATURE_MAP.md](./02_FEATURE_MAP.md) + [03_USER_PERSONAS.md](./03_USER_PERSONAS.md)
> **Namespace:** `US-NNN`
> **Format:** "Como [persona], quiero [acción] para [outcome]" + AC bullets
> **Coverage:** Stories per MVP feature; v1.5/v2 stories solo placeholders

---

## Estructura

Stories agrupadas por **capa** (matching Feature Map). Cada story:

- Tiene 1+ feature ID asociado
- AC verificables, no genéricos
- Default persona: P-1 (salvo nota)

---

## Capa 1 — Auth & Multi-tenant

### US-001 — Signup con Google OAuth

**Como** P-1, **quiero** registrarme con mi cuenta de Google **para** evitar crear y recordar otro password.

- Linked: FT-001, FT-004
- AC:
  - Al click "Continuar con Google", se abre OAuth consent screen de Google
  - Tras consent exitoso, se crea User row con email, name, image de Google
  - User es redirigido a onboarding step 2 (idioma)
  - Si email ya existe con password, se vincula la cuenta Google al mismo User
  - Si OAuth falla, se muestra error claro y opción reintentar

### US-002 — Signup con email + password

**Como** P-1, **quiero** registrarme con email y password **para** no depender de Google si no quiero.

- Linked: FT-002, FT-004
- AC:
  - Form valida: email format, password min 8 chars, password no en lista de 1000 más comunes
  - Password se hashea con bcrypt (rounds 12) vía NextAuth
  - Email no verificado → user puede usar pero ve banner "verificá tu email"; Resend envía link de verificación
  - Duplicate email → error "ya existe una cuenta con este email, intentá iniciar sesión"

### US-003 — Login con cualquiera de los dos providers

**Como** P-1, **quiero** poder loguearme con Google o email/password indistintamente **para** flexibilidad.

- Linked: FT-001, FT-002
- AC:
  - Pantalla login muestra ambas opciones (Google primero)
  - Si user existe con OAuth y intenta password → error "esta cuenta usa Google, iniciá con Google"
  - Si user existe con password y olvida → flow de recovery por email

### US-004 — Multi-tenant data isolation absoluta

**Como** P-1, **quiero** que ningún otro user vea mi data **para** confianza en el producto.

- Linked: FT-003, BR-1
- AC:
  - Toda query a tablas tenant-owned filtra por `user_id = session.user_id`
  - Drizzle query helper (`scopedDb(userId)`) enforced en code review
  - Tests unitarios que intentan acceder a data de otro user → fail (404, no 403)
  - Audit log de cualquier admin impersonation visible al user

### US-005 — Onboarding 8-step

**Como** P-1, **quiero** un onboarding corto y honesto **para** entender qué hace la app y empezar rápido.

- Linked: FT-004
- AC:
  - Steps en orden: idioma → TZ (auto-detect, override) → push perm → mic perm → 3 preguntas inciales → Google Calendar opt-in → confirmar horarios check-in default → cierre
  - Total ≤8 minutos (medible con telemetría)
  - Cada step tiene "saltar" excepto idioma y los 3 prompts iniciales
  - Al terminar, se crea User + NotificationPref + Category "Inbox" + Project "Inbox"

---

## Capa 2 — Organización jerárquica

### US-010 — Crear categoría

**Como** P-1, **quiero** crear categorías con nombre, color e ícono **para** agrupar mis frentes de vida (personal, empresa, etc).

- Linked: FT-010
- AC:
  - UI: input name (required), color picker (paleta predefinida 10 colores), icon picker (Lucide icons subset)
  - Validación: name único por user, max 50 chars
  - Categoría se crea con `position = max(position) + 1`
  - Al primer login, "Inbox" ya existe auto-creada

### US-011 — Reordenar categorías

**Como** P-1, **quiero** drag-and-drop categorías **para** poner mis prioridades arriba.

- Linked: FT-010
- AC: drag actualiza `position`, persist via PATCH /api/categories/reorder con array de IDs

### US-012 — Borrar categoría con confirmación

**Como** P-1, **quiero** que borrar una categoría con proyectos me pida confirmación **para** no perder data sin querer.

- Linked: FT-010, BR-4
- AC:
  - Si categoría tiene 0 proyectos → borra directo
  - Si tiene N proyectos → modal "borrar también N proyectos y M actividades? [confirmar/cancelar]"
  - Confirmación → soft delete cascade (`deleted_at` en todas)
  - Hard delete después de 30 días vía cron

### US-013 — Crear proyecto bajo categoría

**Como** P-1, **quiero** crear proyectos dentro de una categoría **para** subdividir mi trabajo.

- Linked: FT-011
- AC:
  - Form: name, description (opt), category (select), deadline (opt), outcome_expected (opt), status default=active
  - Activity count = 0 al crear
  - Card view en categoría list muestra: name, status badge, deadline, count de activities pendientes

### US-014 — Cambiar status de proyecto

**Como** P-1, **quiero** marcar proyectos como paused/completed/killed **para** que no me molesten en la vista activa.

- Linked: FT-011
- AC:
  - Transiciones permitidas: active ↔ paused, active → completed, active/paused → killed
  - Killed requiere confirmación + opcional reason
  - Vista "Today" muestra solo activities de proyectos active
  - Vista "Goals" puede mostrar projects de cualquier status

### US-015 — Crear actividad por UI

**Como** P-1, **quiero** crear una actividad rápido por UI **para** las veces que no uso voz.

- Linked: FT-012
- AC:
  - Form minimalista: title (req), project (default Inbox), scheduled_date (default today), priority (default 3)
  - Campos opt visibles bajo "+ más detalles": description, scheduled_time, deadline, estimated_minutes, recurrence, tags
  - Submit con Enter, no necesita click
  - Después de crear, queda focus en input title vacío para crear otra

### US-016 — Editar actividad

**Como** P-1, **quiero** editar cualquier campo de una actividad **para** ajustar cuando cambian las cosas.

- Linked: FT-012
- AC:
  - Inline edit en lista (tap title → edit) y full edit en detail view
  - Cambio de project mueve la activity, no la duplica
  - Cambio de scheduled_date la mueve a otro día
  - Histórico de cambios opcional (no MVP)

### US-017 — Crear subtask

**Como** P-1, **quiero** dividir una actividad en subtasks **para** trackear progreso de tareas con varios pasos.

- Linked: FT-013, BR-5
- AC:
  - Solo dentro de una Activity (no en lista global)
  - Max 1 nivel — UI no permite "agregar subtask a subtask"
  - Marcar todas las subtasks completadas → sugiere marcar Activity como done

### US-018 — Tags libres

**Como** P-1, **quiero** poner tags a actividades (ej: `#urgente`, `#review`) **para** filtrar después.

- Linked: FT-014
- AC: text input con autocomplete de tags previos del user; tags se guardan lowercase normalized

---

## Capa 3 — Modelo temporal y planeación

### US-020 — Asignar actividad a un día

**Como** P-1, **quiero** poner una actividad en un día específico **para** ver mi plan.

- Linked: FT-020
- AC:
  - Date picker mobile-native
  - "Hoy", "Mañana", "Esta semana" como quick-picks
  - "Esta semana" deja `scheduled_date = null` y `week_starting` set → vive en pool

### US-021 — Anclar hora a una actividad

**Como** P-1, **quiero** poner hora específica a reuniones/llamadas **para** no perderlas.

- Linked: FT-021
- AC:
  - Time picker opcional al crear/editar
  - Si scheduled_time no nulo → "anchored task", aparece en sección con hora
  - Si nulo → "pool task" del día sin hora específica

### US-022 — Time blocks aspiracionales

**Como** P-1, **quiero** asignar morning/afternoon/evening a una actividad **para** organizarla sin hora exacta.

- Linked: FT-022, X7
- AC:
  - Multi-select: una activity puede tener varios blocks (ej: morning + evening si es estudio en 2 sesiones)
  - Vista Today agrupa pool tasks por block
  - Sin block → "anytime" group default

### US-023 — Deadline separado de scheduled

**Como** P-1, **quiero** ver claramente cuándo es la fecha tope vs cuándo planeo hacerla **para** no confundir urgencia con planning.

- Linked: FT-023
- AC:
  - UI distingue: scheduled_date = "harás" / deadline = "es tarde"
  - Si scheduled > deadline → warning badge "agendada después del deadline"
  - Si deadline pasa sin done → badge "vencida"

### US-024 — Priority 1-5

**Como** P-1, **quiero** marcar prioridad de actividades **para** que las críticas no se pierdan.

- Linked: FT-025
- AC:
  - UI: 5 dots o slider; 5=alta
  - Default = 3 si no se especifica
  - Lista de hoy ordena por priority desc dentro de cada time_block

### US-025 — Recurrencia (RRULE)

**Como** P-1, **quiero** crear actividades recurrentes (ej: gym lunes/miércoles/viernes) **para** no recrearlas manualmente.

- Linked: FT-026
- AC:
  - UI presets: "diaria", "semanal", "L-V", "X días semana custom"
  - Backend almacena RRULE string
  - Cron diario materializa próximas N instancias para evitar query expensivo
  - Skip una instancia no afecta las siguientes

### US-026 — Cambiar estado de actividad

**Como** P-1, **quiero** marcar actividades como done/skipped/blocked **para** trackear ejecución.

- Linked: FT-027
- AC:
  - Tap rápido en checkbox: pending → done
  - Long press o swipe: opciones {in_progress, skipped, blocked}
  - skipped/blocked → modal pide reason (FT-028)
  - done registra `completed_at`

### US-027 — Razón de no cumplimiento

**Como** P-1, **quiero** que cuando marco una tarea como no cumplida me pidan por qué **para** aprender de mis patrones.

- Linked: FT-028, F-13
- AC:
  - Modal con: select reason_category {time, priority, blocked, didnt_want, other} + textarea reason_not_done opt
  - Si user cierra sin elegir → status cambia pero reason queda null (no force)
  - Si intensity_mode = sharp/standard → agente puede repreguntar si reason es vago ("no tuve tiempo" → "¿qué hiciste en lugar de eso?")

---

## Capa 4 — Sheets (Day + Week)

### US-030 — DaySheet morning ritual

**Como** P-1, **quiero** un ritual matutino guiado de 5-8 minutos **para** abrir el día con intención.

- Linked: FT-030, FT-051
- AC:
  - Trigger: push notification al `morning_time` o tap manual desde Today
  - Agente abre chat con prompt: "Buenos días. ¿Cuál es la intención de hoy — una sola frase?"
  - 6 preguntas en orden: intention → gratitude → identity_statement → 3 wins (pull from week's 3) → avoidance → energy (3 sliders 1-5)
  - Cada respuesta puede triggerear challenge (según intensity_mode)
  - Al terminar: "Guardado. Te busco al mediodía." y DaySheet morning fields completos
  - Si user abandona midway → resume al volver el mismo día, sin perder respuestas previas

### US-031 — DaySheet evening ritual

**Como** P-1, **quiero** un cierre nocturno corto **para** consolidar el día.

- Linked: FT-031, FT-051
- AC:
  - Trigger: push al `evening_time`
  - 3 preguntas core: evening_win → evening_lesson → tomorrow_top
  - 1 opcional: insight worth keeping
  - Duración objetivo: 3-5 min
  - DaySheet completo (morning + evening), badge "completado" en lista
  - Si user no completa morning, evening pregunta primero "¿qué fue tu intención hoy?" para tener contexto

### US-032 — Editar DaySheet manualmente

**Como** P-1, **quiero** editar cualquier campo del sheet de hoy o anteriores **para** corregir o agregar.

- Linked: FT-033
- AC:
  - Click cualquier campo → inline edit
  - Sheets de días pasados editables sin restricción (no es libro auditado)
  - Cambios manuales NO disparan challenges del agente

### US-033 — WeekSheet kickoff (domingo)

**Como** P-1, **quiero** planear la semana domingo **para** llegar a lunes con claridad.

- Linked: FT-034, FT-083
- AC:
  - Trigger: push Sunday `weekly_kickoff_dow` (configurable, default domingo)
  - Agente abre con: "Domingo. Si sólo una cosa pasa esta semana, ¿cuál?"
  - Captura sequentially: one_thing → three_wins → calendar_blocks (sugiere bloques con base en Google Calendar busy slots) → people_to_connect → learn_one → avoid_one → self_care (rest/move/eat/sleep)
  - Al terminar, WeekSheet kickoff completo. Pop up: "¿Querés que distribuya las 3 wins en los 7 días ahora?"

### US-034 — WeekSheet Saturday review

**Como** P-1, **quiero** un review semanal forzado **para** aprender de la semana.

- Linked: FT-035, FT-084, FT-103
- AC:
  - Trigger: push sábado al `evening_time` adjusted
  - Agente revisa día por día (DaySheets de la semana), pregunta por wins logradas/no logradas
  - Captura: review_wins (free-text array), review_lessons, review_energy (1-10 slider), review_one_sentence
  - LLM genera post-mortem read-only: % cumplimiento, patrones detectados, sugerencias para próxima semana
  - User puede pedir "explicá X" en chat después

### US-035 — Vista WeekSheet grilla 7 días

**Como** P-1, **quiero** ver mis 7 días con plan vs ejecutado **para** ver pattern.

- Linked: FT-036
- AC:
  - Mobile: scroll horizontal carousel, 1 día por slide
  - Desktop: grilla 7 columnas
  - Cada día muestra: activities planeadas (con check si done), morning/evening sheet completion badges
  - Tap día → abre DaySheet detail

---

## Capa 5 — Goals

### US-040 — Crear goal

**Como** P-1, **quiero** definir goals con scope (quarter/year/5year/life) **para** trackear progreso largo plazo.

- Linked: FT-040
- AC:
  - Form: title (req), description, scope (select req), deadline (req for quarter/year), outcome_expected (text)
  - status default = active
  - v1: scope `quarter` y `year` están activos; v1.5: agregar 5year; v2: agregar life

### US-041 — Vincular activity/project a goal

**Como** P-1, **quiero** marcar que una actividad o proyecto contribuyen a un goal **para** ver progreso.

- Linked: FT-041
- AC:
  - En detail view de activity/project, sección "Goals vinculados" con multi-select
  - Al crear activity por voz, si user menciona goal explícitamente, IA sugiere link
  - Goal detail view muestra todos los activities/projects vinculados con estado

### US-042 — Goal review con calificación

**Como** P-1, **quiero** calificar 1-10 cuánto cumplí un goal cuando llega su deadline **para** ser honesto conmigo.

- Linked: FT-042
- AC:
  - Cuando deadline pasa, badge "review pendiente" en goal
  - Modal: slider 1-10 + textarea notas + select status final (achieved/partial/abandoned auto-suggested by score)
  - 8-10 = achieved, 4-7 = partial, 1-3 = abandoned
  - User puede override la sugerencia

### US-043 — Vista Goals con tabs por scope

**Como** P-1, **quiero** ver mis goals activos agrupados por scope **para** balance corto vs largo plazo.

- Linked: FT-043
- AC:
  - Tabs: Quarter | Year | 5-Year (v1.5) | Life (v2)
  - Cada goal muestra: title, deadline, % progress (basado en activities/projects vinculados done)
  - "Reviewable" badge si deadline pasó sin review

---

## Capa 6 — AI Agent core

### US-050 — Chat con agente

**Como** P-1, **quiero** poder hablar con el agente libremente **para** pedirle contexto, ajustar planes, o desfogarme.

- Linked: FT-050, FT-051
- AC:
  - Threading por día en pantalla Chat
  - Histórico paginado (infinite scroll)
  - El agente mantiene personalidad (asistente profesional neutro) en todo
  - Si user pregunta cosas fuera de scope (terapia/médico/general chat) → redirect (FT-055)

### US-051 — Latencia <2s en respuestas texto

**Como** P-1, **quiero** que el agente responda rápido **para** que la conversación se sienta natural.

- Linked: FT-051
- AC:
  - p50 < 1.5s, p95 < 3s en stable connection
  - Streaming de tokens para que primer token salga rápido
  - Si latencia > 5s → mostrar indicador "pensando..."

### US-052 — Cambiar intensity mode

**Como** P-1, **quiero** ajustar qué tan agresivos son los challenges **para** adaptarlo a mi día/semana.

- Linked: FT-052
- AC:
  - Settings: 4 options con descripción de cada uno
  - Listening → modal warning "este modo se auto-revierte en 48h"
  - Cambio se aplica inmediatamente a próxima conversación
  - Default nuevo user: Gentle por 14 días (medible desde signup), después auto-switch a Standard con notification

### US-053 — Out-of-scope redirect

**Como** P-1, **quiero** que el agente no me dé terapia ni opine de cosas que no sabe **para** confianza.

- Linked: FT-055, AI-7
- AC:
  - Si user pregunta sobre terapia/medical/legal/financial → redirect estándar: "No soy la herramienta para esto. Consultá un profesional. ¿Volvemos a [sheet activa]?"
  - Si user describe crisis (auto/hetero-lesión, abuso) → exit total de personaje + línea de crisis local: "No soy la herramienta para esto ahora. Por favor contactá [Línea]"
  - Telemetría de redirects para entender qué pregunta la gente

---

## Capa 7 — Vague-answer challenges

### US-060 — Detect vague language

**Como** P-1, **quiero** que el agente me desafíe cuando respondo cosas vagas **para** ser concreto conmigo.

- Linked: FT-060, AI-2
- AC:
  - Trigger words (ES): "mejor", "más", "pronto", "bien", "fino", "intenté", "podría", "tal vez", "no tuve tiempo"
  - Trigger words (EN): "better", "more", "soon", "fine", "okay", "good", "try"
  - Cuando detecta, NO acepta la respuesta — repregunta: "¿Qué significa eso concretamente? Nombrá una cosa visible desde afuera."
  - User puede pushback "no, es justo lo que quise decir" → agente acepta, pero solo después que user nombre algo concreto
  - En intensity_mode = listening → NO dispara
  - Detection ≥80% de los casos (medible con eval set)

### US-061 — Cost reveal challenge

**Como** P-1, **quiero** que al crear un goal me pregunten qué tengo que dejar **para** entender el costo real.

- Linked: FT-061
- AC:
  - Trigger: nuevo goal sin "give up" / "dejar" / "sacrificio" mencionado en outcome_expected
  - Pregunta: "¿Qué tenés que dejar de hacer para lograr esto? Tiempo, dinero, comodidad, otra prioridad. Sé específico."
  - Respuesta se guarda en `Goal.notes_cost` (campo nuevo opt)

### US-062 — Reality test challenge

**Como** P-1, **quiero** que cuando me comprometo a algo nuevo, me pregunten probabilidad real **para** no engañarme.

- Linked: FT-062
- AC:
  - Trigger: user dice "voy a [verbo]", "me comprometo a", "esta semana hago" o similar
  - Pregunta: "Honestamente — ¿probabilidad real de hacerlo en los próximos 30 días? Si menos de 70%, lo bajamos."
  - Si user dice <70 → agente sugiere scope down: "¿Qué versión le pondrías 90%?"
  - Solo en modos sharp y standard; gentle = ocasional; listening = nunca

---

## Capa 8 — Captura por voz

### US-070 — Mic button persistente

**Como** P-1, **quiero** un botón mic siempre visible **para** capturar tareas en 2 segundos.

- Linked: FT-070
- AC:
  - Botón flotante bottom-right en Today, Week, Goals (no en Chat, ahí hay otro)
  - Tamaño tap-friendly (≥56px)
  - Animation cuando está grabando (waveform o pulse)

### US-071 — Streaming STT visible

**Como** P-1, **quiero** ver lo que estoy dictando en tiempo real **para** detectar errores antes de soltar.

- Linked: FT-071, FT-072
- AC:
  - Web Speech API streaming, texto visible mientras hablo
  - Si Web Speech no disponible (Firefox iOS, etc) → record blob → upload → Whisper API → texto al final
  - Indicador "🎙️ escuchando" mientras graba
  - Tap "Listo" o silencio >2s → para captura

### US-072 — LLM parse → preview de tarea

**Como** P-1, **quiero** que el dictado se parse automáticamente a campos estructurados **para** no tener que tipear.

- Linked: FT-073, FT-074
- AC:
  - Modal con preview: title (extraído), project (best guess de mis categorías), scheduled_date (parsed: "mañana" → 2026-05-20), scheduled_time (si dije), priority (si dije "alta/baja"), deadline (si dije)
  - Si project ambiguo → multi-select de top 3 mejores matches
  - Cada campo editable inline antes de confirmar
  - "Confirmar" guarda; "Editar más" abre form completo

### US-073 — Permission mic on-demand

**Como** P-1, **quiero** que me pidan permiso de mic solo cuando lo necesito **para** no abandonar el onboarding por miedo a permisos.

- Linked: FT-075
- AC:
  - Onboarding step 4 (mic perm) es opcional con "Salté"
  - Si user salteó y luego hace tap del mic → pide permiso en ese momento
  - Si denegado → fallback con CTA: "Crear con teclado en su lugar"

---

## Capa 9 — Check-ins automáticos

### US-080 — Recibir push morning

**Como** P-1, **quiero** que la app me busque a la mañana **para** abrir el día con intención sin recordar.

- Linked: FT-080, FT-088
- AC:
  - Push a `notification_pref.morning_time` (default 08:00 user TZ)
  - Texto: "Buenos días. ¿Cuál es la intención de hoy?" (no genérico "morning reminder")
  - Tap → abre Chat con prompt ya pedido
  - Si user no responde en 2h → 1 push reentry: "Sigo acá cuando quieras." Después silencio hasta evening

### US-081 — Midday solo si hay wins planeadas pendientes

**Como** P-1, **quiero** que el midday check me pregunte por mi win prioritaria del día **para** no avoidarla.

- Linked: FT-081
- AC:
  - Solo dispara si `DaySheet.wins_planned` no vacío y al menos 1 no en `status=done`
  - Push referencia la win specifically: "Dijiste que ibas a [win #1] hoy. ¿Cómo va?"
  - 3 ramas según respuesta: completada / en progreso / avoidando
  - Si avoidando: "¿De qué es la evitación? Nombrala."

### US-082 — Evening cierre

**Como** P-1, **quiero** un evening corto **para** cerrar el día en paz.

- Linked: FT-082, US-031
- AC: ver US-031

### US-083 — Weekly kickoff domingo

**Como** P-1, **quiero** que la semana arranque con un plan **para** que el lunes no me agarre desprevenido.

- Linked: FT-083, US-033
- AC: ver US-033

### US-084 — Weekly review sábado

**Como** P-1, **quiero** un review forzado de la semana **para** aprender.

- Linked: FT-084, US-034
- AC: ver US-034

### US-085 — Configurar horarios y días de check-in

**Como** P-1, **quiero** poder mover horarios y desactivar fines de semana **para** que la app respete mi vida.

- Linked: FT-085
- AC:
  - Settings → Notifications: time picker para cada slot (morning/midday/evening)
  - Toggle "Weekend enabled" (default off para morning/midday/evening, on para weekly)
  - DOW selector para weekly kickoff y review
  - Cambios se aplican al próximo ciclo (no reschedule el de hoy)

### US-086 — Anti-spam (max 4 push/24h)

**Como** P-1, **quiero** que la app NO me bombardee con notifications **para** no mutearla permanentemente.

- Linked: FT-086, F-9
- AC:
  - Backend enforce: contar `ProactiveTask.sent` en últimas 24h por user; si ≥4, skip nueva
  - Max 1 challenge fuerte por semana (pattern type)
  - Si 3+ días sin actividad: 1 re-entry gentle, después pausa indefinida hasta user vuelva

### US-087 — Mute temporal

**Como** P-1, **quiero** poder mutear notifications por X horas/días **para** vacaciones o crisis.

- Linked: FT-086
- AC:
  - Settings → "Mute por" → presets: 1h, 4h, hoy, 3 días, indefinido
  - Banner en Today: "Mutado hasta [fecha]" con CTA "Reactivar"
  - Listening mode no es lo mismo que mute — listening solo evita challenges, no notifications

---

## Capa 10 — Google Calendar

### US-090 — Conectar Google Calendar

**Como** P-1, **quiero** conectar mi Google Calendar **para** que la app sepa cuándo estoy ocupado y no me sobrecargue.

- Linked: FT-090, FT-091
- AC:
  - Settings → Integrations → "Conectar Google Calendar"
  - OAuth flow con scope `calendar.readonly`
  - Después de connect: lista de calendarios disponibles, user toggle cuáles incluir (default: primary)
  - Almacena access_token + refresh_token encriptados

### US-091 — Mostrar busy slots en weekly planning

**Como** P-1, **quiero** ver mis bloques ocupados al planear la semana **para** no doble-bookear.

- Linked: FT-092
- AC:
  - En WeekSheet kickoff, cuando agente sugiere `calendar_blocks`, los slots ocupados se muestran gris
  - Si user intenta agendar una activity en un slot ocupado → warning "tenés [evento Google] en ese horario"
  - Sync cada 15 min via Inngest

### US-092 — Disconnect Google Calendar

**Como** P-1, **quiero** poder desconectar **para** revocar permisos.

- Linked: FT-093
- AC: Settings botón; tokens se borran de DB; UI vuelve a "no conectado"

---

## Capa 11 — AI sugerencias

### US-100 — Riesgo de tarea por deadline

**Como** P-1, **quiero** que me avisen si una tarea con deadline cercano no tiene tiempo agendado **para** no fallarla.

- Linked: FT-101
- AC:
  - Cron diario: para cada activity con deadline en próximos 7 días sin scheduled_date asignado dentro de ventana viable → genera ProactiveTask type=risk_alert
  - Push: "[Activity] vence en [N] días y no tiene tiempo agendado. ¿La movemos?"
  - Tap → modal con opciones: agendar en slot libre / ajustar deadline / matar

### US-101 — Sugerir matar proyecto estancado

**Como** P-1, **quiero** que me sugieran honestamente cuando un proyecto está abandonado **para** no cargarlo mentalmente.

- Linked: FT-102
- AC:
  - Cron weekly: project active con 0 activities done en últimas 21 días → sugerencia
  - Push (1x por proyecto, no repetir): "[Project] no se ha movido en 3 semanas. ¿Lo pausamos o lo matamos?"
  - Tap → flow para cambiar status; si user dismiss, no preguntar de nuevo en 30 días

### US-102 — Post-mortem semanal auto

**Como** P-1, **quiero** un análisis automático al cierre de la semana **para** entender mis patrones sin esfuerzo.

- Linked: FT-103, US-034
- AC: ver US-034

### US-103 — Resumen diario 1 línea

**Como** P-1, **quiero** una frase al final del día **para** sentir cierre.

- Linked: FT-104
- AC:
  - Generated en evening check-in completion
  - Format: "[N]/[M] tareas hoy, [comparativo vs ayer/semana]"
  - Ej: "Hiciste 6/8 hoy, mejor que ayer (4/7)."

---

## Capa 12 — Billing infra (sin Stripe activo)

### US-110 — User asignado a plan Free al signup

**Como** P-1, **quiero** poder usar la app sin pagar al registrarme **para** evaluar antes de comprometer.

- Linked: FT-110, FT-113
- AC:
  - Trigger en signup: insert Subscription con plan_id=free, status=active
  - Plan Free tiene features completas en v1 (pricing/limits diferidos)

### US-111 — Tracking de uso desde día 1

**Como** producto, **queremos** trackear uso por user **para** informar pricing futuro.

- Linked: FT-112
- AC:
  - Cada LLM call incrementa `usage_meters.ai_calls_count`
  - Cada voice minute Whisper incrementa `voice_minutes_count`
  - Bucket mensual: row nueva al primer evento del mes
  - Admin dashboard (no MVP visible) muestra distribución

---

## Capa 13 — PWA + Settings

### US-120 — Install PWA prompt

**Como** P-1, **quiero** instalar la app en mi home screen **para** acceso rápido.

- Linked: FT-120
- AC:
  - Después de 3 sessions o 7 días → install prompt
  - iOS: instrucciones específicas Safari (no install API)
  - Android: native install prompt
  - Si dismiss, no repreguntar en 30 días

### US-121 — Offline mode básico

**Como** P-1, **quiero** poder ver mi día y crear tareas sin internet **para** captura en metro/avión.

- Linked: FT-121
- AC:
  - Service worker cache: shell + DaySheet de hoy + activities del día
  - Crear/editar activity offline → queue en IndexedDB → sync al volver online
  - No funciona offline: voice capture (Whisper API), chat con agente, Google Calendar sync

### US-122 — Settings page

**Como** P-1, **quiero** un solo lugar para ajustar todo **para** no buscar configs.

- Linked: FT-122
- AC:
  - Secciones: Account / Notifications / Language & TZ / Intensity / Integrations / Billing (placeholder) / Privacy
  - Cada cambio salva automático con toast "Guardado"

### US-123 — Borrar cuenta + export data

**Como** P-1, **quiero** poder borrar mi cuenta y descargar mi data **para** cumplir GDPR-like.

- Linked: FT-123
- AC:
  - Settings → Privacy → "Borrar cuenta"
  - Modal warning: "Tu data se borra en 30 días. Podés cancelar dentro de ese período."
  - Antes de borrar, ofrece "Descargar mi data" → ZIP con JSON de todas sus tablas
  - Soft delete inmediato (flag `deleted_at`), hard purge cron 30 días

### US-124 — Toggle dark mode

**Como** P-1, **quiero** modo oscuro **para** usar la app de noche sin matarme los ojos.

- Linked: FT-124, OQ-3
- AC:
  - Settings → Appearance → {light (default warm-book), dark, system}
  - Dark mode mantiene paleta warm: ink-primary background, cream text, scope accents desaturados
  - Toggle persiste, aplica inmediato

---

## V1.5 — Placeholders (definir al iniciar v1.5)

| US     | Linked FT      | Resumen                                                                  |
| ------ | -------------- | ------------------------------------------------------------------------ |
| US-200 | FT-200         | QuarterSheet completo con 3 wins, habits, self-talk audit, wheel of life |
| US-201 | FT-201         | YearSheet completo con 5 wins, audacious goal, financial targets         |
| US-210 | FT-210, FT-211 | Embeddings nightly + repeat detection                                    |
| US-213 | FT-213         | Quote-back del agente con cita de fecha                                  |

---

## V2 — Placeholders (definir al iniciar v2)

| US     | Linked FT      | Resumen                                |
| ------ | -------------- | -------------------------------------- |
| US-300 | FT-300         | 5-Year sheet                           |
| US-310 | FT-310         | WhatsApp bot integration               |
| US-312 | FT-312         | Voice mode bidireccional               |
| US-320 | FT-320, FT-321 | Stripe billing + feature gating activo |
| US-340 | FT-340         | Calendar write-back                    |

---

## Coverage check

| Capa            | # MVP US    | # MVP FT    | Coverage                                    |
| --------------- | ----------- | ----------- | ------------------------------------------- |
| Auth            | US-001..005 | FT-001..004 | 100%                                        |
| Organización    | US-010..018 | FT-010..014 | 100%                                        |
| Modelo temporal | US-020..027 | FT-020..028 | 100%                                        |
| Sheets          | US-030..035 | FT-030..036 | 100%                                        |
| Goals           | US-040..043 | FT-040..043 | 100%                                        |
| AI Agent core   | US-050..053 | FT-050..056 | ~85% (FT-053, FT-054, FT-056 covered by AC) |
| Challenges      | US-060..062 | FT-060..065 | ~80% (FT-063..065 v1.5)                     |
| Voice capture   | US-070..073 | FT-070..075 | 100%                                        |
| Check-ins       | US-080..087 | FT-080..089 | 100%                                        |
| Google Cal      | US-090..092 | FT-090..093 | 100%                                        |
| AI sugerencias  | US-100..103 | FT-100..104 | 100%                                        |
| Billing infra   | US-110..111 | FT-110..113 | 100%                                        |
| PWA + Settings  | US-120..124 | FT-120..124 | 100%                                        |

**Total MVP US:** ~60 stories cubriendo 74 features.

---

_Generated by `/docs` Batch 2 — 2026-05-19_
