# ⚠️ Risk Register — {{PROJECT_NAME}}

> **Generado por:** `/discovery` (extendido en `/docs`)
> **Propósito:** Identificar y mitigar riesgos del proyecto.

---

## Matriz de Riesgos

|                  | Prob. Baja    | Prob. Media   | Prob. Alta    |
| ---------------- | ------------- | ------------- | ------------- |
| **Impacto Alto** | 🟡 Monitorear | 🔴 Mitigar    | 🔴 Evitar     |
| **Impacto Med**  | 🟢 Aceptar    | 🟡 Monitorear | 🔴 Mitigar    |
| **Impacto Bajo** | 🟢 Aceptar    | 🟢 Aceptar    | 🟡 Monitorear |

---

## Riesgos Identificados

### RSK-001: {{Nombre del Riesgo}}

| Atributo            | Valor                                     |
| ------------------- | ----------------------------------------- |
| **Descripción**     | {{Qué puede pasar}}                       |
| **Categoría**       | Técnico / Negocio / Operacional / Externo |
| **Impacto**         | 🔴 Alto / 🟡 Medio / 🟢 Bajo              |
| **Probabilidad**    | Alta / Media / Baja                       |
| **Nivel de Riesgo** | 🔴 / 🟡 / 🟢                              |
| **Mitigación**      | {{Acción preventiva}}                     |
| **Contingencia**    | {{Si ocurre, qué hacer}}                  |
| **Owner**           | {{Responsable}}                           |

---

### RSK-002: Dependencia de Servicio Externo

| Atributo            | Valor                                    |
| ------------------- | ---------------------------------------- |
| **Descripción**     | Servicio de email (Resend) no disponible |
| **Categoría**       | Externo                                  |
| **Impacto**         | 🟡 Medio (no se pueden enviar invites)   |
| **Probabilidad**    | Baja                                     |
| **Nivel de Riesgo** | 🟢 Bajo                                  |
| **Mitigación**      | Retry logic, fallback to console log     |
| **Contingencia**    | Invites manuales vía DB                  |
| **Owner**           | Dev                                      |

---

### RSK-003: Schema Migration Destructiva

| Atributo            | Valor                                |
| ------------------- | ------------------------------------ |
| **Descripción**     | Migración borra datos en producción  |
| **Categoría**       | Técnico                              |
| **Impacto**         | 🔴 Alto                              |
| **Probabilidad**    | Baja                                 |
| **Nivel de Riesgo** | 🟡 Monitorear                        |
| **Mitigación**      | Revisar SQL antes de aplicar, backup |
| **Contingencia**    | Restore desde backup                 |
| **Owner**           | Dev                                  |

---

## Riesgos por Categoría

### Técnicos

| ID      | Riesgo                | Nivel |
| ------- | --------------------- | ----- |
| RSK-003 | Migration destructiva | 🟡    |
| RSK-XXX | ...                   | ...   |

### Negocio

| ID      | Riesgo | Nivel |
| ------- | ------ | ----- |
| RSK-XXX | ...    | ...   |

### Operacionales

| ID      | Riesgo | Nivel |
| ------- | ------ | ----- |
| RSK-XXX | ...    | ...   |

### Externos

| ID      | Riesgo          | Nivel |
| ------- | --------------- | ----- |
| RSK-002 | Depencia Resend | 🟢    |

---

## Plan de Revisión

| Frecuencia | Acción                  |
| ---------- | ----------------------- |
| Sprint     | Revisar riesgos activos |
| Release    | Evaluar nuevos riesgos  |
| Incidente  | Actualizar registro     |

---

_Generado por TimeKast Factory — /docs_
