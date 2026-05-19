---
description:
---

# Phase 2: Load Issue + Doc References

> **Propósito:** Cargar el issue completo y sus documentos referenciados.
> **Se ejecuta SIEMPRE.**

---

## 2.1 Load Issue

// turbo

```bash
cat ./docs/backlog/*/issues/${ISSUE_ID}*.md
```

**Extraer:**

- Title y ID
- Status (verificar no es Completed/Blocked)
- Epic asociado
- AC (checkboxes)
- Dependencias (Blocked By)
- Referencias (SCR/FLW/CMP/US)
- Doc References → se cargan en 2.2

---

## 2.2 Load Doc References (MANDATORY)

> 🔴 **El issue incluye `📎 Doc References` con documentos que el agente DEBE leer.**
> Sin este paso, el agente pierde contexto crítico que `/backlog` ya preparó.

**El agente DEBE:**

1. Buscar la sección `## Doc References` en el issue
2. Extraer TODOS los documentos referenciados
3. **Cargar la sección indicada** (no el doc entero)
4. Solo leer completo si el doc es pequeño (<100 líneas) o no hay sección específica
5. Si un doc no se encuentra, advertir pero no bloquear

> 🔴 **Regla:** Si el doc ref dice `DATA_MODEL | E-005`, cargar solo la sección E-005, no todo 06_DATA_MODEL.md.

### Doc Name Resolver

| Doc Name     | Resolves To                           |
| ------------ | ------------------------------------- |
| DISCOVERY    | `docs/planning/00_DISCOVERY_BRIEF.md` |
| PROPOSAL     | `docs/planning/01_PROPOSAL.md`        |
| FEATURE_MAP  | `docs/planning/02_FEATURE_MAP.md`     |
| PERSONAS     | `docs/planning/03_USER_PERSONAS.md`   |
| USER_STORIES | `docs/planning/04_USER_STORIES.md`    |
| BIZ_RULES    | `docs/planning/05_BUSINESS_RULES.md`  |
| DATA_MODEL   | `docs/planning/06_DATA_MODEL.md`      |
| ARCHITECTURE | `docs/planning/07_ARCHITECTURE.md`    |
| API          | `docs/planning/08_API_CONTRACTS.md`   |
| GLOSSARY     | `docs/planning/09_GLOSSARY.md`        |
| DESIGN       | `docs/planning/15_DESIGN.md`          |

// turbo

```bash
ISSUE_FILE=$(ls ./docs/backlog/*/issues/${ISSUE_ID}*.md 2>/dev/null | head -1)

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
        DISCOVERY) FILE="./docs/planning/00_DISCOVERY_BRIEF.md" ;;
        PROPOSAL)  FILE="./docs/planning/01_PROPOSAL.md" ;;
        FEATURE_MAP) FILE="./docs/planning/02_FEATURE_MAP.md" ;;
        PERSONAS)  FILE="./docs/planning/03_USER_PERSONAS.md" ;;
        USER_STORIES) FILE="./docs/planning/04_USER_STORIES.md" ;;
        BIZ_RULES) FILE="./docs/planning/05_BUSINESS_RULES.md" ;;
        DATA_MODEL) FILE="./docs/planning/06_DATA_MODEL.md" ;;
        ARCHITECTURE) FILE="./docs/planning/07_ARCHITECTURE.md" ;;
        API)       FILE="./docs/planning/08_API_CONTRACTS.md" ;;
        GLOSSARY)  FILE="./docs/planning/09_GLOSSARY.md" ;;
        DESIGN)    FILE="./docs/planning/15_DESIGN.md" ;;
        SK)        FILE="./docs/reference/reusable-library.md" ;;
        *) FILE="" ;;
      esac

      if [ -n "$FILE" ] && [ -f "$FILE" ]; then
        LINES=$(wc -l < "$FILE")
        if [ -n "$SECTION" ] && [ "$SECTION" != "-" ] && [ "$SECTION" != "General" ]; then
          # Targeted: load section only
          echo "📄 Loading: $DOC_NAME § $SECTION (targeted)"
          sed -n "/## .*${SECTION}/,/^## /p" "$FILE" | head -50
        elif [ "$LINES" -lt 100 ]; then
          # Small doc: load full
          echo "📄 Loading: $DOC_NAME (full — $LINES lines)"
          cat "$FILE"
        else
          # Large doc, no section: load head
          echo "📄 Loading: $DOC_NAME (head -80 — $LINES lines total)"
          head -80 "$FILE"
        fi
        echo ""
      elif [ -n "$FILE" ]; then
        echo "⚠️ Doc not found: $FILE (referenced as $DOC_NAME)"
      fi
    done

    # Format 2: List with markdown links (- [text](path))
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

> 🔴 **Gate:** Issue must be actionable.

// turbo

```bash
ISSUE_FILE=$(ls ./docs/backlog/*/issues/${ISSUE_ID}*.md 2>/dev/null | head -1)
STATUS=$(grep -m1 "Status:" "$ISSUE_FILE" | sed 's/.*\*\*Status:\*\* //')
echo "📊 Issue Status: $STATUS"

GATE_OK=true

# Check status
if echo "$STATUS" | grep -q "✅"; then
  echo "❌ GATE FAIL: Issue ya completado"
  GATE_OK=false
elif echo "$STATUS" | grep -q "🚫"; then
  echo "❌ GATE FAIL: Issue bloqueado"
  GATE_OK=false
fi

# Check real dependencies
BLOCKED_BY=$(grep -oE 'Blocked [Bb]y.*[A-Z]+-[0-9]+' "$ISSUE_FILE" | grep -oE '[A-Z]+-[0-9]+' | sort -u)
if [ -n "$BLOCKED_BY" ]; then
  echo ""
  echo "🔗 Dependencias declaradas:"
  for DEP in $BLOCKED_BY; do
    DEP_FILE=$(ls ./docs/backlog/*/issues/${DEP}*.md 2>/dev/null | head -1)
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

> 🔴 Si GATE FAIL → STOP.
