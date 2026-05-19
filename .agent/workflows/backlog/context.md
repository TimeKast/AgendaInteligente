# Phase 0: Action Detection + Mode Selection

> **Propósito:** Detectar acción y modo antes de cargar contexto.
> **Sin carga de datos** — solo detección y status.

---

## 0.1 Detectar Backlog Existente

// turbo

```bash
MILESTONE=$(ls -d docs/backlog/M*/ 2>/dev/null | sort -V | tail -1 | xargs basename 2>/dev/null || echo "")
if [ -n "$MILESTONE" ]; then
  echo "✅ Backlog existe: $MILESTONE"
  EPIC_COUNT=$(ls docs/backlog/${MILESTONE}/epics/EPIC-*.md 2>/dev/null | wc -l | tr -d ' ')
  ISSUE_COUNT=$(ls docs/backlog/${MILESTONE}/issues/*.md 2>/dev/null | wc -l | tr -d ' ')
  echo "   📦 ${EPIC_COUNT} epics, ${ISSUE_COUNT} issues"
else
  echo "📝 No hay backlog existente — se creará M1 automáticamente"
fi
```

> 📝 Si no se encuentra milestone, es normal para proyectos nuevos.

---

## 0.2 Context Status (MANDATORY)

> 🔴 **MANDATORY OUTPUT — NO SKIP**

// turbo

```bash
cat ./.agent/workflows/_shared/context-check.md
```

**Enforcement:**

- 🟢 → Continuar a §0.3 Mode Selection
- 🟡/🔴 → STOP. Mensaje: "⚠️ Contexto en [🟡/🔴] ([X]%). Recomiendo abrir un chat nuevo. ¿Continúo aquí?"

**ACTION:** Si usuario dice "no" → STOP workflow.

---

## 0.3 Mode Selection

**Si NO existe backlog → full mode directo:**

> No hay backlog. Creando desde design...
> → Continuar a Phase 1

**Si SÍ existe backlog → ofrecer opciones:**

```markdown
## 📋 Backlog Action

| #   | Acción        | Descripción                  |
| --- | ------------- | ---------------------------- |
| 1   | **regenerar** | Regenerar backlog completo   |
| 2   | **agregar**   | Agregar issue/epic/milestone |
| 3   | **validar**   | Solo ejecutar validación     |
| 4   | **status**    | Ver status del backlog       |

**¿Qué quieres hacer?** (1-4)
```

**ACTION:** Call `notify_user` con `BlockedOnUser: true` y esperar selección.

### Opción 2: Smart Add Flow

> 🎯 **Cuando el usuario elige "agregar"**, clasificar ANTES de preguntar destino.

**Paso 1: Entender el request del usuario**

Preguntar (si no está claro del prompt):

```markdown
¿Qué quieres agregar al backlog?
Describe brevemente la funcionalidad, bug, o cambio.
```

**Paso 2: Clasificar automáticamente**

> 🔴 **MANDATORY** — Aplicar decision tree ANTES de preguntar destino.

```
¿Cambia la fecha o scope de una release?
├─► SÍ → 🗓️ MILESTONE (nuevo M{N+1})
└─► NO
    ├─► ¿Es una capability separable con ≥3 issues?
    │   ├─► SÍ → 📦 EPIC nuevo
    │   └─► NO
    │       ├─► ¿Cabe en un epic existente sin cambiar su scope?
    │       │   ├─► SÍ → 📝 ISSUE en epic existente
    │       │   └─► NO → 📦 EPIC nuevo (capability independiente)
    │       └─► Fin
    └─► Fin
```

**Heurísticas de clasificación:**

| Crear...      | Cuando                                                  | Ejemplo                                 |
| ------------- | ------------------------------------------------------- | --------------------------------------- |
| **Issue**     | Cabe en epic existente, no cambia roadmap, 1-2 archivos | "Agregar filtro por fecha al dashboard" |
| **Epic**      | ≥3 issues, capability separable, o dominio nuevo        | "Sistema de notificaciones internas"    |
| **Milestone** | Cambia release boundary, nueva fase del proyecto        | "Fase 2: módulo de reportes avanzados"  |

**Señales de alerta para NO crear solo un issue:**

- Toca ≥3 archivos de diferentes dominios → probablemente epic
- Requiere schema nuevo → probablemente epic (schema + actions + UI + tests)
- Introduce concepto no existente en el backlog → probablemente epic

**Paso 3: Mostrar estado actual + recomendación**

// turbo

```bash
ACTIVE_M=$(ls -d docs/backlog/M*/ 2>/dev/null | sort -V | tail -1 | xargs basename 2>/dev/null || echo "")
if [ -z "$ACTIVE_M" ]; then
  echo "📝 No hay milestone activo — se creará M1"
else
  echo "📋 Backlog actual:"
  echo "  ${ACTIVE_M}/ (activo)"
  for epic in docs/backlog/${ACTIVE_M}/epics/EPIC-*.md; do
    if [ -f "$epic" ]; then
      EPIC_NAME=$(basename "$epic" .md)
      EPIC_ISSUES=$(grep -rl "${EPIC_NAME}" docs/backlog/${ACTIVE_M}/issues/*.md 2>/dev/null | wc -l | tr -d ' ')
      echo "    ${EPIC_NAME} (${EPIC_ISSUES} issues)"
    fi
  done
fi
```

**Paso 4: Presentar clasificación + destino**

```markdown
## 📋 Clasificación

**Request:** "{descripción del usuario}"
**Tipo recomendado:** 📝 Issue / 📦 Epic / 🗓️ Milestone
**Razón:** {justificación de la heurística}

**Destino propuesto:**

| Opción         | Detalle                                              |
| -------------- | ---------------------------------------------------- |
| ✅ Recomendado | {Epic existente / Nuevo epic en M{N} / Nuevo M{N+1}} |
| 🔄 Alternativa | {otra opción viable}                                 |

**¿Confirmas?** (sí / cambiar a [issue/epic/milestone])
```

**ACTION:** Call `notify_user` con `BlockedOnUser: true`.

---

_Phase 0 Complete → Continuar a Phase 1 (Context Loading)_
