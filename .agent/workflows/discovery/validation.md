# Phase 7: Challenge Pass (Validation + Multi-Agent Review)

> **Propósito:** Verificar fidelidad, consistencia y utilidad real del Discovery Brief antes de cerrarlo.

---

## 7.1 Structural Self-Check

Verificar:

- [ ] El brief existe y no está vacío
- [ ] Tiene §1–§11 + Source Package + Decision Registry + Coverage Map
- [ ] No contiene placeholders sin llenar (`{{...}}`, `___`, `[...]`)
- [ ] §3 define features / alcance con criticidad
- [ ] §4 define entidades relevantes con CRUD
- [ ] §6 incluye reglas de negocio o invariantes (BR-XXX)
- [ ] §7 incluye pantallas y flujos como tabla
- [ ] Reconciliation Checklist existe y sirve como cross-check

> ⚠️ **Pasar este check NO implica que el brief sea fiel.** Solo valida estructura.

---

## 7.1.5 Quantitative Completeness (MANDATORY)

> 🔴 **Comparar counts WIP vs Brief. Si cualquier DELTA es negativo, la síntesis PERDIÓ información.**

// turbo

```bash
echo "=== WIP Counts ===" && echo -n "Features: " && grep -cE '^\| FT-|^### FT-|^## FT-' docs/planning/.discovery-wip/deep-dive.md 2>/dev/null || echo "0" && echo -n "BRs: " && grep -cE 'BR-[A-Z]*[0-9]' docs/planning/.discovery-wip/deep-dive.md 2>/dev/null || echo "0" && echo "=== Brief Counts ===" && echo -n "Features: " && grep -cE '^\| FT-' docs/planning/00_DISCOVERY_BRIEF.md 2>/dev/null || echo "0" && echo -n "BRs: " && grep -cE 'BR-[A-Z]*[0-9]' docs/planning/00_DISCOVERY_BRIEF.md 2>/dev/null || echo "0"
```

**Mostrar resultado como tabla:**

| Item                 | WIP Count | Brief Count | Delta | Status                   |
| -------------------- | --------- | ----------- | ----- | ------------------------ |
| Features (FT-)       | X         | Y           | Y-X   | ✅ if ≥0, 🔴 if <0       |
| Business Rules (BR-) | X         | Y           | Y-X   | ✅ if ≥-10%, 🔴 if <-10% |
| Entities (E)         | X         | Y           | Y-X   | ✅ if ≥0, 🔴 if <0       |
| Screens (P)          | X         | Y           | Y-X   | ✅ if ≥0, 🔴 if <0       |

**🔴 Si cualquier item tiene Delta negativo significativo (>10% pérdida) → STOP.**
**Corregir la síntesis antes de continuar con source fidelity check.**

---

## 7.2 Source Fidelity Check (MANDATORY)

> 🔴 **Comparar el brief contra el Freeze Map de Phase 2.**

Verificar:

- [ ] Stakeholder principal coincide con el source
- [ ] Ownership / roles políticos coinciden
- [ ] Deadlines / milestones coinciden
- [ ] Límites de MVP coinciden (no se amplió sin autorizar)
- [ ] Non-goals y exclusions se preservaron (no se recortaron)
- [ ] Jerarquía documental fue respetada
- [ ] No se promovieron recomendaciones a decisiones firmes
- [ ] No se promovieron future / no-MVP a MVP
- [ ] Nombres propios sin cambios

**Output obligatorio:**

```markdown
## 🔒 Source Fidelity Check

| #   | Decisión Firme | Source | En Brief       | ✅/🔴               |
| --- | -------------- | ------ | -------------- | ------------------- |
| F1  | [decisión]     | [doc]  | [cómo aparece] | ✅ Match / 🔴 Drift |
```

**Si hay 🔴 → STOP. Corregir drift antes de continuar.**

---

## 7.3 Drift Report (MANDATORY)

> 🔴 **Listar TODO lo introducido por el brief que NO venía del input.**

Clasificar cada hallazgo:

| Categoría              | Significado                                  | Acción            |
| ---------------------- | -------------------------------------------- | ----------------- |
| **Harmless Wording**   | Reescritura estilística sin cambio semántico | ✅ Keep           |
| **Helpful Inference**  | Deducción razonable marcada como [INFERRED]  | ✅ Keep si tagged |
| **Risky Assumption**   | Gap-fill con costo alto de reversión         | ⚠️ Clarify        |
| **Unauthorized Drift** | Cambio de dato firme sin autorización        | 🔴 Remove         |

**Output obligatorio:**

```markdown
## 📊 Drift Report

| #   | Item         | Tipo                                      | Severidad        | Acción                  |
| --- | ------------ | ----------------------------------------- | ---------------- | ----------------------- |
| 1   | [qué cambió] | harmless / helpful / risky / unauthorized | low / med / high | keep / clarify / remove |

**Total:** N items | Unauthorized: N | Risky: N | Safe: N
```

**🔴 Si hay unauthorized drift en ownership, fechas o scope → STOP.**

---

## 7.4 Namespace Consistency

// turbo

```bash
grep -nE 'RN-[0-9]+' docs/planning/00_DISCOVERY_BRIEF.md 2>/dev/null && echo "🔴 MEZCLA DETECTADA: RN- encontrado" || echo "✅ Solo BR-XXX"
```

---

## 7.5 Internal Consistency Check

| Check                           | Status                                  |
| ------------------------------- | --------------------------------------- |
| §2 Usuarios ↔ §6 Reglas         | Permisos coherentes?                    |
| §3 Features ↔ §7 Pantallas      | Cada feature tiene pantalla?            |
| §3 Features ↔ §4 Entidades      | Cada feature mapea a entidades?         |
| §4 Datos ↔ §5 Integraciones     | Fuentes de datos compatibles?           |
| §8 Infra ↔ §10 Mobile/PWA       | Offline strategy coherente?             |
| §1 North Star ↔ §3 Scope real   | Métrica de éxito alineada con features? |
| §4.1 Entidades ↔ §7.2 Pantallas | Cada entidad tiene pantalla?            |

---

## 7.6 Reconciliation Completeness

- [ ] Reconciliation Checklist existe
- [ ] Firm Decisions Registry — tiene entries
- [ ] Entities / Screens / Features Registry — tiene entries
- [ ] Open Questions & Assumptions Registry — tiene entries
- [ ] CADA entidad de §4.1 aparece en Reconciliation
- [ ] CADA pantalla de §7.2 aparece en Reconciliation
- [ ] CADA feature de §3.1 aparece en Reconciliation
- [ ] No hay items en prosa que falten en Reconciliation

---

## 7.7 Multi-Agent Challenge Pass

> 3 perspectivas revisan el brief. Este es el momento de máximo valor multiagente.

### A. product-owner — Value, Scope, Omissions

**Focus:** ¿Se preservó la intención del negocio?

**Output shape:**

- Valor preservado: ✅/⚠️/🔴
- Scope drift detected: sí/no + detalle
- Features omitidas o degradadas: [lista]
- Recommendation: [acción]

### B. architect — Reversibility, Constraints, Technical Unknowns

**Focus:** ¿Hay decisiones técnicas peligrosas?

**Output shape:**

- Decisiones de alto costo de reversión: [lista con nivel]
- Constraints técnicos no documentados: [lista]
- Riesgos arquitectónicos: [lista con severidad]
- Recommendation: [acción]

### C. project-planner — Sequencing, Dependencies, Timeline Pressure

**Focus:** ¿Es ejecutable en el tiempo?

**Output shape:**

- Dependencias ocultas: [lista]
- Presión scope vs timeline: ✅/⚠️/🔴 + detalle
- Secuencia de fases viable: sí/no
- Recommendation: [acción]

**Output obligatorio:**

```markdown
## 🤖 Challenge Pass

| Perspectiva     | Veredicto | Resumen      |
| --------------- | --------- | ------------ |
| product-owner   | ✅/⚠️/🔴  | [2-3 líneas] |
| architect       | ✅/⚠️/🔴  | [2-3 líneas] |
| project-planner | ✅/⚠️/🔴  | [2-3 líneas] |
```

**Si cualquiera da 🔴 → corregir antes de cerrar.**

---

## 7.8 Architect Gating (Si Aplica)

### Triggers de Escalamiento

| Trigger                                 | Por qué escalar                           |
| --------------------------------------- | ----------------------------------------- |
| Multi-tenant / RBAC complejo            | Arquitectura significativamente diferente |
| Offline parcial/completo                | PWA + sync strategy                       |
| Integraciones críticas                  | Webhooks, idempotency, retries            |
| Reglas core con alto costo de reversión | Decisión de arquitectura temprana         |
| Timeline agresivo vs scope grande       | Tradeoffs necesarios                      |
| Compliance (GDPR, datos financieros)    | Security architecture                     |

---

## 7.9 Close Gate

> Solo se puede cerrar si:

- ✅ Structural self-check OK
- ✅ Source fidelity OK (sin unauthorized drift)
- ✅ Drift report sin drift material
- ✅ Internal consistency aceptable
- ✅ Challenge pass sin blockers
- ✅ Open Questions visibles y honestos
- ✅ Reconciliation refleja la prosa

**Si cualquier gate falla → NO proceder a Phase 8.**

---

_Phase 7 Complete → Continuar a CHECKPOINT 2_
