# Phase 5: Validation (Drift/Gap Analysis)

> **Carga:** Después de generar todos los docs (02-14)
>
> 🔴 **CRÍTICO:** Este análisis es OBLIGATORIO antes de cerrar.

---

## 5.0 Load Proposal (for coverage check)

> 📄 **Proposal se carga AQUÍ** (no en Phase 1) para mantener contexto ligero durante generación.

// turbo

```bash
cat ./docs/planning/01_PROPOSAL.md 2>/dev/null || echo "⚠️ No 01_PROPOSAL.md — coverage check vs Proposal skipped"
```

---

## 9.1 Self-Validation (Checklist Mecánica)

> 📝 Discovery Brief se cargó en Phase 1, Proposal en §5.0, y docs 02-14 se generaron en Phase 3-4.
> **NO recargar** — solo verificar estructura.

**Checklist (el agente valida TODO):**

- Todos los docs 02-14 existen y no están vacíos
- Cada doc tiene secciones: Open Questions, Assumptions
- Cada doc tiene IDs válidos (FT/P/US/BR/E/ADR-XXX)
- No hay placeholders (`{...}`, `[TODO]`, `TBD`)
- Cross-references entre docs son consistentes
- Metadata block presente en cada doc (proyecto, fuente, SSOT)

// turbo

```bash
echo "🔍 Self-Validation: Docs 02-14..."
for i in 02 03 04 05 06 07 08 09 10 11 12 13 14; do
  f=$(ls ./docs/planning/${i}_*.md 2>/dev/null | head -1)
  if [ -n "$f" ]; then
    lines=$(wc -l < "$f")
    oq=$(grep -q "## Open Questions" "$f" && echo "✅" || echo "❌")
    ids=$(grep -qE "(P|US|BR|E|FT|ADR)-[0-9]{3}" "$f" && echo "✅" || echo "⚠️")
    placeholders=$(grep -cE '\{[A-Z_]+\}|\[TODO\]|TBD' "$f" 2>/dev/null || echo "0")
    echo "$oq OQ | $ids IDs | 📏${lines}L | 📎${placeholders} placeholders | $(basename $f)"
  else
    echo "❌ ${i}_*.md — NO ENCONTRADO"
  fi
done
```

### Namespace Consistency Check

// turbo

```bash
echo "🔍 Namespace Consistency Check..."
RN_COUNT=$(grep -rohE 'RN-[0-9]+' docs/planning/*.md 2>/dev/null | sort -u | wc -l | tr -d ' ')
BR_COUNT=$(grep -rohE 'BR-[0-9]+' docs/planning/*.md 2>/dev/null | sort -u | wc -l | tr -d ' ')
if [ "$RN_COUNT" -gt 0 ] && [ "$BR_COUNT" -gt 0 ]; then
  echo "🔴 NAMESPACE DRIFT: $RN_COUNT RN-IDs + $BR_COUNT BR-IDs mezclados"
  echo "   → Migrar todo a BR-XXX (estándar del sistema)"
  echo "   IDs con RN-:"
  grep -rohE 'RN-[0-9]+' docs/planning/*.md 2>/dev/null | sort -u
elif [ "$RN_COUNT" -gt 0 ]; then
  echo "⚠️ Usando RN- namespace (no estándar). El sistema usa BR-XXX"
  echo "   → Migrar a BR-XXX antes de continuar"
else
  echo "✅ Namespace consistente (BR-XXX)"
fi
```

> 🛑 **GATE:** Si NAMESPACE DRIFT detectado → corregir IDs antes de continuar.

> 🛑 **GATE:** Si falta algún doc 02-14 → volver a Phase 2-8 (generation) y completar.

---

## 9.1.5 Source Reconciliation Check (Brief → Docs)

> 🔴 **MANDATORY — Verificar reconciliación 1:1 contra el Brief.**
>
> Este paso previene el caso real: Brief lista 8 entidades pero docs solo generaron 5.

**Tabla 1: Entidades (Brief §3.1/§4.1 → E-XXX en 06_DATA_MODEL)**

| #   | Entidad Brief       | Brief §ref | E-XXX en 06 | Status |
| --- | ------------------- | ---------- | ----------- | ------ |
| 1   | [entidad del Brief] | §3.1/§4.1  | E-001       | ✅/❌  |

**Tabla 2: Features (Brief §3 MVP → FT-XXX en 02_FEATURE_MAP)**

| #   | Feature Brief §3    | Criticidad | FT-XXX en 02 | Status |
| --- | ------------------- | ---------- | ------------ | ------ |
| 1   | [feature del Brief] | MVP/Post   | FT-001       | ✅/❌  |

**Tabla 3: Reglas de Negocio (Brief §6 → BR-XXX en 05_BUSINESS_RULES)**

| #   | Regla Brief §6    | BR-XXX en 05 | Status |
| --- | ----------------- | ------------ | ------ |
| 1   | [regla del Brief] | BR-001       | ✅/❌  |

**Tabla 4: Pantallas (Brief §7.2 → anotada para 15_DESIGN)**

| #   | Pantalla Brief §7.2  | Referenciada en docs | Anotada para 15_DESIGN | Status |
| --- | -------------------- | -------------------- | ---------------------- | ------ |
| 1   | [pantalla del Brief] | 04_USER_STORIES      | ✅/❌                  |        |

**🛑 GATE:** Si CUALQUIER item tiene Status ❌ sin justificación explícita → **STOP**.
Resolver antes de continuar a multi-agent review.

---

## 9.2 Multi-Agent Deep Review (MANDATORY)

> 🤖 **SIEMPRE ejecutar** — Multi-agent validation para cobertura profunda.
>
> 🔴 **HARD GATE — NO CONTINUAR SIN EJECUTAR**

### Perspectivas (5 agentes)

| Agente                 | Dominio                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| `documentation-writer` | Estructura, cross-refs, IDs, formato, naming conventions           |
| `architect`            | Coherencia DATA_MODEL↔ARCHITECTURE↔API_CONTRACTS, ADRs, viabilidad |
| `backend-specialist`   | Server actions, RBAC, schema Drizzle, relaciones, I/O types        |
| `project-planner`      | SSOT chain, cobertura FT→US, scope preservation, prioridades       |
| `product-owner`        | Valor de negocio, features MVP cubiertos, SK leverage              |

### Enfoque de Revisión Exhaustiva

> 🎯 **NO usar checklists predefinidos.** Cada perspectiva debe realizar una revisión exhaustiva enfocada en:

1. **Completitud** — ¿Cubre todos los requisitos del Discovery Brief y Proposal?
2. **Coherencia** — ¿Hay contradicciones internas o entre docs (02-14)?
3. **Fidelidad** — ¿Se apega fielmente al Discovery/Proposal sin inventar requisitos?
4. **Calidad** — ¿Hay errores, ambigüedades, o información incompleta?
5. **Oportunidades** — ¿Hay mejoras que agilicen el desarrollo sin agregar scope?
6. **Ruido** — ¿Hay elementos innecesarios o redundantes que quitar?
7. **Reconciliación vs Brief** — Verificar 1:1 que CADA entidad de §3.1, CADA regla de §6, y CADA pantalla de §7.2 tiene su correspondiente elemento en los docs generados. NO aprobar si falta alguno sin justificación explícita.

### Docs a Consultar

- `docs/planning/00_DISCOVERY_BRIEF.md` (source of truth)
- `docs/planning/01_PROPOSAL.md` (scope aprobado)
- `docs/planning/02_FEATURE_MAP.md` → `14_TRACEABILITY.md` (todos los docs 02-14)
- `docs/planning/project-config.md` (config del proyecto)
- `docs/reference/features.md` (features del SK — evitar duplicar)

### Output Esperado

> 🔴 **CADA perspectiva DEBE incluir resumen de 2-3 líneas con hallazgos específicos.**
> NO dejar "..." ni resúmenes genéricos como "todo bien".

| Perspectiva          | Veredicto | Resumen (OBLIGATORIO: hallazgos específicos) |
| -------------------- | --------- | -------------------------------------------- |
| documentation-writer | ✅/🔴     | [2-3 líneas con hallazgos concretos]         |
| architect            | ✅/🔴     | [2-3 líneas con hallazgos concretos]         |
| backend-specialist   | ✅/🔴     | [2-3 líneas con hallazgos concretos]         |
| project-planner      | ✅/🔴     | [2-3 líneas con hallazgos concretos]         |
| product-owner        | ✅/🔴     | [2-3 líneas con hallazgos concretos]         |

**Veredicto global:** PASS solo si TODAS las perspectivas son PASS.

### 9.2.1 Evaluar Resultado

**Si veredicto = PASS:**
→ Continuar directamente a 9.3

**Si gaps o drift detectados:**

```markdown
## ⚠️ Multi-Agent Validation: Issues Detectados

| Agent | Perspectiva | Issues Encontrados |
| ----- | ----------- | ------------------ |
| ...   | ...         | ...                |

**Opciones:**

| #   | Opción        | Acción                                         |
| --- | ------------- | ---------------------------------------------- |
| 1   | **corregir**  | Volver a generation, aplicar fixes, re-validar |
| 2   | **continuar** | Aceptar gaps, documentar en reporte            |
| 3   | **cancelar**  | Abortar workflow                               |

🛑 **Esperar decisión del usuario antes de CHECKPOINT 3**
```

**ACTION:** Call `notify_user` with `BlockedOnUser: true`

**Si gaps 🔴 Critical en §3 (Features MVP):**

> 🔴 **HARD STOP — Features MVP faltantes = Scope Recortado**
> NO continuar a CHECKPOINT 3 sin aprobación explícita del usuario.

### 9.2.2 Ciclo de Corrección (si usuario elige "corregir")

1. Aplicar los fixes identificados en los docs afectados
2. Actualizar el reporte de validación:
   - Cada gap corregido → marcar como `✅ Corregido`
   - Agregar sección `## Correcciones Aplicadas` con fecha y detalle
3. Volver a mostrar CHECKPOINT 3 con reporte actualizado

> 🔴 **NO crear un reporte nuevo** — actualizar el existente.

---

## 9.3 Generar Reporte de Validación

> 🔴 **MANDATORY ARTIFACT — El agente DEBE crear este archivo**

// turbo

```bash
mkdir -p docs/reports
echo "📁 Directorio docs/reports/ listo"
```

**Guardar reporte en:**

```
docs/reports/validation_docs_{VERSION}_{DATE}.md
```

Ejemplo: `docs/reports/validation_docs_v1.0_2026-02-09.md`

**EL AGENTE DEBE:**

1. Crear el archivo usando `write_to_file` tool
2. Llenar TODAS las secciones del template (no placeholders)
3. Mostrar al usuario: `📄 Reporte guardado en: docs/reports/validation_docs_*.md`

**Template:**

```markdown
# Validation Report: Docs {VERSION}

> **Date:** {DATE}
> **Validated by:** AI Agent (Multi-Agent — 5 perspectives)
> **Status:** ✅ PASS / 🔴 FAIL

## 📊 Coverage Summary

| Sección Discovery | Items | Covered | Coverage |
| ----------------- | ----- | ------- | -------- |
| §1 (Idea)         | X     | Y       | Z%       |
| §2 (Usuarios)     | X     | Y       | Z%       |
| §3 (Features)     | X     | Y       | Z%       |
| §5 (Reglas)       | X     | Y       | Z%       |
| §6 (Datos)        | X     | Y       | Z%       |
| Proposal MVP      | X     | Y       | Z%       |

## 🤖 Veredictos por Perspectiva

| Perspectiva          | Veredicto | Resumen (OBLIGATORIO: hallazgos específicos) |
| -------------------- | --------- | -------------------------------------------- |
| documentation-writer | ✅/🔴     | [2-3 líneas con hallazgos concretos]         |
| architect            | ✅/🔴     | [2-3 líneas con hallazgos concretos]         |
| backend-specialist   | ✅/🔴     | [2-3 líneas con hallazgos concretos]         |
| project-planner      | ✅/🔴     | [2-3 líneas con hallazgos concretos]         |
| product-owner        | ✅/🔴     | [2-3 líneas con hallazgos concretos]         |

## ❌ Gaps

| #   | Fuente | Sección | Elemento | Falta en Doc | Severidad | Status          |
| --- | ------ | ------- | -------- | ------------ | --------- | --------------- |
| 1   | ...    | ...     | ...      | ...          | 🔴/🟡     | ❌/✅ Corregido |

## 🔄 Drift

| #   | Fuente | Dice | Doc dice | Status          |
| --- | ------ | ---- | -------- | --------------- |
| 1   | ...    | ...  | ...      | ❌/✅ Corregido |

## 🏗️ SK Leverage Check

| Feature del SK | ¿Docs lo referencian? | Status |
| -------------- | --------------------- | ------ |
| ...            | ✅/❌                 | ...    |

## Correcciones Aplicadas

<!-- Completar si se ejecutó ciclo de corrección -->

| Fecha | Gap/Drift | Fix Aplicado |
| ----- | --------- | ------------ |

## 🎯 Verdict

[PASS/FAIL with justification]
```

---

## 9.4 Artifact Gate (MANDATORY)

> 🔴 **Verificar que el reporte existe antes de continuar a CHECKPOINT 3.**

// turbo

```bash
ls docs/reports/validation_docs_*.md 2>/dev/null && echo "✅ Artifact de validación existe" || echo "🔴 FALTA ARTIFACT — volver a 9.3 y generarlo"
```

> 🔴 **SI NO EXISTE ARTIFACT:**
>
> 1. STOP
> 2. Volver a Phase 9.3
> 3. Generar el archivo
> 4. Solo entonces mostrar CHECKPOINT 3

---

_Validation Complete → Ir a CHECKPOINT 3_
