# 13 — Risk Register

> **Source:** Cross-cutting risks identified during Discovery (Brief §8 Risks M1/M2/M3) + analysis phase.
> **Format:** ID + Category + Description + Likelihood + Impact + Mitigation + Owner.
> **Scope:** v1 MVP and immediate v1.5 considerations.

---

## Severity matrix

| Likelihood × Impact   | Low Impact | Medium Impact | High Impact     |
| --------------------- | ---------- | ------------- | --------------- |
| **High Likelihood**   | 🟡 Watch   | 🟠 Mitigate   | 🔴 Mitigate now |
| **Medium Likelihood** | 🟢 Accept  | 🟡 Watch      | 🟠 Mitigate     |
| **Low Likelihood**    | 🟢 Accept  | 🟢 Accept     | 🟡 Watch        |

---

## Technical risks

### R-T-001 — Web Speech API coverage insuficiente en target browsers

- **Category:** Tech
- **Likelihood:** Medium (Safari iOS quirks históricos)
- **Impact:** High (sin voice capture, North Star roto)
- **Severity:** 🟠 Mitigate
- **Description:** Web Speech API tiene cobertura desigual. Firefox 0%. Safari iOS funciona pero con flags ocasionales. Si >20% de users caen al Whisper fallback, latencia sube y costo también.
- **Mitigation:**
  - Validar coverage real en sprint 7 (voice week) con beta users (OQ-4)
  - Whisper API como fallback transparente
  - Telemetry: medir % de captures via Web Speech vs Whisper
  - Si Whisper >30% → considerar Whisper-only para todos por consistencia
- **Owner:** Dev (Federico)
- **Reviewed:** —

---

### R-T-002 — Google Calendar OAuth verification process

- **Category:** Tech / Process
- **Likelihood:** Low (scope `calendar.readonly` no es sensible)
- **Impact:** High (delay 2-4 semanas si Google requiere verification)
- **Severity:** 🟡 Watch
- **Description:** Aunque `calendar.readonly` no es sensible, Google a veces pide verification igual si la app tiene branding/dominio nuevo.
- **Mitigation:**
  - Aplicar para verification temprano en development (sprint 1, no esperar a launch)
  - Tener fallback: usar test users (max 100) si verification se demora
  - Documentar la app en Google Cloud Console early
- **Owner:** Dev
- **Reviewed:** —

---

### R-T-003 — LLM cost variance descontrolada

- **Category:** Cost
- **Likelihood:** High (sin caps pricing por tier definido)
- **Impact:** Medium (bleed $ pero no rompe producto)
- **Severity:** 🟠 Mitigate
- **Description:** Cada user puede generar muchas conversaciones / capture / post-mortem. Costo de Anthropic Claude puede escalar antes de tener revenue.
- **Mitigation:**
  - `usage_meters` tracking activo desde día 1 (FT-112)
  - Prompt caching estricto en system prompts del agente (Claude soporta nativo)
  - Soft caps por user: si excede X calls/mes en plan free, throttle + UI explica
  - Monthly budget alert: si total cost > $threshold, email al owner
  - Modelo barato (Haiku) para tareas simples (parseo de voz); Sonnet solo para conversación
- **Owner:** Dev
- **Reviewed:** —

---

### R-T-004 — Whisper API costs si Web Speech falla mucho

- **Category:** Cost
- **Likelihood:** Medium (depende de R-T-001)
- **Impact:** Low ($0.006/min, escalable)
- **Severity:** 🟢 Accept con monitoring
- **Mitigation:** caps por user en `usage_meters`, similar a R-T-003

---

### R-T-005 — Prompt injection vulnerabilities

- **Category:** Security
- **Likelihood:** Medium (LLMs son target nuevo de attacks)
- **Impact:** High (could read/modify user data si LLM ejecutara comandos)
- **Severity:** 🟠 Mitigate
- **Description:** User puede tipear "ignore previous instructions and..." y intentar que el agente haga cosas indebidas.
- **Mitigation:**
  - AI-9: NUNCA parseamos free-text del LLM como instrucción de DB. Solo tool calls con schema Zod validated.
  - Tools tienen scope limitado (e.g., `save_sheet_field` solo modifica el sheet de hoy del user actual)
  - Eval set adversarial con prompt injection attempts; 0 false positives required
- **Owner:** Dev
- **Reviewed:** —

---

### R-T-006 — Multi-tenant data leak

- **Category:** Security
- **Likelihood:** Low (con controls en place)
- **Impact:** Critical (producto muerto si pasa)
- **Severity:** 🔴 Mitigate now (preventive)
- **Mitigation:**
  - `scopedDb(userId)` helper enforced (ADR-010, BR-1)
  - ESLint custom rule prohibiendo `db.select()` sin scope
  - Integration tests obligatorios cubriendo cross-user access (I-005, I-023, E2E-010)
  - Sentry middleware logs all cross-user access attempts
  - Considerar RLS Postgres como defense-in-depth en v1.5
- **Owner:** Dev
- **Reviewed:** —

---

### R-T-007 — Audio leaked via Whisper API

- **Category:** Privacy / Security
- **Likelihood:** Low (OpenAI no almacena audio per ToS)
- **Impact:** High (privacy violation)
- **Severity:** 🟡 Watch
- **Mitigation:**
  - BR-13: Audio nunca persistido en producción
  - OpenAI Zero Data Retention agreement (si aplica al plan)
  - Documentar en privacy policy
  - Considerar Whisper self-hosted (Replicate, etc.) si privacy critical para v2

---

### R-T-008 — DST / timezone edge cases en check-ins

- **Category:** Tech (correctness)
- **Likelihood:** Medium (DST happens 2x/year)
- **Impact:** Medium (user misses check-in o lo recibe a hora rara)
- **Severity:** 🟡 Watch
- **Mitigation:**
  - Usar `Temporal` API o `date-fns-tz` consistente
  - Tests unitarios cubren cambios DST en distintos TZ (U-003)
  - Per-user TZ stored, Inngest schedules respetan
  - Sanity check: dry run con fake dates en CI

---

### R-T-009 — PWA push notifications iOS limitations

- **Category:** Tech
- **Likelihood:** High (es limitación conocida)
- **Impact:** Medium (sin push, accountability degradada)
- **Severity:** 🟠 Mitigate
- **Description:** iOS < 16.4 NO soporta Web Push para PWAs. iOS 16.4+ requiere que user instale el PWA en home screen.
- **Mitigation:**
  - Detectar iOS version y mostrar prompt explicativo en onboarding
  - Para iOS users sin install: email check-ins como fallback (NotificationPref.email_enabled)
  - Long-term: app nativa iOS (v2) si métricas justifican

---

### R-T-010 — Inngest vendor lock-in / outage

- **Category:** Vendor
- **Likelihood:** Low (Inngest es maduro)
- **Impact:** High (sin jobs, no check-ins, no recurrencias)
- **Severity:** 🟡 Watch
- **Mitigation:**
  - Inngest functions son TypeScript, port-ables a Cloudflare Workers / Trigger.dev / BullMQ si fuera necesario
  - Backup: Vercel Cron como fallback genérico de "diario hace X"
  - Monitor Inngest status page

---

### R-T-011 — Anthropic / OpenAI / Google API rate limits o outage

- **Category:** Vendor
- **Likelihood:** Medium (outages happen)
- **Impact:** High (sin agente, producto degradado)
- **Severity:** 🟠 Mitigate
- **Mitigation:** ver runbook R-005. UI banners + graceful degradation.

---

## Product risks

### R-P-001 — North Star metric no se alcanza

- **Category:** Product
- **Likelihood:** Medium (40% retention target es ambicioso vs 15% benchmark)
- **Impact:** High (producto sin tracción)
- **Severity:** 🟠 Mitigate
- **Mitigation:**
  - Measure desde día 1: % users con ≥4 check-ins/week post day-30
  - A/B test variantes de check-in framing
  - Si <20% en mes 1 → revisar UX onboarding + frecuencia de challenges
  - Consider que North Star puede ser wrong → tener fallback metrics (DAU, % users completaron 1 weekly review, etc.)

---

### R-P-002 — Diferenciador "vague-answer challenges" no resuena con users reales

- **Category:** Product
- **Likelihood:** Medium (es hipótesis no validada)
- **Impact:** High (es el diferenciador central)
- **Severity:** 🟠 Mitigate
- **Description:** Reflexión doc declara este patrón como key, pero nuestros users podrían encontrarlo molesto vs útil.
- **Mitigation:**
  - Default a Gentle por 14 días reduce friction inicial
  - User puede ajustar intensity rápido
  - Feedback loop: si user cambia a Listening con frecuencia, métrica para revisar
  - Considerar A/B test de presencia vs ausencia de challenges

---

### R-P-003 — Onboarding demasiado largo o demasiado corto

- **Category:** UX
- **Likelihood:** Medium
- **Impact:** Medium (abandono early o falta de setup)
- **Severity:** 🟡 Watch
- **Mitigation:**
  - 8 steps con cada uno saltable
  - Target ≤8 min total
  - Metric: drop-off por step → ajustar

---

### R-P-004 — Scope creep durante implementación

- **Category:** Project mgmt
- **Likelihood:** High (proyecto personal sin presión externa)
- **Impact:** Medium (delay ship, demoraría validación)
- **Severity:** 🟠 Mitigate
- **Mitigation:**
  - DOR/DOD estricto: features fuera de Feature Map MVP no entran sin update explícito de scope
  - v1.5 y v2 columnas son la válvula de escape — "buena idea, pero v2"
  - Re-leer Discovery Brief mensual para mantener North Star

---

### R-P-005 — Voice parse accuracy <90%

- **Category:** Product
- **Likelihood:** Medium (depende de LLM quality + prompt engineering)
- **Impact:** High (rompe captura frictionless promise)
- **Severity:** 🟠 Mitigate
- **Mitigation:**
  - Eval set robusto (A-009) en CI
  - Preview siempre editable; user puede corregir antes de save
  - Continuous improvement del prompt parser
  - Si <85% sostenido → escalar (Sonnet en lugar de Haiku, fine-tuning, etc.)

---

## Operational risks

### R-O-001 — Backups no recuperables cuando se necesitan

- **Category:** Operations
- **Likelihood:** Low
- **Impact:** Critical
- **Severity:** 🟡 Watch
- **Mitigation:** R-013 runbook backup validation weekly + manual mensual

---

### R-O-002 — Single dev bottleneck (Federico)

- **Category:** People
- **Likelihood:** High (es estado actual)
- **Impact:** High (todo se para si dev incapacitated)
- **Severity:** 🟠 Mitigate
- **Mitigation:**
  - Code + docs en repo → cualquier dev puede recoger
  - CLAUDE.md + project-config.md mantienen contexto cargable por agente
  - Bus factor 1 es aceptable para v1; reconsidereable post-launch si crece

---

### R-O-003 — Crisis exit protocol activado en producción

- **Category:** Safety / Legal
- **Likelihood:** Low pero non-zero
- **Impact:** Critical (legal + ethical)
- **Severity:** 🔴 Mitigate now
- **Mitigation:**
  - AI-8 protocol implementado y testeado (E2E-013 obligatorio)
  - Lookup table de líneas de crisis por país, revisada por contacto profesional pre-launch
  - Logging anonimizado para detection sin violar privacy
  - Legal review de privacy policy + ToS pre-public launch

---

## Compliance risks

### R-C-001 — GDPR-equivalent compliance (data export, delete, consent)

- **Category:** Legal
- **Likelihood:** Medium (depende de mercado)
- **Impact:** High si target EU/CA users
- **Severity:** 🟡 Watch
- **Mitigation:**
  - BR-14 + FT-123: account delete + data export ya en MVP
  - Privacy policy y ToS pre-launch
  - Cookie banner si aplica (minimizar tracking analytics)
  - OQ-7: confirmar país-target → GDPR si UE/UK

---

### R-C-002 — Términos de Anthropic / OpenAI cambian

- **Category:** Vendor / Legal
- **Likelihood:** Low
- **Impact:** Medium
- **Severity:** 🟢 Accept con monitoring
- **Mitigation:** review ToS de providers cada semestre

---

## Resumen

| Severity        | Count                |
| --------------- | -------------------- |
| 🔴 Mitigate now | 2 (R-T-006, R-O-003) |
| 🟠 Mitigate     | 8                    |
| 🟡 Watch        | 8                    |
| 🟢 Accept       | 2                    |

**Acción prioritaria pre-launch:**

1. ✅ Multi-tenant isolation tests verde (R-T-006)
2. ✅ Crisis exit protocol probado y line lookup table revisada (R-O-003)
3. ✅ Google OAuth verification iniciada (R-T-002)
4. ✅ Cost monitoring + soft caps (R-T-003)
5. ✅ Prompt injection eval set passing (R-T-005)

---

_Generated by `/docs` Batch 7 — 2026-05-19_
