# Phase 2: Prerequisites

> **Carga:** Después de context-loading.md
> **Solo full mode.** En add mode → skip a Phase 3.

---

## 2.1 Verificar TODOS los Documentos Requeridos (00-14 + 15)

> 🔴 **OBLIGATORIO** — Backlog requiere TODOS los docs completados.

// turbo

```bash
echo "📄 Verificando TODOS los docs de planning (00-15)..."
echo ""
MISSING=0

for i in 00 01 02 03 04 05 06 07 08 09 10 11 12 13 14; do
  f=$(ls ./docs/planning/${i}_*.md 2>/dev/null | head -1)
  if [ -n "$f" ]; then
    echo "✅ $(basename $f)"
  else
    echo "❌ ${i}_*.md — FALTA"
    MISSING=$((MISSING+1))
  fi
done

if [ -f "./docs/planning/15_DESIGN.md" ]; then
  echo "✅ 15_DESIGN.md"
else
  echo "❌ 15_DESIGN.md — FALTA"
  MISSING=$((MISSING+1))
fi

echo ""
echo "Total faltantes: $MISSING"
[ $MISSING -gt 0 ] && echo "🛑 STOP — Ejecutar /discovery → /proposal → /docs → /design primero"
```

---

## 2.2 Archivos Requeridos (STOP si falta CUALQUIERA)

| Archivo                               | Estado       | Si falta     |
| ------------------------------------- | ------------ | ------------ |
| `docs/planning/00_DISCOVERY_BRIEF.md` | ✅ Requerido | `/discovery` |
| `docs/planning/01_PROPOSAL.md`        | ✅ Requerido | `/proposal`  |
| `docs/planning/02-14_*.md`            | ✅ Requerido | `/docs`      |
| `docs/planning/15_DESIGN.md`          | ✅ Requerido | `/design`    |

**ACTION:** STOP workflow si falta cualquier doc.

---

## 2.3 OQ Detection → ADR Issues

> 🔍 **Detectar Open Questions para crear ADR issues.**
> OQs NO bloquean — se convierten en ADR issues y los issues afectados se marcan como `Blocked By: ADR-XXX`.

// turbo

```bash
echo "🔍 Buscando Open Questions en docs 02-15..."
echo ""
OQ_COUNT=0
OQ_FILES=""

DOC_FILES=$(find ./docs/planning -maxdepth 1 -name '0[2-9]_*.md' -o -name '1[0-5]_*.md' 2>/dev/null | sort)

if [ -z "$DOC_FILES" ]; then
  echo "⚠️ No se encontraron docs 02-15"
else
  for f in $DOC_FILES; do
    BASENAME=$(basename "$f")
    IN_OQ=false
    while IFS= read -r line; do
      if echo "$line" | grep -qiE "^#{1,4}.*open.?questions"; then
        IN_OQ=true
        continue
      fi
      if $IN_OQ && echo "$line" | grep -qE "^#{1,4} "; then
        IN_OQ=false
        continue
      fi
      if $IN_OQ && echo "$line" | grep -qE "^[[:space:]]*[-*] "; then
        echo "⚠️  [$BASENAME] $line"
        OQ_COUNT=$((OQ_COUNT+1))
        echo "$OQ_FILES" | grep -q "$BASENAME" || OQ_FILES="$OQ_FILES $BASENAME"
      fi
    done < "$f"
  done

  echo ""
  echo "📊 Total OQs encontradas: $OQ_COUNT"
  [ $OQ_COUNT -gt 0 ] && echo "📁 En archivos:$OQ_FILES"
  [ $OQ_COUNT -eq 0 ] && echo "✅ No hay Open Questions pendientes"
  [ $OQ_COUNT -gt 0 ] && echo "📝 Se crearán ADR issues para cada OQ durante generación"
fi
```

**Si hay OQs:**

1. **NO bloquear** — continuar con generación
2. Por cada OQ → crear `ADR-XXX: Decidir [tema]` (ver SKILL §9)
3. Issues afectados → marcar `> **Blocked By:** ADR-XXX`

---

## 2.4 Determinar Versión/Milestone

// turbo

```bash
VERSION=$(ls -d ./docs/backlog/v*/ ./docs/backlog/M*/ 2>/dev/null | sort -V | tail -1 | xargs basename 2>/dev/null || echo "M1")
echo "📌 Using milestone: $VERSION"
```

---

_Prerequisites Complete → Continuar a Phase 3 (Load Docs)_
