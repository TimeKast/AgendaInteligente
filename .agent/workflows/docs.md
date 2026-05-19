---
description: Docs workflow - generate technical documentation from discovery
---

# /docs — Technical Documentation

> **Flujo:** Bootstrap (Fase 2 — Documentación)
> **Anterior:** `/proposal`
> **Siguiente:** `/validate_docs` → `/design`
> **Propósito:** Generar documentación técnica central (02-14) desde Discovery Brief.

---

## Hard Gates

| Validación              | Si falla                        |
| ----------------------- | ------------------------------- |
| Discovery Brief existe  | ❌ STOP — Ejecutar `/discovery` |
| §1, §2, §3, §6 están ✅ | ❌ STOP — Completar discovery   |

---

## Phase 0: Mode Detection + Context Status

// turbo

```bash
cat ./.agent/workflows/docs/context.md
```

---

## Phase 1: Context Loading

// turbo

```bash
cat ./.agent/workflows/docs/context-loading.md
```

---

## Phase 2: Prerequisites

// turbo

```bash
cat ./.agent/workflows/docs/prerequisites.md
```

---

## 🛑 CHECKPOINT 1: Pre-Generation

> ⚠️ **MANDATORY STOP — USAR notify_user TOOL**

// turbo

```bash
cat ./.agent/workflows/_shared/checkpoint-transparency.md
```

**EL AGENTE DEBE:**

0. **Anunciar agents y skills activos (OBLIGATORIO, UNA VEZ):**

   ```
   🤖 Kit: @documentation-writer
   🧰 Kit Skills: roles/docs
   🏗️ Project: @{project-agents} (si se cargaron en Phase 1 §1.8)
   🧰 Project Skills: {project-skills} (si se cargaron en Phase 1 §1.8)
   ```

   > Si no hay project agents/skills, omitir las líneas de Project.

1. Mostrar resumen:

- Coverage Map: §1, §2, §3, §6 = ✅
- Templates: Listos ✅
- Docs a generar: 02-14

**ACTION:** Call `notify_user` with `BlockedOnUser: true`, `ShouldAutoProceed: false`

🛑 **STOP AQUÍ — NO continuar sin respuesta del usuario.**

---

## Phase 3: Generate Core Docs (02-05 + 09)

> ⚠️ **SOLO DESPUÉS DE CHECKPOINT 1 APROBADO**
>
> **Estrategia:** 3 batches cargados uno a uno para evitar context degradation.
> Cada batch tiene su propio archivo y checkpoint con pausa real.

### Reglas compartidas (cargar UNA VEZ)

// turbo

```bash
cat ./.agent/workflows/docs/generation/_rules.md
```

### Batch 1: Foundation (02 + 03 + 09)

// turbo

```bash
cat ./.agent/workflows/docs/generation/batch-1.md
```

> 🛑 **CHECKPOINT BATCH 1** — El agente DEBE ejecutar `notify_user` con `ShouldAutoProceed: false`.
> **NO cargar batch-2.md hasta recibir respuesta del usuario.**

### Batch 2: User Stories (04) — Setup

// turbo

```bash
cat ./.agent/workflows/docs/generation/batch-2.md
```

> 🛑 **CHECKPOINT BATCH 2 SETUP** — notify_user con plan de sub-batches.
> **NO generar stories hasta confirmación del usuario.**

### Batch 2: Sub-batch 1 (primeros 5 features)

// turbo

```bash
cat ./.agent/workflows/docs/generation/batch-2-sub.md
```

> 🛑 **CHECKPOINT SUB-BATCH 1** — notify_user con resumen. ShouldAutoProceed: false.
> **Si quedan features:** continuar con sub-batch 2.
> **Si todos los features procesados:** saltar a Batch 3.

### Batch 2: Sub-batch 2 (si quedan features)

// turbo

```bash
cat ./.agent/workflows/docs/generation/batch-2-sub.md
```

> 🛑 **CHECKPOINT SUB-BATCH 2** — notify_user. Si quedan features → sub-batch 3. Si no → Batch 3.

### Batch 2: Sub-batch 3 (si quedan features)

// turbo

```bash
cat ./.agent/workflows/docs/generation/batch-2-sub.md
```

> 🛑 **CHECKPOINT SUB-BATCH 3** — notify_user. Si quedan features → sub-batch 4. Si no → Batch 3.

### Batch 2: Sub-batch 4 (si quedan features)

// turbo

```bash
cat ./.agent/workflows/docs/generation/batch-2-sub.md
```

> 🛑 **CHECKPOINT SUB-BATCH 4** — notify_user. Si quedan features → sub-batch 5. Si no → Batch 3.

### Batch 2: Sub-batch 5 (si quedan features)

// turbo

```bash
cat ./.agent/workflows/docs/generation/batch-2-sub.md
```

> 🛑 **CHECKPOINT SUB-BATCH 5** — notify_user. Si quedan features → sub-batch 6. Si no → Batch 3.

### Batch 2: Sub-batch 6 (si quedan features)

// turbo

```bash
cat ./.agent/workflows/docs/generation/batch-2-sub.md
```

> 🛑 **CHECKPOINT SUB-BATCH 6** — notify_user. Proceder a Batch 3.

### Batch 3: Business Rules (05)

// turbo

```bash
cat ./.agent/workflows/docs/generation/batch-3.md
```

> 🛑 **CHECKPOINT BATCH 3** — El agente DEBE ejecutar `notify_user` con `ShouldAutoProceed: false`.
> **NO cargar Phase 4 hasta recibir respuesta del usuario.**

---

## Phase 4: Generate Extended Docs (06-08, 10-14)

> ⚠️ **SOLO DESPUÉS DE Phase 3 COMPLETADO**
>
> **Estrategia:** 4 batches cargados uno a uno.

### Batch 4: Architecture + Data Model (07 + 06)

// turbo

```bash
cat ./.agent/workflows/docs/extended/batch-4.md
```

> 🛑 **CHECKPOINT BATCH 4** — `notify_user` con `ShouldAutoProceed: false`.

### Batch 5: API Contracts (08)

// turbo

```bash
cat ./.agent/workflows/docs/extended/batch-5.md
```

> 🛑 **CHECKPOINT BATCH 5** — `notify_user` con `ShouldAutoProceed: false`.

### Batch 6: Runbooks + Test Strategy (10 + 11)

// turbo

```bash
cat ./.agent/workflows/docs/extended/batch-6.md
```

> 🛑 **CHECKPOINT BATCH 6** — `notify_user` con `ShouldAutoProceed: false`.

### Batch 7: E2E + Risk + Traceability (12-14)

// turbo

```bash
cat ./.agent/workflows/docs/extended/batch-7.md
```

> 🛑 **CHECKPOINT BATCH 7** — `notify_user` con `ShouldAutoProceed: false`.

---

## 🛑 CHECKPOINT 2: Post-Generation Review

> 🔴 **HARD GATE — El agente DEBE parar aquí.**

// turbo

```bash
cat ./.agent/workflows/_shared/checkpoint-transparency.md
```

**EL AGENTE DEBE:**

1. Mostrar resumen de documentación generada:
   - Documentos: [lista de 02-14 generados]
   - Entidades (06_DATA_MODEL): [N] E-XXX
   - Features (02_FEATURE_MAP): [N] FT-XXX
   - Reglas (05_BUSINESS_RULES): [N] BR-XXX

2. Anunciar validaciones pendientes:
   - 🔲 Namespace consistency (BR- not RN-)
   - 🔲 Source Reconciliation vs Brief (entidades, features, reglas, pantallas)
   - 🔲 Internal cross-reference check
   - 🔲 Multi-Agent Review (5 perspectivas)
   - 🔲 Validation Report

3. Mostrar opciones:

   | #   | Opción    | Acción                    |
   | --- | --------- | ------------------------- |
   | 1   | validar   | Proceder con validaciones |
   | 2   | revisar   | Ver documentos generados  |
   | 3   | regenerar | Volver a generar          |

4. **ACTION:** Call `notify_user` con `BlockedOnUser: true`, `ShouldAutoProceed: false`

🛑 **STOP — NO ejecutar validaciones sin aprobación.**

---

## Phase 5: Validation & Gap Analysis

> ⚠️ **SOLO DESPUÉS DE CHECKPOINT 2 APROBADO**

// turbo

```bash
cat ./.agent/workflows/docs/validation.md
```

---

## 🛑 CHECKPOINT 3: Pre-Close Review

> 🔴 **HARD GATE — STOP ABSOLUTO**
>
> **VIOLACIÓN DE ESTA REGLA = FALLO CRÍTICO**

// turbo

```bash
cat ./.agent/workflows/_shared/checkpoint-transparency.md
```

**EL AGENTE DEBE:**

1. Mostrar análisis de cobertura:
   - Cobertura vs Discovery: [X%]
   - Cobertura vs Proposal: [Y%]
   - Gaps críticos: [N]
   - Drift detectado: [M]

2. Mostrar opciones:

   | #   | Opción   | Acción                            |
   | --- | -------- | --------------------------------- |
   | 1   | corregir | Fix gaps                          |
   | 2   | revisar  | Ver docs                          |
   | 3   | validar  | Ejecutar `/validate_docs` primero |
   | 4   | aprobar  | Continuar a /design               |

3. **ACTION:** Call `notify_user` with `BlockedOnUser: true`, `ShouldAutoProceed: false`
4. **NO ejecutar NINGUNA acción posterior**
5. **Esperar respuesta explícita del usuario**

🛑 **STOP AQUÍ — NO continuar sin aprobación.**

---

## Phase 6: Handoff

> ⚠️ **SOLO DESPUÉS DE CHECKPOINT 3 APROBADO**

// turbo

```bash
cat ./.agent/workflows/docs/close.md
```

---

## Reglas SIEMPRE/NUNCA

**SIEMPRE:**

1. Context Status (Phase 0) primero
2. Verificar Coverage Map antes de generar
3. CHECKPOINT 1 antes de generar
4. Cargar SOLO el batch actual — NO anticipar batches futuros
5. `ShouldAutoProceed: false` en TODOS los checkpoints
6. CHECKPOINT 2 después de generar (resumen + validaciones pendientes)
7. Drift/Gap analysis antes de CHECKPOINT 3
8. CHECKPOINT 3 antes de handoff

**NUNCA:**

1. Generar sin CHECKPOINT 1 aprobado
2. Cargar batch N+1 sin haber pausado con notify_user en batch N
3. Cerrar sin CHECKPOINT 3 aprobado
4. Inventar aprobación del usuario
5. Saltar validation/gap analysis
6. Usar `ShouldAutoProceed: true` en ningún checkpoint

---

_TimeKast Factory — Docs Workflow (v4 — Anti-Degradation Refactoring)_
