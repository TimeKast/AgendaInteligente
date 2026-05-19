# TimeKast Factory — Architecture

> **Mapa del kit.** Qué es la Factory, cómo se organiza `.claude/`, cómo fluye la información desde discovery hasta código. Narrativa ligera — para detalle operativo, seguir los cross-refs a rules.

---

## 1. ¿Qué es TimeKast Factory?

**Delivery OS, no starter kit.** La Factory es un sistema para **generar software con IA** — skills + agents + workflows + rules que orquestan Claude Code para entregar producto consistente. El starter kit (Next.js + Drizzle + NextAuth + Tailwind) es el **output**, no el propósito. El propósito es la **pipeline de delivery** que produce proyectos con el mismo esqueleto, navegables por humanos y agentes.

---

## 2. Ontología Claude Code

Toda primitiva del kit mapea a un concepto del runtime. No inventamos categorías fuera de CC.

| Concepto del kit                          | Primitiva CC          | Ubicación               |
| ----------------------------------------- | --------------------- | ----------------------- |
| Agent (proceso invocable con I/O)         | Subagent              | `.claude/agents/`       |
| Workflow TimeKast (orchestrator de pasos) | Skill `tk-*`          | `.claude/skills/tk-*/`  |
| Knowledge coding (cómo — fase código)     | Skill `kb-*`          | `.claude/skills/kb-*/`  |
| Sistema shipped por el kit                | Skill `sk-*`          | `.claude/skills/sk-*/`  |
| Knowledge documental (fase docs/design)   | Skill `doc-*`         | `.claude/skills/doc-*/` |
| Workflow interno Factory                  | Skill `fx-*`          | `.claude/skills/fx-*/`  |
| Skill project-specific                    | Skill `op-*` / `pj-*` | `.claude/skills/op-*/`  |
| Slash command delgado                     | Command               | `.claude/commands/`     |
| Rules always-on                           | Rules via `@import`   | `.claude/rules/`        |

> Detalle de prioridad, conflict resolution y routing semántico → [`.claude/rules/CC.md §1`, `§6`](../rules/CC.md). Tier de skills (P1/P2/P3) → [`CORE.md §3`](../rules/CORE.md).

### `kb-*` vs `sk-*`

Co-existen por routing semántico. Par por dominio:

- **`kb-*`** = patterns para escribir código nuevo. _"¿Qué pattern aplico?"_
- **`sk-*`** = sistema shipped por el kit. _"¿Cómo me engancho al sistema existente?"_

5 pares canónicos post-KIT-018: `kb-security`/`sk-security`, `kb-api`/`sk-api`, `kb-db`/`sk-db`, `kb-testing-nextjs`/`sk-testing-nextjs`, `kb-ui`/`sk-ui`.

---

## 3. Pipeline SSOT chain

```
Discovery → Proposal → Docs → Design → Backlog → Code
```

Cada fase genera un documento que es SSOT para la siguiente. No se brinca fases.

| Fase      | Documento                                | SSOT para                |
| --------- | ---------------------------------------- | ------------------------ |
| Discovery | `project/planning/00_DISCOVERY_BRIEF.md` | Requisitos, scope        |
| Proposal  | `project/planning/01_PROPOSAL.md`        | Oferta al cliente        |
| Docs      | `project/planning/02–14_*.md`            | Personas, US, BR, Data   |
| Design    | `project/planning/15_DESIGN.md`          | Pantallas, flujos, comps |
| Backlog   | `project/backlog/*/issues/*.md`          | Issues ejecutables       |
| Code      | `src/**`                                 | Implementación           |

> Regla: upstream decide, downstream ejecuta. Ver [`CORE.md §3 SSOT Chain`](../rules/CORE.md).

---

## 4. Regla de 3 audiencias (directorios)

La documentación del repo está segmentada por audiencia. Confundir buckets es un smell — un proyecto derivado no debería clonar el CHANGELOG de la Factory ni el cliente ver `getting-started` del kit.

| Directorio      | Audiencia                                       | Viaja con…        | Contenido ejemplo                                                 |
| --------------- | ----------------------------------------------- | ----------------- | ----------------------------------------------------------------- |
| `docs/`         | Cliente final                                   | Entregable        | product narrative, user docs, release notes                       |
| `project/`      | Dev del proyecto derivado                       | Proyecto derivado | backlog, planning vivo, migration, reference autogen              |
| `.claude/docs/` | Dev del kit (y dev derivado que quiere onboard) | Kit Claude        | getting-started, troubleshooting, CHANGELOG factory, ARCHITECTURE |

---

## 5. Onboarding 5-min (dev nuevo al kit)

1. `git clone` del kit
2. Leer [`CLAUDE.md`](../../CLAUDE.md) — entry point del runtime, inlinea las 5 rules vía `@import`
3. Leer [`CC.md §6`](../rules/CC.md) — ontología y prefijos de skills
4. Leer [`SK.md`](../rules/SK.md) — convenciones del starter kit (DB, UI, QA)
5. `pnpm install` + configurar `.env.local` (ver [`getting-started.md`](./getting-started.md))

Listo. El resto se auto-descubre vía `INVENTORY.md` / `CODEBASE.md` / `HOOKS.md` (autogenerados).

---

## 6. Convenciones de naming

### Prefijos de skills

| Prefijo         | Significado                                  |
| --------------- | -------------------------------------------- |
| `tk-*`          | Workflow TimeKast (`/implement`, `/docs`, …) |
| `kb-*`          | Knowledge base — fase coding                 |
| `sk-*`          | Starter Kit system (shipped)                 |
| `doc-*`         | Knowledge base — fase documental             |
| `fx-*`          | Factory-internal (mantenimiento del kit)     |
| `op-*` / `pj-*` | Operational / project-specific (derivado)    |

### Prefijos de IDs del backlog

| Prefijo    | Dominio                                          |
| ---------- | ------------------------------------------------ |
| `FX-*`     | Factory infra (hooks, tooling del kit)           |
| `PL-*`     | Pipeline del delivery OS                         |
| `PR-*`     | Workflow authoring (tk-discovery, tk-backlog, …) |
| `KIT-*`    | Starter Kit hygiene y evolución                  |
| `VIZ-*`    | Viz / data products                              |
| `QA-*`     | QA / testing                                     |
| `DEPLOY-*` | Deploy / ops                                     |

### Commits (Conventional Commits + keyword footer)

```
<type>(<scope>): <título imperativo, ≤72 chars>

<body opcional>

Closes: FX-008
Refs: PL-001
```

`Closes:` = este commit completa el issue (debe estar ✅ + Evidence). `Refs:` = referencia contextual. Detalle → [`GIT.md §3`](../rules/GIT.md).

---

## 7. Roadmap

El backlog vivo está en [`project/backlog/`](../../project/backlog/) (post-KIT-005 migrará a `project/backlog/`). Milestone actual: **v6.0** — ver [`project/backlog/v6.0/EXECUTION-ORDER.md`](../../project/backlog/v6.0/EXECUTION-ORDER.md) para la lista 1-by-1.

Release notes de la Factory → [`CHANGELOG.md`](./CHANGELOG.md) (este bucket).

---

## 8. Cross-references

| Para…                                  | Ir a                                                             |
| -------------------------------------- | ---------------------------------------------------------------- |
| Rules del runtime                      | [`.claude/rules/`](../rules/)                                    |
| Doctrina del kit / conflict resolution | [`CORE.md`](../rules/CORE.md)                                    |
| Disciplina de código                   | [`CODING.md`](../rules/CODING.md)                                |
| Git / commits / branching              | [`GIT.md`](../rules/GIT.md)                                      |
| Starter kit (DB, UI, QA)               | [`SK.md`](../rules/SK.md)                                        |
| Claude Code runtime                    | [`CC.md`](../rules/CC.md)                                        |
| Onboarding detallado                   | [`getting-started.md`](./getting-started.md)                     |
| FAQ / errores del stack                | [`troubleshooting.md`](./troubleshooting.md)                     |
| Design system activo                   | [`design-system-neomorphism.md`](./design-system-neomorphism.md) |

---

_TimeKast Factory — ARCHITECTURE (introduced by KIT-016; absorbs KIT-007)_
