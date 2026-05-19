# Phase 2: Freeze Map (Decision Extraction)

> **Propósito:** Extraer decisiones firmes del source package y construir el Freeze Map.
> **Éste es el paso más importante del discovery.** Todo lo demás depende de la calidad de este paso.

---

## 2.1 D0: Quick Start (Desde cero)

Si es **D0** (sin documentos), pedir campos mínimos:

```markdown
## 📋 Quick Start (D0)

Por favor proporciona:

1. **Nombre del proyecto:** \_\_\_
2. **Stakeholder/cliente:** \_\_\_
3. **Deadline (si existe):** \_\_\_
4. **Usuarios/roles (alto nivel):** \_\_\_
5. **Integraciones conocidas:** \_\_\_ (Stripe, Resend, etc.)
6. **Plataformas:** Web / PWA / Mobile / \_\_\_
7. **Idioma preferido:** \_\_\_ (es-MX, en-US, etc.)
8. **Terminología específica:** ¿Hay términos de tu industria que debamos usar?
   - Ejemplo: "Partida" en lugar de "línea de cotización"
```

> **D0 construye el Freeze Map DESPUÉS de la entrevista (Phase 3).**
> Aquí solo se recogen los campos mínimos. La formalización a Freeze Map ocurre en gap-interview.md §C.

---

## 2.2 D1/D2: Decision Extraction (Con docs existentes)

> 🔴 **OBLIGATORIO antes de hacer CUALQUIER pregunta.**
> El agente DEBE procesar TODOS los documentos proporcionados y construir el Freeze Map.

### Paso 1: Procesar Documentos

Para CADA documento en el Source Package (clasificado en Phase 1):

1. **Leer completo** (no parcial, no sampling)
2. **Extraer** todos los datos estructurados: nombres, fechas, roles, entidades, reglas, decisiones
3. **Clasificar** cada pieza de información según el Freeze Map

### Paso 2: Construir Freeze Map

```markdown
## 🧊 Freeze Map

### Decisiones Firmes (NO modificar sin autorización)

| #   | Decisión              | Fuente | Sección |
| --- | --------------------- | ------ | ------- |
| F1  | Stakeholder: [nombre] | [doc]  | §1      |
| F2  | Deadline: [fecha]     | [doc]  | §8      |
| F3  | [decisión]            | [doc]  | §X      |

### Decisiones Abiertas (Requieren input del usuario)

| #   | Pregunta   | Impacto       | Sección |
| --- | ---------- | ------------- | ------- |
| O1  | [pregunta] | Alto/Med/Bajo | §X      |

### Contradicciones Detectadas

| #   | Tema   | Doc A dice  | Doc B dice  | Resolución |
| --- | ------ | ----------- | ----------- | ---------- |
| C1  | [tema] | [versión A] | [versión B] | Pendiente  |

### Recomendaciones (No son decisiones)

| #   | Recomendación   | Fuente | Tipo              |
| --- | --------------- | ------ | ----------------- |
| R1  | [recomendación] | [doc]  | Sugerido / Futuro |

### Post-MVP / Futuro (Excluido del scope actual)

| #   | Item                | Fuente | Razón                   |
| --- | ------------------- | ------ | ----------------------- |
| E1  | [feature/capacidad] | [doc]  | Explícitamente excluido |
```

### Paso 3: Validación del Freeze Map

**Campos requeridos para continuar:**

| Campo                                   | Obligatorio        |
| --------------------------------------- | ------------------ |
| Nombre del proyecto                     | ✅ Sí              |
| Stakeholder                             | ✅ Sí              |
| Al menos 1 usuario/rol                  | ✅ Sí              |
| Plataforma principal                    | ✅ Sí              |
| Al menos 1 decisión firme en Freeze Map | ✅ Sí (para D1/D2) |

**Si falta alguno → Preguntar antes de continuar.**

### Paso 4: Feature Identification

> 🔴 **FEATURE COUNT CHECK:**
> Cross-reference the source document against the feature list.
> Every distinct capability/screen/subsystem mentioned should have its own FT-XXX.
> Merging 2+ capabilities into 1 feature is ONLY acceptable if they share
> 100% of their data model, UI, and business rules.
> Example: "O/U System" and "Parlay Bonus" share picks but have different rules → 2 features.

Agregar al freeze-map una sección:

```markdown
### Feature List (Preliminary)

| #   | Feature ID | Nombre   | Criticidad | Fuente   |
| --- | ---------- | -------- | ---------- | -------- |
| 1   | FT-001     | [nombre] | 🔴/🟡      | [doc §X] |
```

---

## 2.3 Bulk Attachment Processing

> Para screenshots, excels, reportes, procedimientos, etc.

**Protocolo:**

1. **Contar** todos los items del attachment (N screenshots, N filas, N páginas)
2. **Declarar** al usuario: "Procesando [N] items de [tipo]"
3. **Procesar todo el material relevante** — extraer entidades, flujos, reglas, datos
4. **Reportar completitud:** "Procesados [X/N] items"

> 🔴 **Si se omite material, se declara qué se omitió y por qué.**
> Se permite particionado explícito o priorización por relevancia, pero NUNCA sampling silencioso.

**Qué extraer de cada tipo:**

| Tipo Attachment   | Extraer                                          |
| ----------------- | ------------------------------------------------ |
| Screenshots de UI | Pantallas, flows, entidades visibles, estados    |
| Excel/Tablas      | Entidades, campos, relaciones, reglas de negocio |
| Reportes PDF      | Métricas, KPIs, reglas, decisiones               |
| Procedimientos    | Flujos, reglas de negocio, roles, triggers       |
| Wireframes/Mocks  | Pantallas, componentes, interacciones            |

---

## 2.4 Mini Challenge (Opcional para D1 con input rico)

> Antes de la entrevista, un pass rápido de 3 perspectivas sobre el Freeze Map:

| Perspectiva         | Check Rápido                                          |
| ------------------- | ----------------------------------------------------- |
| **product-owner**   | ¿Qué decisiones ya están cerradas y no deben tocarse? |
| **architect**       | ¿Qué zonas tienen alto costo de reversión?            |
| **project-planner** | ¿Qué partes requieren clarificación por scope/tiempo? |

> Este paso es **interno** (no se muestra al usuario) pero informa las preguntas de Phase 3.

---

## 2.5 Persistir Freeze Map

> 🔴 **OBLIGATORIO:** Guardar el Freeze Map a disco para que Synthesis pueda re-cargarlo.
> Esto previene pérdida de contexto en conversaciones largas.

// turbo

```bash
mkdir -p docs/planning/.discovery-wip
```

El agente DEBE guardar el Freeze Map completo (decisiones firmes, abiertas, contradicciones, recomendaciones, exclusiones) en:
`docs/planning/.discovery-wip/freeze-map.md`

---

_Phase 2 Complete → Continuar a CHECKPOINT 1_
