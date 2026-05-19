---
description: Proposal workflow - generate client-facing proposal from Discovery Brief
---

# /proposal — Proposal Generation

> **Flujo:** Bootstrap (Fase 2 — Proposal)
> **Anterior:** `/discovery`
> **Siguiente:** `/validate_docs` → `/docs`
> **Propósito:** Generar propuesta cliente desde Discovery Brief.

---

## Invocación

```bash
/proposal              # Genera PROPOSAL.md desde Discovery
/proposal validate     # Solo valida prerequisites
```

---

## 🌳 Árbol de Decisión

```
¿Tienes Discovery Brief aprobado?
│
├─► SÍ (00_DISCOVERY_BRIEF.md existe y aprobado)
│   └─► Generar PROPOSAL.md
│
└─► NO
    └─► ❌ "Ejecuta /discovery primero"
```

---

## Hard Gates

| Validación                   | Si falla                       |
| ---------------------------- | ------------------------------ |
| 00_DISCOVERY_BRIEF.md existe | ❌ STOP — `/discovery` primero |
| Discovery Brief aprobado     | ❌ STOP — Completar discovery  |

---

## Phase 0: Mode Detection + Context Status

// turbo

```bash
cat ./.agent/workflows/proposal/context.md
```

---

## Phase 1: Context Loading

// turbo

```bash
cat ./.agent/workflows/proposal/context-loading.md
```

---

## Phase 2: Prerequisites

// turbo

```bash
cat ./.agent/workflows/proposal/prerequisites.md
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
   🤖 @project-planner, @product-manager
   🧰 Skills: roles/proposal, brainstorming, app-builder, architecture
   ```

1. Mostrar resumen del Discovery Brief:
   - Problema principal (§1)
   - Usuarios target (§2)
   - Features MVP (§3)
   - Restricciones (§4)

2. Mostrar opciones:

   | #   | Opción         | Acción            |
   | --- | -------------- | ----------------- |
   | 1   | **generar**    | Crear PROPOSAL.md |
   | 2   | **clarificar** | Hacer preguntas   |
   | 3   | **cancelar**   | Salir             |

3. **ACTION:** Call `notify_user` with `BlockedOnUser=true`.

🛑 **STOP AQUÍ — NO continuar sin respuesta del usuario.**

---

## Phase 3: Generation

> ⚠️ **SOLO DESPUÉS DE CHECKPOINT 1 APROBADO**

// turbo

```bash
cat ./.agent/workflows/proposal/generation.md
```

---

## 🛑 CHECKPOINT 2: Post-Generation Review

> 🔴 **HARD GATE — El agente DEBE parar aquí.**

// turbo

```bash
cat ./.agent/workflows/_shared/checkpoint-transparency.md
```

**EL AGENTE DEBE:**

1. Mostrar resumen de la Proposal generada:
   - Secciones generadas: [N/8]
   - MVP scope: [N features]
   - Post-MVP: [N features]
   - Supuestos/Decisiones Pendientes: [N]

2. Anunciar validaciones pendientes:
   - 🔲 Self-Validation (checklist mecánica)
   - 🔲 Source Reconciliation vs Brief (features MVP, evolución planificada)
   - 🔲 Multi-Agent Review (5 perspectivas)
   - 🔲 Validation Report

3. Mostrar opciones:

   | #   | Opción    | Acción                    |
   | --- | --------- | ------------------------- |
   | 1   | validar   | Proceder con validaciones |
   | 2   | revisar   | Ver Proposal generada     |
   | 3   | regenerar | Volver a generar          |

4. **ACTION:** Call `notify_user` con `BlockedOnUser: true`, `ShouldAutoProceed: false`

🛑 **STOP — NO ejecutar validaciones sin aprobación.**

---

## Phase 4: Validation (Drift/Gap Analysis)

> ⚠️ **SOLO DESPUÉS DE CHECKPOINT 2 APROBADO**

// turbo

```bash
cat ./.agent/workflows/proposal/validation.md
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

1. Mostrar análisis de cobertura vs Discovery:
   - §1 (Idea) → Secciones 1-2: [%]
   - §2 (Usuarios) → Sección 4: [%]
   - §3 (Features) → Secciones 3+6: [%]
   - Gaps críticos: [N]

2. Mostrar opciones:

   | #   | Opción       | Acción                            |
   | --- | ------------ | --------------------------------- |
   | 1   | **aprobar**  | Continuar a /docs                 |
   | 2   | **validar**  | Ejecutar `/validate_docs` primero |
   | 3   | **corregir** | Ajustar proposal                  |
   | 4   | **cancelar** | Descartar                         |

3. **ACTION:** Call `notify_user` with `BlockedOnUser: true`
4. **NO ejecutar NINGUNA acción posterior**
5. **Esperar respuesta explícita del usuario**

**VERIFICACIÓN DE FALLO:**

- Si el agente continúa sin respuesta → **FALLO**
- Si no usó `notify_user` → **FALLO**

🛑 **STOP AQUÍ — NO continuar sin aprobación.**

---

## Phase 5: Close

> ⚠️ **SOLO DESPUÉS DE CHECKPOINT 3 APROBADO**

// turbo

```bash
cat ./.agent/workflows/proposal/close.md
```

---

## Reglas SIEMPRE/NUNCA

**SIEMPRE:**

1. Context Status (Phase 0) primero
2. Verificar 00_DISCOVERY_BRIEF.md existe
3. Cargar SKILL.md para knowledge base
4. CHECKPOINT 1 antes de generar
5. CHECKPOINT 2 después de generar (resumen + validaciones pendientes)
6. Drift/Gap analysis antes de CHECKPOINT 3
7. Output a `docs/planning/01_PROPOSAL.md`

**NUNCA:**

1. Generar sin Discovery Brief aprobado
2. Inventar features no documentados
3. Omitir secciones del template
4. Incluir tecnicismos (Next.js, API, DB)
5. Incluir precios o costos

---

_TimeKast Factory — Proposal Workflow (v3 — Refactored)_
