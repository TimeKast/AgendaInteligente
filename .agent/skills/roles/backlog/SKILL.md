---
name: backlog-expert
description: Generates issues from Discovery Brief, Docs, and Design
triggers:
  - After /design completed (15_DESIGN.md exists)
  - When issues need to be created from specs
  - When backlog needs to be updated
modes:
  - default: generate issues from docs
  - validate: validate prerequisites only
  - refresh: regenerate preserving issue IDs
  - add: create issue/epic/milestone mid-implementation
---

# 📋 Backlog Expert (v2)

> **Role Skill** — Transforma specs (Brief + Docs + Design) en issues ejecutables.

---

## Principios Fundamentales

1. **SSOT downstream** — Issues derivan de docs, nunca se inventan
2. **Atómicos y cerrables** — Cada issue es una unidad completa verificable
3. **IDs inmutables** — Una vez asignado, el ID nunca cambia
4. **AC verificables** — Cada criterio se puede convertir en un test
5. **Dependencias explícitas** — `Blocked By` siempre documentado

---

## Modes

| Mode         | Comando             | Comportamiento                                |
| ------------ | ------------------- | --------------------------------------------- |
| **generate** | `/backlog`          | Genera issues desde docs y design             |
| **validate** | `/backlog validate` | Solo verifica prerrequisitos                  |
| **refresh**  | `/backlog refresh`  | Regenera preservando IDs de issues existentes |
| **add**      | `/backlog add`      | Crea issue/epic/milestone mid-implementation  |

**Regla de refresh:**

- Si `docs/backlog/M{N}/issues/*.md` ya existen → preservar IDs
- Solo agregar nuevos issues, no renumerar existentes
- IDs eliminados NO se reutilizan

---

## §0. Qué Hace y Qué NO Hace

**HACE:**

- Transforma User Stories (US-XXX) en issues implementables
- Agrupa issues en epics por feature/componente
- Asigna prioridad basada en dependencias y valor
- Estima esfuerzo (T-shirt sizing → Fibonacci SP)
- Cross-referencia a Design (SCR/FLW/CMP), Docs (P/US/BR/E)
- Genera issues compatibles con `pnpm update-board`

**NO HACE:**

- Diseñar soluciones (eso es /design)
- Escribir código (eso es /implement)
- Evaluar calidad (eso es /audit)
- Inventar features no documentados
- **Generar BOARD.md manualmente** (usa `pnpm update-board`)

### SK Leverage (DO NOT REBUILD)

> 🔴 **OBLIGATORIO:** Consultar `docs/reference/features.md` antes de crear issues.
> **NO crear issues que reconstruyan funcionalidad existente del Starter Kit.**

| Categoría   | Verificar en `features.md` | Acción si existe                                        |
| ----------- | -------------------------- | ------------------------------------------------------- |
| Auth/Login  | §1.1 Auth System           | No crear issue de auth — ya implementado                |
| RBAC        | §1.2 Role System           | Solo crear issue para config de permisos, no el sistema |
| DataTable   | §1.3 Data Tables           | Usar componente existente, no crear nuevo               |
| Sidebar/Nav | §1.4 Navigation            | Personalizar, no reconstruir                            |
| Theme       | §1.5 Dark/Light/Midnight   | Ya existe (3 temas), solo configurar                    |
| Email       | §1.6 Email System          | Usar sistema existente                                  |
| Notif Push  | §1.7 Push Notifications    | Ya existe (VAPID + service worker), solo configurar     |
| Notif InApp | §1.8 In-App Notifications  | Ya existe, usar sistema existente                       |
| SSE         | §1.9 Server-Sent Events    | Ya existe, usar para realtime sin reconstruir           |
| User CRUD   | §1.10 User Management      | Extender, no recrear                                    |

Cada issue DEBE incluir sección **"SK Leverage"** declarando qué del SK usa o `"No aplica"`.

### SK Overlap Decision Matrix

> 🔴 **HARD GATE** — Aplicar ANTES de escribir el issue.

| Situación                | Tipo de issue      | Acción                                                                    |
| ------------------------ | ------------------ | ------------------------------------------------------------------------- |
| SK ya lo tiene completo  | **Configuración**  | Issue de config (XS/S): activar, configurar params, personalizar branding |
| SK lo tiene parcialmente | **Extensión**      | Issue de extensión: usar base del SK + agregar lo que falta               |
| SK no lo tiene           | **Implementación** | Issue nuevo: diseñar + implementar desde cero                             |
| No estás seguro          | **🛑 STOP**        | Verificar en `features.md` + `docs/reference/` antes de decidir           |

**Ejemplo concreto:**

| Request                 | SK tiene             | Tipo correcto                                   | Tipo incorrecto                                 |
| ----------------------- | -------------------- | ----------------------------------------------- | ----------------------------------------------- |
| "Login con Google"      | Auth system completo | `CFG-001: Configurar OAuth Google` (XS)         | `AUTH-001: Implementar Login` (L)               |
| "Notificaciones push"   | VAPID + SW completo  | `CFG-002: Activar push notif` (S)               | `NOTIF-001: Crear sistema push` (XL)            |
| "Dashboard de reportes" | DataTable existe     | `DASH-001: Crear vista reportes` (extensión, M) | `DASH-001: Crear tabla de datos` (reimplementa) |
| "Módulo de facturación" | No existe            | `BILL-001: Implementar facturación` (nuevo, L)  | —                                               |

---

## §1. EPIC-SETUP Knowledge

> 🔴 **OBLIGATORIO en `/backlog` (full).** NO aplica en `/backlog add`.
> SSOT: `docs/guides/getting-started.md`
>
> **Detección:** Si `docs/backlog/*/issues/SETUP-*.md` ya existen → SKIP.

### Qué YA está hecho (NO crear issues)

| Paso                        | Ya resuelto por            |
| --------------------------- | -------------------------- |
| Clonar/copiar template      | `new-project.ps1` / manual |
| `pnpm install`              | `new-project.ps1` / manual |
| Crear repo GitHub           | `new-project.ps1`          |
| Auth password (ya funciona) | SK built-in                |
| RBAC (3 roles)              | SK built-in                |
| UI/Theme/Components         | SK built-in                |
| DataTable/Forms             | SK built-in                |

### Issues Obligatorios (SIEMPRE generar)

| #   | ID        | Título                                       | Ref getting-started |
| --- | --------- | -------------------------------------------- | ------------------- |
| 1   | SETUP-001 | Configurar branching strategy (main/develop) | —                   |
| 2   | SETUP-002 | Configurar variables de entorno y secrets    | §Paso 2             |
| 3   | SETUP-003 | Inicializar base de datos y seed             | §Paso 3             |
| 4   | SETUP-004 | Personalizar branding visual                 | §Branding           |
| 5   | SETUP-005 | Generar y configurar PWA icons               | §Branding           |
| 6   | SETUP-006 | Configurar plataforma de deploy              | —                   |
| 7   | SETUP-007 | Configurar email service                     | §Email              |
| 8   | SETUP-008 | Actualizar README y legal pages              | §Legal Pages        |

### Issues Opcionales (preguntar en CHECKPOINT 1)

| #   | ID        | Título                                  | Condición                                |
| --- | --------- | --------------------------------------- | ---------------------------------------- |
| 10  | SETUP-010 | Configurar Push Notifications (VAPID)   | Si proyecto requiere notificaciones push |
| 11  | SETUP-011 | Configurar OAuth Providers              | Si proyecto requiere Google/GitHub OAuth |
| 12  | SETUP-012 | Configurar E2E Testing (Neon Branching) | Si CI/CD con tests E2E                   |

### Template Ligero (Setup Issues)

```markdown
# SETUP-{NUM}: {Título}

> **Issue ID:** SETUP-{NUM}
> **Priority:** P0
> **Effort:** XS
> **Story Points:** 1
> **Status:** 📋 Backlog
> **Epic:** [EPIC-SETUP](../epics/EPIC-SETUP.md)

## Descripción

{Qué configurar y por qué}

## Referencia

📖 Ver: [getting-started.md](../../../guides/getting-started.md#{sección})

## Pasos

1. {paso concreto}
2. {paso concreto}
3. Verificar que funciona

## Criterios de Aceptación

- [ ] {criterio verificable}
- [ ] {criterio verificable}

## SK Leverage

{Qué del SK se usa}
```

### Reglas

1. **Siempre EPIC-00** — Primer epic, antes de cualquier feature
2. **Solo configuración** — NO issues de código nuevo
3. **SSOT: getting-started.md** — No inventar pasos
4. **Consultar Discovery Brief §8-§9** — Branding e infra
5. **XS/S effort** — Cada issue ≤ 2 horas

---

## §2. Inputs SSOT

> 🔴 **Full mode:** Cargar Tier 1 completo + Tier 2 targeted.
> En add mode: solo backlog existente + user input.

### Tier 1: `cat` completo (genera issues directamente)

| Input           | Ubicación                             | Por qué                                      |
| --------------- | ------------------------------------- | -------------------------------------------- |
| Discovery Brief | `docs/planning/00_DISCOVERY_BRIEF.md` | SSOT del proyecto, scope, features, entities |
| Feature Map     | `docs/planning/02_FEATURE_MAP.md`     | Estructura de epics, agrupación              |
| User Personas   | `docs/planning/03_USER_PERSONAS.md`   | P-XXX en cada issue (pequeño)                |
| User Stories    | `docs/planning/04_USER_STORIES.md`    | US-XXX, fuente primaria de issues            |
| Business Rules  | `docs/planning/05_BUSINESS_RULES.md`  | BR-XXX para AC correctos                     |
| Data Model      | `docs/planning/06_DATA_MODEL.md`      | E-XXX → schema/CRUD issues                   |
| Architecture    | `docs/planning/07_ARCHITECTURE.md`    | Stack, decisions técnicas, ADRs              |
| Design          | `docs/planning/15_DESIGN.md`          | SCR/FLW/CMP-XXX, fuente primaria UI          |

### Tier 2: Targeted loading (referencia, no todos los epics)

| Input         | Ubicación                           | Cuándo cargar                                     |
| ------------- | ----------------------------------- | ------------------------------------------------- |
| Proposal      | `docs/planning/01_PROPOSAL.md`      | `head -50` — solo scope/timeline si no está en 00 |
| API Contracts | `docs/planning/08_API_CONTRACTS.md` | Solo cuando epic tiene API/integración            |
| Glossary      | `docs/planning/09_GLOSSARY.md`      | `head -30` — naming consistency (pequeño)         |
| Test Strategy | `docs/planning/11_TEST_STRATEGY.md` | Solo al generar testing issues por epic           |
| E2E Scenarios | `docs/planning/12_E2E_SCENARIOS.md` | Solo al generar testing issues por epic           |
| Risk Register | `docs/planning/13_RISK_REGISTER.md` | Solo al inicio — para detectar ADRs               |

### Tier 3: Skip (no es input al backlog)

| Input        | Ubicación                          | Razón                           |
| ------------ | ---------------------------------- | ------------------------------- |
| Runbooks     | `docs/planning/10_RUNBOOKS.md`     | Post-deploy, no genera issues   |
| Traceability | `docs/planning/14_TRACEABILITY.md` | Es OUTPUT del backlog, no input |

**Stop Conditions (full mode):**

| Condición                   | Acción                     |
| --------------------------- | -------------------------- |
| 00_DISCOVERY_BRIEF.md falta | Ejecutar `/discovery`      |
| Cualquier Tier 1 doc falta  | Ejecutar `/docs` primero   |
| 15_DESIGN.md falta          | Ejecutar `/design` primero |
| Tier 2 doc falta            | ⚠️ Warning, no blocker     |

**OQ High impact → NO bloquear, crear ADR issue.**

---

## §3. Output Structure

```
docs/backlog/M{N}/
├── README.md
├── epics/
│   ├── EPIC-{NN}-{NAME}.md
│   └── ...
└── issues/
    ├── {PREFIX}-001-{slug}.md
    ├── {PREFIX}-002-{slug}.md
    └── ...
```

**SSOT Chain:**

```
Discovery (00) → Proposal (01) → docs (02-14) → design (15) → backlog → code
```

---

## §4. Issue Format & Quality

### Título (CRÍTICO para parsing)

```markdown
# AUTH-001: Implementar Login Form
```

### Metadata Block (CRÍTICO para parsing)

```markdown
> **Issue ID:** AUTH-001
> **Priority:** P1
> **Effort:** M
> **Story Points:** 5
> **Status:** 📋 Backlog
> **Created:** 2026-04-15
> **Started:** —
> **Completed:** —
> **Epic:** [EPIC-AUTH](../epics/EPIC-AUTH.md)
> **Skills:** `domains/db`, `domains/ui`
> **Agents:** `backend-specialist`
> **Owner:** Jose
```

> 🔴 **Skills DEBEN usar formato `category/name`** del registry (ej: `domains/db`, NO `database-design`).
> Categorías válidas: `domains/`, `kit/`, `project/`, `utils/`

#### Lifecycle Date Fields

| Field         | Format              | Set by                       | When                             |
| ------------- | ------------------- | ---------------------------- | -------------------------------- |
| **Created**   | `YYYY-MM-DD`        | `/backlog`                   | When the issue/epic is generated |
| **Started**   | `YYYY-MM-DD` or `—` | `/implement` Phase 4         | When implementation begins       |
| **Completed** | `YYYY-MM-DD` or `—` | `/implement` Phase 6 (close) | When issue is closed             |

- `—` (em-dash) means "not yet applicable"
- `/backlog` fills `Created:` with today's date; `Started:` and `Completed:` default to `—`
- `/implement` sets `Started:` on the issue (and epic if first issue) at Phase 4
- `/implement close` sets `Completed:` on the issue (and epic if last issue) at Phase 6
- Pre-existing issues without these fields are NOT broken — workflows only enforce on files being touched

### Owner Assignment (OBLIGATORIO)

> 🔴 **Cada issue DEBE tener Owner asignado.**

| Fuente                                   | Lógica                                       |
| ---------------------------------------- | -------------------------------------------- |
| Discovery Brief §Team con múltiples devs | Asignar según dominio (frontend/backend)     |
| Discovery Brief §Team con 1 dev          | Asignar nombre del dev o `Tech Lead` a todos |
| Sin sección §Team en Discovery           | `Owner: TBD` — resolver en CHECKPOINT 1      |
| `project-config.md` define owners        | Usar project-config como override            |

### Effort → Story Points (OBLIGATORIO)

| Effort | Story Points | Descripción                              |
| ------ | ------------ | ---------------------------------------- |
| XS     | 1            | Trivial, minutos                         |
| S      | 2            | Simple, < 2 horas                        |
| M      | 5            | Significativo, 1 día                     |
| L      | 8            | Complejo, 1-2 días                       |
| XL     | 13           | Muy complejo, >2 días (considerar split) |

> 🔴 **Regla:** Si Effort = M → Story Points = 5. Sin excepciones.

### Cross-references

```markdown
**Implementa:** US-001
**Pantalla:** SCR-001
**Flujo:** FLW-001
**Componentes SK:** Form, Input, Button
**Componentes Nuevos:** CMP-001
```

### Secciones Obligatorias por Issue

1. Título con ID
2. Metadata block (Status, Priority, Effort, SP, **Created**, **Started**, **Completed**, Epic, Blocked By, Skills, Agents, **Owner**)
3. Descripción (3-5 oraciones — contexto de producto y arquitectura)
4. User Story (referencia a P-XXX) + "Implementa: US-XXX"

> Si no hay US directo (infra/data pura): `Implementa: — (Data infrastructure, §X)`

5. **Doc References (Inline)** — 🔴 Tabla con **anchor links** para `/implement` (≥ 2 docs)
6. Criterios de Aceptación (≥ 3 checkboxes, verificables)
7. **🥒 Gherkin (OBLIGATORIO)** — En español, ≥ 1 escenario (ver regla abajo)
8. Contexto Técnico — archivos a crear/modificar explícitamente
9. **⚠️ Edge Cases** (≥ 1) — Cómo manejar cada caso
10. **🧪 Tests Requeridos** (≥ 1) — Unit/Integration/E2E predefinidos
11. **🚫 Out of Scope** (≥ 1) — Qué NO incluir
12. **SK Leverage** (🔴 OBLIGATORIO — declarar qué del SK reutiliza o `"No aplica — funcionalidad nueva"`)
13. **Implementation Evidence** (🔴 OBLIGATORIO — sección vacía al crear, se llena durante `/implement`)
14. **Commits** (🔴 OBLIGATORIO — sección vacía al crear, se llena durante `/implement`)

> 🔴 **Secciones 5-14 son OBLIGATORIAS.** El validation gate las verifica.

### Regla Gherkin

| Tipo de issue                   | Gherkin                                                  |
| ------------------------------- | -------------------------------------------------------- |
| UI (components, pages, wizards) | 🔴 OBLIGATORIO — ≥ 2 escenarios (happy + edge)           |
| Schema/migration                | 🔴 OBLIGATORIO — ≥ 1 escenario (comportamiento esperado) |
| Server actions/API              | 🔴 OBLIGATORIO — ≥ 1 escenario (input → output)          |
| Config/setup                    | 🟡 Recomendado — 1 escenario si aporta                   |
| Docs/workflow/infra-only        | ⚪ Opcional — skip si no aporta                          |

### Doc References (Inline)

> 🔴 **OBLIGATORIO** — El workflow `/implement` usa esta tabla.
> 🔴 **ANCHOR LINKS OBLIGATORIOS** — Cada link DEBE incluir `#section-anchor`.

```markdown
## 📎 Doc References (Inline)

| Doc        | Sección | Link                                                                      |
| ---------- | ------- | ------------------------------------------------------------------------- |
| DATA_MODEL | E-XXX   | [06_DATA_MODEL.md#e-xxx](../../planning/06_DATA_MODEL.md#e-xxx)           |
| BIZ_RULES  | BR-XXX  | [05_BUSINESS_RULES.md#br-xxx](../../planning/05_BUSINESS_RULES.md#br-xxx) |
| DESIGN     | SCR-XXX | [15_DESIGN.md#scr-xxx](../../planning/15_DESIGN.md#scr-xxx)               |
```

> ⚠️ **Formato correcto vs incorrecto:**
>
> | ✅ Correcto                   | ❌ Incorrecto                       |
> | ----------------------------- | ----------------------------------- |
> | `05_BUSINESS_RULES.md#br-006` | `05_BUSINESS_RULES.md` (sin anchor) |
> | `06_DATA_MODEL.md#e-003`      | `06_DATA_MODEL.md` (sin anchor)     |
> | `15_DESIGN.md#scr-010`        | `15_DESIGN.md` (sin anchor)         |
>
> 🔴 **BLOCKER:** Issues con doc refs sin anchor links → validation gate FAIL.

### Gherkin (siempre en español)

```gherkin
Escenario: {Título descriptivo}
  Dado que {precondición}
  Cuando {acción del usuario}
  Entonces {resultado esperado}
```

### Quality Minimums

| Sección                 | Mínimo              | Si falta   |
| ----------------------- | ------------------- | ---------- |
| Descripción             | 3-5 oraciones       | 🔴 BLOCKER |
| Contexto Técnico        | 2-3 bullets         | 🔴 BLOCKER |
| Acceptance Criteria     | 3-5 items           | 🔴 BLOCKER |
| Gherkin (si UI)         | 1-2 scenarios       | 🟡 WARNING |
| Doc References          | 2+ refs con anchors | 🔴 BLOCKER |
| Doc Refs anchor links   | `#section` en cada  | 🔴 BLOCKER |
| Skills                  | ≥1                  | 🔴 BLOCKER |
| Agents                  | ≥1                  | 🔴 BLOCKER |
| Owner                   | Nombre o TBD        | 🔴 BLOCKER |
| SK Leverage             | Contenido o N/A     | 🔴 BLOCKER |
| Implementation Evidence | Sección presente    | 🟡 WARNING |
| Commits                 | Sección presente    | 🟡 WARNING |

### Default ACs para Issues UI

> 🔴 **OBLIGATORIO:** Al generar issues que tocan UI, inyectar estos ACs automáticamente.
> Basado en los principios de `design-system-principles` y `design-engineering`.

#### Regla de Detección: ¿El issue es UI?

Un issue es **UI** si cumple **cualquiera** de estas condiciones:

| Condición                                           | Ejemplo                                                           |
| --------------------------------------------------- | ----------------------------------------------------------------- |
| Referencia `SCR-XXX` o `CMP-XXX` en cross-refs      | `Pantalla: SCR-005`, `Nuevo: CMP-003`                             |
| Crea o modifica archivos en `components/` o `app/`  | `components/ui/Card.tsx`, `app/(protected)/`                      |
| Incluye keywords UI en título o descripción         | "form", "tabla", "dashboard", "modal", "vista", "página", "botón" |
| Tiene `domains/ui` o `design-engineering` en Skills | `> **Skills:** domains/ui`                                        |

**Excepción:** Issues de **config/setup** (prefijo `SETUP-`, `CFG-`) NO reciben estos ACs, incluso si tocan archivos UI.

#### ACs Default (inyectar en Criterios de Aceptación)

| #   | AC Default                                                                                              | Basado en                                  |
| --- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| DS1 | No usar colores hardcoded — usar design tokens del sistema (`var(--*)`, semantic tokens)                | `design-system-principles` §1 (tokens)     |
| DS2 | No crear componentes inline — reutilizar UI kit del proyecto (consultar INVENTORY.md)                   | `design-system-principles` §3 (kit)        |
| DS3 | Usar tokens de radius, shadow, y spacing del design system — no valores literales ni genéricos          | `design-system-principles` §2, §4 (escala) |
| DS4 | Verificar coherencia visual en **todos** los temas del proyecto (light, dark, midnight u otros activos) | `design-system-principles` §5 (multi-tema) |

#### Formato de Inyección

Agregar al final de la sección `## Criterios de Aceptación` del issue, con separador visual:

```markdown
## Criterios de Aceptación

- [ ] {ACs específicos del issue...}
- [ ] {ACs específicos del issue...}

**Design System (auto):**

- [ ] DS1: No usar colores hardcoded — usar design tokens
- [ ] DS2: No crear componentes inline — reutilizar UI kit
- [ ] DS3: Usar tokens de radius/shadow/spacing — no valores literales
- [ ] DS4: Verificar coherencia visual en todos los temas del proyecto
```

#### Regla de Precedencia

> Si un AC específico del issue contradice un AC default, **el específico gana**.
> Ejemplo: Si el issue dice "usar color hex temporal para prototipo" → DS1 no aplica a ese caso.
> Documentar la excepción con un comentario inline: `(override DS1 — [razón])`.

### Anti-patterns (PROHIBIDO)

❌ Issues con solo título y checkbox
❌ Descripción de 1 oración
❌ AC genéricos ("funciona correctamente")
❌ Sin contexto técnico
❌ Sin referencias a docs
❌ Dejar placeholders (`{...}`, `[TODO]`, `TBD`)

### Definición de Issue Implementable (HARD GATE)

> 🔴 **Un issue NO se escribe hasta que pueda responder claramente estas 6 preguntas.**
> Si no puede → faltan inputs, volver a docs/design.

| #   | Pregunta                           | Dónde se responde en el issue                    |
| --- | ---------------------------------- | ------------------------------------------------ |
| 1   | **¿Qué cambia?**                   | Descripción + User Story                         |
| 2   | **¿Dónde cambia?**                 | Contexto Técnico (archivos, componentes, schema) |
| 3   | **¿Contra qué docs está trazado?** | Doc References (Inline) — US/SCR/E/BR-XXX        |
| 4   | **¿Qué pruebas lo validan?**       | Tests Requeridos + Gherkin                       |
| 5   | **¿Qué depende de él?**            | Blocked By / Blocks                              |
| 6   | **¿Qué queda fuera?**              | Out of Scope                                     |

**Self-check rápido:**

```
¿Si le paso este issue a un dev que no conoce el proyecto,
puede implementarlo sin preguntar nada?
├─► SÍ → ✅ Implementable
└─► NO → 🔴 Falta información, no escribir todavía
```

### Templates

| Template                    | Uso                              |
| --------------------------- | -------------------------------- |
| `issue.template.md`         | Issues regulares                 |
| `testing-issue.template.md` | Issues de testing de fin de epic |
| `epic.template.md`          | Epics                            |

> 🔴 **MANDATORY:** Leer el template ANTES de generar el artefacto.
> El agente DEBE usar `cat` del template, nunca escribir de memoria.
> `epic.template.md` define: Metadata, Objetivo, tabla de Issues (5 cols: # | Issue | Título | SP | Status), Scope, Dependencias.

---

## §5. Epic & Issue Ordering

### Epic Dependency Graph (MANDATORY)

> 🔴 **ANTES de asignar EPIC-NN:**

1. Listar TODOS los epics planeados (sin números aún)
2. Para cada par: ¿Epic A depende de Epic B?
3. Construir grafo de dependencias
4. **Topological sort** (sin dependencias primero)
5. Asignar EPIC-NN en el orden resultante
6. **Verificación de linearidad:** "¿Puedo implementar EPIC-01 → 02 → 03... sin saltar?"

**Heurística de desempate** (sin dependencia directa):

| Prioridad | Tipo                | Ejemplo        |
| --------- | ------------------- | -------------- |
| 1         | DB/Schema           | EPIC-01-SCHEMA |
| 2         | Core business logic | EPIC-02-FUND   |
| 3         | UI/Views            | EPIC-03-DASH   |
| 4         | Integrations        | EPIC-04-SYNC   |
| 5         | Testing/Polish      | EPIC-05-TESTS  |

### Two-Pass Issue Ordering (MANDATORY)

> 🔴 **ANTES de generar archivos, hacer dos pasadas por epic.**

**Pasada 1: Stubs (planificación)**

| #   | Título (stub)                | Depende de        | Tipo             |
| --- | ---------------------------- | ----------------- | ---------------- |
| ?   | Schema Documentos            | —                 | Schema/Migration |
| ?   | Drive API Integration        | —                 | Integration/API  |
| ?   | Upload y Gestión de Archivos | Drive API, Schema | Server Action    |
| ?   | 🧪 Epic Tests                | Todos             | Testing          |

**Reglas de dependencia:**

| Orden | Tipo                          | Va antes de       |
| ----- | ----------------------------- | ----------------- |
| 1     | Schema/Migration              | Todo lo demás     |
| 2     | Integration/API client        | Quien las consume |
| 3     | Server actions (CRUD core)    | UI que las llama  |
| 4     | UI views                      | Business logic    |
| 5     | Business logic avanzada       | Polish            |
| 6     | Polish (export, badges, etc.) | Testing           |
| N     | 🧪 Testing                    | SIEMPRE último    |

**Pasada 2: Asignar IDs por topological sort**

1. Construir grafo de dependencias desde stubs
2. Topological sort (sin dependencias primero)
3. Desempatar por tipo (tabla arriba)
4. Asignar IDs secuenciales: PREFIX-001, PREFIX-002, ...
5. **Verificación:** Issue-N NUNCA depende de Issue-M donde M > N
6. Si violación → intercambiar números ANTES de generar

### Implementability Rule

> 🔴 EPIC-N NUNCA depende de EPIC-M donde M > N.
> Issue-N NUNCA depende de Issue-M donde M > N.
> Los IDs YA SON el orden de implementación.

### Anti-patterns

| ❌ Evitar                                                  | ✅ Correcto                                                |
| ---------------------------------------------------------- | ---------------------------------------------------------- |
| Asignar IDs mientras se escribe cada issue                 | Primero stubs, luego IDs                                   |
| Numerar por orden de User Story (US-011 → US-012 → US-013) | Numerar por dependencia técnica                            |
| Infra/API como issue 006 porque vino de otra US            | Infra/API como issue 002 porque los demás dependen de ella |
| Sección "Orden de implementación" que contradice IDs       | IDs YA SON el orden de implementación                      |

---

## §6. ID Rules

### Prefijos por Dominio

| Dominio             | Prefijo  | Ejemplo   |
| ------------------- | -------- | --------- |
| **Decisiones/ADRs** | `ADR-`   | ADR-001   |
| Autenticación       | `AUTH-`  | AUTH-001  |
| Dashboard           | `DASH-`  | DASH-001  |
| Usuarios            | `USER-`  | USER-001  |
| Configuración       | `CFG-`   | CFG-001   |
| Core/Misc           | `CORE-`  | CORE-001  |
| Infraestructura     | `INFRA-` | INFRA-001 |
| Shell/Navigation    | `SHELL-` | SHELL-001 |

> **Tip:** Si toca múltiples áreas, usar el prefijo del **punto de entrada**.

### Cross-refs desde Docs/Design

| Tipo        | Formato | Uso en Issues         |
| ----------- | ------- | --------------------- |
| Personas    | P-XXX   | "Como P-001 (Admin)…" |
| Stories     | US-XXX  | "Implementa US-003"   |
| Pantallas   | SCR-XXX | "Pantalla: SCR-002"   |
| Flujos      | FLW-XXX | "Flujo: FLW-001"      |
| Componentes | CMP-XXX | "Nuevo: CMP-003"      |

### Reglas de Estabilidad

- IDs por topological sort dentro del epic
- Si issues existen → preservar numeración
- Nuevos issues toman siguiente número disponible
- IDs eliminados NO se reutilizan

### Nombre de archivo

```
{PREFIX}-{NUM}-{slug}.md
```

Ejemplo: `AUTH-001-login-form.md`

---

## §7. Resolution Algorithm (Agent & Skill Assignment)

> 🔴 **Al generar cada issue, usar estos 8 pasos para asignar `Skills:` y `Agents:`**

**Step 1 — detect_matching_combos:** Buscar en `combos.md` TODOS los combos cuyos keywords matcheen.

**Step 2 — select_primary_combo:** Del set matcheado, elegir el combo con mayor relevancia (más keywords).

**Step 3 — allow_one_complement:** Si matchearon combos de la MISMA dimensión → solo el primario. Si DIFERENTES dimensiones → permitir máximo 1 complementario.

| Ejemplo         | Combos                        | Dimensiones    | Resultado                          |
| --------------- | ----------------------------- | -------------- | ---------------------------------- |
| ✅ Aceptable    | `ui_crud` + `schema_db`       | ui + db        | 2 combos (diferentes dimensiones)  |
| ❌ No permitido | `ui_crud` + `ui_visual`       | ui + ui        | Solo el primario (misma dimensión) |
| ✅ Aceptable    | `auth_rbac` + `server_action` | security + api | 2 combos (diferentes dimensiones)  |

**Step 4 — enrich_via_scoring:** Revisar `skills.md` para skills adicionales (+10 keyword, +15 domain).

**Step 5 — apply_agent_relationships:** Aplicar reglas de `registry.yaml`:

- `narrows` → preferir el más específico
- `excludes` → nunca cargar ambos
- `complements` → pueden coexistir

**Step 6 — dedupe:** Eliminar duplicados, ordenar alfabéticamente.

**Step 7 — apply_caps:** max 3 agents, max 5 skills por issue.

**Step 8 — write_to_issue:** Escribir `> **Skills:**` y `> **Agents:**` al issue.

> 🔴 **VALIDACIÓN:** ≥ 1 skill + ≥ 1 agent. Fallback: `domains/api` + `domains/ui` y `backend-specialist` + `frontend-specialist`.

---

## §8. Priority Assignment

| Priority | Criterio                                   |
| -------- | ------------------------------------------ |
| P0       | Bloquea otros issues, infraestructura base |
| P1       | MVP crítico, primera iteración             |
| P2       | Segunda iteración                          |
| P3       | Nice-to-have                               |

**Orden de asignación:**

1. Identificar dependencias entre issues
2. Issues que bloquean otros → P0
3. Issues en flujos críticos → P1
4. Resto P2/P3

**Orden de implementación:**

1. P0 de todos los epics primero
2. Luego P1 por epic (respetando dependencias)

---

## §9. ADR Issues

**Cuando hay OQ High impact o decisión técnica pendiente:**

1. Crear issue `ADR-XXX: Decidir [tema]`
2. Marcar issues afectados con `> **Blocked By:** ADR-XXX`
3. En ADR incluir: contexto, opciones A/B, pros/cons, placeholder para decisión

**Triggers:**

| Trigger           | Ejemplo                               |
| ----------------- | ------------------------------------- |
| Infra tradeoff    | Cache strategy, edge functions        |
| API contract      | Webhooks, retries, idempotencia       |
| Modelado complejo | Multi-tenant, soft-delete, versioning |
| UI architecture   | Offline-first, realtime, wizard state |

**Formato ADR issue:**

```markdown
# ADR-001: Decidir [tema]

> **Issue ID:** ADR-001
> **Priority:** P0
> **Effort:** XS
> **Status:** 📋 Backlog
> **Epic:** [EPIC-XXX](../epics/EPIC-XXX.md)

## Contexto

[Descripción de la decisión pendiente]

## Opciones

### A) [Opción A]

- Pros: ...
- Cons: ...

### B) [Opción B]

- Pros: ...
- Cons: ...

## Decisión

**Pendiente**

## Afecta a

- {PREFIX}-XXX
- {PREFIX}-YYY
```

---

## §10. Additional Rules

### Testing Issues por Epic

> 🔴 Cada epic SIEMPRE termina con un issue de testing como **último issue secuencial**.

Template: `testing-issue.template.md`

```markdown
| AUTH-001 | Login Form | P0 | ✅ |
| AUTH-002 | Session | P0 | ✅ |
| AUTH-003 | Password Reset | P1 | ✅ |
| **AUTH-004** | **🧪 Epic Tests** | **P1** | 📋 |
```

### @ui-critic Audit Issues por Epic UI

> 🔴 **Epics con UI** incluyen un issue de `@ui-critic` audit como **penúltimo issue**
> (el de testing sigue siendo el último).

Template: `ui-critic-issue.template.md`

#### Regla de Detección: ¿El epic tiene UI?

Un epic es **UI** si cumple **cualquiera** de estas condiciones:

| Condición                                                                      | Ejemplo                               |
| ------------------------------------------------------------------------------ | ------------------------------------- |
| ≥1 issue con `SCR-XXX` o `CMP-XXX` en cross-refs                               | `Pantalla: SCR-005`, `Nuevo: CMP-003` |
| ≥1 issue con `domains/ui` o `design-engineering` en Skills                     | `> **Skills:** domains/ui`            |
| ≥1 issue que crea/modifica archivos en `components/` o `app/` (páginas con UI) | `components/ui/Card.tsx`              |

**Excepción:** Epics de solo data/API/infra/workflow → NO generar issue ui-critic.

#### Posición en el Epic

El issue `@ui-critic` es **penúltimo**. El issue de `🧪 Tests` es **siempre último**.

```markdown
| AUTH-001 | Login Form | P0 | ✅ |
| AUTH-002 | Session | P0 | ✅ |
| AUTH-003 | Password Reset | P1 | ✅ |
| **AUTH-004** | **🎨 @ui-critic Audit** | **P1** | 📋 |
| **AUTH-005** | **🧪 Epic Tests** | **P1** | 📋 |
```

#### Reglas

- El issue de ui-critic está **bloqueado por** todos los issues de implementación del epic
- El issue de testing puede avanzar **en paralelo** con ui-critic (no se bloquean entre sí)
- Si el epic tiene solo 1 issue de implementación → aún así generar ui-critic (un componente puede tener múltiples violaciones)
- El issue usa agent `@ui-critic` con skills `design-system-principles` + `design-engineering`

### Slicing Rules

| Size   | Descripción             | Target                |
| ------ | ----------------------- | --------------------- |
| ✅ S-M | Ideal: 0.5-1 día        | Preferir siempre      |
| ⚠️ L   | Complejo pero necesario | Si no se puede partir |
| ❌ XL  | Muy grande              | Dividir en 2-4 issues |

### Quality Check Levels

| Level        | Trigger            | Scope            | Workflow              |
| ------------ | ------------------ | ---------------- | --------------------- |
| **QC-Issue** | Al completar issue | Issue individual | `/implement` Phase QC |
| **QC-Epic**  | Al completar epic  | Todos del epic   | Epic template QC      |

### Epic Update Rule (Enforcement en /implement)

> 🔴 **Al cerrar un issue con `/implement`, el agente DEBE actualizar el epic.**
>
> 1. Leer campo `> **Epic:**` del issue
> 2. Abrir el archivo del epic en `docs/backlog/{version}/epics/`
> 3. Marcar el issue como ✅ en la columna Status de la tabla
> 4. Si TODOS los issues son ✅ → cambiar status del epic a `✅ Done`
>
> **Enforcement:** `implement/close.md` §6.3b tiene verificación `// turbo` que bloquea commit si el epic no fue actualizado.
> | **QC-Release** | Pre-deploy | Milestone | `/audit R4` |

### Collaboration

| Con           | Cuándo             | Acción                       |
| ------------- | ------------------ | ---------------------------- |
| **design**    | Input para backlog | Recibir handoff de 15_DESIGN |
| **implement** | Issues listos      | Handoff a `/implement`       |
| **architect** | Decisión pendiente | Crear ADR-XXX issue          |

### SIEMPRE

1. Verificar docs (00-15) existen (full mode)
2. Formato de título: `# PREFIX-NUM: Título`
3. Metadata block compatible con update-board
4. Cross-reference P/US/SCR/FLW/CMP-XXX
5. Declarar dependencias entre issues
6. Agrupar issues en epics
7. Ubicar en `docs/backlog/{version}/issues/`

### NUNCA

1. Inventar features no documentados
2. Crear issues sin metadata block
3. Ignorar formato de título (rompe BOARD.md)
4. Crear issues "umbrella" demasiado grandes
5. Omitir acceptance criteria o Gherkin
6. Crear epic sin issue de testing al final
7. **Generar BOARD.md manualmente**

---

## Flujo Completo

```
/start → /discovery → /proposal → /docs → /design → /backlog → /implement → /audit
```

---

_TimeKast Factory — Backlog Expert Skill (v2)_
