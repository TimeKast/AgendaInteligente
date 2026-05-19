# `.claude/docs/` — Kit Meta Docs

> **Propósito:** Documentación del **kit** (TimeKast Factory / Starter Kit). Viaja con `.claude/` a cualquier proyecto derivado.
>
> **No son** docs del proyecto derivado **ni** docs del cliente final.

---

## Regla de 3 audiencias

Este directorio es uno de tres buckets de documentación. Cada uno tiene audiencia, destino y contenido distintos:

| Directorio      | Audiencia                                       | Viaja con…        | Ejemplos                                                          |
| --------------- | ----------------------------------------------- | ----------------- | ----------------------------------------------------------------- |
| `docs/`         | Cliente final                                   | Entregable        | product narrative, user docs, release notes                       |
| `project/`      | Dev del proyecto derivado                       | Proyecto derivado | backlog, planning vivo, migration, reference autogen              |
| `.claude/docs/` | Dev del kit (y dev derivado que quiere onboard) | Kit Claude        | getting-started, troubleshooting, CHANGELOG factory, ARCHITECTURE |

---

## Contenido de este bucket

| Archivo                                                        | Qué es                                                                                        |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [ARCHITECTURE.md](./ARCHITECTURE.md)                           | Mapa del kit — ontología CC, pipeline SSOT, onboarding 5-min, 3-audience rule                 |
| [getting-started.md](./getting-started.md)                     | Setup completo del kit (dev onboarding al stack, no al proyecto)                              |
| [troubleshooting.md](./troubleshooting.md)                     | FAQ del stack (OAuth redirects, session secrets, errores comunes)                             |
| [CHANGELOG.md](./CHANGELOG.md)                                 | Changelog de la **Factory** (no del proyecto derivado)                                        |
| [design-system-neomorphism.md](./design-system-neomorphism.md) | Narrativa del DS shipped por el kit (Neomorphism 2.0). Pair con skill `sk-tokens-neomorphism` |

---

## Cross-references

- **Rules del runtime:** `.claude/rules/` — CORE, CODING, GIT, SK, CC
- **Skills y agents:** `.claude/skills/`, `.claude/agents/`
- **Entry point:** `CLAUDE.md` (raíz) — inlinea las rules vía `@import`

---

_TimeKast Factory — kit meta docs (introduced by KIT-016)_
