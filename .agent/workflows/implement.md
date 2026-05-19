---
description: Implement workflow - execute issues from backlog through full pipeline (v2)
---

# /implement — Issue Execution (v2)

> **Flujo:** Bootstrap (Fase 5 — Execution)
> **Anterior:** `/backlog`
> **Siguiente:** `/audit`
> **Propósito:** Ejecutar UN issue del backlog: plan → code → verify → document → close.

---

## Invocación

```bash
/implement ISSUE-XXX        # Pipeline completo
/implement ISSUE-XXX --plan  # Solo plan (Phase 0-3)
/implement --next            # Tomar primer P0/P1 pendiente
```

---

## Hard Gates

| Validación             | Si falla                   |
| ---------------------- | -------------------------- |
| Issue existe           | ❌ STOP — verificar ID     |
| Status ≠ ✅ Completed  | ❌ STOP — ya cerrado       |
| Status ≠ 🚫 Blocked    | ❌ STOP — resolver bloqueo |
| Dependencias cumplidas | ❌ STOP — implementar deps |

---

## Phase 0: Issue Selection + Context Status

// turbo

```bash
cat ./.agent/workflows/implement/selection.md
```

---

## Phase 1: Context Loading

// turbo

```bash
cat ./.agent/workflows/implement/context-loading.md
```

---

## Phase 2: Load Issue + Doc References

// turbo

```bash
cat ./.agent/workflows/implement/load-issue.md
```

---

## Phase 3: Pre-Audit + Plan

// turbo

```bash
cat ./.agent/workflows/implement/planning.md
```

---

## 🛑 CHECKPOINT 1: Plan Confirmation

> 🔴 **HARD GATE — El agente DEBE parar aquí.**

// turbo

```bash
cat ./.agent/workflows/_shared/checkpoint-transparency.md
```

**Risk Assessment:**

| Condición                        | Riesgo | ShouldAutoProceed           |
| -------------------------------- | ------ | --------------------------- |
| 1-2 archivos (crear + modificar) | LOW    | `true` — puede auto-aprobar |
| 3+ archivos (crear + modificar)  | HIGH   | `false` — SIEMPRE parar     |
| Schema change                    | HIGH   | `false` — SIEMPRE parar     |
| New dependency                   | HIGH   | `false` — SIEMPRE parar     |
| ADR pendiente                    | HIGH   | `false` — SIEMPRE parar     |

**EL AGENTE DEBE:**

0. **Anunciar agents y skills del issue (OBLIGATORIO, UNA VEZ):**

   ```
   🤖 @{agents del issue}
   🧰 Skills: {skills del issue}
   ```

   Usar valores exactos de `> **Skills:**` y `> **Agents:**` del issue.

1. Mostrar plan completo (de Phase 3)
2. Clasificar riesgo con esta tabla:

   | Criterio             | LOW | HIGH |
   | -------------------- | --- | ---- |
   | Archivos nuevos      | 0-1 | ≥ 2  |
   | Archivos modificados | 0-2 | ≥ 3  |
   | Toca schema/DB       | No  | Sí   |
   | Toca auth/permisos   | No  | Sí   |
   | Story Points         | 1-2 | ≥ 3  |

   > **Si CUALQUIER criterio es HIGH → el issue es HIGH risk.**

3. Mostrar opciones (continuar / ajustar / cancelar)
4. **ACTION:** Call `notify_user` with:
   - `BlockedOnUser: true`
   - `ShouldAutoProceed: true` SOLO si TODOS los criterios son LOW
   - `ShouldAutoProceed: false` si CUALQUIERA es HIGH

> 🔴 **HIGH risk → STOP obligatorio.** LOW risk (XS config, 1 archivo) → puede auto-proceder.

---

## Phase 4: Code + Verify

> ⚠️ **SOLO DESPUÉS DE CHECKPOINT 1 APROBADO**

// turbo

```bash
cat ./.agent/workflows/implement/coding.md
```

---

## Phase 5: Quality Check

// turbo

```bash
cat ./.agent/workflows/implement/qc.md
```

---

## 🛑 CHECKPOINT 2: Pre-Commit Review

> 🔴 **HARD GATE — ShouldAutoProceed = false SIEMPRE**
> Commit/push afecta el repositorio — NO auto-aprobar nunca.

// turbo

```bash
cat ./.agent/workflows/_shared/checkpoint-transparency.md
```

**Pre-requisitos:**

- ✅ QC Report PASS (de Phase 5)
- ✅ Issue documentado (Implementation Evidence)

**EL AGENTE DEBE:**

1. Mostrar QC Report + AC Evidence (de Phase 5)
2. Mostrar opciones:

   | #   | Opción        | Acción                       |
   | --- | ------------- | ---------------------------- |
   | 1   | **completar** | Commit + push + cerrar issue |
   | 2   | **revisar**   | Ajustar antes de cerrar      |
   | 3   | **cancelar**  | Dejar en progreso            |

3. **ACTION:** Call `notify_user` with `BlockedOnUser: true`, `ShouldAutoProceed: false`

🛑 **STOP — NO commit/push sin respuesta del usuario.**

---

## Phase 6: Close

> ⚠️ **SOLO DESPUÉS DE CHECKPOINT 2 APROBADO**

// turbo

```bash
cat ./.agent/workflows/implement/close.md
```

---

## Reglas Clave

> Principios completos en `SKILL.md`. Aquí solo el resumen ejecutivo.

1. **Plan → CP1 → Code → QC → CP2 → Close** (orden inviolable)
2. **Un issue a la vez** — nunca adelantar trabajo de otros issues
3. **CP1 bloquea código** — no implementar sin plan aprobado
4. **CP2 bloquea commit** — no commit/push sin QC + aprobación
5. **Documentar antes de commit** — Implementation Evidence en el issue
6. **Nunca inventar aprobación** — solo respuestas reales del usuario

---

_TimeKast Factory — Implement Workflow (v2 — Refactored)_
