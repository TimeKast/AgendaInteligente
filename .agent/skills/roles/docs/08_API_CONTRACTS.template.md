# API Contracts — {{PROJECT_NAME}}

> Generado desde Discovery Brief + Architecture por `/docs`
> **Fuente:** `docs/planning/00_DISCOVERY_BRIEF.md`, `docs/planning/06_ARCHITECTURE.md`
> **SSOT:** Este documento para contratos de API

---

## Resumen

Este documento define los contratos de cada Server Action del sistema: inputs, outputs, errores, efectos secundarios, y permisos requeridos.

---

## Server Actions

### Module: [MODULE_NAME]

#### Action: [actionName]

**Purpose:** [Descripción en una línea de lo que hace]

**File:** `lib/actions/[module]-actions.ts`

##### Input

```typescript
type [ActionName]Input = {
  fieldId: string;      // UUID del recurso
  amount: number;       // Monto en centavos
  // ...
};
```

| Field   | Type     | Required | Validation  |
| ------- | -------- | :------: | ----------- |
| fieldId | `string` |    ✅    | UUID format |
| amount  | `number` |    ✅    | > 0         |

##### Output

```typescript
type [ActionName]Output = {
  success: true;
  data: {
    id: string;
    version: number;
    status: "DRAFT" | "APPROVED";
  };
} | {
  success: false;
  error: string;
  code: ErrorCode;
};
```

##### Errors

| Code               | HTTP | Reason                  | Recovery                 |
| ------------------ | :--: | ----------------------- | ------------------------ |
| `UNAUTHENTICATED`  | 401  | Sin sesión válida       | Redirigir a login        |
| `FORBIDDEN`        | 403  | Sin permiso para acción | Mostrar mensaje          |
| `VALIDATION_ERROR` | 400  | Campo inválido          | Mostrar errores de campo |
| `NOT_FOUND`        | 404  | Recurso no existe       | Redirigir o refresh      |
| `CONFLICT`         | 409  | Conflicto de versión    | Retry con refresh        |

##### Side Effects

- **DB:** Inserta en `[tabla]`
- **Audit:** Log en `audit_logs`
- **Notification:** [Ninguna | Email | Push]
- **Cache:** [Ninguno | Invalidate X]

##### RBAC

| Permission        | Scope           |
| ----------------- | --------------- |
| `[MODULE]_CREATE` | resource.fundId |

> **Roles con permiso:** SUPER_ADMIN, FUND_ADMIN

---

## Patrones Comunes

### Estructura de Respuesta Estándar

Todas las Server Actions usan este patrón:

```typescript
// Success
{ success: true, data: T }

// Error
{ success: false, error: string, code: ErrorCode }
```

### Códigos de Error Estándar

| Code               | Descripción                   |
| ------------------ | ----------------------------- |
| `UNAUTHENTICATED`  | Sesión no válida o expirada   |
| `FORBIDDEN`        | Usuario no tiene permiso      |
| `VALIDATION_ERROR` | Input no pasa validación Zod  |
| `NOT_FOUND`        | Recurso no existe             |
| `CONFLICT`         | Conflicto de versión/estado   |
| `INTERNAL_ERROR`   | Error inesperado del servidor |

### Validación con Zod

Todas las actions usan Zod para validar input:

```typescript
const schema = z.object({
  fieldId: z.string().uuid(),
  amount: z.number().positive(),
});

const parsed = schema.safeParse(input);
if (!parsed.success) {
  return { success: false, error: 'Datos inválidos', code: 'VALIDATION_ERROR' };
}
```

---

## Open Questions

| #     | Pregunta             | Impacto           | Owner       |
| ----- | -------------------- | ----------------- | ----------- |
| OQ-01 | [Pregunta pendiente] | **Alto**/Med/Bajo | Cliente/Dev |

---

## Assumptions

| #    | Supuesto           | Si es incorrecto         |
| ---- | ------------------ | ------------------------ |
| A-01 | [Supuesto asumido] | Impacto: [qué cambiaría] |

---

_Generado por TimeKast Factory — /docs_
