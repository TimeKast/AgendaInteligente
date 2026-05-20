# 05 — Business Rules

> **Source:** [00_DISCOVERY_BRIEF.md §6](./00_DISCOVERY_BRIEF.md) + cross-ref con [02_FEATURE_MAP.md](./02_FEATURE_MAP.md) + [04_USER_STORIES.md](./04_USER_STORIES.md)
> **Namespace:** `BR-NNN` (invariants/data) + `AI-NNN` (agent behavior) + `OPS-NNN` (operational)
> **Status:** Reglas formales del dominio. Toda regla aquí es **enforceable** en código (tests, middleware, DB constraints) o en system prompts (AI).

---

## Convención

Cada regla tiene:

- **ID** único
- **Statement** (1 línea, lo que la regla dice)
- **Enforcement** (cómo se garantiza: DB constraint / app code / middleware / test / system prompt / cron)
- **Failure mode** (qué pasa si se viola y cómo se detecta)
- **Linked** (FT/US donde aplica)

---

## BR — Data invariants

### BR-1 — Multi-tenant data isolation absoluta

**Statement:** Ningún user accede a data de otro user. Toda query a tablas tenant-owned filtra por `user_id = session.user_id`. Admin que necesite ver data de otros users debe usar un audit-log explícito visible al user afectado.

**Enforcement:**

- Drizzle helper `scopedDb(userId)` envuelve todas las queries (enforcement por convención + ESLint custom rule que prohíbe `db.select()` directo fuera de `scopedDb`)
- Tests unitarios paramétricos: para cada tabla tenant-owned, test que user B no puede leer/escribir data de user A
- E2E: 2 users en paralelo, intentar XHR a /api/\* con cookies cruzadas → 404 (no 403, no leak existencia)

**Failure mode:** data leak entre users. Detección: integration test obligatorio en CI; reportes Sentry de cross-user access (filter middleware).

**Linked:** FT-003, US-004

---

### BR-2 — Activity debe pertenecer a un Project (incluyendo Inbox)

**Statement:** Toda Activity tiene `project_id` no nulo. El Project "Inbox" se auto-crea para cada user al signup y es no-deletable.

**Enforcement:**

- DB: `activity.project_id NOT NULL` + FK constraint con `ON DELETE RESTRICT`
- Migration seed: trigger en INSERT en `users` que crea Project "Inbox" en Category "Inbox"
- Borrar Inbox: app code rechaza, DB constraint adicional `category.is_inbox = true` no se puede update/delete

**Failure mode:** activities huérfanas. Detección: query de validación `SELECT COUNT(*) FROM activity WHERE project_id IS NULL` debe ser 0 siempre (assertion en migrations).

**Linked:** FT-012, US-015

---

### BR-3 — Project debe pertenecer a una Category

**Statement:** Todo Project tiene `category_id` no nulo. La Category "Inbox" es no-deletable (asocia al Inbox Project).

**Enforcement:**

- DB: `project.category_id NOT NULL` + FK con `ON DELETE RESTRICT`
- App code: borrar category con N>0 projects requiere flow de migration manual o cascade soft-delete con confirmación (US-012)

**Failure mode:** projects huérfanos. Detección: assertion en migration.

**Linked:** FT-011

---

### BR-4 — Categoría no deletable con proyectos sin confirmación

**Statement:** Borrar Category con N>0 Projects requiere confirmación explícita del user, después de la cual se soft-delete cascade (Category + Projects + Activities).

**Enforcement:**

- App code: endpoint `DELETE /api/categories/[id]` chequea projects count; si >0, retorna `409 Conflict` con info; UI dispara modal de confirmación
- Soft delete: setear `deleted_at` en Category + cascade a Projects (loop) + Activities
- Hard purge: cron diario borra rows con `deleted_at < now - 30 days`

**Failure mode:** user pierde data sin querer. Detección: telemetría de "category deleted" + Sentry breadcrumb.

**Linked:** FT-010, US-012

---

### BR-5 — Subtask máximo 1 nivel

**Statement:** Una Subtask pertenece a una Activity. Subtasks NO pueden tener sub-subtasks.

**Enforcement:**

- DB: tabla `subtask` no tiene `parent_subtask_id`. Solo `activity_id`. Esquema lo previene structural.
- UI: no hay botón "agregar sub-subtask" en Subtask UI
- Tests unitarios

**Failure mode:** anidamiento profundo arruina UX mobile. Detección: no aplica (estructuralmente imposible).

**Linked:** FT-013, US-017

---

### BR-6 — Goal vive fuera de jerarquía Cat→Proj→Act

**Statement:** Goal NO tiene category_id ni project_id directos. Goal se vincula a Project(s) y Activity(s) vía tabla many-to-many `GoalLink` polymorphic (target_type, target_id).

**Enforcement:**

- DB: `goal` no tiene FK a category/project. Tabla `goal_link` con (`goal_id`, `target_type` enum, `target_id`)
- Drizzle relations: `goal` define M2M relations via `goal_link`
- App code: API endpoints separados `/api/goals/*` y `/api/goals/[id]/links`

**Failure mode:** confusión conceptual user/dev tratando Goal como Project. Detección: code review + docs.

**Linked:** FT-040, FT-041, US-040, US-041

---

### BR-7 — Sheets únicos por (user_id, period)

**Statement:**

- DaySheet único por `(user_id, date)`
- WeekSheet único por `(user_id, week_starting)` donde `week_starting` siempre = domingo en TZ del user
- QuarterSheet (v1.5) único por `(user_id, quarter_starting)` donde quarter_starting = primer día del trimestre calendario en TZ del user
- YearSheet (v1.5) único por `(user_id, year)`

**Enforcement:**

- DB: UNIQUE constraint `(user_id, date)` en `day_sheet`, `(user_id, week_starting)` en `week_sheet`, etc.
- App code: helper `getOrCreateDaySheet(userId, date)` retorna existente o crea nueva atomically (UPSERT con ON CONFLICT DO NOTHING + RETURNING)
- Cron crea WeekSheet anticipadamente el viernes para Sunday kickoff

**Failure mode:** duplicate sheets corrompen analytics. Detección: DB constraint previene.

**Linked:** FT-030, FT-034, US-030, US-033

---

### BR-8 — Activity transitions limitadas

**Statement:** Transiciones permitidas:

- `pending → in_progress` ✅
- `pending → done` ✅
- `pending → skipped` (con reason_category obligatorio si agente pregunta) ✅
- `pending → blocked` (con reason texto obligatorio) ✅
- `in_progress → done` ✅
- `in_progress → blocked` ✅
- `in_progress → pending` ✅ (deshacer)
- `done → pending` ✅ (deshacer)
- `skipped → pending` ✅ (reactivar)
- `blocked → in_progress` ✅
- `blocked → pending` ✅
- `done → skipped/blocked` ❌ (sin sentido)

**Enforcement:**

- App code: helper `transitionActivity(id, toStatus)` valida `fromStatus` actual
- UI: solo muestra opciones válidas según estado actual

**Failure mode:** estado inconsistente. Detección: tests unitarios per transition.

**Linked:** FT-027, US-026

---

### BR-9 — Goal status derivado de review_score

**Statement:** Cuando se hace review de un Goal (`reviewed_at` set):

- `review_score ∈ [8,10]` → status = `achieved`
- `review_score ∈ [4,7]` → status = `partial`
- `review_score ∈ [1,3]` → status = `abandoned`
- User puede override la sugerencia explícitamente

**Enforcement:**

- App code: trigger en update de goal cuando review_score se set
- DB constraint: `review_score IS NULL OR review_score BETWEEN 1 AND 10`

**Failure mode:** status no refleja calificación. Detección: query de validación cruzada.

**Linked:** FT-042, US-042

---

### BR-10 — Subscription status grace period

**Statement:** Subscription `past_due` mantiene acceso a features paid por 3 días grace. Después, downgrade automático a plan `free` manteniendo toda la data del user.

**Enforcement:**

- Cron diario: `subscriptions WHERE status='past_due' AND updated_at < now - 3 days` → set plan_id = free, status = active
- Email warning al user día 1 y día 2 antes del downgrade
- User puede reactivar pagando, recupera plan original

**Failure mode:** user pierde acceso sin warning. Detección: telemetría de downgrades + opt-out de los emails.

**Linked:** FT-110, FT-111 (v2 cuando Stripe active)

---

### BR-11 — Recurrencia materializada con N instancias adelante

**Statement:** Una Activity con `recurrence_rule` no nulo NO crea infinitas rows en DB. Cron materializa próximas N=14 instancias (2 semanas adelante) y va creando más conforme se aproximan.

**Enforcement:**

- Cron diario: para cada activity con recurrence_rule, expand RRULE próximos 14 días, INSERT instancias faltantes
- Cada instancia es una Activity row separada con `recurrence_parent_id = original.id`
- Borrar instancia singular no afecta padre ni otras instancias
- Borrar padre con cascade pregunta: "borrar también próximas N instancias?"

**Failure mode:** activities futuras infinitas crashean queries. Detección: query lentitud + alertas.

**Linked:** FT-026, US-025

---

### BR-12 — Sensitive tokens encrypted at-rest

**Statement:** Google OAuth `access_token` y `refresh_token` se almacenan encriptados con `pgcrypto` symmetric encryption usando key de env var `ENCRYPTION_KEY`. Decryption solo en server-side a la hora de usar.

**Enforcement:**

- Columnas BYTEA con `pgp_sym_encrypt(token, ENCRYPTION_KEY)` en INSERT/UPDATE
- Helper `getGoogleTokens(userId)` hace SELECT con `pgp_sym_decrypt`
- ENCRYPTION_KEY rotation procedure documentado en runbook

**Failure mode:** leak de DB expone tokens. Detección: code review + sec audit.

**Linked:** FT-090, §4 Sensitive data

---

### BR-13 — Audio temporal NO se guarda en producción

**Statement:** Audio capturado por mic NUNCA se almacena en DB ni storage de producción. Solo se almacena la transcripción texto.

**Enforcement:**

- `/api/voice/transcribe`: recibe blob, llama Whisper, retorna texto, descarta blob (memoria solo)
- No usar storage de objetos (S3/R2) para audio
- Dev/staging: opcional log de audio para debug, con TTL 24h

**Failure mode:** retention costs + privacy concern. Detección: storage usage monitoring.

**Linked:** FT-072, §4 Sensitive data

---

### BR-14 — Soft delete con purge 30 días

**Statement:** Borrar cuenta de user es soft delete inmediato (`User.deleted_at = now`). User puede cancelar en 30 días recuperando todo. Después de 30 días, cron hace hard delete de User y cascade a todas sus rows (Categories, Projects, Activities, Sheets, Conversations, Subscriptions).

**Enforcement:**

- Cron diario: `DELETE FROM users WHERE deleted_at < now - INTERVAL '30 days'`
- ON DELETE CASCADE en todas las FK a `users`
- Antes de hard delete, opcional export JSON a S3 con TTL 90 días (compliance bonus)

**Failure mode:** user pierde data sin posibilidad de recuperar. Detección: telemetría + email confirmación 7 días antes del purge.

**Linked:** FT-123, US-123

---

## AI — Agent behavior rules

### AI-1 — Idioma del user (es/en) con `tú` LatAm

**Statement:** Agente habla en `User.preferred_language`. En español usa `tú` (NUNCA `vos/tenés/querés`), registro neutro LatAm. Cita palabras pasadas del user en el idioma original que el user las escribió.

**Enforcement:**

- System prompt incluye "Spanish uses `tú` informal, Latin-American neutral register"
- Eval set: 50 prompts en español, 0 falsos positivos de voseo
- Code review de microcopy ES

**Failure mode:** voz inconsistente con CORE.md del kit. Detección: linter custom de strings argentinas en source (regex `\b(vos|tenés|querés|listá|incluí|che|dale)\b`).

**Linked:** FT-054, CORE.md §2

---

### AI-2 — Una pregunta por turno

**Statement:** Cada respuesta del agente contiene máximo 1 pregunta abierta al user. Nunca listas, nunca múltiples preguntas seguidas.

**Enforcement:**

- System prompt explícito
- Eval set: testset con golden expected outputs

**Failure mode:** user overwhelmed, abandona. Detección: feedback explícito ("muchas preguntas a la vez") en eval.

**Linked:** FT-051

---

### AI-3 — 1-3 oraciones por respuesta

**Statement:** Respuestas del agente son cortas: 1-3 oraciones, casi siempre. Excepción: review semanal puede ser más largo (resumen).

**Enforcement:** system prompt; eval con max length

**Linked:** FT-051

---

### AI-4 — Cita con fecha cuando aplica (v1.5+)

**Statement:** Cuando el agente referencia palabras pasadas del user, las cita con atribución de fecha: "Hace 3 semanas escribiste: '\_\_\_\_'". Nunca inventa quotes — si no tiene la cita real en DB, no la fabrica.

**Enforcement:**

- Tool use: agente tiene `retrieve_past_quote(query)` que busca en `messages` + `sheet_*` fields
- System prompt: "Si no tenés la cita real, NO la inventes. Pregunta en lugar de citar."

**Failure mode:** confabulation alucina quotes del user → quiebre de confianza total. Detección: eval set con preguntas de quote-back; falsos positivos = bug crítico.

**Linked:** FT-213 (v1.5)

---

### AI-5 — Identidad sobre logro

**Statement:** Cuando aplica, el agente pregunta "¿quién fuiste hoy?" antes de "¿qué hiciste?". Framing de identity en lugar de achievement.

**Enforcement:** system prompt + eval set

**Linked:** FT-051

---

### AI-6 — Nunca moraliza

**Statement:** Agente nunca dice "deberías", "tendrías que", "es importante que". Pregunta en lugar.

**Enforcement:**

- System prompt explícito + lista de palabras prohibidas
- Eval set con prompts que tienten a moralizar

**Failure mode:** voz coachy → rejection emocional del user. Detección: linter de output del LLM con regex.

**Linked:** FT-051

---

### AI-7 — Out-of-scope redirect

**Statement:** Si user pregunta sobre terapia, medicina, legal, financial advice, o chat general no relacionado al producto → agente sale de personaje y redirige sin opinar.

**Enforcement:**

- System prompt con lista explícita de scopes
- Eval set
- Telemetría de redirects para insight

**Linked:** FT-055, US-053

---

### AI-8 — Crisis exit protocol

**Statement:** Si user describe peligro inminente a sí mismo u otros (auto/hetero-lesión, abuso, ideación suicida): agente sale total del personaje con: "No soy la herramienta para esto ahora. Por favor contactá [línea de crisis local]." Provee número específico si conoce el país del user.

**Enforcement:**

- System prompt con keywords trigger (suicidio, hacerme daño, no quiero seguir, etc) y respuesta fija
- Telemetría: log crisis exits (anonimizado) para entender frecuencia
- Reviewed por professional una vez antes de v1 ship

**Failure mode:** producto causa daño real. **Crítico.**

**Linked:** FT-056, US-053

---

### AI-9 — Tool use estructurado, no free-text para data writes

**Statement:** Cuando agente actualiza data (sheet field, activity status, goal review), usa Anthropic tool calling con schema definido. No parsear free-text del LLM como instrucción de DB.

**Enforcement:**

- Tools definidos: `save_sheet_field`, `update_activity_status`, `create_activity`, `create_goal_link`, etc
- Server valida tool input contra Zod schema antes de ejecutar
- Si LLM intenta escribir sin tool → server NO ejecuta, asume conversacional

**Failure mode:** prompt injection → DB corruption. Detección: tests con prompts adversariales.

**Linked:** FT-073 (voice parse usa tools)

---

## OPS — Operational rules

### OPS-1 — Anti-spam: max 4 agent-initiated/24h

**Statement:** Máximo 4 ProactiveTask sent al user en cualquier ventana 24h, sumando todos los canales (push, email, futuro WhatsApp/SMS).

**Enforcement:**

- Job scheduler antes de enviar: `SELECT COUNT(*) FROM proactive_task WHERE user_id=? AND sent_at > now - INTERVAL '24h'` → si ≥4, skip
- ProactiveTask status = `cancelled_anti_spam` para análisis

**Linked:** FT-086, US-086

---

### OPS-2 — Max 1 challenge fuerte por semana

**Statement:** ProactiveTask type=`pattern_challenge` (repeat detection, identity, drift) máximo 1 por user por semana calendario (lunes-domingo).

**Enforcement:**

- Job scheduler: query último pattern_challenge sent_at; si < 7 días, skip
- Pattern detection runs nightly y queue múltiples potential challenges; picker elige el de mayor signal

**Linked:** FT-086, F-9 (Brief)

---

### OPS-3 — Silence re-entry después de 3+ días

**Statement:** Si user no abre app ni responde a checkins por 3+ días: 1 push gentle re-entry ("acá cuando quieras"); después silencio total hasta que user vuelva a abrir.

**Enforcement:**

- Cron diario: detecta users con `last_active_at < now - 3 days` y `silence_re_entry_sent_at IS NULL`; envía push; marca timestamp
- Cuando user vuelve (cualquier action), reset `silence_re_entry_sent_at = NULL`

**Linked:** FT-087, F-9

---

### OPS-4 — Listening mode auto-revert a Standard

**Statement:** Cuando user activa intensity=`listening`, set `intensity_expires_at = now + 48h`. Cron cada hora chequea, revierte a `standard` con push: "Volviste a Standard. ¿Todo bien?"

**Enforcement:**

- Cron horario: `UPDATE users SET intensity_mode='standard', intensity_expires_at=NULL WHERE intensity_mode='listening' AND intensity_expires_at < now`
- Push notification post-revert

**Linked:** FT-053, US-052

---

### OPS-5 — Recurrencia materializada cron diario

**Statement:** Cron diario expande RRULEs en próximas N=14 instancias. (Ver BR-11.)

**Linked:** BR-11

---

### OPS-6 — Google Calendar sync cada 15 min

**Statement:** Para users con Google Calendar conectado, sync busy slots cada 15 min via Inngest. Almacena en cache local (no re-fetch en cada query).

**Enforcement:**

- Inngest scheduled function per-user
- TTL 15 min en cache de busy slots
- Si refresh_token expira, mark connection as invalid + push al user

**Linked:** FT-091, US-090

---

### OPS-7 — Weekly review materialization 2 weeks ahead

**Statement:** Cron viernes genera próxima WeekSheet del user (empty kickoff section) para que el Sunday kickoff tenga la row creada.

**Linked:** BR-7, FT-083

---

### OPS-8 — Embeddings nightly (v1.5)

**Statement:** Cron nightly genera embeddings para sheets nuevos del día. Modelo: OpenAI text-embedding-3-small o Anthropic embeddings.

**Linked:** FT-210, FT-211 (v1.5)

---

### OPS-9 — Rate limit auth endpoints

**Statement:** Endpoints sensibles (signup, login, password reset, magic link) rate-limited via Upstash Redis: max 5 attempts/15min por IP, max 20 attempts/15min por email.

**Enforcement:**

- Middleware Next.js + Upstash ratelimit (TimeKast default)
- Si exceeded → 429 + Retry-After header

**Linked:** FT-001, FT-002 + SK.md security

---

### OPS-10 — Backup diario de DB

**Statement:** Neon hace backups automáticos. Adicional: dump a S3 (R2) semanal con retention 90 días.

**Enforcement:** Inngest job; verified weekly por cron de validación que abre el dump y queryea fila

**Linked:** §8 Infra

---

## Quality

### BR-PROJECT-001 — Quality >> Deadline (TimeKast DOGMA, hardcoded)

**Statement:** Si hay trade-off entre calidad y fecha de entrega, calidad manda. Ship tarde con calidad, nunca a tiempo con deuda técnica acumulada. No negociable.

**Enforcement:**

- DOR/DOD: ningún issue se cierra con tests pendientes, typecheck rojo, lint failure, o regression de E2E
- PR template requiere checklist de verify gates

---

## Summary

| Categoría            | Total reglas            |
| -------------------- | ----------------------- |
| BR (data invariants) | 14                      |
| AI (agent behavior)  | 9                       |
| OPS (operational)    | 10                      |
| **Total**            | **33** + BR-PROJECT-001 |

---

_Generated by `/docs` Batch 3 — 2026-05-19_
