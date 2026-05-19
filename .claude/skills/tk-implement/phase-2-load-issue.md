# Phase 2 — Load Issue + Doc References

> **Propósito:** Cargar el issue completo y sus documentos referenciados.
> **Se ejecuta SIEMPRE.**

---

## 2.1 Load Issue

Leer el archivo del issue con Read tool:

```bash
ls ./project/backlog/*/issues/${ISSUE_ID}*.md
# → usar Read sobre el path resultante
```

**Extraer del issue:**

- Title + ID
- Status (verificar ≠ ✅ Completed, ≠ 🚫 Blocked)
- Epic asociado (campo `> **Epic:**`)
- Acceptance Criteria (checkboxes)
- Dependencias (`Blocked By`)
- Referencias a SCR/FLW/CMP/US
- **Doc References** → se cargan en 2.2

---

## 2.2 Load Doc References (MANDATORY)

> 🔴 El issue incluye `## Doc References` con documentos que el agente DEBE cargar selectivamente.
> Sin este paso, se pierde contexto crítico que `/backlog` ya preparó.

**Reglas:**

1. Buscar sección `## Doc References` en el issue
2. Para cada referencia, cargar **la sección indicada**, no el doc entero
3. Solo leer completo si el doc es pequeño (< 100 líneas) o no hay sección específica
4. Si un doc no se encuentra → advertir, no bloquear

> Si el doc ref dice `DATA_MODEL | E-005`, cargar solo la sección E-005 — no todo `06_DATA_MODEL.md`.

### Doc Name Resolver

| Doc Name     | Resolves To                              |
| ------------ | ---------------------------------------- |
| DISCOVERY    | `project/planning/00_DISCOVERY_BRIEF.md` |
| PROPOSAL     | `project/planning/01_PROPOSAL.md`        |
| FEATURE_MAP  | `project/planning/02_FEATURE_MAP.md`     |
| PERSONAS     | `project/planning/03_USER_PERSONAS.md`   |
| USER_STORIES | `project/planning/04_USER_STORIES.md`    |
| BIZ_RULES    | `project/planning/05_BUSINESS_RULES.md`  |
| DATA_MODEL   | `project/planning/06_DATA_MODEL.md`      |
| ARCHITECTURE | `project/planning/07_ARCHITECTURE.md`    |
| API          | `project/planning/08_API_CONTRACTS.md`   |
| GLOSSARY     | `project/planning/09_GLOSSARY.md`        |
| DESIGN       | `project/planning/15_DESIGN.md`          |
| SK           | `project/reference/reusable-library.md`  |

### Loader (bash)

```bash
ISSUE_FILE=$(ls ./project/backlog/*/issues/${ISSUE_ID}*.md 2>/dev/null | head -1)

if [ -z "$ISSUE_FILE" ]; then
  echo "⚠️ Issue file not found — skipping Doc References"
else
  DOC_SECTION=$(sed -n '/^## .*Doc Ref/,/^## /p' "$ISSUE_FILE" | head -30)

  if [ -z "$DOC_SECTION" ]; then
    echo "ℹ️ No Doc References section in issue — skipping"
  else
    echo "📎 Doc References encontradas:"
    echo "$DOC_SECTION"
    echo ""

    # Format 1: Table rows (| DOC_NAME | Section | ... |)
    echo "$DOC_SECTION" | grep "^|" | grep -v "^| Doc\|^| --\|^|--" | while IFS='|' read -r _ DOC_NAME SECTION _REST; do
      DOC_NAME=$(echo "$DOC_NAME" | xargs)
      SECTION=$(echo "$SECTION" | xargs)

      case "$DOC_NAME" in
        DISCOVERY)    FILE="./project/planning/00_DISCOVERY_BRIEF.md" ;;
        PROPOSAL)     FILE="./project/planning/01_PROPOSAL.md" ;;
        FEATURE_MAP)  FILE="./project/planning/02_FEATURE_MAP.md" ;;
        PERSONAS)     FILE="./project/planning/03_USER_PERSONAS.md" ;;
        USER_STORIES) FILE="./project/planning/04_USER_STORIES.md" ;;
        BIZ_RULES)    FILE="./project/planning/05_BUSINESS_RULES.md" ;;
        DATA_MODEL)   FILE="./project/planning/06_DATA_MODEL.md" ;;
        ARCHITECTURE) FILE="./project/planning/07_ARCHITECTURE.md" ;;
        API)          FILE="./project/planning/08_API_CONTRACTS.md" ;;
        GLOSSARY)     FILE="./project/planning/09_GLOSSARY.md" ;;
        DESIGN)       FILE="./project/planning/15_DESIGN.md" ;;
        SK)           FILE="./project/reference/reusable-library.md" ;;
        *)            FILE="" ;;
      esac

      if [ -n "$FILE" ] && [ -f "$FILE" ]; then
        LINES=$(wc -l < "$FILE")
        if [ -n "$SECTION" ] && [ "$SECTION" != "-" ] && [ "$SECTION" != "General" ]; then
          echo "📄 Loading: $DOC_NAME § $SECTION (targeted)"
          sed -n "/## .*${SECTION}/,/^## /p" "$FILE" | head -50
        elif [ "$LINES" -lt 100 ]; then
          echo "📄 Loading: $DOC_NAME (full — $LINES lines)"
          cat "$FILE"
        else
          echo "📄 Loading: $DOC_NAME (head -80 — $LINES total)"
          head -80 "$FILE"
        fi
        echo ""
      elif [ -n "$FILE" ]; then
        echo "⚠️ Doc not found: $FILE (referenced as $DOC_NAME)"
      fi
    done

    # Format 2: Markdown links (- [text](path))
    echo "$DOC_SECTION" | grep -oE '\([^)]+\.md\)' | tr -d '()' | while read -r REL_PATH; do
      ISSUE_DIR=$(dirname "$ISSUE_FILE")
      RESOLVED="${ISSUE_DIR}/${REL_PATH}"
      if [ -f "$RESOLVED" ]; then
        echo "📄 Loading linked doc: $RESOLVED"
        cat "$RESOLVED"
        echo ""
      else
        echo "⚠️ Linked doc not found: $RESOLVED (from $REL_PATH)"
      fi
    done

    echo "✅ Doc References loaded"
  fi
fi
```

---

## 2.3 Verify Issue Status + Dependencies

> 🔴 **Gate:** Issue debe ser actionable.

```bash
ISSUE_FILE=$(ls ./project/backlog/*/issues/${ISSUE_ID}*.md 2>/dev/null | head -1)
STATUS=$(grep -m1 "Status:" "$ISSUE_FILE" | sed 's/.*\*\*Status:\*\* //')
echo "📊 Issue Status: $STATUS"

GATE_OK=true

if echo "$STATUS" | grep -q "✅"; then
  echo "❌ GATE FAIL: Issue ya completado"
  GATE_OK=false
elif echo "$STATUS" | grep -q "🚫"; then
  echo "❌ GATE FAIL: Issue bloqueado"
  GATE_OK=false
fi

BLOCKED_BY=$(grep -oE 'Blocked [Bb]y.*[A-Z]+-[0-9]+' "$ISSUE_FILE" | grep -oE '[A-Z]+-[0-9]+' | sort -u)
if [ -n "$BLOCKED_BY" ]; then
  echo ""
  echo "🔗 Dependencias declaradas:"
  for DEP in $BLOCKED_BY; do
    DEP_FILE=$(ls ./project/backlog/*/issues/${DEP}*.md 2>/dev/null | head -1)
    if [ -z "$DEP_FILE" ]; then
      echo "  ❌ $DEP — NO EXISTE"
      GATE_OK=false
    else
      DEP_STATUS=$(grep -m1 "Status:" "$DEP_FILE" | sed 's/.*\*\*Status:\*\* //')
      if echo "$DEP_STATUS" | grep -q "✅"; then
        echo "  ✅ $DEP — Done"
      else
        echo "  ❌ $DEP — Status: $DEP_STATUS (no completado)"
        GATE_OK=false
      fi
    fi
  done
else
  echo "✅ Sin dependencias declaradas"
fi

echo ""
$GATE_OK && echo "✅ GATE PASS: Issue listo para implementar" || echo "🔴 GATE FAIL: Resolver dependencias antes de continuar"
```

> 🔴 Si GATE FAIL → **STOP**. No avanzar a Phase 3.

---

_Phase 2 Complete → Phase 3 (Plan)_
