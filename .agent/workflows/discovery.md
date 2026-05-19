---
description: Product discovery - preserve source of truth, identify gaps, interview only where needed, and generate a high-fidelity Discovery Brief
---

# /discovery — Product Discovery

> **Flujo:** Bootstrap (Fase 1 — Discovery)
> **Propósito:** Entender correctamente el proyecto y producir un Discovery Brief confiable para `/docs`.

---

## Principio Rector

El objetivo del workflow **NO es "llenar una plantilla".**
El objetivo es:

1. Preservar decisiones firmes del source package
2. Detectar huecos reales y contradicciones
3. Evitar drift sobre datos cerrados
4. Generar un brief usable downstream con alta fidelidad

---

## Hard Gates

| Validación                                    | Si falla                       |
| --------------------------------------------- | ------------------------------ |
| No hay fuente principal identificada en D1    | 🛑 STOP — Clasificar sources   |
| Hay contradicción material no resuelta        | 🛑 STOP — Resolver o marcar OQ |
| §1, §2, §3 o §6 quedan en 🔴 al cierre        | 🛑 STOP — Completar            |
| Se detecta drift en ownership / dates / scope | 🛑 STOP — Corregir             |
| Brief bonito pero no trazable a fuentes       | 🛑 STOP — Corregir             |

---

## Pause Types

| Tipo                 | Símbolo | Propósito                       | User Decision                                                           |
| -------------------- | ------- | ------------------------------- | ----------------------------------------------------------------------- |
| **Checkpoint**       | 🛑      | Gate real — el usuario decide   | SÍ — opciones tabla, esperar elección                                   |
| **Checkpoint Light** | 🛑      | Stop mecánico anti-truncamiento | SÍ — `1=continue, 2=stop`. `notify_user` con `ShouldAutoProceed: false` |
| **Auto**             | ➡️      | Transición sin input            | NO — continuar inmediatamente                                           |

---

## 9 Fases

> Phases 0-2 → intake + freeze map. Phase 3 → gap interview. Phase 4 → deep-dive (5/batch).
> Phase 5 → SK leverage. Phase 6 → synthesis (3 passes + 🛑 Checkpoint Light). Phase 7 → challenge. Phase 8 → close.

---

## Phase 0: Mode Detection + Context Status

> Toda la lógica de mode detection está en context.md.

// turbo

```bash
cat ./.agent/workflows/discovery/context.md
```

---

## Phase 1: Source Intake (Context Loading)

> Cargar contexto del kit, agent, clasificar documentos fuente, y detectar SK.

// turbo

```bash
cat ./.agent/workflows/discovery/context-loading.md
```

---

## Phase 2: Freeze Map (Decision Extraction)

> Extraer decisiones firmes, abiertas, contradicciones. Construir Freeze Map.
> **Éste es el paso más importante del discovery.**
> Resultado se persiste a `docs/planning/.discovery-wip/freeze-map.md`.

// turbo

```bash
cat ./.agent/workflows/discovery/freeze-map.md
```

---

## 🛑 CHECKPOINT 1: Post-Intake Review

> ⚠️ **MANDATORY STOP — Después de Source Intake + Freeze Map**

// turbo

```bash
cat ./.agent/workflows/_shared/checkpoint-transparency.md
```

**EL AGENTE DEBE:**

0. **Anunciar agents y skills activos (OBLIGATORIO, UNA VEZ):**

   ```
   🤖 @discovery-expert
   🧰 Skills: roles/discovery
   ```

1. Mostrar:
   - **Discovery mode** detectado (D0/D1/D2)
   - **Source Package:** Lista de docs procesados con clasificación
   - **Freeze Map Summary:**
     - Decisiones firmes: [N]
     - Decisiones abiertas: [N]
     - Contradicciones detectadas: [N]
     - Attachments procesados: [X/Y] (DEBE ser Y/Y)
   - **Coverage Map:** Estado actual de §1-§11
   - **Gap List:** Qué necesita preguntas
   - **Propuesta de siguiente paso:**
     - Generar draft directo (si coverage ya es alta)
     - Hacer pocas preguntas targeted
     - Profundizar discovery

2. Mostrar opciones:

   | #   | Opción      | Acción                                         |
   | --- | ----------- | ---------------------------------------------- |
   | 1   | continuar   | Proceder con Gap Interview + Feature Deep-Dive |
   | 2   | profundizar | Revisar Freeze Map / más preguntas             |
   | 3   | cancelar    | Salir                                          |

🛑 **STOP AQUÍ — NO continuar sin respuesta del usuario.**

---

## ➡️ Phases 3→4→5: Bloque Continuo (Sin Pause entre fases)

> 🔴 **EJECUTAR LAS 3 FASES EN SECUENCIA SIN PEDIR CONFIRMACIÓN ENTRE ELLAS.**
> Los únicos pauses válidos son los Batch Checkpoints DENTRO de Phase 4 (deep-dive batches).
> Phase 5 es OBLIGATORIA si SK_ACTIVE = true — NO ofrecerla como opción.

### Phase 3: Gap Interview

> Preguntar SOLO por lo no resuelto. No entrevistar por costumbre.

// turbo

```bash
cat ./.agent/workflows/discovery/gap-interview.md
```

> 🔴 **GAP INTERVIEW STOP — After presenting questions:**
>
> 1. Present ALL questions in a single batch (grouped by impact)
> 2. Show: `[N] preguntas. Responde y continúo con Deep-Dive.`
> 3. **ACTION:** Call `notify_user` with `BlockedOnUser: true`, `ShouldAutoProceed: false`
> 4. 🛑 **STOP — DO NOT proceed to Phase 4 without user answers.**
>
> After user responds → update freeze-map.md with resolutions → continue to Phase 4.

### Phase 4: Feature Deep-Dive

> Profundizar CADA feature del Freeze Map. Max 5 por batch. Resultado se persiste.

// turbo

```bash
cat ./.agent/workflows/discovery/feature-deep-dive.md
```

> 🔴 **BATCH STOP ENFORCEMENT — After EVERY batch of 5 features:**
>
> 1. Persist batch to `docs/planning/.discovery-wip/deep-dive.md`
> 2. Show: `Batch [N] done: [completed/total] features. 1=continue, 2=review OQs`
> 3. **ACTION:** Call `notify_user` with `BlockedOnUser: true`, `ShouldAutoProceed: false`
> 4. 🛑 **STOP — DO NOT continue to next batch without user response.**
>
> This rule is DEFINED HERE in the main workflow. It overrides any sub-file behavior.
> If you have 20 features → you MUST stop 4 times (after batch 1, 2, 3, 4).

### Phase 5: SK Leverage Analysis

> 🔴 **OBLIGATORIO si SK_ACTIVE = true. NO preguntar, ejecutar directamente.**
> Si SK_ACTIVE = false → saltar a Phase 6.

// turbo

```bash
cat ./.agent/workflows/discovery/sk-leverage.md
```

---

## Post-Checkpoint Reconciliation (MANDATORY)

> 🔴 **ANTES de empezar la síntesis, reconciliar feedback del CHECKPOINT 1 en el Freeze Map.**

Cada OQ tocada por el usuario DEBE reclasificarse:

| Estado                        | Significado                                          |
| ----------------------------- | ---------------------------------------------------- |
| **Resolved During Discovery** | El usuario la cerró explícitamente                   |
| **Working Hypothesis**        | El usuario aceptó seguir provisionalmente            |
| **Deferred**                  | Se manda downstream (a /docs, /design, o /implement) |
| **Still Open**                | Sigue sin resolver — se mantiene como OQ             |

> ⚠️ **"Inferred ok" NO se convierte en Firm.** Default: Working Hypothesis.

---

## Phase 6: Synthesis Draft (3 Passes con 🛑 Checkpoint Light)

> 🔴 **ANTI-DEGRADACIÓN:** Cada pasada se carga individualmente.
> El agente NUNCA ve instrucciones de la pasada N+1 hasta completar pasada N.

### Step 6.0: Cargar reglas compartidas

// turbo

```bash
cat ./.agent/workflows/discovery/synthesis/_rules.md
```

> 🔴 **HIDDEN PASS CHAIN:** discovery.md only loads Pass 1.
> Pass 1 loads Pass 2. Pass 2 loads Pass 3. Each with a mandatory checkpoint.
> The model MUST NOT know what comes after the current pass.

// turbo

```bash
cat ./.agent/workflows/discovery/synthesis/pass-1.md
```

---

## Phase 7: Challenge Pass (Multi-Agent Review)

> 3 perspectivas revisan el brief ANTES de cerrarlo.

// turbo

```bash
cat ./.agent/workflows/discovery/validation.md
```

> 🛑 **CHECKPOINT CHALLENGE** — Mostrar: `Challenge Pass done: [N] issues found. 1=continue, 2=review`
> **ACTION:** Call `notify_user` with `BlockedOnUser: true`, `ShouldAutoProceed: false`
> **NO continuar a CHECKPOINT 2 hasta recibir respuesta del usuario.**

---

## 🛑 CHECKPOINT 2: Pre-Close Review

> 🔴 **HARD GATE — STOP ABSOLUTO antes de cerrar**

// turbo

```bash
cat ./.agent/workflows/_shared/checkpoint-transparency.md
```

**EL AGENTE DEBE:**

1. Mostrar resultado de validaciones:
   - Source Fidelity: ✅/🔴
   - Drift Report: ✅/⚠️/🔴 (#items, in Brief: ✅/❌)
   - Internal Consistency: ✅/⚠️/🔴
   - Challenge Pass: ✅/⚠️/🔴 (3 perspectivas mostradas: ✅/❌)
   - Structural Self-Check: ✅/🔴
   - Reconciliation: ✅/🔴 (entities: [N], screens: [N], features: [N])
   - Coverage: X/11

2. **Fidelity Score:**

   ```
   Source Fidelity: X% | Drift: N items | Assumptions: N | Open Questions: N | Coverage: X/11
   ```

3. Mostrar opciones:

   | #   | Opción     | Acción                         |
   | --- | ---------- | ------------------------------ |
   | 1   | cerrar     | Commit Brief + cerrar          |
   | 2   | corregir   | Aplicar correcciones           |
   | 3   | re-validar | Ejecutar validaciones de nuevo |

### Close Gate

Solo se puede cerrar si:

- Structural self-check OK
- Source fidelity OK (sin unauthorized drift)
- Internal consistency aceptable
- Challenge pass completado y mostrado
- Reconciliation cross-map completo
- Open Questions visibles y honestos

🛑 **STOP — NO cerrar sin aprobación.**

---

## Phase 8: Final Brief + Close

> Aplicar correcciones, generar artefactos finales, cleanup .discovery-wip/, cierre.
> **Pre-requisito:** CHECKPOINT 2 aprobado.

// turbo

```bash
cat ./.agent/workflows/discovery/close.md
```

---

## Shortcuts

```bash
/discovery D0    # Desde cero
/discovery D1    # Con docs existentes
/discovery D2    # Validar Brief existente
/discovery       # Pregunta el modo
```

---

## Flujo Completo

```
/start → /discovery → /proposal → /docs → /design → /backlog → /implement
```

---

_TimeKast Factory — Discovery Workflow (v4.2 — Checkpoint Light + Batch Stops)_
