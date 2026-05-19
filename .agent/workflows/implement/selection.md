# Phase 0: Issue Selection + Context Status

> **Propósito:** Seleccionar issue y mostrar estado del contexto.
> **Sin carga de datos** — solo detección.

---

## 0.1 Issue Selection

**Si se especificó issue en el comando:**

> Usar directamente: `ISSUE_ID = {argumento}`

**Si NO se especificó issue:**

// turbo

```bash
VERSION=$(ls -d ./docs/backlog/v*/ ./docs/backlog/M*/ 2>/dev/null | sort -V | tail -1 | xargs basename 2>/dev/null || echo "none")
if [ "$VERSION" != "none" ]; then
  echo "📋 Issues disponibles ($VERSION):"
  echo ""
  echo "| ID | Título | Priority | Status |"
  echo "| -- | ------ | -------- | ------ |"
  for f in ./docs/backlog/${VERSION}/issues/*.md; do
    [ -f "$f" ] || continue
    ID=$(grep -m1 "^# " "$f" | sed 's/# //' | cut -d: -f1)
    TITLE=$(grep -m1 "^# " "$f" | sed 's/# //' | cut -d: -f2-)
    PRIORITY=$(grep -m1 "Priority:" "$f" | sed 's/.*\*\*Priority:\*\* //')
    STATUS=$(grep -m1 "Status:" "$f" | sed 's/.*\*\*Status:\*\* //')
    echo "| $ID | $TITLE | $PRIORITY | $STATUS |"
  done | grep -v "✅" | head -10
fi
```

**Si usa `--next`:** Tomar primer issue P0/P1 pendiente (📋 Backlog).

**ACTION:** Si no hay issue → `notify_user` preguntando cuál implementar.

---

## 0.2 Context Status (MANDATORY)

> 🔴 **MANDATORY — El agente DEBE generar esta tabla y actuar según el resultado.**

// turbo

```bash
cat ./.agent/workflows/_shared/context-check.md
```

**ENFORCE:**

> Después de generar la tabla de Context Status:
>
> - **🟢** → Continuar a Phase 0.3
> - **🟡 o 🔴** → **MANDATORY STOP.** Llamar `notify_user` con:
>   - `BlockedOnUser: true`
>   - `ShouldAutoProceed: false`
>   - Mensaje: "⚠️ Contexto en [🟡/🔴] ([X]%). Recomiendo abrir un chat nuevo para este issue. ¿Continúo aquí o prefieres chat nuevo?"
>
> 🛑 **Si 🟡/🔴 → NO avanzar sin respuesta del usuario. NUNCA.**

---

## 0.3 Prerequisites

// turbo

```bash
if [ -z "$ISSUE_ID" ]; then
  echo "🛑 No ISSUE_ID — seleccionar issue primero (Phase 0.1)"
fi

if [ ! -f "package.json" ]; then
  echo "❌ GATE FAIL: Proyecto no configurado — ejecuta setup primero"
fi

if [ ! -d "docs/backlog" ]; then
  echo "❌ GATE FAIL: No hay backlog — ejecuta /backlog primero"
fi

FILES=$(ls ./docs/backlog/*/issues/${ISSUE_ID}*.md 2>/dev/null)
COUNT=$(echo "$FILES" | grep -c . 2>/dev/null || echo 0)

if [ $COUNT -eq 0 ]; then
  echo "❌ GATE FAIL: Issue no encontrado: ${ISSUE_ID}"
  echo "📌 Issues disponibles:"
  ls ./docs/backlog/*/issues/*.md 2>/dev/null | head -10
elif [ $COUNT -gt 1 ]; then
  echo "❌ GATE FAIL: Múltiples matches para ${ISSUE_ID}:"
  echo "$FILES"
else
  echo "✅ GATE PASS: Issue encontrado: $FILES"
fi
```

> 🔴 Si cualquier GATE FAIL → STOP. No continuar a Phase 1.

---

_Phase 0 Complete → Continuar a Phase 1 (Context Loading)_
