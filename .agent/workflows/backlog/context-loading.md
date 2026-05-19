# Phase 1: Context Loading

> **Propósito:** Cargar knowledge base, agentes, y docs de referencia del SK.
> **Se ejecuta SIEMPRE** — tanto en full como en add mode.

---

## 1.1 Load Knowledge Base

// turbo

```bash
cat ./.agent/skills/roles/backlog/SKILL.md
```

// turbo

```bash
cat ./.agent/rules/DOR_DOD.md 2>/dev/null || echo "No DOR_DOD.md"
```

// turbo

```bash
cat ./docs/planning/project-config.md 2>/dev/null || echo "No project-config.md"
```

---

## 1.1b Detect Owner Assignment

> 🎯 **El Owner se asigna a issues durante generación.** Detectar quién aquí.

// turbo

```bash
echo "👥 Detecting Owner assignment source..."
# 1. Check project-config.md for explicit owners
if grep -qi "owner\|team\|developer" ./docs/planning/project-config.md 2>/dev/null; then
  echo "✅ project-config.md tiene info de team/owner"
  grep -iA 5 "owner\|team\|developer" ./docs/planning/project-config.md 2>/dev/null | head -15
# 2. Check Discovery Brief for team section
elif grep -qi "team\|equipo\|developer\|desarrollador" ./docs/planning/00_DISCOVERY_BRIEF.md 2>/dev/null; then
  echo "✅ Discovery Brief tiene sección de team"
  grep -iA 10 "team\|equipo\|developer\|desarrollador" ./docs/planning/00_DISCOVERY_BRIEF.md 2>/dev/null | head -15
else
  echo "⚠️ No se encontró info de team/owner"
  echo "📌 Owner será 'TBD' — resolver en CHECKPOINT 1"
fi
```

> **Regla de asignación (SKILL §4):**
>
> | Situación                | Owner                                  |
> | ------------------------ | -------------------------------------- |
> | Múltiples devs con roles | Asignar por dominio (frontend/backend) |
> | 1 solo dev               | Nombre del dev o `Tech Lead`           |
> | Sin info de team         | `TBD` → preguntar en CHECKPOINT 1      |

---

## 1.2 Previous Validation Report (if exists)

// turbo

```bash
PREV_REPORT=$(ls docs/reports/validation_design_*.md 2>/dev/null | head -1)
[ -n "$PREV_REPORT" ] && { echo "📋 Loading: $PREV_REPORT"; cat "$PREV_REPORT"; } || echo "📝 No previous validation report"
```

---

## 1.3 SK Docs (Guides + References)

> 🎯 **El SK ya tiene mucho implementado** — cargar estos docs evita crear issues redundantes.
> Incluye `crud-scaffold.md` para estandarizar issues de CRUD.

// turbo

```bash
echo "📚 Loading Starter Kit Guides..."
for guide in ./docs/guides/*.md; do
  BASENAME=$(basename "$guide")
  # Skip: SKILL already covers getting-started; troubleshooting not relevant for issues
  [ "$BASENAME" = "getting-started.md" ] && continue
  [ "$BASENAME" = "troubleshooting.md" ] && continue
  if [ -f "$guide" ]; then
    echo "--- $BASENAME ---"
    cat "$guide"
  fi
done
```

// turbo

```bash
echo "📖 Loading Reference Docs..."
for ref in ./docs/reference/*.md; do
  BASENAME=$(basename "$ref")
  if [ -f "$ref" ]; then
    echo "--- $BASENAME ---"
    if [ "$BASENAME" = "CODEBASE.md" ]; then
      head -30 "$ref"  # TOC only — full file too heavy for backlog context
    else
      cat "$ref"
    fi
  fi
done
```

> ⚠️ **CONTEXT WARNING**
>
> Este workflow carga mucho contexto (~50-70% del límite).
> Para mejores resultados:
>
> 1. Ejecutar en un **chat nuevo** dedicado
> 2. Comenzar con `/init` → `/backlog`

---

## 1.4 Agents

> 🤖 **Agentes para backlog**

// turbo

```bash
cat ./.agent/agents/project-planner.md
```

// turbo

```bash
head -80 ./.agent/agents/architect.md
```

---

_Phase 1 Complete → Continuar a Phase 2 (Prerequisites) o Phase 3 (en add mode)_
