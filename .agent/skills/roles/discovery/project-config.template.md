# Project Config Template

> Template para `docs/planning/project-config.md`.
> **Se genera durante:** `/discovery`
> **Se carga en:** `@import` desde `CLAUDE.md` (always-on, ver CLAUDE.md §Proyecto)

---

## Principios del schema

1. **Minimal always-on.** Este archivo se @importa en CLAUDE.md — cada línea es context tax. Target: ≤150 líneas.
2. **Síntesis, no enumeración.** Versiones, features, comandos genéricos → pointers a SSOT real (package.json, skills, SK.md), no duplicación.
3. **Project-specific only.** Si algo está en `SK.md`, `GIT.md`, `CODING.md`, `CC.md` → no repetir aquí.
4. **Ops detail va aparte.** SSH commands, paths del VPS, env vars completas → `docs/infra/{servicio}.md` (pointer desde §5).

---

## Template

````markdown
---
project: '{{nombre_proyecto}}'
client: '{{nombre_cliente_o_organización}}'
stakeholder: '{{nombre_principal — quien aprueba}}'
project_type: saas-mvp # saas-mvp | internal-tool | landing | e-commerce | mobile-app | api-service
structure_version: '1.0'
design_system: neomorphism-2
locale: 'es-MX'
timezone: 'America/Mexico_City'
deadline: '{{YYYY-MM-DD o TBD}}'
stack: { framework: next, db: drizzle-neon, auth: nextauth }
---

# Project Config — {{nombre_proyecto}}

<!-- INSTRUCCIÓN: No incluir este comentario ni los HTML comments del template en el output final -->

---

## 1. Identity

| Campo                 | Valor                                                        |
| --------------------- | ------------------------------------------------------------ |
| **Nombre**            | {{nombre_proyecto}}                                          |
| **Slug**              | {{kebab-case}}                                               |
| **Tipo**              | {{saas-mvp / internal-tool / landing / e-commerce / custom}} |
| **Repo**              | {{org/repo}}                                                 |
| **Branch principal**  | {{main}}                                                     |
| **Branch de trabajo** | {{develop}}                                                  |
| **Stakeholder**       | {{nombre_principal}}                                         |
| **Deadline MVP**      | {{YYYY-MM-DD o TBD}}                                         |

---

## 2. Pipeline Status

| Fase      | Documento                             | Estado       |
| --------- | ------------------------------------- | ------------ |
| Discovery | `docs/planning/00_DISCOVERY_BRIEF.md` | ✅ Completo  |
| Proposal  | `docs/planning/01_PROPOSAL.md`        | ⬜ Pendiente |
| Docs      | `docs/planning/02-14_*.md`            | ⬜ Pendiente |
| Design    | `docs/planning/15_DESIGN.md`          | ⬜ Pendiente |
| Backlog   | `docs/backlog/`                       | ⬜ Pendiente |
| Code      | `src/`                                | ⬜ Pendiente |

<!-- Cada workflow actualiza su fila al cerrar. -->

---

## 3. Problem Statement

<!-- 3-5 líneas: qué hace, para quién, qué problema resuelve. Narrativa densa, no bullets. -->

{{Descripción concisa del proyecto.}}

---

## 4. Stack Summary

<!-- ≤6 bullets con tecnología, sin versiones. Versiones exactas → package.json -->

- **Framework:** {{Next.js 16 (App Router, RSC)}}
- **UI:** {{React + Tailwind v4 + shadcn/ui}}
- **DB:** {{Neon Postgres + Drizzle ORM}}
- **Auth:** {{Auth.js v5}}
- **Hosting:** {{Vercel}}
- **Otros:** {{Payments: Stripe | Storage: R2 | Email: Resend}} <!-- consolidar en 1 línea -->

<!-- 🚫 No duplicar package.json. Si el stack difiere del SK base → anotar en §9 Key Decisions. -->

---

## 5. Infrastructure & Services

<!-- Tabla compacta: solo lo necesario para que el agente sepa QUÉ existe y DÓNDE.
     Detalle operativo (SSH, paths, commands, monitoreo) → docs/infra/{servicio}.md -->

| Servicio | Host / URL         | Propósito           | Env Var          | Costo         |
| -------- | ------------------ | ------------------- | ---------------- | ------------- |
| Vercel   | {{app.vercel.app}} | Hosting + Cron Jobs | —                | {{$20/mes}}   |
| Neon     | Via `DATABASE_URL` | DB principal        | `DATABASE_URL`   | {{Free tier}} |
| Resend   | Via API            | Email transaccional | `RESEND_API_KEY` | {{Free tier}} |

> **Ops detail:** SSH, monitoreo, paths, env vars completas → `docs/infra/{servicio}.md` (crear si hay VPS/tunnel/proxy/cron).

<!-- Ejemplos de servicios proyecto-específicos:
| VPS DigitalOcean | 24.144.91.109       | Proxy TCP para MySQL ERP | —                 | $6/mes     |
| Cloudflare R2    | Via `R2_*`          | Storage: CSVs + imágenes | `R2_*`            | Pay per use|
| The Odds API     | the-odds-api.com    | Líneas, scores en vivo   | `THE_ODDS_API_KEY`| Pay per use|
-->

---

## 6. Related Repos

<!-- Solo si hay multi-repo / monorepo / repos hermanos. Omitir sección completa si single-repo. -->

| Repo       | Path / URL       | Stack                  | Propósito                          |
| ---------- | ---------------- | ---------------------- | ---------------------------------- |
| {{repo-1}} | {{~/org/repo-1}} | {{Flutter + Firebase}} | {{App móvil — consume este admin}} |

---

## 7. Roles (RBAC)

<!-- Roles del sistema, no stakeholders del proyecto (eso va en §8). Línea compacta.
     Fuente: Brief §2 (Personas & RBAC). -->

{{super_admin, admin, staff}}

<!-- Ejemplos:
- MVPicks: super_admin, platform_admin, host, user + Superhost (capability)
- Aditivo: Tienda (4 sub-roles), Supervisor, Marketing, Admin
-->

---

## 8. Stakeholders

<!-- Omitir si solo hay 1 decisor (ya está en §1 Identity → Stakeholder).
     Incluir cuando hay >1 rol con poder de decisión. -->

| Rol           | Nombre     | Decides sobre       |
| ------------- | ---------- | ------------------- |
| Product Owner | {{nombre}} | Scope, prioridad    |
| Tech Lead     | {{nombre}} | Arquitectura, stack |
| Cliente       | {{nombre}} | Aprobación final    |

---

## 9. Key Decisions

<!-- Top 10 decisiones firmes con razón 1-línea. Para el resto → Brief Decision Registry.
     Incluir decisiones NO-obvias que el agente DEBE respetar (evitan scope creep y reimplementación). -->

1. {{Decisión 1}} — {{razón 1-línea}}
2. {{Decisión 2}} — {{razón 1-línea}}

> Decision Registry completo → `docs/planning/00_DISCOVERY_BRIEF.md §Decision Registry`.

<!-- Ejemplos:
1. Sync directo MySQL→PostgreSQL (sin CSV intermedio) — ADR-007
2. VPS DigitalOcean como proxy TCP para IP fija (Vercel→ERP)
3. 4 Cron Jobs: Sync Clients (2AM), Sync Sales (2:30AM), Cleanup (dom), Motor Listas (4AM)
-->

---

## 10. Project-Specific Rules (BR-XXX)

<!-- Solo reglas ÚNICAS del proyecto. NO repetir reglas de SK.md/GIT.md/CODING.md/CC.md.
     Prefijo BR-XXX para trazabilidad a Business Rules del Brief. -->

1. **BR-XXX** — {{regla específica}} — {{razón}}

<!-- Ejemplos (de proyectos reales):
- BR-001 — End-user NUNCA ve tool calls, file reads, paths internos (compliance crítica)
- BR-V2-006 — Modelo SIEMPRE Opus en producción (`--model opus`)
- BR-V2-008 — Cada nueva sesión usa un proyecto recién clonado de `_template/` (nunca reuso)
-->

---

## 11. Client Context

<!-- Contexto del cliente para adaptar tono, vocabulario y restricciones de marca.
     Fuente: Brief §9 (Branding) + §11 (Visual Direction Seeds).
     Usado por: /proposal (lenguaje cliente), /design (restricciones visuales).
     Omitir si es proyecto interno sin restricciones. -->

| Campo                   | Valor                                                     |
| ----------------------- | --------------------------------------------------------- |
| **Industria**           | {{industria}}                                             |
| **Nivel de formalidad** | {{formal / semi-formal / casual}}                         |
| **Idioma preferido**    | {{español / inglés / bilingüe}}                           |
| **Restricciones marca** | {{colores prohibidos, logo rules, o "sin restricciones"}} |

---

## 12. Domain Glossary — Quick Ref

<!-- Top 8-10 términos del dominio con "usar en lugar de". Full glossary → 09_GLOSSARY.md.
     Prioridad: términos que el agente confundiría con sinónimos genéricos. -->

| Término       | Significado            | Usar en lugar de     |
| ------------- | ---------------------- | -------------------- |
| {{Término 1}} | {{definición concisa}} | {{sinónimo ambiguo}} |
| {{Término 2}} | {{definición concisa}} | {{sinónimo ambiguo}} |

> Glossary completo → `docs/planning/09_GLOSSARY.md`.

---

## 13. SSOT Pointers

<!-- Apuntadores a las fuentes de verdad que este archivo NO duplica. -->

- **Versions (deps, scripts, ports):** `package.json`
- **Features (DB tables, actions, env vars):** [`sk-features-index`](../../.claude/skills/sk-features-index/SKILL.md)
- **File structure (dónde va cada archivo):** [`sk-project-structure`](../../.claude/skills/sk-project-structure/SKILL.md)
- **Commands (pnpm dev/test/build/lint/typecheck/etc):** `SK.md §4.1`
- **UI primitives:** [`sk-ui`](../../.claude/skills/sk-ui/SKILL.md) + `docs/reference/INVENTORY.md`
- **Dependency map:** `docs/reference/CODEBASE.md`

### Project-specific commands (si aplica)

<!-- Solo comandos ÚNICOS de este proyecto que no están en SK.md §4.1.
     Omitir la sub-sección si no hay ninguno. -->

```bash
# Ejemplo (Aditivo CRM):
pnpm db:query:erp "SQL"   # Query read-only contra MySQL Proscai via VPS proxy
```

---

_{{nombre_proyecto}} — Project Config ({{YYYY-MM-DD}})_
````

---

## Notas para el agente (cómo rellenar)

### Frontmatter YAML (OBLIGATORIO)

- `project`, `client`, `stakeholder` → Brief §1 + §2
- `project_type` → Brief §1 (tipo de producto)
- `design_system` → SK default (`neomorphism-2`) salvo que se defina custom
- `locale` → Brief §9 (idioma UI)
- `timezone` → Brief §8 (infraestructura), default `America/Mexico_City`
- `stack` → Brief §8 + SK actual (framework, db, auth)
- `deadline` → Brief §8 (timeline), o `'TBD'` si no hay fecha definida
- `structure_version` → siempre `"1.0"` para proyectos nuevos
- **No incluir** `version` ni `ports` — SSOT en `package.json`

### Body desde Brief

| Sección                    | Fuente Brief                                                             |
| -------------------------- | ------------------------------------------------------------------------ |
| §1 Identity                | §1 Nombre + §2 Stakeholders + §8 Deadline                                |
| §2 Pipeline Status         | Discovery ✅, resto ⬜                                                   |
| §3 Problem Statement       | §1.2 Problem Statement (3-5 líneas, condensar)                           |
| §4 Stack Summary           | §8 Stack (tech solo, sin versiones)                                      |
| §5 Infrastructure          | §5 Infra + §8 Services (consolidar en 1 tabla)                           |
| §6 Related Repos           | §8 Related Repos (omitir si single-repo)                                 |
| §7 Roles                   | §2 Personas & RBAC (roles del sistema)                                   |
| §8 Stakeholders            | §2 Stakeholders (omitir si ≤1 decisor)                                   |
| §9 Key Decisions           | Decision Registry (top 10 firmes)                                        |
| §10 Project-Specific Rules | §6 Business Rules (solo BR-XXX únicas)                                   |
| §11 Client Context         | §9 Branding + §11 Visual Direction                                       |
| §12 Domain Glossary        | `09_GLOSSARY.md §Términos de Negocio` (top 8-10)                         |
| §13 SSOT Pointers          | Fijo (copiar del template + agregar project-specific commands si aplica) |

### Qué NO va aquí

- ❌ **Tech Stack versions** → `package.json` es SSOT
- ❌ **Features completas** → `sk-features-index`
- ❌ **File structure** → `sk-project-structure`
- ❌ **Comandos genéricos** (`pnpm dev`, `pnpm build`, `pnpm test`…) → `SK.md §4.1`
- ❌ **Env vars completas** → `.env.example`
- ❌ **SSH commands, paths del VPS, monitoreo** → `docs/infra/{servicio}.md`
- ❌ **Changelog** → git log / tags
- ❌ **Scope Boundaries completos** → Brief §3.3
- ❌ **Open Questions / Assumptions** → Brief (fase discovery, no runtime)
- ❌ **Stack Overrides históricos** → ADRs

### Mantenimiento

1. **Pipeline Status** se actualiza por cada workflow al cerrar fase.
2. **Cambios de infra/stack/key decisions** → update manual + entry en git log (no changelog inline).
3. **Target tamaño:** ≤150 líneas. Si crece más → algo pertenece a otra SSOT (skill, ADR, doc de infra).

---

_TimeKast Factory — Project Config Template (schema v2)_
