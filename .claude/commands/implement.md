---
description: Execute a backlog issue end-to-end (plan → code → QC → close)
argument-hint: 'ISSUE-XXX | --next | ISSUE-XXX --plan'
---

# /implement

Ejecuta un issue del backlog a través del pipeline completo de `tk-implement`.

**Argumento:** `$ARGUMENTS`

---

## Instrucciones al agente

1. **Invocar skill `tk-implement`** — lee `.claude/skills/tk-implement/SKILL.md` con Read tool antes de ejecutar (CC.md §7).
2. Parsear `$ARGUMENTS`:
   - `ISSUE-XXX` → pipeline completo
   - `ISSUE-XXX --plan` → solo hasta CP1 (plan aprobado)
   - `--next` → tomar primer P0/P1 con status `📋 Backlog`
   - (vacío) → Phase 0.1 pide al usuario cuál implementar
3. **Crear TodoWrite** con las 7 fases desde el inicio.
4. Ejecutar fases en orden leyendo cada `phase-N-*.md` con Read antes de ejecutarla.
5. Respetar los dos checkpoints duros:
   - **CP1** (fin de Phase 3) — Plan Mode si HIGH risk
   - **CP2** (inicio de Phase 6) — nunca auto-aprobar

No ejecutar de memoria. No saltar fases. No commitear sin CP2.
