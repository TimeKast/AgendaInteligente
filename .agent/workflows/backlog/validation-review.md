# Phase 7b: Validation - Multi-Perspective Review

> **Carga:** Después de validation-structural.md
> **Solo full mode.** En add mode → usar validation-lite.md.
>
> 🔍 **OBLIGATORIO** — Revisión multi-perspectiva del backlog generado.

---

## 7b.1 Multi-Perspective Deep Review (MANDATORY)

> 🔍 **SIEMPRE ejecutar** — Revisión desde 7 perspectivas especializadas para cobertura profunda.
> Nota: Es un solo modelo revisando desde 7 ángulos distintos, no 7 agentes independientes.
>
> 🔴 **HARD GATE — NO CONTINUAR SIN EJECUTAR**

### Perspectivas (7 lentes)

| Agente                 | Dominio                                                                         |
| ---------------------- | ------------------------------------------------------------------------------- |
| `project-planner`      | US↔Issue coverage, SSOT chain, priorización P0 first, 14_TRACEABILITY completa  |
| `architect`            | Decisiones de 07_ARCHITECTURE con issues, ADRs pendientes, stack coherente      |
| `backend-specialist`   | E↔CRUD issues, API actions implementadas, server actions definidos              |
| `frontend-specialist`  | SCR↔Issue coverage, FLW cubiertos, CMP nuevos con issue                         |
| `security-auditor`     | Auth, RBAC, validaciones con issues dedicados, riesgos mitigados                |
| `documentation-writer` | Doc references correctas, Gherkin español, naming ↔ GLOSSARY                    |
| `product-owner`        | Priorización MVP, valor por issue, features Discovery §3 cubiertos, SK leverage |

### Enfoque de Revisión

> 🎯 **NO usar checklists predefinidos.** Cada perspectiva revisa:

1. **Completitud** — ¿Todas las US/SCR/E/FLW/API tienen issue?
2. **Coherencia** — ¿Hay contradicciones con docs (00-15)?
3. **Fidelidad** — ¿Se apega fielmente al Discovery/Proposal?
4. **Calidad** — ¿Hay errores, ambigüedades, placeholders?
5. **Oportunidades** — ¿Mejoras sin agregar scope?
6. **Ruido** — ¿Elementos innecesarios o redundantes?
7. **Reconciliación Brief** — CADA entidad §3.1, CADA feature §3, CADA pantalla §7.2

### Docs a Consultar

- `docs/planning/00_DISCOVERY_BRIEF.md` → `15_DESIGN.md` (todos)
- `docs/backlog/M{N}/epics/*.md` y `issues/*.md`
- `docs/planning/project-config.md`
- `docs/reference/features.md` (SK — evitar duplicar)

### Output Esperado

> 🔴 CADA perspectiva DEBE incluir resumen de 2-3 líneas con hallazgos específicos.

| Perspectiva          | Veredicto | Resumen (OBLIGATORIO: hallazgos específicos) |
| -------------------- | --------- | -------------------------------------------- |
| project-planner      | ✅/🔴     | [2-3 líneas con hallazgos concretos]         |
| architect            | ✅/🔴     | [2-3 líneas con hallazgos concretos]         |
| backend-specialist   | ✅/🔴     | [2-3 líneas con hallazgos concretos]         |
| frontend-specialist  | ✅/🔴     | [2-3 líneas con hallazgos concretos]         |
| security-auditor     | ✅/🔴     | [2-3 líneas con hallazgos concretos]         |
| documentation-writer | ✅/🔴     | [2-3 líneas con hallazgos concretos]         |
| product-owner        | ✅/🔴     | [2-3 líneas con hallazgos concretos]         |

**Veredicto global:** PASS solo si TODAS son PASS.

### 7b.1.1 Evaluar Resultado

**Si PASS → continuar a 7b.2**

**Si gaps detectados:**

```markdown
## ⚠️ Multi-Perspective Review: Issues Detectados

| Agent | Issues Encontrados |
| ----- | ------------------ |

**Opciones:**

| #   | Opción        | Acción                   |
| --- | ------------- | ------------------------ |
| 1   | **corregir**  | Crear issues faltantes   |
| 2   | **continuar** | Aceptar gaps, documentar |
| 3   | **cancelar**  | Abortar                  |
```

**ACTION:** Call `notify_user` with `BlockedOnUser: true`

### 7b.1.2 Ciclo de Corrección

1. Crear issues faltantes o corregir existentes
2. Actualizar reporte (no crear nuevo)
3. Volver a CHECKPOINT 3

---

## 7b.2 Generar Reporte de Validación

> 🔴 **MANDATORY ARTIFACT**

// turbo

```bash
mkdir -p docs/reports
echo "📁 Directorio docs/reports/ listo"
```

**Guardar en:** `docs/reports/validation_backlog_M{N}_{DATE}.md`

**Template:**

```markdown
# Validation Report: Backlog M{N}

> **Date:** {DATE}
> **Validated by:** AI Agent (Multi-Perspective — 7 lenses)
> **Status:** ✅ PASS / 🔴 FAIL

## 📊 Coverage Summary

| Dimensión   | Items | Covered | Coverage |
| ----------- | ----- | ------- | -------- |
| US → Issue  | X     | Y       | Z%       |
| E → CRUD    | X     | Y       | Z%       |
| SCR → Issue | X     | Y       | Z%       |
| FLW → Issue | X     | Y       | Z%       |
| API → Issue | X     | Y       | Z%       |
| BR → Issue  | X     | Y       | Z%       |

## 📎 Traceability

| Metric                | Value |
| --------------------- | ----- |
| US en 04_USER_STORIES | X     |
| US en 14_TRACEABILITY | Y     |
| Cobertura             | Z%    |

## 🔍 Veredictos por Perspectiva

| Perspectiva          | Veredicto | Resumen     |
| -------------------- | --------- | ----------- |
| project-planner      | ✅/🔴     | [hallazgos] |
| architect            | ✅/🔴     | [hallazgos] |
| backend-specialist   | ✅/🔴     | [hallazgos] |
| frontend-specialist  | ✅/🔴     | [hallazgos] |
| security-auditor     | ✅/🔴     | [hallazgos] |
| documentation-writer | ✅/🔴     | [hallazgos] |
| product-owner        | ✅/🔴     | [hallazgos] |

## 🏗️ SK Overlap Check

| Feature del SK | Issue que duplica | Acción |
| -------------- | ----------------- | ------ |

## ❌ Gaps

| #   | Doc | Elemento | Falta Issue | Severidad | Status |
| --- | --- | -------- | ----------- | --------- | ------ |

## 🔄 Drift

| #   | Fuente | Dice | Backlog dice | Status |
| --- | ------ | ---- | ------------ | ------ |

## Correcciones Aplicadas

| Fecha | Gap/Drift | Fix Aplicado |
| ----- | --------- | ------------ |

## 🎯 Verdict

[PASS/FAIL with justification]
```

---

## 7b.3 Artifact Gate (MANDATORY)

// turbo

```bash
ls docs/reports/validation_backlog_*.md 2>/dev/null && echo "✅ Artifact de validación existe" || echo "🔴 FALTA ARTIFACT — volver a 7b.2"
```

> 🔴 SI NO EXISTE → STOP → volver a 7b.2

---

_Validation Complete → Ir a CHECKPOINT 3_
