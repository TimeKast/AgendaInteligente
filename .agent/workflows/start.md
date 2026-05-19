---
description: Router inteligente universal - detecta tipo de solicitud y carga contexto relevante
---

# /start - Router Inteligente

Este workflow te convierte en un especialista optimizado para la tarea solicitada.
Usa el **REGISTRY** para seleccionar agents y skills dinámicamente.

---

## Paso 1: Clasificar y Seleccionar Agents

> 🎯 **Matching bilingüe contra registry.yaml** — NO tablas hardcodeadas.

### 1.1 Cargar catálogo de agents

// turbo

```bash
cat ./.agent/registry/views/agents.md
```

### 1.2 Scoring mental

El agente DEBE evaluar el request del usuario contra las keywords de cada agent:

```
Para cada agent en agents.md:
  hits = count(keyword ∈ request) usando keywords_any (EN) + keywords_es (ES)
  score = hits × (priority / 100)

Seleccionar top 2 agents por score.
```

**Reglas de selección:**

| Condición                           | Acción                            |
| ----------------------------------- | --------------------------------- |
| Solo 1 dominio detectado            | 1 agent principal                 |
| 2+ dominios detectados              | Max 2 agents                      |
| `query` (pregunta pura, sin código) | 0 agents — responder directamente |

### 1.3 Apply Agent Relationships

Antes de cargar, verificar en `agents.md` § Relationships:

- **narrows:** Si el más específico está presente → descartar el genérico
- **excludes:** Nunca cargar ambos → quedarse con el de mayor score
- **complements:** Pueden coexistir

---

> **Nota:** Las rules (CORE.md, CORE-RT.md, CORE-SK.md) se cargan automáticamente
> por el runtime. No se requiere carga manual.

## Paso 2: Cargar Agents y Skills Seleccionados

### 2.1 Cargar agents

Para cada agent seleccionado en Paso 1:

// turbo

```bash
# Reemplazar {AGENT_NAME} con el nombre real del agent seleccionado
cat ./.agent/agents/${AGENT_NAME}.md
```

### 2.2 Skill Enrichment

Mapear los `domains` de los agents seleccionados → skills con domains matching:

// turbo

```bash
cat ./.agent/registry/views/skills.md
```

**Reglas:**

1. Buscar skills cuyo dominio coincida con los domains del agent (ej: agent domain `ui` → skills de `domains/ui`)
2. Agregar skills de `kit/` relevantes por keyword match con el request
3. **Cap: max 5 skills** (alineado con CORE §1)

### 2.3 Anuncio con Razonamiento (OBLIGATORIO)

> 🔴 **Anunciar agents, skills, Y razonamiento ANTES de responder.**

```markdown
🤖 Routing: keywords [{kw1}, {kw2}] → @{agent-1} (score: {N}) | Relationships: {applied or none}
🧰 Skills: `{skill-1}` (domain), `{skill-2}` (keyword)
```

Mostrar: keywords matcheados, score por agent, relationships aplicadas, razón de cada skill.

**Cargar cada skill:** `cat ./.agent/skills/{skill-path}/SKILL.md | head -100`

---

## Paso 3: Cargar Documentación del Proyecto

### 3.1 Explorar `/docs/`

**OBLIGATORIO**: Lista el contenido de `/docs/` para ver qué documentación existe.

### 3.2 Seleccionar según clasificación

Los docs viven en `docs/planning/`. Cargar según el tipo de tarea:

| Categoría  | Docs a cargar                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------- |
| `feature`  | `00_DISCOVERY_BRIEF`, `02_FEATURE_MAP`, `04_USER_STORIES`, `06_DATA_MODEL`, `15_DESIGN`           |
| `bugfix`   | `00_DISCOVERY_BRIEF`, `07_ARCHITECTURE`, `08_API_CONTRACTS`                                       |
| `frontend` | `00_DISCOVERY_BRIEF`, `15_DESIGN`, `03_USER_PERSONAS`, `02_FEATURE_MAP`                           |
| `backend`  | `00_DISCOVERY_BRIEF`, `06_DATA_MODEL`, `07_ARCHITECTURE`, `08_API_CONTRACTS`, `05_BUSINESS_RULES` |
| `pwa`      | `00_DISCOVERY_BRIEF`, `07_ARCHITECTURE`, `15_DESIGN`                                              |
| `security` | `00_DISCOVERY_BRIEF`, `05_BUSINESS_RULES`, `07_ARCHITECTURE`, `08_API_CONTRACTS`                  |
| `docs`     | **TODOS** (00-15)                                                                                 |
| `setup`    | `00_DISCOVERY_BRIEF`, `07_ARCHITECTURE`, `project-config`                                         |
| `refactor` | `00_DISCOVERY_BRIEF`, `07_ARCHITECTURE` + docs del área afectada                                  |
| `query`    | `00_DISCOVERY_BRIEF` (mínimo) + docs relacionados con la pregunta                                 |

> **Criterio de selección**: Si un documento parece relevante, léelo completo. Mejor más contexto que menos.

**Docs de referencia adicionales** (cargar si existen en el proyecto):

| Doc               | Path                               | Cuándo                  |
| ----------------- | ---------------------------------- | ----------------------- |
| Inventario        | `docs/reference/INVENTORY.md`      | Si la tarea lo requiere |
| Codebase          | `docs/reference/CODEBASE.md`       | Si la tarea lo requiere |
| CRUD Scaffold     | `docs/reference/crud-scaffold.md`  | Si es CRUD              |
| Design System     | `docs/guides/design-system.md`     | Si es frontend          |
| Project Structure | `docs/guides/project-structure.md` | Si crea archivos/rutas  |

> **Nota:** Los protocolos legacy en `plan/` existen como referencia histórica
> pero /start tiene su propio protocolo de ejecución en pasos 4-8.

---

## Paso 4: Confirmar Contexto Cargado (VISIBLE al usuario)

> 🔴 **El agente DEBE mostrar al usuario qué cargó — no validar internamente.**

// turbo

```bash
cat ./.agent/workflows/_shared/checkpoint-transparency.md
```

Mostrar la tabla de CONTEXT LOADED junto con el anuncio de routing (Paso 2.3).
El usuario debe poder ver: agents, skills, docs, y references cargados.

> Si falta algo, cargarlo ahora antes de continuar.

---

## Paso 5: Evaluar Complejidad y Planificar

### 5.1 ¿Requiere plan?

**Requiere plan**: >3 archivos, cambios schema, múltiples componentes, APIs externas, auth/permisos.
**No requiere**: Fix simple (1 archivo), cambio UI menor, query.

> Ante la duda, hacer plan.

### 5.2 Template de Plan

```markdown
## Plan: [Título]

### Objetivo

[Qué se va a lograr]

### Archivos

1. `path/file.ts` - [cambio]
2. [NEW] `path/new.ts` - [propósito]

### Pasos

1. [ ] Paso 1
2. [ ] Paso 2

### Criterios

- [ ] [Criterio 1]
```

Marca: `[x]` completado, `[/]` en progreso, `[ ]` pendiente.

---

## Paso 6: Implementar

Con todo el contexto cargado (y plan si aplica):

1. **Actúa** como el(los) agente(s) cargado(s)
2. **Sigue** el plan paso a paso (si existe)
3. **Aplica** las rules estrictas cargadas (máxima prioridad)
4. **Cumple** las reglas globales del proyecto

> ⚠️ **CRÍTICO**: Si durante la ejecución descubres que necesitas agentes, docs adicionales, o modificar el plan, hazlo antes de continuar. Calidad > Velocidad.

> 🔧 **REGLA DE COMANDOS**: NUNCA uses `&&` para encadenar comandos `git` o `gh`. Ejecuta cada comando **por separado**, uno a la vez.

---

## Paso 7: Auditoría Post-Implementación

**OBLIGATORIO** (excepto `query`). Ejecutar en orden:

```bash
pnpm format && pnpm build && pnpm typecheck && pnpm lint && pnpm test
```

Revisar: sin código muerto, sin console.log debug, nomenclatura consistente, edge cases.
Si falla → fix → re-auditar. NO avanzar hasta que TODO pase ✅.

---

## Paso 8: Sincronización de Documentación

**OBLIGATORIO** si los cambios afectan comportamiento de la app.

### 8.1 Evaluar Impacto

| Pregunta                                 | Acción                 |
| ---------------------------------------- | ---------------------- |
| ¿Se agregó funcionalidad nueva?          | Documentar en `/docs`  |
| ¿Se modificó comportamiento existente?   | Actualizar docs        |
| ¿Se cambió UI/UX de forma significativa? | Actualizar docs        |
| ¿Se agregaron/modificaron permisos?      | Actualizar RBAC docs   |
| ¿Se cambió el modelo de datos?           | Actualizar schema docs |

> Si TODAS las respuestas son "No", puedes saltar este paso.

### 8.2 Actualizar `/docs/`

1. Identifica qué documentos están afectados
2. Lee esos documentos completos
3. Actualiza las secciones relevantes
4. Verifica que no haya contradicciones

---

## Paso 9: Entrega Final

### 9.1 Checklist Final

- [ ] Implementación completa según request
- [ ] Build, typecheck, lint pasando
- [ ] Auditoría de cambios completada
- [ ] Documentación actualizada (si aplica)

### 9.2 Pregunta de Oro

> "¿Esto es lo que entregaría el mejor desarrollador del mundo?"

Si la respuesta no es **sí**, vuelve al paso correspondiente y mejora.

### 9.3 Resumen de Cambios

Al finalizar: lista cambios, archivos, validación (build/typecheck/lint/test), docs actualizados.

---

## Referencia Rápida: Jerarquía de Documentos

```
1. Rules (.agent/rules/CORE*.md)    (máxima autoridad — auto-loaded)
2. /docs/*                          (reglas de negocio)
3. /agents/*.md                     (especialización técnica)
```

Si hay conflicto, gana el documento de mayor rango.
