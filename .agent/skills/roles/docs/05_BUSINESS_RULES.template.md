# 📏 Reglas de Negocio - {{PROJECT_NAME}}

> Template para documentar reglas de negocio críticas e invariantes.
> **Generado desde:** Script Canónico §6 (Reglas de Negocio)

---

## Invariantes Críticas

> ⚠️ Reglas que **NUNCA** se pueden romper bajo ninguna circunstancia.

### INV-001: {{Nombre de la invariante}}

| Atributo        | Valor                                                   |
| --------------- | ------------------------------------------------------- |
| **Regla**       | {{Entidad}} NUNCA puede {{acción}} cuando {{condición}} |
| **Razón**       | {{Por qué es crítico para el negocio}}                  |
| **Enforcement** | DB constraint / Backend validation / Frontend           |
| **Error Code**  | `{{ERROR_CODE}}`                                        |
| **Test**        | `{{nombre-del-test.spec.ts}}`                           |

**Ejemplo de violación:**

```
❌ Usuario intenta {{acción}} cuando {{condición}} → Error: {{ERROR_CODE}}
```

---

### INV-002: {{Nombre}}

| Atributo        | Valor           |
| --------------- | --------------- |
| **Regla**       | {{Descripción}} |
| **Razón**       | {{Por qué}}     |
| **Enforcement** | {{Dónde}}       |
| **Error Code**  | `{{CODE}}`      |

---

## Cálculos y Fórmulas

### CALC-001: {{Nombre del cálculo}}

| Atributo          | Valor               |
| ----------------- | ------------------- |
| **Descripción**   | {{Qué calcula}}     |
| **Cuándo se usa** | {{En qué contexto}} |

**Fórmula:**

```
resultado = {{fórmula matemática}}
```

**Inputs:**
| Variable | Tipo | Descripción |
|----------|------|-------------|
| {{var1}} | number | {{desc}} |
| {{var2}} | number | {{desc}} |

**Output:** {{Tipo y rango válido}}

**Ejemplo:**

```
Inputs: var1 = 100, var2 = 0.15
Resultado: 100 * 0.15 = 15
```

**Implementación de referencia:**

```typescript
function calculate{{Nombre}}(var1: number, var2: number): number {
  return var1 * var2
}
```

---

## Estados y Transiciones

### Entidad: {{NombreEntidad}}

**Diagrama de estados:**

```
┌─────────┐     create      ┌─────────┐
│  (new)  │ ───────────────►│  DRAFT  │
└─────────┘                 └────┬────┘
                                 │
                            publish
                                 │
                                 ▼
                           ┌─────────┐     archive     ┌──────────┐
                           │ ACTIVE  │ ───────────────►│ ARCHIVED │
                           └────┬────┘                 └──────────┘
                                │
                             cancel
                                │
                                ▼
                           ┌───────────┐
                           │ CANCELLED │
                           └───────────┘
```

**Tabla de transiciones:**

| Desde  | Hacia     | Acción  | Condiciones   | Reversible | Error si falla   |
| ------ | --------- | ------- | ------------- | ---------- | ---------------- |
| DRAFT  | ACTIVE    | publish | {{condición}} | ❌         | `CANNOT_PUBLISH` |
| ACTIVE | ARCHIVED  | archive | {{condición}} | ✅         | `CANNOT_ARCHIVE` |
| ACTIVE | CANCELLED | cancel  | {{condición}} | ❌         | `CANNOT_CANCEL`  |

---

## Triggers Automáticos

### TRG-001: {{Nombre del trigger}}

| Atributo           | Valor                                 |
| ------------------ | ------------------------------------- |
| **Cuando**         | {{Evento que lo dispara}}             |
| **Entonces**       | {{Acción automática}}                 |
| **Implementación** | Cron job / Event handler / DB trigger |
| **Frecuencia**     | {{Si es cron, cuándo corre}}          |

**Lógica:**

```
IF {{condición}}
THEN {{acción 1}}
AND {{acción 2}}
```

---

### TRG-002: {{Nombre}}

| Atributo           | Valor      |
| ------------------ | ---------- |
| **Cuando**         | {{Evento}} |
| **Entonces**       | {{Acción}} |
| **Implementación** | {{Tipo}}   |

---

## Locks y Fairness

> Reglas que protegen la integridad y fairness del sistema.

### LOCK-001: {{Nombre del lock}}

| Atributo             | Valor                            |
| -------------------- | -------------------------------- |
| **Qué se bloquea**   | {{Entidad o campo}}              |
| **Cuándo se activa** | {{Condición de activación}}      |
| **Por qué**          | {{Razón de fairness/integridad}} |
| **Error Code**       | `{{ERROR_CODE}}`                 |

**Ejemplo:**

```
Usuario intenta modificar {{entidad}} después de {{evento}}
→ Sistema rechaza con error {{ERROR_CODE}}
→ Mensaje: "{{mensaje user-friendly}}"
```

---

## Validaciones de Datos

### VAL-001: {{Campo o entidad}}

| Campo  | Regla                | Error            |
| ------ | -------------------- | ---------------- |
| email  | Formato email válido | `INVALID_EMAIL`  |
| age    | >= 18                | `UNDERAGE`       |
| amount | > 0 AND <= 10000     | `INVALID_AMOUNT` |

---

## Códigos de Error del Proyecto

| Código         | HTTP | Cuándo            | Mensaje User-Friendly                |
| -------------- | ---- | ----------------- | ------------------------------------ |
| `UNAUTHORIZED` | 401  | Sin sesión        | "Por favor inicia sesión"            |
| `FORBIDDEN`    | 403  | Sin permisos      | "No tienes permiso para esta acción" |
| `NOT_FOUND`    | 404  | Recurso no existe | "No encontrado"                      |
| `{{CUSTOM_1}}` | 422  | {{Cuándo}}        | "{{Mensaje}}"                        |
| `{{CUSTOM_2}}` | 422  | {{Cuándo}}        | "{{Mensaje}}"                        |

---

_Generado con TimeKast Factory_
