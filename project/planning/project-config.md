---
project: 'AgendaInteligente'
client: 'Federico Levi (personal)'
stakeholder: 'Federico Levi'
project_type: saas-mvp
structure_version: '1.0'
design_system: editorial
locale: 'es-MX'
timezone: 'America/Mexico_City'
deadline: 'TBD'
stack: { framework: next, db: drizzle-neon, auth: nextauth }
---

# Project Config — AgendaInteligente

---

## 1. Identity

| Campo                 | Valor                                                  |
| --------------------- | ------------------------------------------------------ |
| **Nombre**            | AgendaInteligente (placeholder — naming real diferido) |
| **Slug**              | agenda-inteligente                                     |
| **Tipo**              | saas-mvp (PWA mobile-first, multi-tenant)              |
| **Repo**              | fedelevik/AgendaInteligente                            |
| **Branch principal**  | main                                                   |
| **Branch de trabajo** | develop (adaptive — actualmente pre-release)           |
| **Stakeholder**       | Federico Levi                                          |
| **Deadline MVP**      | TBD (~10 semanas estimadas single-dev con Claude Code) |

---

## 2. Pipeline Status

| Fase      | Documento                                | Estado                                                         |
| --------- | ---------------------------------------- | -------------------------------------------------------------- |
| Discovery | `project/planning/00_DISCOVERY_BRIEF.md` | ✅ Completo                                                    |
| Proposal  | `project/planning/01_PROPOSAL.md`        | ⬜ N/A (personal)                                              |
| Docs      | `project/planning/02-14_*.md`            | ✅ Completo                                                    |
| Design    | `project/planning/15_DESIGN.md`          | ✅ Completo                                                    |
| Backlog   | `project/backlog/`                       | ✅ Completo (11 epics v1.0 + 62 issues + placeholders v1.5/v2) |
| Code      | `src/`                                   | ⬜ Pendiente                                                   |

---

## 3. Problem Statement

PWA mobile-first multi-tenant para gestión personal de agenda. Diferencia: agente de IA que **persigue activamente** al usuario (3 check-ins diarios + weekly review) y desafía respuestas vagas para convertir excusas en datos accionables. Target: profesionales 25-45 que probaron Notion/Todoist/journaling y no sostuvieron el hábito. Producto vendible (SaaS), pero single-user-data (sin equipos ni colaboración).

---

## 4. Stack Summary

- **Framework:** Next.js 16 (App Router, RSC, Turbopack)
- **UI:** React + Tailwind v4 + Lucide + shadcn/ui (warm-book aesthetic)
- **DB:** Neon Postgres + Drizzle ORM + pgvector (v1.5)
- **Auth:** Auth.js v5 (Google OAuth + email/password)
- **Hosting:** Vercel
- **Otros:** LLM Anthropic Claude Sonnet | STT Web Speech API + Whisper fallback | Jobs Inngest | Email Resend | Rate-limit Upstash Redis | Errors Sentry

---

## 5. Infrastructure & Services

| Servicio  | Host / URL           | Propósito                         | Env Var                   | Costo       |
| --------- | -------------------- | --------------------------------- | ------------------------- | ----------- |
| Vercel    | TBD                  | Hosting + Edge + Cron             | —                         | Free → Pro  |
| Neon      | Via `DATABASE_URL`   | Postgres + pgvector               | `DATABASE_URL`            | Free tier   |
| Anthropic | api.anthropic.com    | Claude Sonnet (agente)            | `ANTHROPIC_API_KEY`       | Pay-per-use |
| OpenAI    | api.openai.com       | Whisper STT fallback              | `OPENAI_API_KEY`          | Pay-per-use |
| Google    | OAuth + Calendar API | Auth + read-only calendar         | `GOOGLE_CLIENT_ID/SECRET` | Free        |
| Resend    | Via API              | Email transaccional               | `RESEND_API_KEY`          | Free tier   |
| Inngest   | inngest.com          | Background jobs / scheduled tasks | `INNGEST_*`               | Free tier   |
| Upstash   | Redis serverless     | Rate limit + cache scheduling     | `UPSTASH_REDIS_*`         | Free tier   |
| Sentry    | sentry.io            | Error tracking                    | `SENTRY_*`                | Dev tier    |

---

## 7. Roles (RBAC)

`user` (default — CRUD sobre data propia, multi-tenant isolated), `admin` (super — bootstrap vía `pnpm db:seed`, métricas globales, soporte). **Sin roles de equipo/colaboración** (single-user-data por diseño).

---

## 8. Stakeholders & Team

### 8.1 Stakeholders

| Rol                   | Nombre        | Decide sobre                            |
| --------------------- | ------------- | --------------------------------------- |
| Stakeholder principal | Federico Levi | Todo (proyecto personal, decisor único) |

### 8.2 Team members

| Rol            | Nombre        | Responsabilidades                        |
| -------------- | ------------- | ---------------------------------------- |
| Solo developer | Federico Levi | Stack completo, asistido por Claude Code |

---

## 9. Key Decisions

1. **Stack TimeKast Next.js** sobre React Native — kit ya configurado, PWA cubre F6/F13, mobile-native diferido a v2 si métricas lo justifican
2. **6 escalas de planeación** (Day/Week/Quarter/Year/5-Year/Life) — adoptado de Reflexión, autorizado por user (Q14)
3. **Single-user-data multi-tenant** — sin equipos, sin shared workspaces, sin colaboración. Es Things 3, no Asana (X1 resolved)
4. **AI agent con vague-answer challenges + intensity modes** (Sharp/Standard/Gentle/Listening) — patrón adoptado de Reflexión
5. **Captura voice-first** — Web Speech API primary + Whisper fallback
6. **Google Calendar read-only en MVP** — scope `calendar.readonly` no sensible, evita verification process
7. **Billing infrastructure desde día 1, pricing diferido** — tablas Plan/Subscription/UsageMeter existen, Stripe se activa v2
8. **Warm-book aesthetic** (warm charcoal + cream + serif) — diferenciador visual real vs Todoist/TickTick genéricos
9. **Gamificación diferida a v2** — X2 resolved (user dijo "más adelante")
10. **Spanish `tú` LatAm neutro + English** — registro y idioma v1

> Decision Registry completo → `00_DISCOVERY_BRIEF.md` (especialmente §Appendix A Reconciliation).

---

## 10. Project-Specific Rules (BR-XXX)

### BR-PROJECT-001 — Quality >> Deadline (DOGMA TimeKast)

Si hay trade-off entre calidad y fecha de entrega, **calidad manda**. Ship tarde con calidad, nunca a tiempo con deuda técnica acumulada. No negociable.

### Otras BR del proyecto

1. **BR-1** — Multi-tenant data isolation absoluta: ningún user ve data de otro user, ni siquiera admin "como user X" sin auditoría visible
2. **BR-5** — Subtasks máximo 1 nivel (no recursión) — X1 resolved
3. **BR-6** — Goals viven **fuera** de jerarquía categoría/proyecto/actividad (entidad separada, vinculada M2M)
4. **BR-7** — DaySheet único por (user_id, date); WeekSheet único por (user_id, week_starting con week_starting siempre = domingo en TZ del user)
5. **AI-1** — Idioma `tú` en español (NUNCA `vos`), registro LatAm neutro
6. **AI-2** — Una pregunta por turno del agente, nunca listas

> Full BR registry → `00_DISCOVERY_BRIEF.md §6 Business Rules`.

---

## 11. Client Context

| Campo                   | Valor                                                                |
| ----------------------- | -------------------------------------------------------------------- |
| **Industria**           | Productividad personal / SaaS B2C                                    |
| **Nivel de formalidad** | Semi-formal (asistente profesional neutro, no coach motivacional)    |
| **Idioma preferido**    | Bilingüe (ES default, EN switch)                                     |
| **Restricciones marca** | Sin coaching motivacional, sin "¡tú puedes!", sin emojis decorativos |

---

## 13. SSOT Pointers

- **Versions (deps, scripts, ports):** `package.json`
- **Features (DB tables, actions, env vars):** [`sk-features-index`](../../.claude/skills/sk-features-index/SKILL.md)
- **File structure:** [`sk-project-structure`](../../.claude/skills/sk-project-structure/SKILL.md)
- **Commands:** `SK.md §4.1`
- **UI primitives:** [`sk-ui`](../../.claude/skills/sk-ui/SKILL.md) + `project/reference/INVENTORY.md`
- **Canonical symbols:** `project/reference/HOOKS.md`
- **Discovery Brief (full context):** `project/planning/00_DISCOVERY_BRIEF.md`

---

## 14. Delivery Model

Proyecto personal — sin estructura comercial externa. Owner = developer = stakeholder único. Sin transition plan, sin handover. Post-launch ops = self.

---

_AgendaInteligente — Project Config (2026-05-19)_
