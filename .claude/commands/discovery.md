---
description: Product Discovery — extract project truth from stakeholder + source docs, produce Discovery Brief + project-config as SSOT.
argument-hint: '[nuevo|con-docs|validar]'
---

# /discovery

Workflow CC-native que produce `project/planning/00_DISCOVERY_BRIEF.md` + `project/planning/project-config.md` desde cero (modo `nuevo`), con docs existentes (modo `con-docs`), o validando un brief previo (modo `validar`).

**Argumento:** `$ARGUMENTS` — `nuevo` (desde cero) / `con-docs` (con docs) / `validar` (validar existente). Si está vacío, el agente pregunta.

---

## Instrucciones al agente

1. **Invocar skill `tk-discovery`** — leer `.claude/skills/tk-discovery/SKILL.md` con Read tool antes de ejecutar (CC.md §7).
2. Parsear `$ARGUMENTS`:
   - `nuevo` / `con-docs` / `validar` → modo explícito, saltar pregunta en Phase 0.
   - (vacío) → Phase 0 pregunta el modo.
3. **Crear TodoWrite** según `SKILL.md §TodoWrite obligatorio` (Phases + CP1 + CP2 + Gap Round 2) desde el inicio del Turn 1.
4. Ejecutar fases respetando **turn boundaries** declarados en SKILL.md (cada turn cierra con STOP explícito).
5. Respetar checkpoints según `tk-discovery/SKILL.md §Checkpoints` — CP1 es **inline + STOP** (compact, conversational); CP2 es **Plan Mode formal** (synthesis multi-fuente). El wrapper NO redefine la semántica del skill.
6. No ejecutar de memoria. No saltar fases. No listar sub-pasos de fases futuras.
