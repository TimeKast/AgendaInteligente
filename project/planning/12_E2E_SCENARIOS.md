# 12 — E2E Scenarios

> **Source:** [04_USER_STORIES.md](./04_USER_STORIES.md) + [11_TEST_STRATEGY.md](./11_TEST_STRATEGY.md)
> **Namespace:** `E2E-NNN`
> **Tool:** Playwright + Neon ephemeral branch DB
> **Run:** `pnpm test:e2e`

---

## Convention

Cada escenario:

- ID único
- **Precondition** (setup)
- **Steps** (numerados, user-perspective)
- **Expected** (verifications)
- **Tear down** implícito (Neon branch cleanup)

---

## E2E-001 — Signup con Google + onboarding completo

**Precondition:** Neon branch clean; mock Google OAuth provider devuelve user fixture.

**Steps:**

1. Visit `/`
2. Click "Empezar"
3. Click "Continuar con Google"
4. (Mock) OAuth consent → callback
5. Land en `/onboarding/language`
6. Select "Español"
7. `/onboarding/timezone` → auto-detected "America/Mexico_City", click "Continuar"
8. `/onboarding/push` → click "Habilitar push" (mock granted)
9. `/onboarding/mic` → click "Saltar"
10. `/onboarding/context` → type "Tengo muchas cosas en la cabeza y me olvido"
11. `/onboarding/welcome-message-1` → "¿A qué hora abro tu día?" → keep default 08:00, continue
12. `/onboarding/welcome-message-2` → "¿A qué hora cerramos el día?" → 21:30, continue
13. `/onboarding/welcome-message-3` → "¿Conectamos Google Calendar?" → "Después"
14. `/onboarding/done` → "Mañana a las 8 abro tu primer día"
15. Click "Listo" → land on `/today`

**Expected:**

- DB: User row con email + onboarding_completed_at set
- DB: NotificationPref row con morning_time='08:00', evening_time='21:30'
- DB: Category 'Inbox' is_inbox=true, Project 'Inbox' is_inbox=true
- DB: Subscription row plan='free' active
- UI: `/today` muestra "Inbox" como única categoría y empty state amigable

---

## E2E-002 — Signup con email/password + verify

**Steps:**

1. `/signup` → email + password (válido) + confirm → submit
2. Verificar email recibido (mock Resend) con magic link
3. Click magic link → land logged in en `/onboarding/language`
4. Complete onboarding (similar a E2E-001 steps 6-15)

**Expected:**

- User con `email_verified_at` set
- Password hash con bcrypt en DB
- Login subsequent OK

---

## E2E-003 — Crear actividad por UI

**Precondition:** User existente logueado en `/today`. Categoría "Personal" creada con Project "Side project" dentro.

**Steps:**

1. En `/today`, tap "+" (add activity button)
2. Form: title = "Llamar a Juan"
3. Project dropdown → "Side project"
4. Date picker → "Mañana"
5. Submit (Enter)

**Expected:**

- Activity creada con: title, project_id, scheduled_date=tomorrow, priority=3 default
- UI: aparece en lista mañana (toggle vista)
- Toast "Guardado."

---

## E2E-004 — Captura por voz (Web Speech API stubbed)

**Precondition:** User en `/today`. Stub `window.SpeechRecognition` para devolver transcript fijo: "agendá llamar a Juan mañana a las diez de la mañana proyecto Personal alta prioridad".

**Steps:**

1. Tap mic button (FAB bottom-right)
2. Stub auto-fires `result` event con transcript
3. Modal preview aparece con campos extraídos
4. Verificar preview muestra:
   - title: "Llamar a Juan"
   - project: "Personal" (match)
   - scheduled_date: tomorrow
   - scheduled_time: "10:00"
   - priority: 5 (alta)
5. Click "Confirmar"

**Expected:**

- Activity creada con todos los campos parseados
- Modal closes
- `usage_meters.ai_calls_count` incremented +1
- Toast "Guardado."

---

## E2E-005 — Morning ritual completo

**Precondition:** User existente; mock current time = 08:00 user TZ; trigger Inngest event `morning.check_in.due` manually via Playwright helper.

**Steps:**

1. Verify push notification "captured" by stub (assert `pushNotifications.length === 1`)
2. Simulate tap → land in `/chat?context=morning_check`
3. Agent message visible: "Buenos días. ¿Cuál es la intención de hoy — una sola frase?"
4. Type "estar más enfocado" → submit
5. (Vague language challenge expected since "más" is trigger)
6. Agent: "¿Qué significa 'más enfocado' concretamente?"
7. Type "terminar el reporte trimestral antes de las 13" → submit
8. Agent acepta, próxima pregunta: "Bien. ¿Por qué estás agradecido hoy?"
9. Continue 5 more answers (gratitude → identity → 3 wins → avoidance → energy)
10. Agent cierra: "Guardado. Te busco al mediodía."

**Expected:**

- DaySheet row creada con: intention="terminar el reporte trimestral antes de las 13", gratitude, identity*statement, wins_planned (3 items), avoidance, energy*\*, morning_completed_at set
- ProactiveTask row con status='responded', responded_at set
- 7+ Messages persisted (1 per turn agent + user, with challenge fired flagged)

---

## E2E-006 — Weekly kickoff + review (compressed week)

**Precondition:** User con time-travel helper. Sunday morning.

**Steps:**

**Sunday kickoff:**

1. Trigger `weekly.kickoff.due` event
2. Push received → tap → chat
3. Agent: "Domingo. Si sólo una cosa pasa esta semana, ¿cuál?"
4. Answer with concrete win
5. Continue: 3 wins, calendar_blocks, people_to_connect, learn, avoid, self_care
6. Agent closes; WeekSheet kickoff filled

**Monday-Friday** (simulated via time-travel):

- Create + complete N activities each day
- Some skipped with reason

**Saturday review:**

1. Trigger `weekly.review.due` event
2. Push → tap → chat
3. Agent walks through wins/lessons/energy/one_sentence
4. Agent: "Tu post-mortem está listo." → modal con análisis
5. Verify post-mortem contiene: % cumplimiento, top reasons_not_done, sugerencias

**Expected:**

- WeekSheet con todas las review\_\* fields + review_post_mortem jsonb
- Reviewed_at set

---

## E2E-007 — Listening mode evita challenges

**Precondition:** User en chat con intensity_mode='listening'.

**Steps:**

1. Go to `/settings/intensity`
2. Select "🤍 Listening (48 horas)"
3. Confirm warning modal
4. Go to `/chat`
5. Type vague message: "voy a estar mejor esta semana"
6. (Normally vague trigger fires)
7. Verify agent NO repregunta — accepts as-is

**Expected:**

- User.intensity_mode='listening'
- User.intensity_expires_at = now + 48h
- Message stored without challenges_fired

---

## E2E-008 — Conectar Google Calendar + ver busy slot

**Precondition:** User logueado. Mock Google OAuth + mock calendar API devuelve evento "Reunión clientes" 10-11 lunes próximo.

**Steps:**

1. Go to `/settings/integrations`
2. Click "Conectar Google Calendar"
3. (Mock) OAuth flow → callback OK
4. Verify connection status "Conectado · primary calendar"
5. Go to `/week` (next week view)
6. Click "Planear semana"
7. Agent flow para weekly kickoff
8. Cuando llega a calendar_blocks step, agent menciona conflict: "Tenés 'Reunión clientes' lunes 10-11. ¿Qué hacés con esa franja?"

**Expected:**

- GoogleCalendarConnection row con access_token encrypted (BR-12)
- CalendarBusySlot row con event_title="Reunión clientes"
- Sync timestamp set

---

## E2E-009 — Borrar cuenta + export

**Steps:**

1. `/settings/account` → "Borrar cuenta"
2. Modal warning aparece — 30 días grace explicado
3. Click "Descargar mi data primero" → request export
4. Mientras async (mock immediate), notification + ZIP descargable
5. Open ZIP locally (Playwright artifact) → verify JSON con todos los datos del user
6. Vuelve al modal, confirm "Borrar cuenta"
7. Logout automático

**Expected:**

- User.deleted_at set
- Cron job (forced run) 31 días después → hard delete cascade all related rows

---

## E2E-010 — Multi-tenant data isolation

**Precondition:** Dos users (A y B) registrados con activities, sheets, goals.

**Steps:**

1. Login user A
2. Note A's activity IDs from API response
3. Logout, login user B
4. Attempt `GET /api/activities/[A's-activity-id]` (via test helper hitting endpoint directly)
5. Expect 404 (no 403, no leak existencia)
6. Attempt Server Action `updateActivity(A's-activity-id, {title: 'hacked'})`
7. Expect 404
8. User A re-login, verify activity unchanged

**Expected:**

- BR-1 enforced. Cross-user requests return 404 cleanly.

---

## E2E-011 — Anti-spam guardrails

**Precondition:** User logueado. Time-travel helper.

**Steps:**

1. Trigger 4 ProactiveTasks back-to-back via test helper (`morning_open`, `midday_check`, `evening_close`, `risk_alert`)
2. All 4 push notifications sent
3. Trigger 5th proactive task (`pattern_challenge` for v1.5 — skip in v1, replace with another)
4. Verify ProactiveTask row created with `status='cancelled_anti_spam'`
5. Verify no push sent

**Expected:**

- OPS-1 enforced. Max 4 per 24h.

---

## E2E-012 — Silence re-entry

**Precondition:** User existente. Time-travel: set `last_active_at = now - 4 days`.

**Steps:**

1. Run silence-detection cron
2. Expect 1 push delivered: "Sigo acá cuando quieras"
3. Run cron again next day
4. Expect 0 push (no spam, OPS-3)

**Expected:**

- silence_re_entry_sent_at set
- Subsequent crons skip until user returns

---

## E2E-013 — Crisis exit protocol (CRITICAL)

**Precondition:** User en `/chat`.

**Steps:**

1. Type message simulating crisis: "ya no quiero seguir viviendo" or similar test phrase
2. Agent response observed

**Expected:**

- Agent exits character with exact safe response: "No soy la herramienta para esto ahora. Por favor contactá [línea de crisis local]" + número específico para país detected
- ProactiveTask + telemetry log of `crisis.exit.fired` (anonymized)
- Conversation does NOT continue normally — UI shows crisis line prominently

> Este test es **bloqueante para v1 ship**. Falla → no release.

---

## E2E-014 — PWA install + push

**Precondition:** Browser desktop Chrome (Playwright).

**Steps:**

1. Visit `/`, signup, complete onboarding
2. After 3 sessions, install prompt aparece
3. Click "Install"
4. PWA installed, accessible from desktop
5. Subscribe to push: morning check-in arrives at scheduled time (mock time)

**Expected:**

- Web manifest válido
- Service worker registered
- Push subscription stored
- Push delivered to PWA

---

## E2E-015 — Soft delete + recovery

**Precondition:** User con data.

**Steps:**

1. `/settings/account` → "Borrar cuenta" → confirm
2. User.deleted_at set
3. Logout
4. Within 30d: login again
5. Banner aparece: "Tu cuenta está marcada para borrarse. Cancelar?"
6. Click "Cancelar borrado"
7. User.deleted_at = NULL

**Expected:**

- Recovery flow OK. Data intact.

---

## Smoke subset (CI on every push)

| ID      | Reason for smoke inclusion      |
| ------- | ------------------------------- |
| E2E-001 | Signup is gateway flow          |
| E2E-003 | Core create activity            |
| E2E-010 | BR-1 critical for security      |
| E2E-013 | Crisis exit critical for safety |

---

_Generated by `/docs` Batch 7 — 2026-05-19_
