# Definition of Ready & Done

> Criterios estándar para issues en proyectos TimeKast Factory.
> **Ubicación:** `.claude/rules/DOR_DOD.md`
> **Cargado:** always-on vía `@import` desde `CLAUDE.md`.

---

## Definition of Ready (DoR)

Un issue está **Ready** para implementar cuando tiene:

### Obligatorio

| ✅  | Criterio                                       |
| --- | ---------------------------------------------- |
| [ ] | Título con ID: `PREFIX-XXX: Descripción clara` |
| [ ] | Descripción del problema o feature             |
| [ ] | Acceptance Criteria (preferible Gherkin)       |
| [ ] | Prioridad asignada (P0/P1/P2/P3)               |
| [ ] | Epic asociado                                  |

### Si aplica

| ✅  | Criterio                           | Cuándo                                                                                                    |
| --- | ---------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [ ] | API Contract definido              | Issues con Server Actions                                                                                 |
| [ ] | Mockups/wireframes                 | Issues de UI                                                                                              |
| [ ] | **Component test declarado en AC** | Componentes con interacción (onClick, forms, state, conditional render) — DEBE aparecer como AC explícito |
| [ ] | **E2E test declarado en AC**       | Flujos cross-page, auth/RBAC — DEBE aparecer como AC explícito                                            |
| [ ] | Dependencias identificadas         | Issues bloqueados                                                                                         |
| [ ] | ADR asociado                       | Decisiones de arquitectura                                                                                |

> 🔴 **Enforcement para `/backlog`:** issues que declaran cambio de componente interactivo SIN una AC de component test → **bloquear creación**. El creador debe agregar la AC o justificar (ej: "componente puramente presentacional, sin handlers").

---

## Definition of Done (DoD)

Un issue está **Done** cuando cumple:

### Código ✅

| ✅  | Criterio                         | Comando          |
| --- | -------------------------------- | ---------------- |
| [ ] | Implementación completa según AC | —                |
| [ ] | Sin errores TypeScript           | `pnpm typecheck` |
| [ ] | Sin errores lint                 | `pnpm lint`      |
| [ ] | Build exitoso                    | `pnpm build`     |

### Tests ✅

Pirámide de 3 capas (ver `SK.md §4.2`). Según naturaleza del issue, al menos UNA capa debe cubrir el cambio:

| ✅  | Criterio                                                              | Comando         |
| --- | --------------------------------------------------------------------- | --------------- |
| [ ] | Unit — funciones puras, helpers, validaciones                         | `pnpm test`     |
| [ ] | Component (RTL) — componentes con interacción (onClick, forms, state) | `pnpm test`     |
| [ ] | E2E (Playwright) — flujos cross-page, auth, RBAC                      | `pnpm test:e2e` |
| [ ] | Todos los tests pasan                                                 | `pnpm verify`   |

### Documentación ✅

| ✅  | Criterio                             |
| --- | ------------------------------------ |
| [ ] | JSDoc en funciones públicas nuevas   |
| [ ] | Implementation Notes en issue.md     |
| [ ] | CHANGELOG entry (si feature visible) |

### Review ✅

| ✅  | Criterio                               |
| --- | -------------------------------------- |
| [ ] | QC Report generado (`/audit R0`)       |
| [ ] | Todas las AC verificadas con evidencia |
| [ ] | Usuario aprueba cierre explícitamente  |

---

## Excepciones

| Tipo de Issue        | Puede omitir    | Razón                     |
| -------------------- | --------------- | ------------------------- |
| **Hotfix P0**        | Tests unitarios | Urgencia, agregar después |
| **Spike/PoC**        | Tests, Docs     | Es investigación          |
| **Refactor interno** | CHANGELOG       | No afecta usuario         |
| **Docs-only**        | Build, Tests    | Solo documentación        |

---

## Regla de Oro

> 🛑 **No implementar issue que no cumpla DoR.**
> 🛑 **No cerrar issue que no cumpla DoD.**

---

_TimeKast Factory — Methodology Rules_
