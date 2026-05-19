# {PREFIX}-{NUM}: {Título Descriptivo}

> **Issue ID:** {PREFIX}-{NUM}
> **Priority:** P0 | P1 | P2 | P3
> **Effort:** XS | S | M | L | XL
> **Story Points:** 1 | 2 | 3 | 5 | 8 | 13
> **Status:** 📋 Backlog
> **Created:** {{DATE}}
> **Started:** —
> **Completed:** —
> **Epic:** [EPIC-{NAME}](../epics/EPIC-{NAME}.md)
> **Skills:** `domains/{x}`, `domains/{y}`, `kit/{z}`
> **Agents:** `{agent1}`, `{agent2}`
> **Owner:** {owner}
>
> _Skills/Agents via resolution algorithm (registry.yaml §D). Owner via Discovery Brief §Team._

---

## 🎯 Objetivo

{Descripción clara del problema o feature. Suficiente contexto para implementar sin preguntas.}

## User Story

> Como **P-XXX** ({rol}), quiero **{acción}** para **{beneficio}**.

**Implementa:** US-XXX

---

## 📎 Doc References (Inline)

<!-- /implement parseará estos links para cargar solo las secciones relevantes -->

| Doc          | Sección | Link                                                                  |
| ------------ | ------- | --------------------------------------------------------------------- |
| DATA_MODEL   | E-XXX   | [06_DATA_MODEL.md#e-xxx](../../planning/06_DATA_MODEL.md#e-xxx)       |
| FEATURE_MAP  | FT-XXX  | [02_FEATURE_MAP.md#ft-xxx](../../planning/02_FEATURE_MAP.md#ft-xxx)   |
| DESIGN       | SCR-XXX | [15_DESIGN.md#scr-xxx](../../planning/15_DESIGN.md#scr-xxx)           |
| USER_STORIES | US-XXX  | [04_USER_STORIES.md#us-xxx](../../planning/04_USER_STORIES.md#us-xxx) |

---

## 📚 Referencias Detalladas

**Design:**

- Pantalla: [SCR-XXX](../../planning/15_DESIGN.md#scr-xxx)
- Flujo: [FLW-XXX](../../planning/15_DESIGN.md#flw-xxx)

**Schema:**

- Entidades: [E-XXX](../../planning/06_DATA_MODEL.md#e-xxx)

**Componentes Starter Kit:**

- `DataTable` — {uso}
- `{Componente}` — {uso}

**Componentes Nuevos:**

- `CMP-XXX` — {descripción breve}

**SK Leverage:**

> Listar features del Starter Kit que este issue reutiliza (de `features.md`).

- `{Feature §X.X}` — {cómo se usa en este issue}
- O declarar: `No aplica — funcionalidad nueva`

---

## ✅ Criterios de Aceptación

- [ ] {Criterio 1 - verificable y específico}
- [ ] {Criterio 2 - verificable y específico}
- [ ] {Criterio 3 - verificable y específico}

---

## 🥒 Escenarios (Gherkin)

> 🔴 **OBLIGATORIO** — Escribir en español para consistencia.

```gherkin
Escenario: {Título del escenario happy path}
  Dado que {precondición}
  Y {otra precondición si aplica}
  Cuando {acción del usuario}
  Entonces {resultado esperado}
  Y {otro resultado si aplica}

Escenario: {Título del escenario edge case}
  Dado que {precondición}
  Cuando {acción del usuario}
  Entonces {resultado esperado}
```

---

## 🔧 Contexto Técnico

**Archivos a crear/modificar:**

- `{ruta/archivo.ts}` — {qué hacer}
- `{ruta/archivo.ts}` — {qué hacer}

### API Contract (si aplica a Server Actions)

> ⚠️ **Obligatorio** para issues que crean/modifican server actions.
> Omitir si el issue es solo UI o refactor.

**Action:** `{actionName}`

```typescript
// Input
type Input = {
  fieldId: string; // UUID del recurso
  amount: number; // Monto en centavos
};

// Output
type Output =
  | { success: true; data: { id: string; version: number } }
  | { success: false; error: string; code: ErrorCode };

// Errors
type Errors = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'CONFLICT';
```

**Side Effects:**

- Escribe en tabla `{tabla}`
- Invalida cache `{key}` (si aplica)
- Dispara notificación (si aplica)

**RBAC:**

- Permiso requerido: `{PERMISSION_NAME}` sobre `{resource}`

---

**Dependencias de Issues:**

- Bloqueado por: {PREFIX}-XXX (si aplica)
- Bloquea a: {PREFIX}-XXX (si aplica)

## ⚠️ Edge Cases

- {Caso 1}: {Cómo manejarlo}
- {Caso 2}: {Cómo manejarlo}

## 🧪 Tests Requeridos

- [ ] Unit: {qué testear}
- [ ] Integration: {qué testear}
- [ ] E2E: {flujo a testear} (si aplica)

## 🚫 Out of Scope

- {Qué NO incluir en este issue}

---

## 📝 Implementation Evidence

<!-- Completar DURANTE y DESPUÉS de implementar -->

### Decisiones Tomadas

| Fecha      | Decisión     | Razón     |
| ---------- | ------------ | --------- |
| YYYY-MM-DD | {Decisión X} | {Por qué} |

### Problemas y Soluciones

| Fecha      | Problema   | Solución   |
| ---------- | ---------- | ---------- |
| YYYY-MM-DD | {Problema} | {Solución} |

### Desviaciones del Plan

- {Si algo cambió del plan original}

### Notas para Mantenimiento

- {Tips, gotchas, contexto importante}

---

## Commits

<!-- Actualizar con cada commit -->

- `abc1234` — feat: {descripción}

---

_Creado: {{DATE}}_
_Última actualización: {{DATE}}_
