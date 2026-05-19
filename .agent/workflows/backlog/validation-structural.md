# Phase 7a: Validation - Structural Checks

> **Carga:** Después de CHECKPOINT 2 aprobado.
> **Solo full mode.** En add mode → usar validation-lite.md.
>
> 🔍 **OBLIGATORIO** — Validación estructural del backlog generado.

---

## 7a.1 Self-Validation (Checklist Mecánica)

> 📝 Los docs de planning (00-15) ya fueron cargados en Phase 3 (load-docs.md).
> **NO recargar** — solo verificar estructura del backlog generado.

**Checklist Estructural (el agente valida TODO):**

- Todos los issues tienen título con formato `PREFIX-NUM: Título`
- Cada issue tiene metadata: Status, Priority, Effort, Story Points, Epic, **Owner**
- **Owner** presente en cada issue (nombre, Tech Lead, o TBD)
- Cada issue tiene secciones: Objetivo, User Story, AC, Gherkin, Doc References
- 🔴 **Doc References usan formato tabla** (no lista)
- 🔴 **Doc References incluyen anchor links** (`#br-xxx`, `#e-xxx`, `#scr-xxx`)
- No contienen placeholders (`{...}`, `[TODO]`, `TBD`)
- Cada issue referencia su epic correctamente en metadata
- Cada epic lista TODOS sus issues en la tabla
- No hay issues huérfanos (sin epic)
- Cada epic termina con issue de testing (numeración secuencial)
- README.md del milestone lista todos los epics
- Todas las refs US/SCR/E/P-XXX en issues existen en docs
- **SK Leverage** sección presente en cada issue (contenido o "No aplica")
- **Implementation Evidence** sección presente en cada issue
- **Commits** sección presente en cada issue
- **SK Overlap Check:** Ningún issue recrea funcionalidad del SK

// turbo

```bash
echo "🔍 Self-Validation: Backlog Structure..."

echo "📋 Validando títulos..."
for f in ./docs/backlog/*/issues/*.md; do
  [ -f "$f" ] && grep -qE "^# [A-Z]+-[0-9]+:" "$f" && echo "✅ $(basename $f): título OK" || echo "❌ $(basename $f): título incorrecto"
done 2>/dev/null

echo ""
echo "📋 Validando metadata..."
for f in ./docs/backlog/*/issues/*.md; do
  [ -f "$f" ] && {
    status=$(grep -qF '**Status:**' "$f" && echo "✅" || echo "❌")
    priority=$(grep -qF '**Priority:**' "$f" && echo "✅" || echo "❌")
    owner=$(grep -qF '**Owner:**' "$f" && echo "✅" || echo "❌")
    echo "$status/$priority/$owner $(basename $f)"
  }
done 2>/dev/null

echo ""
echo "🔴 Validando anchor links en Doc References..."
ANCHOR_FAILS=""
for f in ./docs/backlog/*/issues/*.md; do
  [ -f "$f" ] || continue
  # Check if Doc References table has links without anchors
  DOC_REFS=$(grep -E '\|.*planning/.*\.md' "$f" 2>/dev/null || true)
  if [ -n "$DOC_REFS" ]; then
    NO_ANCHOR=$(echo "$DOC_REFS" | grep -v '#' || true)
    if [ -n "$NO_ANCHOR" ]; then
      ANCHOR_FAILS="$ANCHOR_FAILS $(basename $f)"
    fi
  fi
done
if [ -n "$ANCHOR_FAILS" ]; then
  echo "❌ Doc refs SIN anchor links:$ANCHOR_FAILS"
else
  echo "✅ Todos los doc refs tienen anchor links"
fi

echo ""
echo "📋 Validando SK Leverage section..."
SK_MISSING=""
for f in ./docs/backlog/*/issues/*.md; do
  [ -f "$f" ] || continue
  grep -qi "SK Leverage" "$f" || SK_MISSING="$SK_MISSING $(basename $f)"
done
if [ -n "$SK_MISSING" ]; then
  echo "❌ Issues SIN SK Leverage:$SK_MISSING"
else
  echo "✅ Todos los issues tienen SK Leverage"
fi

echo ""
echo "📊 Totales:"
echo "📎 Issues: $(ls ./docs/backlog/*/issues/*.md 2>/dev/null | wc -l)"
echo "📎 Epics: $(ls ./docs/backlog/*/epics/*.md 2>/dev/null | wc -l)"
echo "📎 US refs: $(grep -ohE 'US-[0-9]+' ./docs/backlog/*/issues/*.md 2>/dev/null | sort -u | wc -w)"
echo "📎 SCR refs: $(grep -ohE 'SCR-[0-9]+' ./docs/backlog/*/issues/*.md 2>/dev/null | sort -u | wc -w)"
```

---

## 7a.2 Namespace Consistency Check

// turbo

```bash
echo "🔍 Namespace Consistency Check..."
RN_PLAN=$(grep -rohE 'RN-[0-9]+' docs/planning/*.md 2>/dev/null | sort -u | wc -l | tr -d ' ')
BR_PLAN=$(grep -rohE 'BR-[0-9]+' docs/planning/*.md 2>/dev/null | sort -u | wc -l | tr -d ' ')
RN_BACK=$(grep -rohE 'RN-[0-9]+' docs/backlog/*/issues/*.md 2>/dev/null | sort -u | wc -l | tr -d ' ')
if [ "$RN_PLAN" -gt 0 ] && [ "$BR_PLAN" -gt 0 ]; then
  echo "🔴 NAMESPACE DRIFT en docs: $RN_PLAN RN-IDs + $BR_PLAN BR-IDs mezclados"
elif [ "$RN_PLAN" -gt 0 ]; then
  echo "⚠️ Docs usan RN- namespace (no estándar)"
fi
if [ "$RN_BACK" -gt 0 ]; then
  echo "🔴 NAMESPACE DRIFT en backlog: $RN_BACK issues con RN- IDs"
fi
[ "$RN_PLAN" -eq 0 ] && [ "$RN_BACK" -eq 0 ] && echo "✅ Namespace consistente (BR-XXX)"
```

> 🛑 **GATE:** Si NAMESPACE DRIFT detectado → corregir IDs antes de continuar.

---

## 7a.3 Traceability Matrix Validation

// turbo

```bash
echo "🔍 Validando Traceability Matrix..."
f="./docs/planning/14_TRACEABILITY.md"
[ -f "$f" ] && echo "✅ 14_TRACEABILITY.md existe" || echo "🔴 NO EXISTE — STOP"
[ -f "$f" ] && {
  US_STORIES=$(grep -oE "US-[0-9]+" ./docs/planning/04_USER_STORIES.md 2>/dev/null | sort -u | wc -l)
  US_MAPPED=$(grep -oE "US-[0-9]+" "$f" 2>/dev/null | sort -u | wc -l)
  echo "📊 US en 04_USER_STORIES: $US_STORIES"
  echo "📊 US en 14_TRACEABILITY: $US_MAPPED"
  [ "$US_MAPPED" -ge "$US_STORIES" ] && echo "✅ Cobertura completa" || echo "⚠️ Hay US sin mapear en traceability"
}
```

// turbo

```bash
echo "🔍 Validando Epic → Issues..."
for epic in ./docs/backlog/*/epics/*.md; do
  if [ -f "$epic" ]; then
    epic_name=$(basename "$epic" .md)
    count=$(grep -l "$epic_name" ./docs/backlog/*/issues/*.md 2>/dev/null | wc -l)
    echo "📂 $epic_name: $count issues"
  fi
done
echo ""
echo "🔍 Validando Milestone..."
for version in $(ls -d ./docs/backlog/v*/ ./docs/backlog/M*/ 2>/dev/null); do
  epic_count=$(ls "$version/epics/"*.md 2>/dev/null | wc -l)
  issue_count=$(ls "$version/issues/"*.md 2>/dev/null | wc -l)
  echo "📂 $(basename $version): $epic_count epics, $issue_count issues"
done
```

---

## 7a.4 Issue Categorization Check

> 🔴 Todo issue DEBE estar trazado a US/SCR/FLW/E o declarado como Non-Traceable.

// turbo

```bash
echo "🔍 Validando que todo issue está categorizado..."

ORPHANS=""
for issue in ./docs/backlog/*/issues/*.md; do
  [ ! -f "$issue" ] && continue
  ISSUE_ID=$(basename "$issue" .md | sed 's/-[a-z].*//i')
  HAS_REF=$(grep -qE "Implementa:\s*(US|SCR|FLW|E)-" "$issue" && echo "yes" || echo "no")
  if [ "$HAS_REF" = "no" ]; then
    IN_NT=$(grep -q "$ISSUE_ID" ./docs/planning/14_TRACEABILITY.md 2>/dev/null && echo "yes" || echo "no")
    if [ "$IN_NT" = "no" ]; then
      ORPHANS="$ORPHANS $ISSUE_ID"
    fi
  fi
done

if [ -n "$ORPHANS" ]; then
  echo "🔴 Issues sin categoría:$ORPHANS"
  echo "🛑 STOP — Cada issue debe estar trazado O declarado como Non-Traceable"
else
  echo "✅ Todos los issues están categorizados"
fi
```

---

## 7a.5 Source Reconciliation Check (Brief/Docs → Backlog)

> 🔴 **MANDATORY — Red de seguridad FINAL.**

**Tabla 1: Entidades → CRUD Issues**

| #   | Entidad E-XXX | Issue(s) CRUD en backlog | Status |
| --- | ------------- | ------------------------ | ------ |
| 1   | E-001         | ISSUE-001, ISSUE-002     | ✅/❌  |

**Tabla 2: User Stories → Issues**

| #   | US-XXX | Issue(s) que la implementa | Status |
| --- | ------ | -------------------------- | ------ |
| 1   | US-001 | ISSUE-003                  | ✅/❌  |

**Tabla 3: Pantallas → Issues**

| #   | SCR-XXX | Issue(s) que la implementa | Status |
| --- | ------- | -------------------------- | ------ |
| 1   | SCR-001 | ISSUE-004                  | ✅/❌  |

**Tabla 4: Brief §3.1 → Issues (RECONCILIACIÓN FINAL)**

> ⚠️ **Más importante** — cruza Brief vs backlog directamente.

| #   | Feature Brief §3.1  | MVP/Post | Issue(s) en backlog | Status |
| --- | ------------------- | -------- | ------------------- | ------ |
| 1   | [feature del Brief] | MVP      | ISSUE-005           | ✅/❌  |

**🛑 GATE:** Si CUALQUIER status ❌ sin justificación → **STOP**.

---

> 🛑 **GATE:** Si falla checklist estructural o traceability → corregir antes de continuar.

---

_Structural Checks Complete → Ir a Phase 7b (validation-review.md)_
