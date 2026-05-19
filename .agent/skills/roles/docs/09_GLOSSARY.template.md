# Glossary — {{PROJECT_NAME}}

> Generado desde Discovery Brief por `/docs`
> **Fuente:** `docs/planning/00_DISCOVERY_BRIEF.md`
> **SSOT:** Este documento para vocabulario **del dominio del proyecto**
> **Quick-ref inline:** `docs/planning/project-config.md §12` (top 8-10 términos)

---

## Principios

1. **Project-specific únicamente.** Términos universales (Server Action, RBAC, SSOT, DoR, DoD, MVP, API, UI, UX, PK/FK…) los conoce el agente por su conocimiento base y reglas del kit — no duplicar aquí.
2. **Convenciones de naming** (snake_case tablas, camelCase TS, PascalCase tipos…) viven en `.claude/rules/SK.md` y skills `sk-*` — no duplicar.
3. **Open Questions / Assumptions** viven en `00_DISCOVERY_BRIEF.md` — este doc es vocabulario ejecutable, no fase discovery.

---

## Términos de Negocio

<!-- Core del doc. 10-30 términos del dominio del cliente. Lo que el agente DEBE usar con precisión.
     Incluir sinónimo ambiguo para que el agente corrija su copy. -->

| Término       | Definición                     | Usar en lugar de   | Usado en      |
| ------------- | ------------------------------ | ------------------ | ------------- |
| {{Término 1}} | {{Definición clara y concisa}} | {{sinónimo común}} | BR-XXX, E-XXX |
| {{Término 2}} | {{Definición clara y concisa}} | {{sinónimo común}} | US-XXX        |
| {{Término 3}} | {{Definición clara y concisa}} | {{sinónimo común}} | BR-XXX        |

---

## Estados de Entidades

<!-- State machines project-specific. Solo incluir si el proyecto tiene entidades con lifecycle no-obvio.
     Omitir sección completa si los estados son genéricos (DRAFT/PENDING/APPROVED/CANCELLED universales). -->

| Estado     | Significado     | Entidad     | Transiciones permitidas |
| ---------- | --------------- | ----------- | ----------------------- |
| {{ESTADO}} | {{Significado}} | {{Entidad}} | {{→ OTRO_ESTADO}}       |

---

## Códigos del Sistema

<!-- Enums, currencies, units, códigos del dominio. Solo project-specific. -->

| Código     | Significado     | Contexto         |
| ---------- | --------------- | ---------------- |
| {{Código}} | {{Significado}} | {{Dónde se usa}} |

<!-- Ejemplos:
| MXN   | Peso mexicano      | Currency (orders, pricing) |
| USD   | Dólar              | Currency (suppliers only)  |
| TIER1 | Complejidad baja   | Pricing estimator (demos)  |
-->

---

## Acrónimos (project-specific únicamente)

<!-- Omitir sección si no hay acrónimos únicos del proyecto.
     NO incluir MVP, API, UI, UX, DB, FK, PK (conocimiento base). -->

| Acrónimo     | Significado     |
| ------------ | --------------- |
| {{Acrónimo}} | {{Significado}} |

---

_Generado por TimeKast Factory — /docs_
