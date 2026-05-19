# Phase 0 — Issue Selection + Context Status

> **Propósito:** Seleccionar issue, verificar contexto, validar prerequisites.
> **Sin carga de datos** — solo detección y gates.

---

## 0.1 Issue Selection

**Si el comando trae ISSUE-ID:**
→ Usar directamente: `ISSUE_ID = {argumento}`.

**Si NO se especificó issue (ni `--next`):**
→ Listar issues disponibles de la versión más reciente:

```bash
VERSION=$(ls -d ./project/backlog/v*/ ./project/backlog/M*/ 2>/dev/null | sort -V | tail -1 | xargs basename 2>/dev/null || echo "none")
if [ "$VERSION" != "none" ]; then
  echo "📋 Issues disponibles ($VERSION):"
  echo ""
  echo "| ID | Título | Priority | Status |"
  echo "| -- | ------ | -------- | ------ |"
  for f in ./project/backlog/${VERSION}/issues/*.md; do
    [ -f "$f" ] || continue
    ID=$(grep -m1 "^# " "$f" | sed 's/# //' | cut -d: -f1)
    TITLE=$(grep -m1 "^# " "$f" | sed 's/# //' | cut -d: -f2-)
    PRIORITY=$(grep -m1 "Priority:" "$f" | sed 's/.*\*\*Priority:\*\* //')
    STATUS=$(grep -m1 "Status:" "$f" | sed 's/.*\*\*Status:\*\* //')
    echo "| $ID | $TITLE | $PRIORITY | $STATUS |"
  done | grep -v "✅" | head -10
fi
```

→ Preguntar al usuario cuál implementar. **STOP hasta respuesta.**

**Si usa `--next`:** tomar primer issue P0/P1 con status `📋 Backlog`.

---

## 0.2 Prerequisites (Hard Gates)

```bash
if [ -z "$ISSUE_ID" ]; then
  echo "🛑 No ISSUE_ID — seleccionar issue primero (Phase 0.1)"
fi

if [ ! -f "package.json" ]; then
  echo "❌ GATE FAIL: Proyecto no configurado"
fi

if [ ! -d "project/backlog" ]; then
  echo "❌ GATE FAIL: No hay backlog — ejecutar /backlog primero"
fi

FILES=$(ls ./project/backlog/*/issues/${ISSUE_ID}*.md 2>/dev/null)
COUNT=$(echo "$FILES" | grep -c . 2>/dev/null || echo 0)

if [ "$COUNT" -eq 0 ]; then
  echo "❌ GATE FAIL: Issue no encontrado: ${ISSUE_ID}"
  echo "📌 Issues disponibles:"
  ls ./project/backlog/*/issues/*.md 2>/dev/null | head -10
elif [ "$COUNT" -gt 1 ]; then
  echo "❌ GATE FAIL: Múltiples matches para ${ISSUE_ID}:"
  echo "$FILES"
else
  echo "✅ GATE PASS: $FILES"
fi
```

> 🔴 Si cualquier GATE FAIL → **STOP**. No continuar a Phase 1.

---

_Phase 0 Complete → Phase 1 (Context Loading)_
