# CORE — TimeKast Factory Rules

> Meta-reglas universales. Siempre activas, máxima prioridad.

---

## 1. Jerarquía de Autoridad

> En conflicto entre rules peer, gana la más específica de dominio (ej: commit → `GIT.md` manda sobre `CORE.md`).

### Rules always-on (peer-level)

| Archivo      | Dominio                                                                  |
| ------------ | ------------------------------------------------------------------------ |
| `CORE.md`    | Meta-reglas universales: jerarquía, idioma                               |
| `CODING.md`  | Disciplina de código: simplicidad, surgical changes, hard limits calidad |
| `GIT.md`     | Git: commits, push, --no-verify, branching adaptive                      |
| `SK.md`      | Starter Kit TimeKast: DB, UI, QA, code reuse, issues                     |
| `CC.md`      | Runtime Claude Code: routing, checkpoints, filesystem, hooks, ontología  |
| `DOR_DOD.md` | Definition of Ready / Done                                               |

### Resto de la jerarquía

| Nivel | Ubicación            | Propósito                                   |
| ----- | -------------------- | ------------------------------------------- |
| 1     | `rules/*.md`         | Siempre activas (tabla anterior)            |
| 2     | `skills/*`           | Conocimiento on-demand (ver prefijos abajo) |
| 3     | `agents/*.md`        | Personas/expertos invocables como subagents |
| 4     | `commands/*.md`      | Slash commands ejecutables                  |
| 5     | `project/planning/*` | Documentación del proyecto                  |
| 6     | `project/backlog/*`  | Issues y epics                              |

### Prioridad de Skills (por prefijo)

| Tier | Prefijo        | SSOT Para                                                                  | Prioridad |
| ---- | -------------- | -------------------------------------------------------------------------- | --------- |
| P1   | `op-*`, `pj-*` | Operational / project-specific                                             | Mayor     |
| P2   | `kb-*`         | Knowledge base (cómo hacer algo — fase coding)                             | Media     |
| P2   | `sk-*`         | Starter kit systems (sistemas shipped — notifications, tokens, navigation) | Media     |
| P2   | `doc-*`        | Knowledge base (fase documental — no coding)                               | Media     |
| P3   | `tk-*`, `fx-*` | Workflows TimeKast / factory-internal                                      | Base      |

> En conflicto, `op-*`/`pj-*` ganan sobre `kb-*`/`sk-*`/`doc-*`. `tk-*`/`fx-*` ejecutan pasos, no redefinen reglas.
> `doc-*` alimenta discovery/design/backlog (no se activa en `/implement`). `kb-*` se activa en fase de implementación.
> `kb-*` vs `sk-*`: co-existen por routing semántico (CC.md §1.1). `kb-*` = patterns para escribir código nuevo ("¿qué patterns aplico?"). `sk-*` = sistema shipped por el kit ("¿cómo me engancho al sistema existente?").

### SSOT Chain

```
Discovery → Proposal → Docs → Design → Backlog → Code
```

| Fase      | Documento                                | SSOT para                |
| --------- | ---------------------------------------- | ------------------------ |
| Discovery | `project/planning/00_DISCOVERY_BRIEF.md` | Requisitos, scope        |
| Proposal  | `project/planning/01_PROPOSAL.md`        | Oferta al cliente        |
| Docs      | `project/planning/02-14_*.md`            | Personas, US, BR, Data   |
| Design    | `project/planning/15_DESIGN.md`          | Pantallas, flujos, comps |
| Backlog   | `project/backlog/*/issues/*.md`          | Issues ejecutables       |

---

## 2. Idioma

- Usuario en español → responder en español **neutro o mexicano**. NUNCA argentino: prohibido voseo (`vos`/`tenés`/`querés`/`listá`/`incluí`...) y argentinismos (`che`/`dale`).
- Código, comentarios, variables → siempre en inglés

---

## 3. Regla de Oro

Skills y workflows NUNCA redefinen reglas — solo ejecutan.

---

_TimeKast Factory — Core Rules (L1 Meta)_
