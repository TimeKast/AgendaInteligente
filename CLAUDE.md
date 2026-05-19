# TimeKast Factory — Claude Code Instructions

> **Runtime:** Claude Code. **SSOT:** `.claude/` (rules, agents, skills, commands).

---

## Rules (auto-loaded)

@.claude/rules/CORE.md
@.claude/rules/CODING.md
@.claude/rules/GIT.md
@.claude/rules/SK.md
@.claude/rules/CC.md
@.claude/rules/DOR_DOD.md

## Rules (on-demand reference)

---

## Proyecto

### config

@project/planning/project-config.md

- **Stack:** Next.js 16+ + TypeScript + Drizzle ORM + Tailwind
- **Branching:** adaptive (ver `GIT.md §4`). Actualmente post-release (develop-first).
- **Package manager:** pnpm

## Convenciones de nomenclatura de skills

- `tk-*` → workflows TimeKast (ej: `/implement`)
- `kb-*` → knowledge base fase coding (auto-ruteo semántico en implementación)
- `doc-*` → knowledge base fase documental (discovery/design/backlog, no coding)
- `sk-*` → starter kit systems (sistemas shipped por el kit; viajan con el kit a proyectos derivados)
- `op-*` / `pj-*` → operational project-specific (no se sube al template — específico del derivado)
- `fx-*` → factory-internal (herramientas para mantener el kit)

## Convenciones de nomenclatura de agents

Agentes (`.claude/agents/*.md`) se prefijan según su **scope de invocación**, paralelo a skills:

- `dsc-*` → scoped a `/discovery` workflow only (ej: `dsc-intake-analyst`, `dsc-kit-analyst`, `dsc-freeze-map-extractor`)
- `imp-*` → scoped a `/implement` workflow (future)
- `docs-*` → scoped a `/docs` workflow (future; nota: `docs-*` no `doc-*` para evitar colisión con skills `doc-*`)
- `fx-*` → factory-internal agents (future)
- **sin prefix** → generic cross-workflow, invocable desde 3+ workflows (ej: `architect`, `product-owner`, `project-planner`, `quality-engineer`, `security-auditor`, `code-archaeologist`, `ui-critic`, `skeptical-client`, `flutter-mobile`)

**Enforcement:** hook `agent-taxonomy-lint.sh` (pre-commit) valida convención + referencias cross-file (ver `.claude/hooks/`).

---

_TimeKast Factory — CLAUDE.md (runtime: Claude Code)_
