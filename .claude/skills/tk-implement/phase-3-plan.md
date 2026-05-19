# Phase 3 — Discovery + Plan

> **Propósito:** Explorar código existente y generar plan de implementación.
> **Subagent candidate:** `architect` si el issue activa gating (schema nuevo, patrón no documentado, ADR pendiente). Si no aplica gating → main loop.
> **Se ejecuta SIEMPRE.**

---

## 3.1 Explore Codebase

> 🔍 Buscar código existente relacionado con el issue.

```bash
ISSUE_FILE=$(ls ./project/backlog/*/issues/${ISSUE_ID}*.md 2>/dev/null | head -1)
KEYWORDS=$(head -1 "$ISSUE_FILE" | sed 's/# [A-Z]*-[0-9]*: //' | tr '[:upper:]' '[:lower:]' | tr ' ' '\n' | grep -v '^$' | head -3)
echo "🔍 Buscando código relacionado..."
for kw in $KEYWORDS; do
  MATCHES=$(grep -rl "$kw" src/ app/ lib/ components/ 2>/dev/null | head -5)
  [ -n "$MATCHES" ] && echo "  📁 '$kw': $MATCHES"
done
```

> Preferir la herramienta `Grep` de CC sobre `grep -r` para tareas exploratorias nuevas. El snippet de arriba se mantiene por compatibilidad.

```bash
# Schema exploration (solo si el issue referencia entidades)
if grep -qi "schema\|entity\|E-[0-9]\|migration\|table\|column" "$ISSUE_FILE" 2>/dev/null; then
  echo "📊 Schema existente:"
  ls lib/db/schema/*.ts 2>/dev/null
  # usar Read sobre los archivos que correspondan
else
  echo "ℹ️ Issue no referencia schema — skip"
fi
```

---

## 3.2 Architect Gating

> 🛑 **Gating obligatorio** si la exploración revela alguno de estos:

| Trigger                         | Acción                                                                  |
| ------------------------------- | ----------------------------------------------------------------------- |
| Auth / RBAC / permisos          | Invocar `Agent` con `subagent_type: architect`                          |
| Cache / invalidación            | Invocar `Agent` con `subagent_type: architect`                          |
| API ambiguo / patrón no claro   | Invocar `Agent` con `subagent_type: architect`                          |
| State management no documentado | Invocar `Agent` con `subagent_type: architect`                          |
| Schema nuevo sin ADR            | Invocar `Agent` con `subagent_type: data-modeler-drizzle` o `architect` |

El subagent recibe: issue file path, exploration findings, pregunta concreta. Devuelve: decisión arquitectural + trade-offs.

---

## 3.3 Generate Plan

**Rol del main loop:** Staff Engineer / Tech Lead.

**Acciones:**

1. Leer issue completo + AC (ya cargado en Phase 2)
2. Analizar código encontrado en 3.1
3. Incorporar decisión del architect (si hubo gating)
4. Identificar archivos a crear/modificar
5. Definir orden de implementación
6. Especificar tests requeridos

---

## 3.4 Plan Output (MANDATORY)

> 🔴 Este plan se muestra al usuario en **CHECKPOINT 1**.

```markdown
## 📋 Plan: {ISSUE-ID}

**Archivos a crear:**

- path/to/file.ts — propósito

**Archivos a modificar:**

- path/to/existing.ts — qué cambiar

**Orden de implementación:**

1. Paso 1
2. Paso 2

**Tests requeridos:**

- Unit: descripción
- E2E: descripción (si aplica)

**Out of Scope (explícito):**

- {qué NO se hará en este issue}
- {features adyacentes que se dejan para otro issue}

🤖 **Agents candidatos Phase 4:**

- `backend-specialist` — razón
- `test-engineer` — si hay AC de testing

🧰 **Skills consultadas:**

- `kb-api` — razón (si aplica)

**Architect Gating:** Sí / No (si sí, resumen de la decisión)
```

> 🔴 **Validación antes de presentar:**
>
> - Si no hay agents candidatos → el main loop implementa inline (es OK para issues pequeños)
> - Si `Out of Scope` está vacío → agregar al menos un ítem (CODING.md §3: surgical changes)

---

## 🛑 CHECKPOINT 1 — Plan Confirmation

> 🔴 **HARD GATE** — El main loop DEBE parar aquí hasta respuesta del usuario.
>
> 🔴 **COPIAR el template de abajo y LLENAR los `{placeholders}`.** No construir desde cero, no parafrasear. Emisión literal.

### Template CP1 (copy → fill → emit)

```markdown
## 🛑 CP1 — Plan {ISSUE_ID}

### 📊 Risk Assessment

| Criterio             | Valor real | Clasificación |
| -------------------- | ---------- | ------------- |
| Archivos nuevos      | {N}        | {LOW / HIGH}  |
| Archivos modificados | {N}        | {LOW / HIGH}  |
| Toca schema / DB     | {Sí / No}  | {LOW / HIGH}  |
| Toca auth / permisos | {Sí / No}  | {LOW / HIGH}  |
| Story Points         | {N}        | {LOW / HIGH}  |

**Verdict global:** {LOW / HIGH}
**Mecanismo:** {auto-proceder tras aprobación / Plan Mode obligatorio}

### 📂 CONTEXT LOADED

| Item                              | Status  | Tipo      |
| --------------------------------- | ------- | --------- |
| @{agent}                          | ✅ / ❌ | agent     |
| .claude/skills/{skill}/SKILL.md   | ✅ / ❌ | skill     |
| .claude/rules/{rule}.md           | ✅      | rule      |
| project/backlog/.../{ISSUE_ID}.md | ✅      | doc       |
| project/planning/{doc}.md         | ✅ / ❌ | doc       |
| project/reference/INVENTORY.md    | ✅ / ❌ | reference |
| project/reference/CODEBASE.md     | ✅ / ❌ | reference |
| project/reference/HOOKS.md        | ✅ / ❌ | reference |

### 📋 Plan

**Archivos a crear:**

- `{path}` — {propósito}

**Archivos a modificar:**

- `{path}` — {qué cambiar}

**Orden de implementación:**

1. {paso 1}
2. {paso 2}

**Tests requeridos:**

- {tipo}: {descripción}

**Out of Scope:**

- {qué NO se hará}

**Agents candidatos Phase 4:** {lista o "main loop" si trivial}
**Architect Gating:** {Sí — resumen / No}

### Opciones

| #   | Opción        | Acción             |
| --- | ------------- | ------------------ |
| 1   | **continuar** | Proceder a Phase 4 |
| 2   | **ajustar**   | Modificar plan     |
| 3   | **cancelar**  | Abortar            |

🛑 **STOP** — ¿Cómo procedo? Responde con el número.
```

### Reglas de llenado

- **Risk Assessment:** basar cada fila en exploración real de 3.1, NO en estimación. Si un criterio es HIGH → verdict global = HIGH.
- **HIGH risk:** entrar en Plan Mode vía `ExitPlanMode` (CC.md §3). LOW risk: inline STOP es suficiente.
- **CONTEXT LOADED:** listar TODO lo leído con Read tool en esta sesión hasta este punto. ❌ = intentaste leerlo pero no existía / omitiste intencional.
- **Opciones:** emitir la tabla literal 1/2/3. "¿Apruebas?" suelto no cuenta.

> 🔴 HIGH risk → STOP obligatorio. LOW risk (XS, 1 archivo, sin schema/auth) → puede auto-proceder si el usuario ya aprobó globalmente.

---

_Phase 3 Complete → ESPERAR CP1 → Phase 4 (Code)_
