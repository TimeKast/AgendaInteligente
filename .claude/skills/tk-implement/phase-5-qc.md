# Phase 5 — Quality Check (Evaluate Evidence)

> **Carga:** Automática después de Phase 4.
> **Propósito:** Evaluar evidencia de Phase 4 contra el contrato del issue.
> **Output:** 🧪 QC Report (MANDATORY).
>
> 🔴 **Phase 5 NO re-ejecuta validaciones.** Evalúa lo que Phase 4 ya corrió.

---

## Subagent Delegation (trigger específico, no HIGH general)

> Spawnear `quality-engineer` vía `Agent` tool si **CUALQUIERA** aplica:

| Trigger                                             | Razón                                                         |
| --------------------------------------------------- | ------------------------------------------------------------- |
| Story Points ≥ 3                                    | Complejidad suficiente para perder perspectiva en self-review |
| Conditional check dispara (Breaking / Migration)    | Blast radius real — ojos frescos                              |
| Archivos modificados en `lib/` con `export` público | API surface — segundo par de ojos                             |
| Auth / RBAC / permisos tocados                      | Security-sensitive                                            |

> Si ningún trigger aplica → main loop ejecuta P5 (issues triviales como DASH-027 no ameritan subagent).
> Delegación NO es por HIGH risk general — HIGH dispara con volumen de archivos y eso no correlaciona con necesidad de QC externo.

---

## 6 Core Checks (SIEMPRE)

### Check 1: Issue Compliance (AC) — 🤖 Agent evaluates

Para cada Acceptance Criteria del issue:

```markdown
| AC  | Description  | Covered | Evidence    |
| --- | ------------ | ------- | ----------- |
| 1   | [from issue] | ✅ / 🔴 | file.ts:L45 |
| 2   | [from issue] | ✅ / 🔴 | test.ts:L12 |
```

**Verdict:** ✅ All covered / 🔴 Missing AC#

---

### Check 2: Tests Exist — 🤖 Automated (file check)

```bash
git diff --name-only | grep -E "\\.test\\.(ts|tsx)$" || echo "⚠️ No test files in changes"
```

**Rules:**

- Nuevo endpoint / action → DEBE tener test
- Nuevo componente → al menos smoke test
- Bug fix → test de regresión
- **Docs / Workflow changes → N/A**

---

### Check 3: Lint / Types — 🤖 Automated (from Phase 4 evidence)

> Usar resultados de Phase 4.2. **No re-ejecutar.**

---

### Check 4: Duplication + File Dependencies — 👤 Human judgment (INVENTORY + CODEBASE + HOOKS)

> Tres sub-checks combinados. Usan docs auto-generados por husky (`pnpm generate:inventory`, `pnpm generate:codebase`, `pnpm generate:hooks`) → siempre presentes en repos del kit.

**4a. Duplication (INVENTORY.md + HOOKS.md):**

```bash
head -30 ./project/reference/INVENTORY.md 2>/dev/null || echo "⚠️ No INVENTORY.md — skip 4a components"
head -30 ./project/reference/HOOKS.md     2>/dev/null || echo "⚠️ No HOOKS.md — skip 4a hooks/helpers"
```

Agente verifica:

- ¿Componente similar ya existe? (INVENTORY.md)
- ¿Hook / action helper / DB helper / form kit wrapper duplicado? (HOOKS.md)
- ¿Nombre canónico del símbolo coincide con el registrado? (HOOKS.md — detecta drift tipo `useQueryState` inventado)

**4b. File Dependencies (CODEBASE.md — SK.md §2.2):**

```bash
CODEBASE="./project/reference/CODEBASE.md"
CHANGED=$(git diff --name-only 2>/dev/null | grep -E "^(src|app|lib|components)/" | grep -vE "\.(test|spec)\.(ts|tsx)$" | head -15)

if [ -z "$CHANGED" ] || [ ! -f "$CODEBASE" ]; then
  echo "⬜ 4b skipped (no src/ changes or no CODEBASE.md)"
else
  echo "🔍 File Dependencies — checking dependents of modified files:"
  echo ""
  echo "| Modified File | Dependents | Action |"
  echo "| ------------- | ---------- | ------ |"
  HAS_DEPS=false
  for file in $CHANGED; do
    BASENAME=$(basename "$file")
    DEPS=$(grep -F "$BASENAME" "$CODEBASE" | grep -oE "Used By.*" | sed 's/Used By | //' | sed 's/ |$//' | head -1)
    if [ -n "$DEPS" ] && [ "$DEPS" != "—" ]; then
      echo "| \`$file\` | $DEPS | ⚠️ Verify |"
      HAS_DEPS=true
    fi
  done
  [ "$HAS_DEPS" = false ] && echo "| _(none with dependents)_ | — | ✅ |"
fi
```

> Si 4a detecta duplicación O 4b detecta dependientes no verificados → 🛑 **STOP** — confirmar intencional o verificar que los dependientes sigan funcionando.

---

### Check 5: Scope Creep — 👤 Human judgment (AC + Out of Scope)

Comparar cambios vs AC del issue + Out of Scope del plan:

- ¿Implementó features no solicitadas?
- ¿Agregó dependencias no necesarias?
- ¿Refactorizó código fuera de scope?

> Si scope creep → 🛑 **STOP** — reportar y confirmar.

---

### Check 6: JSDoc — 🤖 Semi-auto

```bash
for file in $(git diff --name-only | grep -E "\.(ts|tsx)$" 2>/dev/null); do
  if [ -f "$file" ]; then
    EXPORTS=$(grep -c "^export" "$file" 2>/dev/null || echo 0)
    JSDOCS=$(grep -c "^\s*/\*\*" "$file" 2>/dev/null || echo 0)
    echo "  $file: $EXPORTS exports, $JSDOCS JSDoc blocks"
  fi
done || echo "No TS files in changes"
```

**Rules:**

- Funciones exportadas → DEBEN tener JSDoc
- Types / Interfaces exportadas → DEBEN tener JSDoc
- **Workflow / Docs → N/A**

---

## 4 Conditional Checks (SOLO SI APLICA)

### Breaking Changes (si `lib/` o `types/` modificados) — 🤖 Automated

```bash
git diff lib/ types/ 2>/dev/null | grep -E "^[-+]export" || echo "N/A"
```

> Si breaking change → 🛑 **STOP** — documentar migración.

---

### Migration Check (si `lib/db/schema/` modificado) — 🤖 Automated

```bash
if git diff --name-only | grep -q "lib/db/schema"; then
  echo "⚠️ Schema changed — checking for migration..."
  ls -la lib/db/migrations/*.sql 2>/dev/null | tail -3 || echo "No migrations found"
fi
```

> Si schema changed sin migration nueva → 🛑 **STOP**.

---

### Token Validation (si `.tsx` / `.css` modificados) — 🤖 Semi-auto

> 🎨 Anti-drift check: buscar valores hardcoded que deberían usar design tokens.
> **Informativo — warning, no blocker.**
> Solo corre si existe token map (`.claude/skills/kb-design-system/` o equivalente).

```bash
UI_CHANGED=$(git diff --name-only 2>/dev/null | grep -E "\.(tsx|css)$" | grep -vE "\.(test|spec)\." | head -10)
TOKEN_MAP=$(ls ./.claude/skills/kb-design-system/*.md 2>/dev/null | head -1)

if [ -z "$UI_CHANGED" ]; then
  echo "⬜ Token validation skipped (no UI files changed)"
elif [ -z "$TOKEN_MAP" ]; then
  echo "⬜ Token validation skipped (no design system token map)"
else
  echo "🎨 Token Validation — Checking for anti-patterns in UI files:"
  VIOLATIONS=0

  HEX_HITS=$(echo "$UI_CHANGED" | xargs grep -nE "#[0-9a-fA-F]{3,8}[^a-zA-Z]" 2>/dev/null | grep -v "var(--" | grep -v ".css:" | grep -v "// token" | grep -v "// safe" | head -5)
  if [ -n "$HEX_HITS" ]; then
    echo "  🟡 Hardcoded colors found:"
    echo "$HEX_HITS" | while read line; do echo "    $line"; done
    VIOLATIONS=$((VIOLATIONS + 1))
  fi

  RGB_HITS=$(echo "$UI_CHANGED" | xargs grep -nE "rgb\(|hsl\(" 2>/dev/null | grep -v "var(--" | head -5)
  if [ -n "$RGB_HITS" ]; then
    echo "  🟡 Raw rgb/hsl values found:"
    echo "$RGB_HITS" | while read line; do echo "    $line"; done
    VIOLATIONS=$((VIOLATIONS + 1))
  fi

  if [ $VIOLATIONS -eq 0 ]; then
    echo "  ✅ No anti-pattern tokens detected"
  else
    echo ""
    echo "  ⚠️ $VIOLATIONS type(s) of token drift detected — consider using design system tokens"
  fi
fi
```

---

## Output: QC Report (HARD GATE — bloquea Phase 6)

> 🔴 **Sin la tabla literal abajo, Phase 6 (Close) NO puede iniciar.**
> Historial: en el piloto DASH-027 el agente cerró P5 con "All gates green" en prosa. Eso NO cumple P5. La tabla debe emitirse aunque todos los checks sean ✅.

```markdown
## 🧪 QC Report: {ISSUE_ID}

| #   | Check                 | Type     | Status        | Evidence             |
| --- | --------------------- | -------- | ------------- | -------------------- |
| 1   | Issue Compliance (AC) | 🤖 Auto  | ✅ / 🔴       | [AC refs]            |
| 2   | Tests Exist           | 🤖 Auto  | ✅ / ⚠️ / N/A | [test files or N/A]  |
| 3   | Lint / Types          | 🤖 Auto  | ✅            | Phase 4 evidence     |
| 4   | Duplication           | 👤 Human | ✅ / 🛑       | checked vs INVENTORY |
| 5   | Scope Creep           | 👤 Human | ✅ / 🛑       | matches issue scope  |
| 6   | JSDoc                 | 🤖 Semi  | ✅ / 🟡 / N/A | [status]             |

### Conditional (only if applies)

| Breaking Changes | 🤖 Auto | ✅ / 🛑 / N/A | [if touched lib/ or types/] |
| Migration | 🤖 Auto | ✅ / 🛑 / N/A | [if touched schema/] |
| Token Validation | 🤖 Semi | ✅ / ⚠️ / N/A | [if UI files + token map] |

**Verdict:** ✅ PASS / 🛑 NEEDS CONFIRM / 🔴 FAIL
```

---

## Output: File Summary (MANDATORY)

```bash
echo "📂 Archivos en este issue:"
echo ""
echo "| Tipo | Archivo |"
echo "| ---- | ------- |"
for f in $(git diff --diff-filter=A --name-only 2>/dev/null); do
  echo "| 🆕 | \`$f\` |"
done
for f in $(git diff --diff-filter=M --name-only 2>/dev/null); do
  echo "| ✏️ | \`$f\` |"
done
for f in $(git diff --diff-filter=D --name-only 2>/dev/null); do
  echo "| 🗑️ | \`$f\` |"
done
NEW_DEPS=$(git diff package.json 2>/dev/null | grep "^+" | grep -E '"[^"]+":\s' | grep -v "^+++" | sed 's/^+//' | sed 's/[",]//g' | awk '{print $1, $2}')
if [ -n "$NEW_DEPS" ]; then
  echo "$NEW_DEPS" | while read name version; do
    echo "| 📦 | \`$name $version\` (new dep) |"
  done
fi
echo ""
```

---

## Stop Conditions

| Condition        | Action                             |
| ---------------- | ---------------------------------- |
| 🔴 FAIL          | NO continuar a Close — fix primero |
| 🛑 NEEDS CONFIRM | Esperar confirmación del usuario   |
| ✅ PASS          | Continuar a CHECKPOINT 2 → Close   |

---

## Self-check antes de entrar a Phase 6

> 🔴 **Antes de pasar a CP2, verificar que los 3 artefactos de P5 existen en la salida:**
>
> 1. ✅ QC Report (tabla 6 Core + Conditional)
> 2. ✅ File Summary (tabla de archivos)
> 3. ✅ Verdict explícito (✅ PASS / 🛑 NEEDS CONFIRM / 🔴 FAIL)
>
> Si falta cualquiera de los 3 → completarlo antes de CP2. Prosa tipo "todo verde" NO cuenta.

---

_Phase 5 Complete → CP2 con QC Report visible → Phase 6 (Close)_
