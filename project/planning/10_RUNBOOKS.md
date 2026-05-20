# 10 — Runbooks

> **Scope:** Procedimientos operativos para incidentes, mantenimiento, on-call. Lean — solo lo crítico v1.

---

## R-001 — Deploy a producción

**Cuándo:** merge a `main`.

**Pasos:**

1. PR aprobado, CI green (lint + typecheck + test + E2E smoke)
2. Merge a `main` → Vercel auto-deploy
3. Monitor Vercel deployment status (~2-4 min)
4. Verificar `/api/health` responde 200
5. Smoke test manual: login + crear actividad + push notification recibida
6. Monitor Sentry 30 min post-deploy por nuevos errores

**Si falla deploy:**

- Revert via Vercel UI ("Promote to Production" del deploy anterior)
- Si DB migration falla → ver R-002

---

## R-002 — Rollback de DB migration

**Cuándo:** migración rompe producción o introduce bug crítico.

**Default:** Drizzle migrations son forward-only. Para rollback:

1. **Down migration manual:**
   - Crear nueva migration que invierte el cambio (`drop_column_x.sql`, `recreate_column_y.sql`)
   - PR rápido, merge, deploy
2. **Si data corruption:**
   - Neon: usar Branching para recuperar snapshot pre-migration
   - Restaurar branch → promote to primary

**Prevención:** todas las migrations testeadas en branch de Neon antes de merge a main.

---

## R-003 — User reporta no recibir notifications

**Diagnosis (en orden):**

1. ¿User aceptó permiso push?
   - Settings → Notifications → check `push_enabled = true`
   - Si false: usuario lo desactivó manualmente o nunca aceptó
2. ¿Push subscription registrada?
   - DB query: `SELECT * FROM push_subscriptions WHERE user_id = '...'`
   - Si no hay row: pedirle re-aceptar permission
3. ¿NotificationPref configurado?
   - Default values existen, pero confirmar no muteado: `muted_until IS NULL OR muted_until < now()`
4. ¿Anti-spam guardrails activos?
   - Query proactive_tasks últimas 24h, count status=sent
   - Si ≥4, hit anti-spam (OPS-1), legítimo
5. ¿FCM/APNs delivery falló?
   - Sentry filter: error `WebPushError` para user_id
   - Subscription invalid → necesita re-subscribe
6. ¿Inngest job ran?
   - Inngest dashboard: search `morning.check_in.due` event for user_id, check status

**Comunicación al user:** "Verifica permiso push en navegador, después de la pantalla Settings → Notifications también."

---

## R-004 — User reporta voice capture falla

**Diagnosis:**

1. ¿Browser soporta Web Speech API?
   - Check user-agent en logs
   - Safari iOS <14.5, Firefox → fallback Whisper automático
2. ¿Mic permission denegado?
   - Browser-level setting, no podemos override
   - Pedirle revisar en Settings del browser
3. ¿Whisper API falló?
   - Sentry filter: `/api/voice/transcribe` errors
   - Si rate-limited: `usage_meters.whisper_seconds_count` excede límite del plan
   - Si Whisper 500: OpenAI status (https://status.openai.com)
4. ¿LLM parse falló?
   - Sentry filter: `/api/ai/parse-task` errors
   - Anthropic status (https://status.anthropic.com)

**Mitigación inmediata:** fallback UI ofrece crear con teclado.

---

## R-005 — Claude / Whisper / Google API downtime

**Triage:**

| Servicio         | Detección                            | Mitigación                                                                                                                                                                                     |
| ---------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anthropic Claude | `/api/ai/*` errors spike             | Show user-facing banner: "El agente está temporalmente offline. Tus tareas siguen funcionando." Disable chat UI gracefully. Voice capture cae a Whisper-only parsing (heurística regex local). |
| OpenAI Whisper   | `/api/voice/transcribe` errors spike | Web Speech API sigue funcionando; fallback se desactiva con banner.                                                                                                                            |
| Google Calendar  | Sync errors spike                    | Banner en Today: "Sync con Google Calendar pausado. Reintenta en X min." User puede seguir usando app sin slots ocupados visibles.                                                             |
| Neon Postgres    | App 500s, health check fail          | Vercel logs Sentry; pingear Neon support. Sin alternativa local — wait.                                                                                                                        |
| Vercel           | Deploy failures, edge errors         | Vercel status. Wait.                                                                                                                                                                           |

**Comunicación pública:** status page (futuro), tweet desde cuenta oficial (v2).

---

## R-006 — Suspected data leak (multi-tenant breach)

**Severidad: CRÍTICA. Treat as P0 incident.**

1. **Containment inmediato:**
   - Push deploy con `MAINTENANCE_MODE=true` env var → app retorna 503 a todas las requests
2. **Confirmación:**
   - Query log: identificar request culpable
   - Si confirmado breach: cuáles users afectados, qué data
3. **Forensics:**
   - Snapshot Neon branch para audit
   - Code review del code path involucrado
4. **Notificación:**
   - Email a users afectados dentro de 72h (GDPR-like)
   - Notificación al owner del producto
5. **Fix:**
   - Patch + tests obligatorios cubriendo el caso
   - Deploy
6. **Post-mortem:**
   - Doc en `project/incidents/YYYY-MM-DD-multi-tenant-leak.md`
   - Action items para prevenir

**Prevención:** integration test suite obligatorio en CI; ESLint rule prohibiendo `db.select()` sin scope.

---

## R-007 — User reporta cobro indebido (v2 cuando Stripe active)

1. Verificar Stripe customer/subscription para el user
2. Comparar con Subscription row en DB
3. Si mismatch: reconciliar (Stripe siempre wins for billing state)
4. Si user razón: refund via Stripe dashboard
5. Comunicar al user con resolución

---

## R-008 — Pre-deploy checklist

Antes de merge a `main`:

- [ ] CI green (lint, typecheck, vitest, playwright smoke)
- [ ] Migrations testeadas en Neon branch
- [ ] `pnpm verify` localmente passing
- [ ] No console.log accidentales
- [ ] No secrets en código
- [ ] PR description menciona cambios en API contracts o data model
- [ ] Si cambios en DB: backwards-compatible o migration plan documentado
- [ ] Si nueva env var: agregada a Vercel + `.env.example`

---

## R-009 — Crisis exit incident (AI-8 fired)

**Cuándo:** Sentry log muestra event `crisis.exit.fired` (telemetría anonimizada).

**Pasos:**

1. Verificar metadata: idioma, país detectado, número de crisis sugerido
2. Si número incorrecto/inexistente → fix urgente en lookup table
3. NO contactar al user proactivamente (privacy + safety boundaries)
4. Si hay reportes externos de user en crisis → derivar a soporte legal/clinical

**Prevención:** lookup table de líneas de crisis revisada trimestralmente por contacto profesional.

---

## R-010 — Rotación de secretos

**Cadencia:** anual + en cualquier sospecha de leak.

**Secretos:**

- `ANTHROPIC_API_KEY` — rotate vía Anthropic console; update Vercel env
- `OPENAI_API_KEY` — idem
- `GOOGLE_CLIENT_SECRET` — Google Cloud Console; coordinar con app downtime corto
- `ENCRYPTION_KEY` (BR-12) — **proceso especial:**
  1. Generate new key
  2. Add as `ENCRYPTION_KEY_NEW` env var (ambos keys disponibles)
  3. Migration: re-encrypt todos los Google Calendar tokens con new key
  4. Después de migration, rotar key vars
  5. Documentar fecha y razón
- `RESEND_API_KEY`, `UPSTASH_REDIS_*`, `INNGEST_*` — standard rotate

**Verificación post-rotate:** smoke test cada integración (signin Google, conectar calendar, send push, send email).

---

## R-011 — User pide export de sus datos

Auto-handled por `GET /api/account/export` (US-123). Si user reporta falla:

1. Verificar request en logs
2. Si async job stuck (Inngest), re-trigger
3. Si data grande (>100MB), upgrade plan de export o split

---

## R-012 — Daily startup checklist (cuando hay multiple devs)

> En v1 single-dev (Federico) este runbook es mínimo. Lo dejamos esqueleto para v2.

- Check Sentry overnight errors
- Check Inngest failed jobs
- Check Vercel deployment status
- Triage tickets nuevos

---

## R-013 — Backup verification

**Cadencia:** semanal automatizada + mensual manual.

**Automatizado (Inngest weekly):**

1. Dump completo a S3/R2 con timestamp
2. Validation cron: abrir dump, query test row, log resultado
3. Si validation falla → alerta Sentry + email

**Manual mensual:**

- Verificar S3 bucket tiene últimos 4 dumps semanales
- Spot-check uno: download + inspect

---

_Generated by `/docs` Batch 6 — 2026-05-19_
