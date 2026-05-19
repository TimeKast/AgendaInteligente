---
trigger: always_on
---

# CORE — TimeKast Factory Rules

> Reglas operativas universales del sistema. Aplican a TODO proyecto Factory,
> en cualquier runtime y stack. Siempre activas, máxima prioridad.
>
> **Reglas adicionales por capa:**
>
> - `CORE-RT.md` — Reglas del runtime AI activo
> - `CORE-SK.md` — Reglas para proyectos con Starter Kit

---

## 1. Agent Protocol

> **OBLIGATORIO antes de cualquier respuesta con código o diseño.**

1. **Detectar dominio** del request (keywords EN/ES)
2. **Matchear** contra `registry.yaml` §agents → `keywords_any` + `keywords_es`
3. **Cargar** el agent `.md` + skills del frontmatter
4. **Anunciar** antes de responder:

```markdown
🤖 Aplicando conocimiento de `@{agent-name}`...
🧰 Skills: `{skill-1}`, `{skill-2}`
```

**Reglas:**

- Scoring completo definido en `registry.yaml` §routing_policy (SSOT)
- Algoritmo de selección en skill `intelligent-routing`
- Si el usuario menciona `@agent` explícitamente → usarlo
- Máx 3 agents, máx 5 skills por tarea
- Leer agent → Entender principios → Aplicar → Codear. Nunca saltar pasos.

---

## 2. Request Classifier

**Antes de actuar, clasificar:**

| Tipo              | Triggers                                  | Acción                                    |
| ----------------- | ----------------------------------------- | ----------------------------------------- |
| **PREGUNTA**      | "qué es", "cómo funciona", "explica"      | Respuesta directa, agent si es técnica    |
| **SURVEY/INTEL**  | "analiza", "lista archivos", "overview"   | Explorar + responder, agent según dominio |
| **CODE SIMPLE**   | "fix", "agrega", "cambia" (1 archivo)     | Editar inline con agent                   |
| **CODE COMPLEJO** | "build", "crea", "implementa", "refactor" | Plan obligatorio + agent                  |
| **DESIGN/UI**     | "diseña", "UI", "página", "dashboard"     | Plan obligatorio + agent de diseño        |
| **SLASH CMD**     | /workflow                                 | Ejecutar workflow correspondiente         |

---

## 3. Pre-Flight Check

> **OBLIGATORIO para requests complejos, features nuevas, o ambigüedad.**

| Tipo de Request         | Estrategia     | Acción                                                                  |
| ----------------------- | -------------- | ----------------------------------------------------------------------- |
| **Feature / Build**     | Deep Discovery | Preguntar mínimo 3 preguntas estratégicas                               |
| **Code Edit / Bug Fix** | Context Check  | Confirmar entendimiento + preguntar sobre impacto                       |
| **Vago / Simple**       | Clarificación  | Preguntar propósito, usuarios afectados, alcance                        |
| **Orquestación**        | Gatekeeper     | **STOP** — no invocar subagentes hasta que el usuario confirme el plan  |
| **"Procede" directo**   | Trust          | Proceder. Solo preguntar si hay un riesgo genuino que el usuario no vio |

**Protocolo:**

1. Si falta información crítica o hay riesgo real → PREGUNTAR
2. Si el usuario da una lista de respuestas → no saltar el gate, preguntar sobre trade-offs o edge cases
3. NO escribir código ni invocar tools hasta que el usuario apruebe
4. Detalle completo en skill `brainstorming`

---

## 4. Jerarquía de Autoridad

> En caso de conflicto, el nivel superior manda.

| Nivel | Documento                | Propósito                                 |
| ----- | ------------------------ | ----------------------------------------- |
| 1a    | `rules/CORE.md`          | Reglas universales (este archivo)         |
| 1b    | `rules/CORE-RT.md`       | Reglas del runtime AI activo              |
| 1c    | `rules/CORE-SK.md`       | Reglas del Starter Kit                    |
| 2     | `registry/registry.yaml` | SSOT de agents, skills, combos, fallbacks |
| 3     | `skills/domains/*`       | Reglas por stack (ui, db, api, security)  |
| 4     | `skills/roles/*`         | Comportamientos por flujo                 |
| 5     | `workflows/*`            | Flujos de trabajo ejecutables             |
| 6     | `docs/planning/*`        | Documentación del proyecto                |
| 7     | `docs/backlog/*`         | Issues y epics                            |

### Prioridad de Skills

| Tier | Path       | SSOT Para            | Prioridad |
| ---- | ---------- | -------------------- | --------- |
| P1   | `domains/` | CÓMO en ESTE stack   | Mayor     |
| P2   | `roles/`   | QUÉ hacer, CUÁNDO    | Media     |
| P3   | (kit root) | POR QUÉ (principios) | Menor     |

> `domains/` son la autoridad técnica del stack. Si `domains/ui/` dice "usar clases de Tailwind"
> y un role o kit skill sugiere otra práctica → `domains/ui/` GANA.
> Skills project-specific en `domains/` también son P1.

### SSOT Chain

```
Discovery → Proposal → Docs → Design → Backlog → Code
```

| Fase      | Documento                             | SSOT para                |
| --------- | ------------------------------------- | ------------------------ |
| Discovery | `docs/planning/00_DISCOVERY_BRIEF.md` | Requisitos, scope        |
| Proposal  | `docs/planning/01_PROPOSAL.md`        | Oferta al cliente        |
| Docs      | `docs/planning/02-14_*.md`            | Personas, US, BR, Data   |
| Design    | `docs/planning/15_DESIGN.md`          | Pantallas, flujos, comps |
| Backlog   | `docs/backlog/*/issues/*.md`          | Issues ejecutables       |

> **Skills y workflows NUNCA redefinen reglas.** Solo ejecutan lo que dicen las rules.

---

## 5. Hard Limits

> ⚠️ **Violación de cualquiera = fallo crítico.**

### 🤖 Agent Behavior

#### 5.1 🔴 NUNCA ejecutar procedimientos definidos de memoria

```
❌ PROHIBIDO: Ejecutar pasos de un procedimiento sin leer su archivo fuente
✅ OBLIGATORIO: Leer el archivo .md del procedimiento en esta sesión
✅ OBLIGATORIO: // turbo en phases = auto-ejecutable
```

#### 5.2 🔴 NUNCA modificar archivos sin cargar agente

> Aplica a TODA respuesta que use tools de edición de archivos o ejecución de código.
> Única excepción: `/init` (solo lee contexto, no modifica).

```
❌ PROHIBIDO: Editar archivos sin haber anunciado el agente activo
✅ OBLIGATORIO:
   1. Detectar dominio del request (keywords EN/ES)
   2. Matchear contra registry.yaml + project.yaml
   3. Cargar el agent .md + skills (cat/view_file)
   4. Mostrar el bloque de anuncio ANTES de cualquier tool de edición:

      🤖 Aplicando conocimiento de `@{agent-name}`...
      🧰 Skills: `{skill-1}`, `{skill-2}`

   5. Si no hay match claro → usar fallback del registry
```

### 📦 Dependencies

#### 5.3 🔴 NUNCA instalar dependencias sin autorización

```
❌ PROHIBIDO: Instalar paquetes sin aprobación explícita del usuario
✅ OBLIGATORIO: Proponer la dependencia + justificación → ESPERAR confirmación
```

### 🔀 Git

#### 5.4 🔴 NUNCA usar --no-verify en commits o push

```
❌ PROHIBIDO: git commit --no-verify / git commit -n (bypasea pre-commit hooks)
❌ PROHIBIDO: git push --no-verify
✅ OBLIGATORIO: Si hooks fallan → corregir el error → reintentar sin flags
✅ EXCEPCIÓN: Merge commits en /deploy y /factory_release (no hay staged changes normales)
```

#### 5.5 🔴 NUNCA ejecutar git push sin autorización

```
❌ PROHIBIDO: git push sin confirmación del usuario
✅ OBLIGATORIO: Mostrar branch, remote, commits → ESPERAR confirmación
✅ EXCEPCIÓN: Workflows con checkpoint gate (e.g. CP2 de /implement) = autorización implícita
```

### 🧑‍💻 Code Quality

#### 5.6 🔴 NUNCA hardcodear valores

```
❌ PROHIBIDO: Valores mágicos en código (URLs, colores, tamaños, textos)
✅ OBLIGATORIO: Usar constantes, config files, o CSS variables
```

#### 5.7 🔴 NUNCA marcar completo sin verificar

```
❌ PROHIBIDO: Decir "feature completa" sin verificar
✅ OBLIGATORIO: Confirmar que pre-commit pasó o ejecutar manualmente
```

#### 5.8 Commits deben referenciar issues

```
✅ OBLIGATORIO: Usar ID del issue (ej: feat(auth): AUTH-001 - ...)
✅ OBLIGATORIO: Actualizar /docs si afecta comportamiento documentado
```

### 📋 Planning

#### 5.9 🔴 NUNCA inventar business rules

```
❌ PROHIBIDO: Asumir reglas de negocio que no están en docs/planning/
✅ OBLIGATORIO: Si algo no está documentado → preguntar al usuario
```

#### 5.10 🔴 NUNCA inventar modelo de datos sin consultar docs

```
❌ PROHIBIDO: Crear tablas, columnas o entidades que no están en la documentación
✅ OBLIGATORIO: Consultar docs/planning/ antes de cualquier cambio al modelo de datos
```

#### 5.11 Crear issues con template o workflow

```
❌ PROHIBIDO: Crear issues sin leer el template primero
✅ SINGLE ISSUE: Leer .agent/skills/roles/backlog/issue.template.md
   → crear con write_to_file → preguntar en qué epic ponerlo
✅ BATCH (2+ issues o epic nuevo): /backlog add
✅ PIPELINE (desde docs/design): /backlog (full)
✅ PERMITIDO: Editar issues existentes (marcar Done, agregar Evidence, ajustar AC)
```

---

## 6. Idioma

1. **Usuario en español** → Responder en español
2. **Código, comentarios, variables** → Siempre en inglés

---

## 7. Final Checklist

**Trigger:** Cuando el usuario dice "final checks", "checklist", "auditoría" o similar.

**Usar `/audit` workflow** — selecciona nivel de review (R0-R4) según scope y riesgo.

---

## 8. Reglas de Oro

1. **Skills y workflows NUNCA redefinen reglas** — solo ejecutan lo que dicen las rules
2. **Ante la duda, escalar al usuario** — nunca asumir, siempre preguntar

---

_TimeKast Factory — Core Rules (L1 Universal)_
