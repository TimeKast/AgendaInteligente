# Phase 3: Discovery + Plan

> **Propósito:** Explorar código existente y generar plan de implementación.
> **Se ejecuta SIEMPRE.**

---

## 3.1 Explore Codebase

> 🔍 Buscar código existente relacionado con el issue.

// turbo

```bash
ISSUE_FILE=$(ls ./docs/backlog/*/issues/${ISSUE_ID}*.md 2>/dev/null | head -1)
# Extract keywords from issue title for search
KEYWORDS=$(head -1 "$ISSUE_FILE" | sed 's/# [A-Z]*-[0-9]*: //' | tr '[:upper:]' '[:lower:]' | tr ' ' '\n' | grep -v '^$' | head -3)
echo "🔍 Buscando código relacionado..."
for kw in $KEYWORDS; do
  MATCHES=$(grep -rl "$kw" src/ app/ lib/ components/ 2>/dev/null | head -5)
  [ -n "$MATCHES" ] && echo "  📁 '$kw': $MATCHES"
done
```

// turbo

```bash
# Schema exploration (only if issue references entities)
if grep -qi "schema\|entity\|E-[0-9]\|migration\|table\|column" "$ISSUE_FILE" 2>/dev/null; then
  echo "📊 Schema existente:"
  cat lib/db/schema/*.ts 2>/dev/null | head -50
else
  echo "ℹ️ Issue no referencia schema — skip"
fi
```

**Architect Gating:** Si la exploración revela auth/cache/API/state ambiguo → Cargar `@[.agent/agents/architect.md]`

---

## 3.2 Generate Plan

**Rol:** Staff Engineer / Tech Lead

**Acciones:**

1. Leer issue completo + AC
2. Analizar código encontrado en 3.1
3. Identificar archivos a crear/modificar
4. Definir orden de implementación
5. Especificar tests requeridos
6. Verificar si hay Architect Gating requerido

---

## 3.3 Plan Output (MANDATORY)

> 🔴 OBLIGATORIO — Este plan se muestra al usuario en CHECKPOINT 1.

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

🤖 **Agents cargados:**

- `agent-1` — razón

🧰 **Skills cargados:**

- `domains/x` — razón

**Architect Gating:** Sí/No

---

| #   | Opción        | Acción                 |
| --- | ------------- | ---------------------- |
| 1   | **continuar** | Proceder a implementar |
| 2   | **ajustar**   | Modificar plan         |
| 3   | **cancelar**  | Abortar                |

**¿Qué quieres hacer?** (1-3)
```

> 🔴 **Validación antes de presentar:**
>
> - Si `Agents cargados` vacío → cargar `backend-specialist` + `frontend-specialist`
> - Si `Skills cargados` vacío → cargar `domains/api` + `domains/ui`
> - **Mínimo 1 agent + 1 skill siempre.**

**ACTION:** Call `notify_user` con `BlockedOnUser: true`.

🛑 **STOP — NO continuar a Phase 4 sin respuesta del usuario.**

---

_Phase 3 Complete → ESPERAR CHECKPOINT 1 → Continuar a Phase 4_
