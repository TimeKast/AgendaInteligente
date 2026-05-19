# Phase 6 — Close (CP2 + Document + Commit + Handoff)

> **Carga:** Incluye CHECKPOINT 2 al inicio. Todo lo que sigue es post-aprobación.
>
> 🔴 **ORDEN CRÍTICO:** CP2 → Documentar → Commit → Handoff.

---

## 🛑 CHECKPOINT 2 — Pre-Commit Review

> 🔴 **HARD GATE — NUNCA auto-aprobar.** Commit/push afecta el repositorio.
> Esto implementa GIT.md §2 (nunca push sin autorización).

### Pre-requisitos

- ✅ QC Report PASS (de Phase 5)
- ✅ Issue documentado (Implementation Evidence preparado — se escribe en 6.2)

### Template CP2 (copy → fill → emit)

> 🔴 **COPIAR el template y LLENAR los `{placeholders}`.** No parafrasear.

```markdown
## 🛑 CP2 — Pre-Commit Review {ISSUE_ID}

### 🧪 QC Report

{pegar QC Report tabla literal de Phase 5}

### 📂 File Summary

{pegar File Summary tabla literal de Phase 5}

### 📝 GENERATED/MODIFIED

- `{path}` (created)
- `{path}` (modified)
- `{path/issue}.md` (Evidence written)
- `{path/epic}.md` (issue marked ✅)

### Opciones

| #   | Opción       | Acción                            |
| --- | ------------ | --------------------------------- |
| 1   | **commit**   | Commit local (sin push)           |
| 2   | **cancelar** | Abortar cierre, dejar en progreso |

🛑 **STOP** — ¿Cómo procedo? Responde con el número.
```

> 🔴 **NO ofrecer "push" como opción.** Push requiere autorización **explícita y posterior** del usuario (GIT.md §2).
> Después del commit (opción 1), el agente pregunta separado: "¿Pusheo a {branch}?".

---

## 6.1 Code Documentation (Conditional)

> 📝 Solo si aplica al tipo de cambio:

| Si el issue toca...           | Entonces...        |
| ----------------------------- | ------------------ |
| Funciones públicas en `lib/`  | JSDoc obligatorio  |
| Feature visible para usuario  | README update      |
| Cambio en API/schema/breaking | CHANGELOG entry    |
| Docs / workflow / script      | Ninguno (skip 6.1) |

---

## 6.2 Issue Documentation (MANDATORY)

> 🔴 **ANTES del commit.** Part of DoD.

Agregar sección **Implementation Evidence** al issue:

```markdown
## 📝 Implementation Evidence

### Decisions Made

| Decisión       | Razón                        |
| -------------- | ---------------------------- |
| Patrón X usado | Por rendimiento/consistencia |
| No incluido Y  | Fuera de scope               |

### Artifacts Created

- `path/to/new-file.ts` — propósito
- `path/to/new-file.test.ts` — tests

### Verification

- [x] Typecheck: Pass
- [x] Lint: Pass
- [x] Tests: X passing

### Commit

`hash` feat(scope): description

---

_Completado: YYYY-MM-DD_
```

> 📝 Tasks `[ ]` en el issue body se marcan `[x]` durante Phase 4 (tracking operativo).
> **Implementation Evidence** es el resumen final — no repetir evidencia por task.

Smoke check (presencia, no calidad):

```bash
grep -q "Implementation Evidence" ./project/backlog/*/issues/${ISSUE_ID}*.md && echo "✅ Evidence section present" || echo "🔴 FALTA — agregar antes de commit"
```

---

## 6.3 Update Issue Status + Completed Date

1. Set status:

   ```markdown
   > **Status:** ✅ Done
   ```

2. Set `Completed:` a la fecha de hoy (`YYYY-MM-DD`).

```bash
grep -qE "Completed:\*\*[[:space:]]+20[0-9]{2}-[0-9]{2}-[0-9]{2}" ./project/backlog/*/issues/${ISSUE_ID}*.md && echo "✅ Completed date present" || echo "🔴 MISSING Completed date"
```

---

## 6.3b Update Epic (if applicable)

> 📦 Si el issue pertenece a un epic, actualizar el epic.
> 🔴 **NO SALTAR.**

1. Leer campo `> **Epic:**` del issue
2. Si no tiene epic → **skip**
3. Si tiene epic → abrir el archivo en `project/backlog/{version}/epics/`
4. Marcar el issue como ✅ en la columna Status de la tabla de issues
5. Verificar: ¿todos los issues del epic tienen Status ✅?
   - **SÍ** → Cambiar status del epic a `> **Status:** ✅ Done` + set `Completed: YYYY-MM-DD`
   - **NO** → No cambiar status del epic

> Si el epic no tiene columna Status en la tabla, agregarla.

**Lifecycle dates en epic:**

- Si `Started:` del epic es `—` y estamos cerrando un issue → set `Started: YYYY-MM-DD` (catch-up)
- Si todos los issues son ✅ → set `Completed: YYYY-MM-DD` en el epic

**Verificación (HARD GATE — bloquea commit si falla):**

```bash
# Restringir búsqueda al MISMO milestone del issue (evita falsos positivos
# por menciones narrativas cross-milestone tipo "(from PL-005)" en epics
# de otra versión que ganan por orden alfabético del glob).
ISSUE_FILE=$(ls project/backlog/*/issues/${ISSUE_ID}*.md 2>/dev/null | head -1)
if [ -z "$ISSUE_FILE" ]; then
  echo "🔴 BLOCKER: Issue file not found for ${ISSUE_ID}"
  exit 1
fi
MILESTONE_DIR=$(dirname "$(dirname "$ISSUE_FILE")")
EPIC_FILE=$(grep -l "${ISSUE_ID}" "$MILESTONE_DIR"/epics/EPIC-*.md 2>/dev/null | head -1)
if [ -n "$EPIC_FILE" ]; then
  # Check that THIS issue is marked ✅ in the epic (not just any ✅)
  if ! grep -qE "${ISSUE_ID}.*✅|✅.*${ISSUE_ID}" "$EPIC_FILE"; then
    echo "🔴 BLOCKER: Epic ${EPIC_FILE} does NOT mark ${ISSUE_ID} as ✅"
    echo "🔴 Fix the epic row before proceeding to §6.4 commit."
    exit 1
  fi
  if ! grep -qE "Started:\*\*[[:space:]]+20[0-9]{2}-[0-9]{2}-[0-9]{2}" "$EPIC_FILE"; then
    echo "🔴 BLOCKER: Epic ${EPIC_FILE} missing 'Started:' lifecycle date (or empty/—)"
    exit 1
  fi
  echo "✅ Epic updated: $EPIC_FILE"
else
  echo "ℹ️ No epic found (skip)"
fi
```

> 🔴 **Si este gate falla, NO proceder a §6.4.** Regresar a 6.3b, editar el epic, re-ejecutar el gate.
> Historial: en el piloto DASH-028 el agente saltó este paso y dejó EPIC-DASHV3.md desactualizado. Ahora es bloqueante.

---

## 6.4 Commit + Push

> 🔴 **Pre-flight gate (hard — no saltar):**
>
> Antes de `git add`, verificar TODOS los pre-requisitos:
>
> ```bash
> ISSUE_FILE=$(ls project/backlog/*/issues/${ISSUE_ID}*.md | head -1)
> grep -qF "Implementation Evidence" "$ISSUE_FILE"       || { echo "🔴 MISSING Evidence (§6.2)"; exit 1; }
> grep -qE "Status:\*\*[[:space:]]+(✅[[:space:]]+)?Done" "$ISSUE_FILE" || { echo "🔴 MISSING Status Done (§6.3)"; exit 1; }
> grep -qE "Completed:\*\*[[:space:]]+20[0-9]{2}-[0-9]{2}-[0-9]{2}" "$ISSUE_FILE" || { echo "🔴 MISSING Completed date (§6.3)"; exit 1; }
> # Epic gate ran in 6.3b above
> echo "✅ Pre-flight OK — proceeding to commit"
> ```
>
> Si cualquier check falla → regresar a la fase correspondiente, arreglar, re-ejecutar.
>
> Ver GIT.md §1 (nunca `--no-verify`), §2 (nunca push sin autorización), §3 (referenciar issue).

Commit message formato (HEREDOC):

```bash
git add <archivos específicos, no -A>
git commit -m "$(cat <<'EOF'
feat(scope): ISSUE-ID — título corto

Detalle opcional.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

**Branching (GIT.md §4):**

- Pre-release (v0.0.0) → push a main directo permitido
- Post-release (v1.0.0+) → push solo a `develop`. NUNCA a `main` sin autorización explícita

Push (solo con CP2 aprobado):

```bash
git push
```

Verificación final:

```bash
grep -q "Status.*Done" ./project/backlog/*/issues/${ISSUE_ID}*.md && echo "✅ Issue cerrado correctamente"
```

---

## 6.5 Update Board (best-effort, no blocker)

```bash
pnpm update-board 2>/dev/null && echo "✅ Board actualizado" || echo "ℹ️ update-board no disponible (best-effort)"
```

---

## 6.6 Handoff Final (HARD GATE — cierre inválido sin esto)

> 🔴 **El issue NO se considera cerrado hasta que este bloque se emita.**
>
> Si el agente omite el handoff, el pipeline está incompleto aunque el commit haya landeado.
>
> **Antes de aceptar el siguiente prompt del usuario, verificar:**
>
> - ¿Se emitió el bloque `## ✅ {ISSUE-ID} Completado`?
>
> Si NO → emitir el handoff AHORA, antes de cualquier otra acción.

```markdown
## ✅ {ISSUE-ID} Completado

**Artefactos:**

- Archivos creados: [X]
- Archivos modificados: [Y]
- Tests: passing

**Commit:** `hash` feat(scope): description

**Próximo:** `/implement {NEXT-ID}` o `/audit`
```

---

_Close Complete → Issue cerrado_
