# Phase 6: Close (Document + Commit + Handoff)

> **Carga:** Solo DESPUÉS de CHECKPOINT 2 aprobado.
>
> 🔴 **ORDEN CRÍTICO:** Documentar → Commit → Handoff

---

## 6.1 Code Documentation (Conditional)

> 📝 **Solo si aplica al tipo de cambio:**

| Si el issue toca...           | Entonces...        |
| ----------------------------- | ------------------ |
| Funciones públicas en `lib/`  | JSDoc obligatorio  |
| Feature visible para usuario  | README update      |
| Cambio en API/schema/breaking | CHANGELOG entry    |
| Docs/workflow/script          | Ninguno (skip 6.1) |

---

## 6.2 Issue Documentation (MANDATORY)

> 🔴 **ANTES de commit.** Part of DoD.

**Agregar sección Implementation Evidence al issue:**

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

> 📝 **Tasks `[ ]` en el issue body se marcan `[x]` durante Phase 4 (tracking operativo).**
> Implementation Evidence es el **resumen final** — no repetir evidencia por task.

**Smoke check (no calidad, solo presencia):**

// turbo

```bash
grep -q "Implementation Evidence" ./docs/backlog/*/issues/${ISSUE_ID}*.md && echo "✅ Evidence section present" || echo "🔴 FALTA — agregar antes de commit"
```

---

## 6.3 Update Issue Status + Completed Date

1. Set status:

```markdown
> **Status:** ✅ Done
```

2. Set `Completed:` to today's date (`YYYY-MM-DD`)

**Smoke test:**

```bash
grep -qF "Completed:" ./docs/backlog/*/issues/${ISSUE_ID}*.md && echo "✅ Completed date present" || echo "🔴 MISSING Completed date"
```

---

## 6.3b Update Epic (if applicable)

> 📦 **Si el issue pertenece a un epic, actualizar el epic.**
> 🔴 **NO SALTAR** — este paso se omitía por falta de enforcement.

1. Leer campo `> **Epic:**` del issue
2. Si no tiene epic → **skip** (no todos los issues tienen epic)
3. Si tiene epic → abrir el archivo del epic en `docs/backlog/{version}/epics/`
4. Marcar el issue como ✅ en la columna Status de la tabla de issues del epic
5. Verificar: ¿todos los issues del epic tienen Status ✅?
   - **SÍ** → Cambiar status del epic a `> **Status:** ✅ Done` **Y** set `Completed: YYYY-MM-DD`
   - **NO** → No cambiar status del epic

> ⚠️ Si el epic no tiene columna Status en la tabla, agregarla.

**Lifecycle dates en epic:**

- Si `Started:` del epic es `—` y estamos cerrando un issue → set `Started: YYYY-MM-DD` (catch-up for pre-existing epics)
- Si todos los issues del epic son ✅ → set `Completed: YYYY-MM-DD` en el epic

**Verificación (OBLIGATORIA):**

// turbo

```bash
EPIC_FILE=$(grep -l "${ISSUE_ID}" docs/backlog/*/epics/EPIC-*.md 2>/dev/null | head -1); if [ -n "$EPIC_FILE" ]; then grep -qF "✅" "$EPIC_FILE" && echo "✅ Epic updated: $EPIC_FILE" || echo "🔴 Epic NOT updated — fix before commit"; else echo "ℹ️ No epic found (skip)"; fi
```

**Smoke test lifecycle dates (epic):**

```bash
if [ -n "$EPIC_FILE" ]; then
  grep -qF "Started:" "$EPIC_FILE" && echo "✅ Epic Started present" || echo "🔴 MISSING Epic Started"
fi
```

---

## 6.4 Commit + Push

```bash
git add .
git commit -m "feat(scope): description ({ISSUE-ID})"
git push
```

// turbo

```bash
grep -q "Status.*Done" ./docs/backlog/*/issues/${ISSUE_ID}*.md && echo "✅ Issue cerrado correctamente"
```

---

## 6.5 Update Board (best-effort, no blocker)

// turbo

```bash
pnpm update-board 2>/dev/null && echo "✅ Board actualizado" || echo "ℹ️ update-board no disponible (best-effort)"
```

---

## 6.6 Context Check (MANDATORY — runs BEFORE handoff)

> 🔴 **Ejecutar ANTES del handoff. El resultado se incluye DENTRO del mensaje final.**

// turbo

```bash
cat ./.agent/workflows/_shared/context-check.md
```

---

## 6.7 Handoff Final

> 🔴 **DEBE incluir Context Status. Si falta → handoff inválido.**

```markdown
## ✅ {ISSUE-ID} Completado

**Artefactos:**

- Archivos creados: [X]
- Archivos modificados: [Y]
- Tests: passing

**Commit:** `hash` feat(scope): description

### 📊 Context Status

| Metric            | Value        | Status   |
| ----------------- | ------------ | -------- |
| Conversación      | [N] mensajes | 🟢/🟡/🔴 |
| Contexto estimado | [X]%         | 🟢/🟡/🔴 |

{CONTEXT_ADVISORY}

**Próximo:** `/implement {NEXT-ID}` o `/audit`
```

> **Acción según resultado del Context Check:**
>
> - **🟢** → `{CONTEXT_ADVISORY}` = "Puedes continuar con otro issue en este chat."
> - **🟡** → `{CONTEXT_ADVISORY}` = "⚠️ Contexto en 🟡 — el próximo issue hazlo en un chat nuevo."
> - **🔴** → `{CONTEXT_ADVISORY}` = "🔴 Contexto agotado — NO implementes otro issue aquí. Abre chat nuevo."

---

_Close Complete → Issue cerrado_
