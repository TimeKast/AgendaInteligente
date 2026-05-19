---
trigger: manual
---

# Definition of Ready & Done

> Criterios estándar para issues en proyectos TimeKast Factory.
> **Ubicación:** `.agent/rules/DOR_DOD.md`
> **Cargado por:** `/implement` (on-demand, no always_on)

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

| ✅  | Criterio                   | Cuándo                     |
| --- | -------------------------- | -------------------------- |
| [ ] | API Contract definido      | Issues con Server Actions  |
| [ ] | Mockups/wireframes         | Issues de UI               |
| [ ] | Dependencias identificadas | Issues bloqueados          |
| [ ] | ADR asociado               | Decisiones de arquitectura |

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

| ✅  | Criterio                               | Comando     |
| --- | -------------------------------------- | ----------- |
| [ ] | Tests unitarios para lógica de negocio | `pnpm test` |
| [ ] | Tests pasan                            | `pnpm test` |

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
