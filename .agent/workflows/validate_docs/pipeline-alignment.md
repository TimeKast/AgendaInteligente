# Phase V1: Pipeline Alignment

> **Propósito:** Verificar que CADA elemento del Discovery Brief tiene representación
> a lo largo de toda la cadena de docs hasta el punto actual del pipeline.
>
> **Diferencia con validaciones inline:** Esta validación cruza TODA la cadena de una vez,
> no solo el doc anterior → doc actual.

---

## 1.1 Source of Truth (ya cargada)

> ✅ **Todos los docs ya fueron cargados vía Phase 1.5 (`load-docs.md`).**
> El agente tiene en contexto el contenido COMPLETO de todos los docs.

**Del Discovery Brief, extraer para validación:**

1. **Features MVP** (§3 / §3.1) — lista completa con criticidad
2. **Features excluidos** (§3.6) — lo que NO va en MVP
3. **Entidades** (§4.1) — todas las entidades del dominio
4. **Reglas de negocio** (§6 / §6.1) — todas las BR-XXX
5. **Pantallas** (§7.2) — todas las pantallas mencionadas
6. **Flujos** (§7.3) — todos los flujos de usuario
7. **Integraciones** (§5) — APIs externas, servicios

---

## 1.2 Cadena de Trazabilidad por Stage

> Ejecutar SOLO las validaciones hasta el stage detectado.

### Post-Discovery (siempre correr)

| Check         | Qué verificar                                              | Cómo                  |
| ------------- | ---------------------------------------------------------- | --------------------- |
| §11 Cross-Map | ¿CADA entidad, pantalla, feature de §1-§10 aparece en §11? | Re-leer prosa vs §11  |
| Namespace     | ¿Solo BR-XXX? ¿Hay RN-XXX mezclados?                       | `grep -E 'RN-[0-9]+'` |
| Completitud   | ¿§1-§11 + Coverage Map completos?                          | Verificar secciones   |

### Post-Proposal (si `01_PROPOSAL.md` existe)

| Check                 | Qué verificar                                                        | Cómo            |
| --------------------- | -------------------------------------------------------------------- | --------------- |
| Features MVP coverage | ¿TODOS los features MVP de Brief §3 están en Proposal "Incluye"?     | Tabla 1:1       |
| Exclusiones match     | ¿TODAS las exclusiones de Brief §3.6 están en Proposal "No incluye"? | Tabla 1:1       |
| Scope creep           | ¿Hay features en Proposal que NO están en Brief?                     | Comparar listas |
| Timeline viable       | ¿El timeline es coherente con el scope?                              | Juicio experto  |

**Tabla de reconciliación (OBLIGATORIA):**

| #   | Feature Brief §3 MVP | ¿En Proposal "Incluye"? | Status |
| --- | -------------------- | ----------------------- | ------ |
| 1   | [listar cada uno]    | ✅/❌                   |        |

### Post-Docs (si docs 02-14 existen)

| Check             | Fuente → Destino                           | Qué verificar                                                      |
| ----------------- | ------------------------------------------ | ------------------------------------------------------------------ |
| Features          | Brief §3 → 02_FEATURE_MAP                  | ¿Cada feature MVP tiene FT-XXX?                                    |
| Personas          | Brief §2 → 03_USER_PERSONAS                | ¿Cada tipo de usuario tiene P-XXX?                                 |
| US coverage       | Brief §3 features → 04_USER_STORIES US-XXX | ¿Cada feature tiene al menos 1 US?                                 |
| BR coverage       | Brief §6 → 05_BUSINESS_RULES               | ¿Cada regla tiene BR-XXX?                                          |
| Entidades         | Brief §4 → 06_DATA_MODEL                   | ¿Cada entidad tiene E-XXX con campos?                              |
| ADR → Data Model  | 07_ARCHITECTURE ADRs → 06_DATA_MODEL       | ¿Cada ADR que afecta schema se refleja en el Data Model?           |
| Decision Registry | Brief Decision Registry → Docs relevantes  | ¿Cada decisión "Firm" del Brief aparece en el doc correspondiente? |
| API actions       | 04_USER_STORIES → 08_API_CONTRACTS         | ¿Cada US de escritura tiene action?                                |
| Riesgos           | Brief §8 → 13_RISK_REGISTER                | ¿Constraints técnicos tienen R-XXX?                                |
| Traceability      | 14_TRACEABILITY                            | ¿FT → US → E → BR → SCR chain completa?                            |

**Tablas de reconciliación (OBLIGATORIAS):**

| #   | Entidad Brief §4 | E-XXX en 06 | CRUD definido | Status |
| --- | ---------------- | ----------- | ------------- | ------ |
| 1   | [cada una]       |             |               |        |

| #   | BR Brief §6 | BR-XXX en 05 | Implementable | Status |
| --- | ----------- | ------------ | ------------- | ------ |
| 1   | [cada una]  |              |               |        |

### Post-Design (si `15_DESIGN.md` existe)

| Check                   | Fuente → Destino                            | Qué verificar                                                         |
| ----------------------- | ------------------------------------------- | --------------------------------------------------------------------- |
| Pantallas               | Brief §7.2 → 15_DESIGN SCR-XXX              | ¿Cada pantalla del Brief tiene SCR?                                   |
| Features → UI           | 02_FEATURE_MAP → SCR-XXX                    | ¿Cada feature MVP tiene pantalla?                                     |
| Entidades → Data Req    | 06_DATA_MODEL E-XXX → SCR data requirements | ¿Cada entidad aparece en algún SCR?                                   |
| Flujos                  | Brief §7.3 → 15_DESIGN FLW-XXX              | ¿Cada flujo tiene FLW?                                                |
| Componentes SK          | INVENTORY.md → 15_DESIGN CMP                | ¿Se reutilizan los del SK?                                            |
| RBAC visual             | 03_PERSONAS → SCR access                    | ¿Cada pantalla tiene permisos correctos?                              |
| Variantes diferenciadas | Brief variants/formatos → 15_DESIGN SCR-XXX | ¿Cada variante del producto tiene su propia experiencia visual en UX? |

**Tabla de reconciliación (OBLIGATORIA):**

| #   | Pantalla Brief §7.2 | SCR-XXX en 15 | US asociada | Status |
| --- | ------------------- | ------------- | ----------- | ------ |
| 1   | [cada una]          |               |             |        |

### Post-Backlog (si `docs/backlog/` existe)

| Check           | Fuente → Destino                       | Qué verificar                               |
| --------------- | -------------------------------------- | ------------------------------------------- |
| US → Issues     | 04_USER_STORIES US-XXX → Issues        | ¿Cada US tiene al menor 1 issue?            |
| E → CRUD issues | 06_DATA_MODEL E-XXX → Issues de schema | ¿Cada entidad tiene issue de CRUD?          |
| SCR → Issues    | 15_DESIGN SCR-XXX → Issues de UI       | ¿Cada pantalla tiene issue?                 |
| BR → Issues     | 05_BUSINESS_RULES BR-XXX → Issues      | ¿Cada BR tiene issue que la implementa?     |
| FLW → E2E       | 15_DESIGN FLW-XXX → 12_E2E_SCENARIOS   | ¿Flujos críticos tienen E2E?                |
| API → Issues    | 08_API_CONTRACTS → Issues de backend   | ¿Cada action tiene issue?                   |
| Epic order      | Epic dependency graph                  | ¿Epics siguen topological sort?             |
| Issue order     | Issue dependencies                     | ¿Issue-N no depende de Issue-M donde M > N? |
| SK overlap      | features.md → Issues                   | ¿Hay issues que duplican features del SK?   |
| Agents/Skills   | Issues → campos `Agents:` y `Skills:`  | ¿Cada issue tiene asignación de agentes?    |
| Issue sizing    | Issues → Story Points / sizing         | ¿Ningún issue excede XL (necesita split)?   |

**Tabla de reconciliación (OBLIGATORIA):**

| #   | US-XXX     | Issues que la cubren | Coverage | Status |
| --- | ---------- | -------------------- | -------- | ------ |
| 1   | [cada una] |                      |          |        |

---

## 1.3 Output V1

> 🔴 **CADA check DEBE tener resultado concreto, no genérico.**

### Resumen de Pipeline Alignment

| Stage          | Checks Passed | Checks Failed | Gaps | Drift |
| -------------- | :-----------: | :-----------: | :--: | :---: |
| post-discovery |       N       |       N       |  N   |   N   |
| post-proposal  |       N       |       N       |  N   |   N   |
| post-docs      |       N       |       N       |  N   |   N   |
| post-design    |       N       |       N       |  N   |   N   |
| post-backlog   |       N       |       N       |  N   |   N   |

### Gaps (elementos faltantes)

| #   | Fuente   | Elemento  | Debería estar en | Severidad | Status |
| --- | -------- | --------- | ---------------- | --------- | ------ |
| 1   | Brief §3 | [feature] | 02_FEATURE_MAP   | 🔴/🟡     | ❌     |

### Drift (elementos que cambiaron)

| #   | Fuente dice | Doc dice | Doc afectado | Severidad | Status |
| --- | ----------- | -------- | ------------ | --------- | ------ |
| 1   | [original]  | [cambio] | [doc]        | 🔴/🟡     | ❌     |

---

_Pipeline Alignment Complete → Continuar a Semantic Fidelity (V2) o Report_
