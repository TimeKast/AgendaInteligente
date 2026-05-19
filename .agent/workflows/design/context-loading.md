# Phase 1: Context Loading

> **Propósito:** Cargar knowledge base, agentes, skills, y docs de referencia.
> **Se ejecuta SIEMPRE.**

---

## 1.1 Load Knowledge Base

// turbo

```bash
cat ./.agent/skills/roles/design/SKILL.md
```

// turbo

```bash
cat ./docs/planning/project-config.md 2>/dev/null || echo "No project-config.md"
```

---

## 1.2 Previous Validation Report

> 📄 **Cargar reporte de validación del paso anterior** (si existe).

// turbo

```bash
PREV_REPORT=$(ls docs/reports/validation_docs_*.md 2>/dev/null | head -1)
[ -n "$PREV_REPORT" ] && { echo "📋 Loading: $PREV_REPORT"; cat "$PREV_REPORT"; } || echo "📝 No previous validation report (validation_docs_*)"
```

---

## 1.3 Load Reference Docs (Tiered)

> 📖 **Carga selectiva — solo refs relevantes para design.**
> Skip: crud-scaffold, e2e-testing, sw-updates, security.
> CODEBASE: TOC only.

// turbo

```bash
echo "📖 Loading Design Reference Docs..."

# Keep (full load)
for ref in component-catalog features navigation layout-patterns INVENTORY; do
  FILE="./docs/reference/${ref}.md"
  if [ -f "$FILE" ]; then
    echo "--- ${ref}.md ---"
    cat "$FILE"
  fi
done

# CODEBASE — TOC only
echo "--- CODEBASE.md (TOC) ---"
head -30 ./docs/reference/CODEBASE.md 2>/dev/null || echo "No CODEBASE.md"

# Conditional: notifications
BRIEF=$(cat ./docs/planning/00_DISCOVERY_BRIEF.md 2>/dev/null || echo "")
if echo "$BRIEF" | grep -qiE "notif|push|email|alert"; then
  echo "--- notifications.md ---"
  cat ./docs/reference/notifications.md 2>/dev/null || echo "No notifications.md"
fi
```

---

## 1.4 Load Guides

// turbo

```bash
# Design system — tokens, temas, neumorphic patterns
cat ./docs/guides/design-system.md 2>/dev/null || echo "No design-system guide"
```

---

## 1.5 SSOT Documents — Planning Docs (Tiered)

> 🔴 **Design deriva de Discovery + Docs.**
>
> **Chain:** Discovery (00) → Proposal (01) → Docs (02-14) → **Design** (15)

### Tier 1: Always Load

// turbo

```bash
echo "📄 Loading Tier 1 Planning Docs..."
for i in 00 02 03 04 05; do
  f=$(ls ./docs/planning/${i}_*.md 2>/dev/null | head -1)
  if [ -n "$f" ]; then
    echo "✅ Cargando: $f"
    cat "$f"
    echo ""
    echo "---"
  else
    echo "⚠️ No encontrado: ${i}_*.md"
  fi
done
```

### Tier 2: Conditional Load

// turbo

```bash
echo "📄 Loading Tier 2 Planning Docs (conditional)..."

# 01_PROPOSAL — scope MVP/Post
f=$(ls ./docs/planning/01_*.md 2>/dev/null | head -1)
[ -n "$f" ] && { echo "✅ $f"; cat "$f"; echo "---"; } || echo "⚠️ No 01_PROPOSAL.md"

# 06_DATA_MODEL — si campos en UI
f=$(ls ./docs/planning/06_*.md 2>/dev/null | head -1)
[ -n "$f" ] && { echo "✅ $f"; cat "$f"; echo "---"; } || echo "⚠️ No 06_DATA_MODEL.md"

# 07_ARCHITECTURE — si ADRs de UI
f=$(ls ./docs/planning/07_*.md 2>/dev/null | head -1)
[ -n "$f" ] && { echo "✅ $f"; cat "$f"; echo "---"; } || echo "⚠️ No 07_ARCHITECTURE.md"
```

> **Skip:** 08_API through 14 (not relevant for design).

---

## 1.6 Kit Skills Loading

> 🎨 **Skills del Kit para enriquecer el proceso de diseño**

// turbo

```bash
cat ./.agent/skills/frontend-design/SKILL.md 2>/dev/null || echo "No frontend-design skill"
```

// turbo

```bash
cat ./.agent/skills/frontend-design/ux-psychology.md 2>/dev/null || echo "No ux-psychology"
```

// turbo

```bash
cat ./.agent/skills/mobile-design/SKILL.md 2>/dev/null || echo "No mobile-design skill"
```

// turbo

```bash
# Stack-specific UI patterns (React, Tailwind, shadcn)
cat ./.agent/skills/domains/ui/SKILL.md 2>/dev/null | head -100 || echo "No domains/ui skill"
```

// turbo

```bash
# Skin families, visual tone selection
cat ./.agent/skills/ui-style-lab/SKILL.md 2>/dev/null || echo "No ui-style-lab skill"
```

---

## 1.7 Agent Context Loading

> 🤖 **Agentes para design**

// turbo

```bash
# Visual Design Director — visual language, skin, tone
cat ./.agent/agents/visual-design-director.md
```

// turbo

```bash
# Layout Composer — shell, nav model, density
cat ./.agent/agents/layout-composer.md
```

// turbo

```bash
# Design Engineer — tokens, states, a11y, motion, construibilidad
cat ./.agent/agents/design-engineer.md
```

// turbo

```bash
# Mobile si aplica
BRIEF=$(cat ./docs/planning/00_DISCOVERY_BRIEF.md 2>/dev/null || echo "")
echo "$BRIEF" | grep -qiE "mobile|ios|android|react native|flutter" && \
  cat ./.agent/agents/mobile-developer.md
```

// turbo

```bash
# SEO si aplica
BRIEF=$(cat ./docs/planning/00_DISCOVERY_BRIEF.md 2>/dev/null || echo "")
echo "$BRIEF" | grep -qiE "seo|metadata|sitemap" && \
  cat ./.agent/agents/seo-specialist.md
```

---

_Phase 1 Complete → Continuar a Phase 2 (Prerequisites)_
