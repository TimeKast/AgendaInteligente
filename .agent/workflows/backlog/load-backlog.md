# Phase 3 (add mode): Load Existing Backlog

> **Solo en `/backlog add`.**
> **Propósito:** Cargar backlog existente como contexto para generar nuevo issue/epic/milestone.

---

## 3a.1 Detectar Milestone Activo

// turbo

```bash
ACTIVE_M=$(ls -d docs/backlog/M*/ 2>/dev/null | sort -V | tail -1 | xargs basename 2>/dev/null || echo "")
if [ -z "$ACTIVE_M" ]; then
  echo "📝 No hay milestone activo — se creará M1"
else
  echo "📋 Milestone activo: $ACTIVE_M"
fi
```

---

## 3a.2 Cargar Epics Existentes

// turbo

```bash
ACTIVE_M=$(ls -d docs/backlog/M*/ 2>/dev/null | sort -V | tail -1 | xargs basename 2>/dev/null || echo "")
if [ -n "$ACTIVE_M" ]; then
  echo "📦 Cargando epics existentes..."
  for epic in docs/backlog/${ACTIVE_M}/epics/*.md; do
    if [ -f "$epic" ]; then
      echo "========================================"
      echo "=== $(basename $epic) ==="
      echo "========================================"
      cat "$epic"
      echo ""
    fi
  done
else
  echo "📝 No hay epics — se creará el primero"
fi
```

---

## 3a.3 Cargar Issues Existentes (cabeceras)

> Solo carga título + metadata de cada issue (no el cuerpo completo) para contexto.

// turbo

```bash
ACTIVE_M=$(ls -d docs/backlog/M*/ 2>/dev/null | sort -V | tail -1 | xargs basename 2>/dev/null || echo "")
if [ -n "$ACTIVE_M" ]; then
  echo "📋 Issues existentes (cabeceras):"
  for issue in docs/backlog/${ACTIVE_M}/issues/*.md; do
    if [ -f "$issue" ]; then
      echo "--- $(basename $issue) ---"
      head -15 "$issue"
      echo ""
    fi
  done
else
  echo "📝 No hay issues existentes"
fi
```

---

## 3a.4 Detectar IDs Disponibles

// turbo

```bash
ACTIVE_M=$(ls -d docs/backlog/M*/ 2>/dev/null | sort -V | tail -1 | xargs basename 2>/dev/null || echo "")
if [ -n "$ACTIVE_M" ]; then
  echo "📈 IDs en uso:"
  for issue in docs/backlog/${ACTIVE_M}/issues/*.md; do
    [ -f "$issue" ] && basename "$issue" .md
  done | sort
  echo ""
  NEXT_EPIC=$(ls docs/backlog/${ACTIVE_M}/epics/EPIC-*.md 2>/dev/null | grep -oE 'EPIC-[0-9]+' | grep -oE '[0-9]+' | sort -n | tail -1)
  NEXT_EPIC=$(printf "%02d" $((10#${NEXT_EPIC:-0} + 1)))
  echo "📈 Siguiente epic disponible: EPIC-${NEXT_EPIC}"
fi
```

---

_Backlog Loaded → Continuar a CHECKPOINT 1_
