# Phase 1: Context Loading

> **Propósito:** Cargar knowledge base, agentes, skills, y docs de referencia.
> **Se ejecuta SIEMPRE.**
>
> ⚠️ **Context budget:** Cargar solo lo estrictamente necesario.
> Docs que solo aplican a batches específicos se cargan en su batch file.

---

## 1.1 Load Knowledge Base

// turbo

```bash
cat ./.agent/skills/roles/docs/SKILL.md
```

---

## 1.2 Load Reference Docs (selectivo)

> 📖 **Cargar SOLO docs de referencia directamente relevantes para generación.**
> Otros docs se cargan on-demand en batch files específicos.

// turbo

```bash
echo "📖 Loading Reference Docs (selective)..."
cat ./docs/reference/features.md 2>/dev/null || echo "⚠️ No features.md"
cat ./docs/reference/component-catalog.md 2>/dev/null || echo "⚠️ No component-catalog.md"
cat ./docs/reference/navigation.md 2>/dev/null || echo "⚠️ No navigation.md"
```

---

## 1.3 Load Guides

// turbo

```bash
# Project structure — relevante para 07_ARCHITECTURE
cat ./docs/guides/project-structure.md 2>/dev/null || echo "No project-structure guide"
```

---

## 1.4 SSOT Document (MANDATORY)

> 🔴 **OBLIGATORIO** — Docs deriva de Discovery Brief.
>
> **Chain:** Discovery (00) → Proposal (01) → **Docs** (02-14)
>
> ⚠️ Proposal se carga en Phase 5 (validation) donde se necesita para coverage check.

// turbo

```bash
cat ./docs/planning/00_DISCOVERY_BRIEF.md 2>/dev/null || echo "⚠️ No 00_DISCOVERY_BRIEF.md"
```

---

## 1.5 Agent Context Loading

> 🤖 **Solo document-writer base.** Architect se carga on-demand en Batch 4.

// turbo

```bash
cat ./.agent/agents/documentation-writer.md
```

---

## 1.6 Previous Validation Report (solo modo regeneración)

> 📄 **Cargar SOLO si los docs 02-14 ya existen** (modo regeneración/refresh).

// turbo

```bash
# Solo cargar si hay docs previos (modo regeneración)
if ls docs/planning/0[2-9]_*.md docs/planning/1[0-4]_*.md 2>/dev/null | head -1 > /dev/null 2>&1; then
  PREV_REPORT=$(ls docs/reports/validation_docs_*.md 2>/dev/null | sort | tail -1)
  [ -n "$PREV_REPORT" ] && { echo "📋 Loading previous validation: $PREV_REPORT"; cat "$PREV_REPORT"; } || echo "📝 No previous validation report"
else
  echo "ℹ️ First generation — no previous validation to load"
fi
```

---

## 1.7 Project-Specific Loading

> 🎯 **Si el proyecto tiene agentes o skills propios, cargarlos para contexto de dominio.**
>
> Esto da al agente conocimiento específico del dominio (ej: reglas deportivas, lógica financiera)
> que mejora significativamente la calidad de 06_DATA_MODEL, 07_ARCHITECTURE, y 10_RUNBOOKS.

// turbo

```bash
# Project registry
cat ./.agent/registry/project.yaml 2>/dev/null || echo "ℹ️ No project registry"
```

// turbo

```bash
# Project agents
for agent in ./.agent/agents/project/*.md; do
  [ -f "$agent" ] && [ "$(basename $agent)" != ".gitkeep" ] && { echo "🤖 --- $(basename $agent) ---"; cat "$agent"; }
done
echo "ℹ️ Project agents loaded (or none found)"
```

// turbo

```bash
# Project skills
for skill in ./.agent/skills/project/*/SKILL.md; do
  [ -f "$skill" ] && { echo "🧰 --- $(dirname $skill | xargs basename) ---"; cat "$skill"; }
done
echo "ℹ️ Project skills loaded (or none found)"
```

---

_Phase 1 Complete → Continuar a Phase 2 (Prerequisites)_
