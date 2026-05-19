# Methodology — Factory Tickets (intake-drift / sk-drift / workflow-drift)

> Sub-file of `tk-discovery/methodology/`. See parent `methodology.md` for the full index.
> Topical scope: kit-wide primitive for surfacing actionable Factory gaps from any workflow — ticket types, trigger rules, location/naming convention, ticket shape, harvest reference, and pipeline rules.

---

## §13 — Factory-Ticket Pattern (kit-wide primitive)

**Primitiva del kit para escalar gaps accionables del Factory desde cualquier workflow.** No específico al Discovery — cualquier agent/skill/workflow que encuentre un gap actionable puede emitir un factory-ticket con este shape.

### Tipos canonical

- `intake-drift` — emitido por `dsc-intake-analyst` (Phase 1) cuando encuentra media-type Tier 2 / unknown
- `sk-drift` — emitido por `dsc-kit-analyst` (Phase 5) cuando encuentra features en `src/` no documentados en skills `sk-*`
- `workflow-drift` — emitido por main orchestrator (Phase 8 close con user confirmation) cuando schema 7-fields o algún aspecto estructural del workflow no aloja correctamente la info de un FT. Candidate surface, user aprueba emisión.

Future workflows may emit additional types following this shape.

### Trigger rules objetivas (no juicio)

**`intake-drift`:** automático por `dsc-intake-analyst`. Cualquier file Tier 2 (`.docx`/`.pdf`/`.xlsx`/unknown) → emit.

**`sk-drift`:** automático por `dsc-kit-analyst`. Feature en `src/` del target repo sin cobertura en `sk-features-index` + `sk-*` skills → emit.

**`workflow-drift` candidates (orchestrator surfacea, user emite):**

- Edge bucket de un FT Tier L excede **500 chars** → candidate "schema 7-fields insuficiente para state machines"
- **≥2 FTs Tier L en mismo run** disparan la regla above → elevar a ticket material
- **>8 [INFERRED] tags** en Firm Decisions de un run → candidate "Phase 3 Gap Interview insuficiente" (gap rate alto sugiere workflow gap)
- Agent `dsc-feature-specer` retorna error "Tier L received in batch" → workflow-drift "Phase 4a tiering pass missed Tier L"

### Location + naming

- **Location:** `project/factory/` (per-project, flat dir)
- **Filename:** `{type}-{YYYY-MM-DD}-{project-slug}-{NNN}.md`

Ejemplo:

```
project/factory/
├── intake-drift-{YYYY-MM-DD}-{project-slug}-001.md
├── intake-drift-{YYYY-MM-DD}-{project-slug}-002.md
├── sk-drift-{YYYY-MM-DD}-{project-slug}-001.md
└── .gitkeep
```

### Ticket shape

```markdown
# Factory Ticket — {type}

**Project:** {project-slug}
**Date:** {YYYY-MM-DD}
**Source agent:** dsc-intake-analyst | dsc-kit-analyst | {other}
**Trigger context:** {file path / src/ location / other anchor}

## What was attempted

{strategy name + brief approach}

## Why it failed / why it's a gap

{concrete reason — unknown extension, missing skill coverage, etc.}

## Suggested Factory improvement

{actionable suggestion: new strategy candidate, new skill doc needed, tool integration, rule update, etc.}

## Context snippet (optional)

{short excerpt for Factory maintainer to reproduce}
```

### Harvest (reference — manual del user)

```bash
# Listado cross-project
ls /Timekast/*/project/factory/*.md

# Por tipo
ls /Timekast/*/project/factory/intake-drift-*.md
ls /Timekast/*/project/factory/sk-drift-*.md
```

El Factory maintainer (user) lee los tickets cuando decida. **No hay triage automatizado, promotion rules, ni zombie cleanup en el methodology** — eso es proceso humano fuera de scope.

### Pipeline rules (aplican a todos los tipos)

- Pipeline NO se detiene por tickets. Agent escala + continúa con `[MARKER]` en output estructurado (ej: `[MEDIA-PENDING-STRATEGY]`, `[SK-DRIFT-FEATURE]`).
- Si ≥1 ticket emitido en un run → orchestrator surface count al user al cierre de la fase correspondiente (Phase 1 para intake, Phase 5 para kit).
- Tickets **no bloquean** CP1/CP2 — son feedback async para Factory.

### Migration del `sk-drift` existente

- Location vieja: `.claude/docs/sk-drift/{YYYY-MM-DD}-{slug}.md`
- Location nueva: `project/factory/sk-drift-{YYYY-MM-DD}-{slug}.md`

Shape del contenido **no cambia** — solo location + filename convention.

---

## §14 — Bibliografía interna

- `SKILL.md` — workflow operacional (entry point ejecutable)
- `templates/00_DISCOVERY_BRIEF.template.md` — shape canónico del output brief
- `templates/project-config.template.md` — shape canónico del project-config
- `.claude/agents/dsc-intake-analyst.md` — subagent Phase 1 (implementa `methodology/intake.md §2.1` strategies + §10 schema)
- `.claude/agents/dsc-kit-analyst.md` — subagent Phase 5 (implementa `methodology/kit-leverage.md §12` schema)

---

_TimeKast Factory — Discovery methodology / factory tickets (sub-file)_
