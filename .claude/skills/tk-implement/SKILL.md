---
name: tk-implement
description: Coding-family workflow that executes a backlog issue end-to-end — read issue → plan → implement → test → audit → close. Primary invocation is the `/implement ISSUE-ID` slash command; do not run this skill directly outside that command.
family: coding
model: opus
parallelism_unit: none
concurrency_cap: 1
merge_strategy: orchestrator-merge
auditor_step: true
last-verified: 2026-04-23
---

# /implement — Issue Execution

> **Propósito:** Ejecutar UN issue del backlog: plan → code → verify → document → close.
> **Anterior:** `/backlog`
> **Siguiente:** `/audit`

---

## Invocación

```
/implement ISSUE-XXX          # Pipeline completo
/implement ISSUE-XXX --plan   # Solo hasta CP1 (plan aprobado)
/implement --next             # Primer P0/P1 pendiente
```

---

## Hard Gates (Phase 0 + Phase 2)

| Validación             | Si falla                   |
| ---------------------- | -------------------------- |
| Issue existe           | ❌ STOP — verificar ID     |
| Status ≠ ✅ Completed  | ❌ STOP — ya cerrado       |
| Status ≠ 🚫 Blocked    | ❌ STOP — resolver bloqueo |
| Dependencias cumplidas | ❌ STOP — implementar deps |

---

## Orden inviolable

```
Phase 0 Selection → 1 Context → 2 Issue → 3 Plan →
🛑 CP1 (Plan) → 4 Code → 5 QC → 🛑 CP2 (Commit) → 6 Close
```

Cada fase vive en un archivo separado. **Lee el archivo de la fase actual** con Read antes de ejecutarla — no ejecutes de memoria (CC.md §7).

| Fase         | Archivo                 | Subagent delegado             |
| ------------ | ----------------------- | ----------------------------- |
| 0 Selection  | `phase-0-selection.md`  | main loop                     |
| 1 Context    | `phase-1-context.md`    | main loop                     |
| 2 Load Issue | `phase-2-load-issue.md` | main loop                     |
| 3 Plan       | `phase-3-plan.md`       | `architect` si gating aplica  |
| 4 Code       | `phase-4-coding.md`     | domain specialist según issue |
| 5 QC         | `phase-5-qc.md`         | `quality-engineer`            |
| 6 Close      | `phase-6-close.md`      | main loop                     |

Bloques reusables (SSOT en `.claude/skills/_shared/`): `versioning.md` — leído solo donde se necesita. (Los primitives `context-check` y `checkpoint-transparency` fueron retirados — la transparencia de CP vive inline en los templates de Phase 3 / Phase 6.)

---

## Principios Fundamentales

1. **Un issue a la vez** — nunca adelantar trabajo de otros issues
2. **Plan antes de código** — CP1 bloquea escritura
3. **AC como contrato** — todos los criterios deben cumplirse y verificarse
4. **Verificar antes de cerrar** — typecheck, lint, build, tests antes de commit
5. **Documentar desviaciones** — si el plan cambió, explicar por qué en Implementation Evidence
6. **Nunca inventar aprobación** — solo respuestas reales del usuario
7. **Scope surgical** — bug fix no incluye refactors adyacentes (CODING.md §3)

---

## HACE / NO HACE

**HACE:**

- Ejecuta UN issue por invocación
- Planifica antes de codificar (Phase 3)
- Implementa exactamente lo del plan (Phase 4)
- Verifica con tests + linting (Phase 4.2)
- Documenta Evidence + cierra issue (Phase 6)
- Actualiza epic si aplica (Phase 6.3b)

**NO HACE:**

- Implementar múltiples issues a la vez
- Decidir arquitectura sin `architect` gating
- Generar nuevo backlog (eso es `/backlog`)
- Auditoría profunda post-merge (eso es `/audit`)

---

## Subagent delegation (Phase-level)

Invocación vía `Agent` tool con `subagent_type` correcto:

| Fase | Subagent               | Cuándo                                   |
| ---- | ---------------------- | ---------------------------------------- |
| 3    | `architect`            | Schema nuevo, patrón no documentado, ADR |
| 4    | `backend-specialist`   | Server actions, APIs, validación         |
| 4    | `frontend-specialist`  | Componentes React, páginas, state        |
| 4    | `data-modeler-drizzle` | Schema Drizzle, migraciones              |
| 4    | `flutter-mobile`       | Issues en directorios Flutter            |
| 4    | `test-engineer`        | Si el issue tiene AC de testing          |
| 5    | `quality-engineer`     | Siempre — genera QC Report               |

> El campo `> **Agents:**` del issue es **hint advisory** — mejora el match semántico, no sustituye el criterio del main loop.

---

## Reglas Clave (resumen ejecutivo)

1. **Plan → CP1 → Code → QC → CP2 → Close** (orden inviolable)
2. **CP1 HIGH risk → Plan Mode obligatorio** (CC.md §3)
3. **CP2 siempre espera confirmación** — commit/push nunca auto-aprobado (GIT.md §2)
4. **Documentar antes de commit** — Implementation Evidence en el issue antes de `git commit`
5. **Un solo todo `in_progress`** — usar TodoWrite desde Phase 0

---

## Naming Conventions (Code)

| Tipo             | Convención      | Ejemplo                   |
| ---------------- | --------------- | ------------------------- |
| Componentes      | PascalCase      | `UserCard.tsx`            |
| Utilities        | kebab-case      | `date-utils.ts`           |
| Actions          | kebab-case      | `user-actions.ts`         |
| Variables/funcs  | camelCase       | `userId`, `getUserById`   |
| Types/Interfaces | PascalCase      | `User`, `CreatePickInput` |
| Constantes       | SCREAMING_SNAKE | `MAX_PICKS`, `API_URL`    |
| DB columns       | snake_case      | `created_at`, `user_id`   |

---

## Issue Status System

Formatos EXACTOS (requisito de `pnpm update-board`):

| Status      | Format                                    |
| ----------- | ----------------------------------------- |
| To Do       | `> **Status:** 📋 Backlog`                |
| In Progress | `> **Status:** 🚧 In Progress`            |
| Done        | `> **Status:** ✅ Done`                   |
| Postponed   | `> **Status:** ⏸️ Postponed`              |
| Won't Do    | `> **Status:** ❌ Won't Do`               |
| Blocked     | `> **Status:** 🚫 Blocked by [ISSUE-XXX]` |

---

_TimeKast Factory — tk-implement (CC port of /implement v2)_
