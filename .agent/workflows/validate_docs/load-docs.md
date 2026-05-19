# Phase: Load ALL Planning Docs for Validation

> **Carga:** Después de tier selection, ANTES de ejecutar cualquier validación.
>
> 🔴 **OBLIGATORIO:** Leer TODOS los documentos de planning (00-15) COMPLETOS.
> La validación es INÚTIL si el agente lee selectivamente.

---

## ⚠️ POR QUÉ ESTO ES OBLIGATORIO

> El propósito de `/validate_docs` es verificar integridad y fidelidad semántica
> entre documentos. Si el agente lee fragmentos o resúmenes, se pierde
> POR COMPLETO el propósito de la validación.
>
> **NO hay atajos. NO hay lectura selectiva. TODOS los docs, COMPLETOS.**

---

## Cargar TODOS los documentos del pipeline

> 🔴 **CADA doc se lee con `cat` para garantizar lectura completa.**
> El agente NO puede sustituir esto con `view_file` parcial.

// turbo

```bash
echo "📄 Cargando TODOS los docs de planning para validación..."
echo ""

for i in 00 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15; do
  f=$(ls ./docs/planning/${i}_*.md 2>/dev/null | head -1)
  if [ -n "$f" ]; then
    echo "========================================"
    echo "=== $(basename $f) ==="
    echo "========================================"
    cat "$f"
    echo ""
  else
    echo "⚠️ ${i}_*.md — NO ENCONTRADO (puede ser normal según stage)"
  fi
done

# project-config.md (configuración del proyecto)
if [ -f "./docs/planning/project-config.md" ]; then
  echo "========================================"
  echo "=== project-config.md ==="
  echo "========================================"
  cat "./docs/planning/project-config.md"
  echo ""
else
  echo "⚠️ project-config.md — NO ENCONTRADO"
fi
```

---

## Cargar Backlog (si existe)

> 🔴 **Si el stage es post-backlog, TAMBIÉN leer todos los epics e issues.**

// turbo

```bash
if [ -d "./docs/backlog" ]; then
  echo ""
  echo "📂 Cargando Backlog..."
  echo ""

  # Epics
  for epic in ./docs/backlog/*/epics/*.md; do
    if [ -f "$epic" ]; then
      echo "========================================"
      echo "=== EPIC: $(basename $epic) ==="
      echo "========================================"
      cat "$epic"
      echo ""
    fi
  done

  # Issues
  for issue in ./docs/backlog/*/issues/*.md; do
    if [ -f "$issue" ]; then
      echo "========================================"
      echo "=== ISSUE: $(basename $issue) ==="
      echo "========================================"
      cat "$issue"
      echo ""
    fi
  done

  EPIC_COUNT=$(ls ./docs/backlog/*/epics/*.md 2>/dev/null | wc -l | tr -d ' ')
  ISSUE_COUNT=$(ls ./docs/backlog/*/issues/*.md 2>/dev/null | wc -l | tr -d ' ')
  echo "📋 Backlog: ${EPIC_COUNT} epics, ${ISSUE_COUNT} issues cargados"
else
  echo "ℹ️ No hay backlog (normal si stage < post-backlog)"
fi
```

---

## Verificar Carga Completa

// turbo

```bash
echo ""
echo "📊 Resumen de docs cargados:"
TOTAL=0
for i in 00 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15; do
  f=$(ls ./docs/planning/${i}_*.md 2>/dev/null | head -1)
  if [ -n "$f" ]; then
    LINES=$(wc -l < "$f" | tr -d ' ')
    echo "  ✅ $(basename $f) — ${LINES} líneas"
    TOTAL=$((TOTAL + 1))
  fi
done
echo ""
echo "📋 Total docs cargados: ${TOTAL}"
echo ""
echo "🔴 Si algún doc esperado falta → verificar stage detectado en Phase 0"
```

---

## 🛑 REGLA DE ENFORCEMENT

> **PROHIBIDO** pasar a Phase 2 (Execute Validation) sin haber ejecutado
> los `cat` de esta fase. El agente DEBE tener en contexto el contenido
> COMPLETO de todos los docs antes de emitir cualquier juicio de validación.

❌ **PROHIBIDO:**

- Usar `view_file` con rangos parciales como sustituto
- Decir "ya conozco el contenido de sesiones anteriores"
- Resumir docs sin haberlos leído en esta ejecución
- Saltar esta fase por "eficiencia"

✅ **OBLIGATORIO:**

- Ejecutar el bloque `cat` completo
- Verificar que el resumen muestra todos los docs esperados
- Solo entonces proceder a validación

---

_Load Docs Complete → Continuar a Phase 2 (Execute Validation)_
