---
description: Backlog workflow - generate issues from docs and design (v2 — batched)
---

# /backlog — Issue Generation (v2)

> **Flujo:** Bootstrap (Fase 4 — Backlog)
> **Anterior:** `/design`
> **Siguiente:** `/implement`
> **Propósito:** Generar issues ejecutables desde docs y design.

---

## Invocación

```bash
/backlog              # Genera issues (o RESUME si existe progress file)
/backlog validate     # Solo valida prerrequisitos
/backlog refresh      # Regenera preservando IDs existentes
/backlog add          # Crea issue/epic/milestone mid-implementation
```

> 🔄 **Resume:** Si existe `docs/backlog/backlog-progress.md`, el workflow
> retoma automáticamente desde el último epic completado.

---

## 🌳 Árbol de Decisión

```
¿Comando incluye "add"?
│
├─► SÍ → /backlog add
│   → Phase 0 (action) → Phase 1 (context) → Phase 3 (load backlog)
│   → CHECKPOINT 1 → Phase 5 (generate) → Phase 6 (overlap)
│   → Phase 7 (validate-lite) → Phase 8 (close)
│
└─► NO → /backlog (full)
    ├─► ¿Tienes TODOS los docs (00-14) + design (15)?
    │   ├─► SÍ → Phase 0 → 1 → 2 → 3 → CP1 → 4 → 5 → 6 → CP2 → 7 → CP3 → 8
    │   └─► NO → ❌ "Ejecuta /discovery → /proposal → /docs → /design primero"
    └─► Fin
```

---

## Hard Gates

> 🔴 **Docs Tier 1 son obligatorios. Tier 2 son warning. Tier 3 no se verifican.**
> Ver SKILL.md §2 para justificación de cada tier.

**Tier 1 (blockers — generan issues directamente):**

| Validación            | Si falta                    |
| --------------------- | --------------------------- |
| 00_DISCOVERY_BRIEF.md | ❌ STOP — `/discovery`      |
| 02_FEATURE_MAP.md     | ❌ STOP — `/docs` primero   |
| 03_USER_PERSONAS.md   | ❌ STOP — `/docs` primero   |
| 04_USER_STORIES.md    | ❌ STOP — `/docs` primero   |
| 05_BUSINESS_RULES.md  | ❌ STOP — `/docs` primero   |
| 06_DATA_MODEL.md      | ❌ STOP — `/docs` primero   |
| 07_ARCHITECTURE.md    | ❌ STOP — `/docs` primero   |
| 15_DESIGN.md          | ❌ STOP — `/design` primero |

**Tier 2 (warnings — referencia contextual):**

| Validación          | Si falta               |
| ------------------- | ---------------------- |
| 01_PROPOSAL.md      | ⚠️ WARNING — continuar |
| 08_API_CONTRACTS.md | ⚠️ WARNING — on-demand |
| 09_GLOSSARY.md      | ⚠️ WARNING — continuar |
| 11_TEST_STRATEGY.md | ⚠️ WARNING — on-demand |
| 12_E2E_SCENARIOS.md | ⚠️ WARNING — on-demand |
| 13_RISK_REGISTER.md | ⚠️ WARNING — continuar |

**Tier 3 (skip — no se verifican):**

> 10_RUNBOOKS.md (post-deploy), 14_TRACEABILITY.md (output del backlog)

---

## Phase 0: Action Detection + Mode Selection

// turbo

```bash
cat ./.agent/workflows/backlog/context.md
```

---

## Phase 1: Context Loading

// turbo

```bash
cat ./.agent/workflows/backlog/context-loading.md
```

---

## Phase 2: Prerequisites (full mode only)

> ⚠️ In `/backlog add` → skip to Phase 3

// turbo

```bash
cat ./.agent/workflows/backlog/prerequisites.md
```

---

## Phase 3: Load Context Source

> **full mode:** Load planning docs (00-15)
> **add mode:** Load existing backlog

**Full mode:**

// turbo

```bash
cat ./.agent/workflows/backlog/load-docs.md
```

**Add mode:**

// turbo

```bash
cat ./.agent/workflows/backlog/load-backlog.md
```

---

## 🛑 CHECKPOINT 1: Plan Review

> ⚠️ **MANDATORY STOP — USAR notify_user TOOL**

// turbo

```bash
cat ./.agent/workflows/_shared/checkpoint-transparency.md
```

**EL AGENTE DEBE:**

0. **Anunciar agents y skills activos (OBLIGATORIO, UNA VEZ):**

   ```
   🤖 @project-planner, @architect
   🧰 Skills: roles/backlog
   ```

1. Mostrar resumen del plan:
   - **full:** Milestone, epics planificados, issues estimados, ADRs pendientes
   - **add:** Epic destino, issue planificado, overlap check

2. Mostrar opciones:

   | #   | Opción       | Acción               |
   | --- | ------------ | -------------------- |
   | 1   | **generar**  | Crear epics e issues |
   | 2   | **revisar**  | Ver plan detallado   |
   | 3   | **cancelar** | Salir                |

3. **ACTION:** Call `notify_user` with `BlockedOnUser=true`.

🛑 **STOP AQUÍ — NO continuar sin respuesta del usuario.**

---

## Phase 4: Generate EPIC-SETUP (full mode only)

> ⚠️ In `/backlog add` → skip to Phase 5

// turbo

```bash
cat ./.agent/workflows/backlog/setup-epic.md
```

---

## Phase 5: Generate Feature Epics + Issues (BATCHED)

> 🎯 **Core change: generates ONE EPIC at a time.**
> In `/backlog add`: generates single issue/epic/milestone.

// turbo

```bash
cat ./.agent/workflows/backlog/epic-generation.md
```

---

## Phase 6: Post-Generation Analysis

> **full mode:** Gap analysis + traceability population
> **add mode:** Overlap check vs existing backlog

**Full mode:**

// turbo

```bash
cat ./.agent/workflows/backlog/gap-analysis.md
```

// turbo

```bash
cat ./.agent/workflows/backlog/populate-traceability.md
```

**Add mode:**

> El agente verifica:
>
> - ¿El nuevo issue duplica uno existente?
> - ¿Las dependencias referenciadas existen?
> - ¿El ID no colisiona con IDs existentes?

---

## 🛑 CHECKPOINT 2: Post-Generation Review

> 🔴 **HARD GATE — El agente DEBE parar aquí.**

// turbo

```bash
cat ./.agent/workflows/_shared/checkpoint-transparency.md
```

**EL AGENTE DEBE:**

1. Mostrar resumen:
   - **full:** Epics, Issues, Story Points, cobertura US/SCR
   - **add:** Issue creado, epic asignado, overlap results

2. Mostrar opciones:

   | #   | Opción    | Acción                     |
   | --- | --------- | -------------------------- |
   | 1   | validar   | Proceder con validaciones  |
   | 2   | revisar   | Ver epics/issues generados |
   | 3   | regenerar | Volver a generar           |

3. **ACTION:** Call `notify_user` con `BlockedOnUser: true`

🛑 **STOP — NO ejecutar validaciones sin aprobación.**

---

## Phase 7: Validation

> **full mode:** Structural + multi-agent review
> **add mode:** Lite validation (structural + consistency)

**Full mode:**

// turbo

```bash
cat ./.agent/workflows/backlog/validation-structural.md
```

// turbo

```bash
cat ./.agent/workflows/backlog/validation-review.md
```

**Add mode:**

// turbo

```bash
cat ./.agent/workflows/backlog/validation-lite.md
```

---

## 🛑 CHECKPOINT 3: Pre-Close Review (full mode only)

> 🔴 **HARD GATE — STOP ABSOLUTO**
> In `/backlog add` → skip to Phase 8

// turbo

```bash
cat ./.agent/workflows/_shared/checkpoint-transparency.md
```

**EL AGENTE DEBE:**

1. Mostrar análisis de cobertura:
   - Stories cubiertas: [X/Y] ([Z%])
   - Pantallas cubiertas: [A/B] ([C%])
   - Gaps críticos: [N]

2. Mostrar opciones:

   | #   | Opción              | Acción                 |
   | --- | ------------------- | ---------------------- |
   | 1   | **Corregir gaps**   | Crear issues faltantes |
   | 2   | **Revisar backlog** | Ver epics/issues       |
   | 3   | **Aprobar**         | Continuar a close      |

3. **ACTION:** Call `notify_user` with `BlockedOnUser: true`

🛑 **STOP AQUÍ — NO continuar sin aprobación.**

---

## Phase 8: Close

// turbo

```bash
cat ./.agent/workflows/backlog/close.md
```

---

## Reglas Clave

> Principios completos en `SKILL.md`. Aquí solo el resumen ejecutivo.

1. **1 archivo = 1 issue** — NUNCA agrupar múltiples issues en un archivo
2. **Usar write_to_file** — NUNCA crear archivos con heredoc (`cat << EOF`)
3. **Máximo 5 epics por sesión** — actualizar progress file y continuar en nueva sesión
4. **Gherkin obligatorio** para issues con UI (en español)
5. **Per-issue validation gate** — cada issue pasa quality check antes del siguiente
6. **Checkpoints 1-3** antes de generar, después de generar, y antes de cerrar
7. **BOARD.md** generado con `pnpm update-board` (no manualmente)

---

_TimeKast Factory — Backlog Workflow (v2 — Batched)_
