# Phase 6a: Gap Analysis Pass

> **Carga:** Solo después de generar epics e issues (Phase 5).
> **Solo full mode.** En add mode → overlap check inline.
> **Propósito:** Detectar concerns transversales y gaps que la generación por-epic no captura.

---

## Instrucciones

> 🎯 **Este NO es un checklist de validación** — es un segundo pase creativo.
> El agente debe re-leer los issues generados como un TODO y hacerse estas preguntas.

---

## Pregunta 1: Deletion Dependencies (Cross-Cutting)

> "¿Qué pasa cuando borras una entidad padre que tiene hijos?"

**Verificar:**

1. Identificar todas las relaciones padre→hijo en `06_DATA_MODEL.md`
2. Para cada relación: ¿el issue del CRUD padre maneja la eliminación con dependencias?
3. Si NO: ¿se necesita un issue cross-cutting de "deletion guards"?

---

## Pregunta 2: Navigation Gaps

> "¿Todas las pantallas SCR-XXX son accesibles desde la navegación?"

**Verificar:**

1. Listar todas las SCR-XXX del 15_DESIGN.md
2. ¿Hay issues que cubran sidebar items, tabs, o bottomnav con items de negocio?
3. ¿El Starter Kit sidebar/bottomnav está configurado con los items de ESTE proyecto?

---

## Pregunta 3: External Integrations

> "¿Hay datos que viven en sistemas externos y necesitan sincronización?"

**Verificar:**

1. Buscar menciones a servicios externos en `06_DATA_MODEL`, `05_BUSINESS_RULES`, `15_DESIGN`
2. Para cada integración: ¿hay issues para setup + sync recovery?

---

## Pregunta 4: Starter Kit Customization

> "¿Qué features del Starter Kit necesitan customización significativa?"

| Feature SK                      | ¿Necesita customización para este proyecto? |
| ------------------------------- | ------------------------------------------- |
| Login/Auth UI (tema, providers) | ¿?                                          |
| Layout/Sidebar                  | ¿?                                          |
| BottomNav (mobile)              | ¿?                                          |
| User management                 | ¿?                                          |
| PWA config                      | ¿?                                          |

> Regla: Si customización > 1 hora → necesita issue propio.

---

## Pregunta 5: Independent vs Embedded Views

> "¿Hay entidades que aparecen como tabs dentro de otra entidad Y como página independiente?"

**Verificar:**

1. Revisar SCR-XXX — ¿alguna pantalla es un tab de una entidad padre?
2. Si también existe como lista independiente → ¿hay issues separados para ambas vistas?

---

## Pregunta 6: Consolidation Check (Anti-Super-Issue)

> "¿Algún issue absorbe demasiados concerns y merece descomposición?"

**Verificar:**

1. Identificar issues con **≥ 8 SP** o que cubran **≥ 4 sub-concerns distintos**
2. Para cada uno: ¿los sub-concerns son independientes y podrían tener su propio ciclo de testing?
3. Si SÍ: proponer split en 2-4 issues más atómicos

**Señales de over-consolidation:**

| Señal                                             | Ejemplo                                                     | Acción                                                 |
| ------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------ |
| Issue cubre computation + guards + UI + real-time | Un "Lockdown Service" que es backend + frontend + WebSocket | Split en: computation, guards/validation, countdown UI |
| Issue tiene ≥ 6 archivos a crear                  | Demasiados cambios para un PR                               | Split por capa (schema, actions, UI)                   |
| Issue tiene ≥ 5 Gherkin scenarios                 | Demasiados flujos para testear como unidad                  | Split por flujo                                        |
| AC tiene ≥ 8 items                                | Demasiados criterios = scope muy amplio                     | Split por feature sub-unit                             |

> 🔴 **Regla:** Un issue ideal es S-M (0.5-1 día). Si un issue es L-XL (>2 días) y tiene múltiples concerns → SPLIT.

---

**Si hay gaps:** Generar los issues faltantes antes de continuar.
**Si no hay gaps:** Continuar a Phase 6b (Traceability).

---

_TimeKast Factory — Backlog Gap Analysis Phase_
