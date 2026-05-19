# Phase 4: Feature Deep-Dive

> **Propósito:** Profundizar CADA feature del proyecto para eliminar assumptions del AI.
> **Siempre activo** — no depende del criterio del agente.
> **Max 5 features por batch.** Si hay más → batches con checkpoint.

---

## 4.1 Feature List Extraction

Extraer TODAS las features del Freeze Map.

Para cada feature, crear una entrada en el Deep-Dive:

| #   | Feature ID | Nombre   | Complexity (S/M/L/XL) | Batch |
| --- | ---------- | -------- | --------------------- | ----- |
| 1   | FT-001     | [nombre] | [estimación]          | 1     |
| 2   | FT-002     | [nombre] | [estimación]          | 1     |
| ... |            |          |                       |       |
| 6   | FT-006     | [nombre] | [estimación]          | 2     |

**Batch assignment:** Orden por prioridad, máx 5 por batch.

---

## 4.2 Deep-Dive por Feature (OBLIGATORIO)

Para CADA feature en el batch actual, completar TODOS estos campos:

### FT-{ID}: {Feature Name}

| Campo                     | Valor                                                  | Status |
| ------------------------- | ------------------------------------------------------ | ------ |
| **Happy path**            | [flujo principal paso a paso]                          | ✅/❌  |
| **Error/edge cases**      | [qué pasa si X falla, datos inválidos, concurrencia]   | ✅/❌  |
| **Automático vs manual**  | [qué es automático y qué requiere intervención humana] | ✅/❌  |
| **Referencia similar**    | [app/producto similar como referencia, o "ninguna"]    | ✅/❌  |
| **Usuarios involucrados** | [qué roles interactúan con esta feature]               | ✅/❌  |
| **Datos requeridos**      | [entidades y campos que necesita]                      | ✅/❌  |
| **Reglas de negocio**     | [invariantes, cálculos, validaciones específicas]      | ✅/❌  |

**Confidence:** Confirmed / [INFERRED] / [ASSUMPTION] / [OQ]

> 🔴 **Si un campo queda vacío → debe marcarse como `[OQ]`, NO inventar.**
> Cada campo vacío es un gap honesto, no una falla.

---

## 4.3 Parametric Completeness Check

**El deep-dive de una feature se considera completo si:**

| Criterio              | Umbral                |
| --------------------- | --------------------- |
| Campos completados    | ≥ 5 de 7              |
| Campos con `[OQ]`     | ≤ 2                   |
| Happy path definido   | OBLIGATORIO (siempre) |
| Error cases definidos | OBLIGATORIO (siempre) |

> Si happy path O error cases faltan → la feature NO está profundizada.
> Preguntar al usuario antes de proceder.

---

## 4.4 Batch Checkpoint (Si > 5 features)

> 🔴 **MANDATORY STOP después de CADA batch de 5 features.**
> `ShouldAutoProceed: false` — SIEMPRE. Sin excepciones.

### 4.4.1 Persistir batch inmediatamente

> 🔴 **ANTES de mostrar el checkpoint, guardar las features de este batch.**

// turbo

```bash
mkdir -p docs/planning/.discovery-wip
```

**Append** las tablas de 7 campos de este batch a `docs/planning/.discovery-wip/deep-dive.md`:

- Si es Batch 1 → crear el archivo con header + feature list completa + tablas de este batch
- Si es Batch N>1 → append las tablas de este batch al archivo existente

> 🔴 **CONTENIDO OBLIGATORIO POR FEATURE EN EL ARCHIVO:**
> La tabla completa de 7 campos de §4.2 (NOT just the summary row).
> Cada feature debe tener su sección `### FT-{ID}: {Name}` con la tabla completa.
> Un summary row no es suficiente.

### 4.4.2 Mostrar checkpoint

**Mostrar:**

- Features profundizadas en este batch: [lista]
- Total: [N/total] features completadas
- OQs generados: [N]
- Features pendientes: [lista del siguiente batch]
- Batch persistido: ✅ `docs/planning/.discovery-wip/deep-dive.md`

**OPTIONS:** `Batch [N] done: [N/total] features. 1=continue, 2=review OQs`

**ACTION:** Call `notify_user` with `BlockedOnUser: true`, `ShouldAutoProceed: false`

🛑 **STOP — DO NOT continue without user response. DO NOT auto-proceed.**

---

## 4.5 Deep-Dive Summary (Al completar TODOS los batches)

> Las tablas completas ya fueron persistidas por batch en §4.4.1.
> Este paso solo agrega el summary table al final del archivo.

**Append** la tabla resumen al final de `docs/planning/.discovery-wip/deep-dive.md`:

```markdown
---

## Summary

| Feature | Happy Path | Errors | Auto/Manual | Reference | Users | Data | Rules | Completeness |
| ------- | ---------- | ------ | ----------- | --------- | ----- | ---- | ----- | ------------ |
| FT-001  | ✅         | ✅     | ✅          | ✅        | ✅    | ✅   | ✅    | 7/7          |
| FT-002  | ✅         | ✅     | [OQ]        | ❌        | ✅    | ✅   | ❌    | 5/7          |

**Total features:** [N]
**Fully complete:** [N] (7/7)
**Partially complete:** [N] (5-6/7)
**OQs generated:** [N]
```

---

_Phase 4 Complete → Retornar a discovery.md (el orquestador decide el siguiente paso)_
