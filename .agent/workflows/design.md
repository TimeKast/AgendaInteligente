---
description: Design workflow - generate design specification from docs
---

# /design — Design Specification

> **Flujo:** Bootstrap (Fase 3 — Diseño)
> **Anterior:** `/docs`
> **Siguiente:** `/validate_docs` → `/backlog`
> **Propósito:** Generar especificación de diseño: pantallas, flujos, componentes.
> **Output:** `docs/planning/15_DESIGN.md`

---

## Hard Gates

| Validación                  | Si falla                        |
| --------------------------- | ------------------------------- |
| Discovery Brief (00) existe | ❌ STOP — Ejecutar `/discovery` |
| User Personas (03) existe   | ❌ STOP — Ejecutar `/docs`      |
| User Stories (04) existe    | ❌ STOP — Ejecutar `/docs`      |
| §3, §7 en Brief están ✅/🟡 | ❌ STOP — Completar discovery   |

---

## Phase 0: Mode Detection + Context Status

// turbo

```bash
cat ./.agent/workflows/design/context.md
```

---

## Phase 1: Context Loading

// turbo

```bash
cat ./.agent/workflows/design/context-loading.md
```

---

## Phase 2: Prerequisites

// turbo

```bash
cat ./.agent/workflows/design/prerequisites.md
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
   🤖 @visual-design-director, @layout-composer
   🧰 Skills: roles/design, frontend-design, ux-psychology, mobile-design, domains/ui, ui-style-lab
   ```

1. **Visual Direction Selection** (OBLIGATORIO antes de diseñar pantallas):

   Usando el contexto del `visual-design-director` + `layout-composer`, recomendar:
   - Skin family (de `ui-style-lab`)
   - Visual tone (premium/operator/editorial/warm/technical)
   - Typography direction
   - Shell type (sidebar/topnav/split/command)
   - Navigation model
   - Density profile

   > Se documenta como §0 "Visual Direction" en `15_DESIGN.md`.

2. Mostrar resumen:
   - Discovery Brief: Cargado ✅
   - Coverage Map: §3, §7 = ✅/🟡
   - Docs 02-05: Existentes ✅
   - Pantallas identificadas: SCR-001 → SCR-XXX
   - Flujos identificados: FLW-001 → FLW-XXX
   - Visual Direction: [skin family + tone]

3. Mostrar opciones:

   | #   | Opción   | Acción             |
   | --- | -------- | ------------------ |
   | 1   | generar  | Crear 15_DESIGN.md |
   | 2   | revisar  | Ver detalle antes  |
   | 3   | cancelar | Salir              |

4. **ACTION:** Call `notify_user` with `BlockedOnUser: true`

🛑 **STOP AQUÍ — NO continuar sin respuesta del usuario.**

---

## Phase 3: Generation (3 Passes con Checkpoints)

> ⚠️ **SOLO DESPUÉS DE CHECKPOINT 1 APROBADO**
>
> 🔴 **ANTI-DEGRADACIÓN:** Cada pasada se carga individualmente.
> El agente NUNCA ve instrucciones de la pasada N+1 hasta completar pasada N.

### Step 3.0: Cargar reglas compartidas

// turbo

```bash
cat ./.agent/workflows/design/generation/_rules.md
```

### Step 3.1: Pass 1 — Visual Direction + Structure (§0-§3)

// turbo

```bash
cat ./.agent/workflows/design/generation/pass-1.md
```

### 🛑 Checkpoint Inter-Pasada 1

> 🔴 **MANDATORY STOP — USAR notify_user TOOL**

**EL AGENTE DEBE:**

1. Mostrar resumen de Pass 1:
   - **Visual Direction:** [resumen 1 línea]
   - **Pantallas:** SCR-001 → SCR-XXX ([N] total)
   - **Flujos:** FLW-001 → FLW-XXX ([M] total)
   - **Coverage vs Brief §7.2:** [N/total] pantallas cubiertas

2. **ACTION:** Call `notify_user` con `BlockedOnUser: true`, `ShouldAutoProceed: false`

🛑 **STOP — NO cargar Pass 2 sin aprobación.**

---

### Step 3.2: Pass 2 — Components + Decisions (§4-§8)

```bash
cat ./.agent/workflows/design/generation/pass-2.md
```

### 🛑 Checkpoint Inter-Pasada 2

> 🔴 **MANDATORY STOP — USAR notify_user TOOL**

**EL AGENTE DEBE:**

1. Mostrar resumen de Pass 2:
   - **Componentes nuevos:** CMP-001 → CMP-XXX ([K] total)
   - **Decisions:** DD-001 → DD-XXX ([D] total)
   - **Open Questions:** [N]
   - **Assumptions:** [N]

2. **ACTION:** Call `notify_user` con `BlockedOnUser: true`, `ShouldAutoProceed: false`

🛑 **STOP — NO cargar Pass 3 sin aprobación.**

---

### Step 3.3: Pass 3 — Wireframes (§9)

```bash
cat ./.agent/workflows/design/generation/pass-3.md
```

---

## 🛑 CHECKPOINT 2: Post-Generation Review

> 🔴 **HARD GATE — El agente DEBE parar aquí.**

// turbo

```bash
cat ./.agent/workflows/_shared/checkpoint-transparency.md
```

**EL AGENTE DEBE:**

1. Mostrar resumen completo del diseño generado:
   - Pantallas (SCR-XXX): [N]
   - Flujos (FLW-XXX): [N]
   - Componentes (CMP-XXX): [N]
   - Wireframes: [N]/[N] (debe ser 100%)
   - Cobertura Stories: X/Y (Z%)
   - Cobertura Personas: N/M

2. Anunciar validaciones pendientes:
   - 🔲 Source Reconciliation vs Brief (pantallas, features, entidades)
   - 🔲 US→SCR coverage check
   - 🔲 FT→SCR coverage check
   - 🔲 Multi-Agent Review (5 perspectivas)
   - 🔲 Validation Report

3. Mostrar opciones:

   | #   | Opción    | Acción                    |
   | --- | --------- | ------------------------- |
   | 1   | validar   | Proceder con validaciones |
   | 2   | revisar   | Ver 15_DESIGN.md          |
   | 3   | regenerar | Volver a generar          |

4. **ACTION:** Call `notify_user` con `BlockedOnUser: true`, `ShouldAutoProceed: false`

🛑 **STOP — NO ejecutar validaciones sin aprobación.**

---

## Phase 4: Validation & Gap Analysis

> ⚠️ **SOLO DESPUÉS DE CHECKPOINT 2 APROBADO**

// turbo

```bash
cat ./.agent/workflows/design/validation.md
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
   - Cobertura Stories: X/Y (Z%)
   - Cobertura Personas: N/M
   - Gaps críticos: [N]
   - Drift detectado: [M]

2. Mostrar opciones:

   | #   | Opción   | Acción                             |
   | --- | -------- | ---------------------------------- |
   | 1   | corregir | Agregar pantallas/flujos faltantes |
   | 2   | revisar  | Ver 15_DESIGN.md                   |
   | 3   | validar  | Ejecutar `/validate_docs` primero  |
   | 4   | aprobar  | Continuar a /backlog               |

3. **ACTION:** Call `notify_user` with:
   - `BlockedOnUser: true`
   - `PathsToReview: ["docs/planning/15_DESIGN.md"]`
4. **NO ejecutar NINGUNA acción posterior**
5. **Esperar respuesta explícita del usuario**

**VERIFICACIÓN DE FALLO:**

- Si el agente continúa sin respuesta → **FALLO**
- Si no usó `notify_user` → **FALLO**

🛑 **STOP AQUÍ — NO continuar sin aprobación.**

---

## Phase 5: Handoff

> ⚠️ **SOLO DESPUÉS DE CHECKPOINT 3 APROBADO**

// turbo

```bash
cat ./.agent/workflows/design/close.md
```

---

## Gates/Escalation

| Trigger                     | Acción                                   |
| --------------------------- | ---------------------------------------- |
| Decisión de arquitectura UI | → Cargar `@[.agent/agents/architect.md]` |
| Componente nuevo complejo   | → Verificar design system                |
| Accesibilidad no clara      | → Consultar WCAG                         |

---

## Reglas SIEMPRE/NUNCA

**SIEMPRE:**

1. Context Status (Phase 0) primero
2. Verificar docs 02-05 existen
3. Visual Direction en CHECKPOINT 1 — ANTES de pantallas
4. CHECKPOINT 1 antes de generar
5. Checkpoints inter-pasada entre cada Pass (notify_user obligatorio)
6. CHECKPOINT 2 después de generar (resumen + validaciones pendientes)
7. Drift/Gap analysis antes de CHECKPOINT 3
8. CHECKPOINT 3 antes de handoff

**NUNCA:**

1. Generar sin CHECKPOINT 1 aprobado
2. Cargar Pass N+1 sin completar checkpoint inter-pasada N
3. Cerrar sin CHECKPOINT 3 aprobado
4. Inventar pantallas no derivadas de Stories
5. Saltar validation/gap analysis
6. Ignorar componentes del Starter Kit

---

_TimeKast Factory — Design Workflow (v4 — Anti-Degradation)_
