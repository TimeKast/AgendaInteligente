---
name: design-expert
description: Creates design specifications from Discovery Brief and Docs
triggers:
  - After /docs completed (central docs exist)
  - UI/UX design decisions needed
  - Screen mapping required
---

# 🎨 Design Expert

> **Role Skill** — Transforma Discovery Brief + Docs en especificación de diseño.
> **Output:** `docs/planning/15_DESIGN.md`

---

## Principios Fundamentales

1. **Mobile-first** — Diseñar para móvil primero, escalar hacia arriba
2. **Tokens sobre valores** — Usar design tokens del sistema, nunca hardcodear
3. **Componentes atómicos** — Diseños descompuestos en componentes reutilizables
4. **Accesibilidad inherente** — WCAG AA desde el diseño, no como fix posterior
5. **Consistencia visual** — Seguir patrones existentes del design system

---

## SSOT Chain Position

```
Discovery (00) → Proposal (01) → Docs (02-14) → Design (15) → Backlog → Code
                                                   ↑
                                               YOU ARE HERE
```

---

## Modes

| Mode         | Comando            | Comportamiento                                    |
| ------------ | ------------------ | ------------------------------------------------- |
| **generate** | `/design`          | Genera 15_DESIGN.md desde cero                    |
| **validate** | `/design validate` | Solo verifica prerrequisitos y estructura         |
| **refresh**  | `/design refresh`  | Regenera desde docs actualizados, preservando IDs |

**Regla de refresh:**

- Si `docs/planning/15_DESIGN.md` ya existe → preservar IDs `SCR/FLW/CMP/DD`
- Solo agregar/modificar contenido, no reordenar IDs
- Nuevos items reciben siguiente ID disponible
- IDs eliminados NO se reutilizan

---

## 0. Qué Hace y Qué NO Hace

**HACE:**

- Mapea TODAS las pantallas del MVP con URLs y accesos
- Documenta flujos de usuario principales (mínimo 3)
- Identifica componentes del Starter Kit a usar por pantalla
- Define componentes nuevos necesarios con prioridad
- Especifica data requirements (server actions, mutations)
- Crea wireframes ASCII cuando aclara
- Cross-referencia IDs de Personas, Stories, Rules

**NO HACE:**

- Discovery (eso es Discovery Expert)
- Documentación técnica (eso es Docs Expert)
- Diseñar arquitectura backend (eso es Architect)
- Evaluar calidad (eso es QE)
- Crear mockups visuales de alta fidelidad
- Implementar código (eso es /implement)

---

## 1. Inputs (SSOT)

> 🔴 **OBLIGATORIO:** Leer TODOS los documentos de planning (00-14) para generar un Design completo.

| Input           | Ubicación                             | Requerido         |
| --------------- | ------------------------------------- | ----------------- |
| Discovery Brief | `docs/planning/00_DISCOVERY_BRIEF.md` | ✅ (§3, §7)       |
| Proposal        | `docs/planning/01_PROPOSAL.md`        | ✅ MVP scope      |
| Feature Map     | `docs/planning/02_FEATURE_MAP.md`     | ✅ Feature list   |
| User Personas   | `docs/planning/03_USER_PERSONAS.md`   | ✅ Accesos/roles  |
| User Stories    | `docs/planning/04_USER_STORIES.md`    | ✅ Cross-refs     |
| Business Rules  | `docs/planning/05_BUSINESS_RULES.md`  | ✅ Validaciones   |
| Data Model      | `docs/planning/06_DATA_MODEL.md`      | ✅ Entidades      |
| Architecture    | `docs/planning/07_ARCHITECTURE.md`    | ✅ Stack/ADRs     |
| API Contracts   | `docs/planning/08_API_CONTRACTS.md`   | ✅ Server actions |
| Glossary        | `docs/planning/09_GLOSSARY.md`        | ⚪ Terminología   |
| Runbooks        | `docs/planning/10_RUNBOOKS.md`        | ⚪ Si existe      |
| Test Strategy   | `docs/planning/11_TEST_STRATEGY.md`   | ⚪ Si existe      |
| E2E Scenarios   | `docs/planning/12_E2E_SCENARIOS.md`   | ⚪ Si existe      |
| Risk Register   | `docs/planning/13_RISK_REGISTER.md`   | ⚪ Si existe      |
| Traceability    | `docs/planning/14_TRACEABILITY.md`    | ⚪ Stub de /docs  |
| SK Features     | `docs/reference/features.md`          | ✅ Anti-dup       |
| UI Skill        | `.agent/skills/frontend-design/`      | ⚪ Referencia     |

---

## 2. Stop Conditions

**🛑 STOP — No generar Design si:**

| Condición                           | Acción                   |
| ----------------------------------- | ------------------------ |
| 00_DISCOVERY_BRIEF §3 (Features) 🔴 | Volver a `/discovery`    |
| 00_DISCOVERY_BRIEF §7 (UI/UX) 🔴    | Volver a `/discovery`    |
| 01_PROPOSAL.md no existe            | Ejecutar `/proposal`     |
| 02_FEATURE_MAP.md no existe         | Ejecutar `/docs` primero |
| 03_USER_PERSONAS.md no existe       | Ejecutar `/docs` primero |
| 04_USER_STORIES.md no existe        | Ejecutar `/docs` primero |
| 05_BUSINESS_RULES.md no existe      | Ejecutar `/docs` primero |
| 06_DATA_MODEL.md no existe          | Ejecutar `/docs` primero |
| 07_ARCHITECTURE.md no existe        | Ejecutar `/docs` primero |
| 08_API_CONTRACTS.md no existe       | Ejecutar `/docs` primero |
| 09_GLOSSARY.md no existe            | Ejecutar `/docs` primero |
| 10_RUNBOOKS.md no existe            | Ejecutar `/docs` primero |
| 11_TEST_STRATEGY.md no existe       | Ejecutar `/docs` primero |
| 12_E2E_SCENARIOS.md no existe       | Ejecutar `/docs` primero |
| 13_RISK_REGISTER.md no existe       | Ejecutar `/docs` primero |
| 14_TRACEABILITY.md no existe        | Ejecutar `/docs` primero |

**⚠️ CONTINUAR CON CUIDADO si:**

- §7 está 🟡 → Generar con Open Questions + Architect gating

---

## 3. Output

**Archivo a generar:**

```
docs/planning/15_DESIGN.md
```

**Template:**

```
.agent/skills/roles/design/15_DESIGN.template.md
```

---

## 4. Consistencia de IDs

### Formatos (nuevos para Design)

| Tipo               | Formato   | Ejemplo          |
| ------------------ | --------- | ---------------- |
| Pantallas          | `SCR-XXX` | SCR-001, SCR-015 |
| Flujos             | `FLW-XXX` | FLW-001, FLW-003 |
| Componentes nuevos | `CMP-XXX` | CMP-001, CMP-008 |
| Decisiones         | `DD-XXX`  | DD-001, DD-003   |

### Cross-references (de Docs)

| Tipo     | Formato | Uso en Design                |
| -------- | ------- | ---------------------------- |
| Personas | P-XXX   | "Acceso: P-001 (Admin)"      |
| Stories  | US-XXX  | "Implementa: US-003, US-004" |
| Rules    | BR-XXX  | "Valida: BR-012"             |
| Entities | E-XXX   | "Data: E-001 (users)"        |

---

## 5. Secciones del Design

| #   | Sección                  | Contenido                                                   | IDs          |
| --- | ------------------------ | ----------------------------------------------------------- | ------------ |
| 1   | Mapa de Pantallas        | URL, propósito, acceso por rol, **FT-XXX**, Scope Notes     | SCR-XXX      |
| 2   | Navegación/Sidebar       | Estructura, ítems, permisos                                 | -            |
| 3   | Flujos Principales       | Mermaid diagrams, estados, errors                           | FLW-XXX      |
| 4   | Componentes por Pantalla | SK usados + nuevos + interaction states + surface hierarchy | CMP-XXX      |
| 5   | Data Requirements        | §5.0 Cache model + lifecycle, tabla mutations               | -            |
| 6   | Decisiones de Diseño     | Opciones + elegida + razón + **Data Impact**                | DD-XXX       |
| 7   | Open Questions           | Heredar Brief §7 + clasificar arch/product/cosmetic         | OQ-XXX       |
| 8   | Assumptions + Deferred   | §8.1 Supuestos, §8.2 Deferred to Backlog                    | A-XXX, D-XXX |
| 9   | Wireframes Textuales     | ASCII art por pantalla (**obligatorio**)                    | -            |
| 10  | Checklist Pre-Backlog    | **Post-validation**, counts reales con grep                 | -            |

---

## 6. Componentes del Starter Kit

| Componente                  | Uso Típico                              |
| --------------------------- | --------------------------------------- |
| `DataTable`                 | Listas con paginación, sorting, filters |
| `EmptyState`                | Estados vacíos con CTA                  |
| `PageHeader`                | Headers de página con acciones          |
| `Card`                      | Contenedores de contenido               |
| `Dialog` / `Sheet`          | Modales y sidebars                      |
| `Form` / `Input` / `Select` | Formularios                             |
| `Button`                    | Acciones primarias/secundarias          |
| `Avatar`                    | Usuarios, perfiles                      |
| `Badge`                     | Estados, tags                           |
| `Skeleton`                  | Loading states                          |
| `Toast`                     | Notificaciones                          |
| `Tabs`                      | Navegación en contexto                  |

**Para cada pantalla especificar:**

1. Componentes SK a usar (con variantes si aplica)
2. Componentes nuevos a crear (con `CMP-XXX`)
3. Estados de la pantalla (loading, empty, error, data)

> 🔴 **Anti-duplicación:** Antes de definir un componente como CMP-XXX (nuevo), verificar
> `features.md` §11 (Anti-patterns) para confirmar que no existe ya en el Starter Kit.

---

## 7. Flujos con Mermaid

**Mínimo 3 flujos críticos. Formato:**

```markdown
### FLW-001: [Nombre del Flujo]

**Descripción:** [Qué logra el usuario]
**Personas:** P-001, P-002
**Stories:** US-003 → US-005

\`\`\`mermaid
graph TD
A[SCR-001: Login] -->|credentials| B{Valid?}
B -->|Sí| C[SCR-002: Dashboard]
B -->|No| D[Error: Invalid credentials]
D --> A
\`\`\`

**Estados:**

- Happy path: [descripción]
- Error: [cómo se maneja]
- Edge case: [casos especiales]
```

---

## 8. Architect Gating

**Cargar `@[.agent/agents/architect.md]` cuando:**

| Trigger                      | Ejemplo                      |
| ---------------------------- | ---------------------------- |
| Offline-first UI             | Cache strategy, sync         |
| Realtime features            | WebSockets vs polling        |
| Complex state management     | Global state, URL state      |
| Performance-critical screens | Virtualization, lazy loading |
| Multi-step wizards           | State persistence            |

---

## 9. Reglas Duras

**SIEMPRE:**

1. Verificar que 03_USER_PERSONAS.md y 04_USER_STORIES.md existen
2. Mapear TODAS las pantallas del MVP con IDs (SCR-XXX)
3. Documentar mínimo 3 flujos críticos con Mermaid (FLW-XXX)
4. Identificar componentes SK para cada pantalla
5. Cross-reference P-XXX, US-XXX, BR-XXX, E-XXX
   5b. Cross-reference **FT-XXX** por pantalla en §1
   5c. Agregar **Scope Notes** cuando la pantalla simplifica vs Brief
6. Definir estados por pantalla (loading, empty, error, data)
   6b. Documentar **surface hierarchy** + **interaction states** por componente interactivo en §4
7. Declarar Open Questions y Assumptions
8. §0 DEBE incluir **contrast ratios WCAG** de tokens custom vs `--background` (mínimo AA 4.5:1)
9. §0 Motion DEBE incluir columna **Duration (ms)** por animación — no solo descriptivo
10. §0 Tokens custom DEBEN validarse contra `project-config.md` o SK `globals.css` — no usar defaults de Material/Tailwind
11. §5 DEBE incluir **§5.0 Cache model** + mutation lifecycle antes de la tabla
12. §6 DD DEBEN incluir **Data Impact** si afectan data
13. §7 DEBE heredar preguntas de Brief §7 + clasificar arch/product/cosmetic
14. §8 DEBE incluir **§8.2 Deferred to Backlog**
15. §10 se genera **post-validation** con counts reales (grep)
16. Si §0 Visual Direction difiere del SK default → §0.1 Impact Assessment obligatorio
17. Libertad creativa justificada con referencia al contexto del proyecto (Brief, Personas, branding)

**NUNCA:**

1. Inventar pantallas no derivadas de Discovery/Stories
2. Diseñar sin docs 03-04 existentes
3. Ignorar componentes del Starter Kit
4. Saltar data requirements
5. Omitir estados de error
6. Diseñar componentes que ya existen en el SK — verificar `features.md` §11 antes de crear CMP-XXX
7. Usar hex de color sin verificar contra SK tokens o project-config
8. Poner durations descriptivas sin ms ("snappy", "smooth" — SIEMPRE agregar ms concretos)
9. Cambiar paradigma visual sin §0.1 SK Style Migration Assessment
10. Declarar componente como `🏗️ SK Provided` si §0.1 lo marca como `🔧 Override`

---

## 9.1 Libertad Creativa

> La libertad creativa es **bienvenida** — el design no debe ser un copy-paste del SK.
> Pero debe ser **justificada** y **planificada**.

**PERMITIDO siempre que:**

1. La justificación referencie el contexto del proyecto (Discovery Brief, Personas, branding del cliente)
2. Se documente en §0.1 como "Creative Freedom Zone" con tipo y razón
3. Si cambia paradigma visual (ej: neo→glass, neo→flat) → impacto documentado con:
   - Tabla de impacto (§0.1)
   - DD formal en §6 si >5 componentes afectados
   - Estimación de issues de migration para backlog
4. Cambios cosméticos (paleta, tipografía, iconografía) NO requieren §0.1 completo — solo mención en §0

**Ejemplos de libertad creativa legítima:**

| Cambio                                       | ¿Necesita §0.1?                | ¿Necesita DD?       |
| -------------------------------------------- | ------------------------------ | ------------------- |
| Cambiar paleta de colores                    | No (mención en §0)             | No                  |
| Agregar animaciones nuevas                   | Sí (Creative Freedom Zone)     | No                  |
| Cambiar neumorphism → glassmorphism          | Sí (tabla de impacto completa) | Sí (>5 componentes) |
| Eliminar un tema (ej: midnight)              | Sí (fila en tabla)             | No (1 cambio)       |
| Diseñar componente CMP-XXX con estilo propio | No (es nuevo, no migración)    | No                  |

---

## 10. Handoff

Al completar:

```markdown
## ✅ Design Completado

**Proyecto:** [nombre]
**Pantallas:** SCR-001 → SCR-XXX ([N] total)
**Flujos:** FLW-001 → FLW-XXX ([M] total)
**Componentes nuevos:** CMP-001 → CMP-XXX ([K] total)

**Artefacto:**

- `docs/planning/15_DESIGN.md`

**Próximo paso:** `/backlog` para generar issues.
```

---

## 🔗 Colaboración

| Con           | Cuándo                    | Acción                                 |
| ------------- | ------------------------- | -------------------------------------- |
| **docs**      | Input para design         | Recibir handoff de 02-14               |
| **backlog**   | Design completo           | Handoff a `/backlog`                   |
| **ui**        | Componentes y patterns    | Consultar `frontend-design/SKILL.md`   |
| **architect** | UI architecture decisions | Cargar `@[.agent/agents/architect.md]` |

---

_TimeKast Factory — Design Expert Skill_
