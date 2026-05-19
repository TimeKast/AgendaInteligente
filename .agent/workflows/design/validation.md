# Phase 5: Validation (Drift/Gap Analysis)

> **Carga:** Después de generation.md
>
> 🔍 **OBLIGATORIO** — Comparar design generado contra TODOS los docs anteriores (02-14).

---

## 4.1 Self-Validation (Checklist Mecánica)

> 📝 Los docs (00-14 + 15_DESIGN) ya están en contexto desde Phase 1-3.
> **NO recargar** — solo verificar estructura.

**Checklist Estructural (el agente valida TODO):**

- `15_DESIGN.md` existe y no está vacío
- Tiene secciones: Pantallas (SCR), Flujos (FLW), Componentes (CMP)
- Cada pantalla tiene: ID, wireframe, data requirements, estados
- No contiene placeholders (`{...}`, `[TODO]`, `TBD`)
- IDs SCR/FLW/CMP son secuenciales y únicos
- Cross-refs a US/P/E-XXX existen en docs anteriores

// turbo

```bash
echo "🔍 Self-Validation: 15_DESIGN.md..."
f="./docs/planning/15_DESIGN.md"
[ -f "$f" ] && echo "✅ Archivo existe" || echo "🔴 NO EXISTE — STOP"
[ -f "$f" ] && lines=$(wc -l < "$f") && echo "📏 $lines líneas" || true
[ -f "$f" ] && scr=$(grep -cE "^###? SCR-[0-9]+" "$f" 2>/dev/null || echo "0") && echo "📱 $scr pantallas (SCR)" || true
[ -f "$f" ] && flw=$(grep -cE "^###? FLW-[0-9]+" "$f" 2>/dev/null || echo "0") && echo "🔄 $flw flujos (FLW)" || true
[ -f "$f" ] && cmp=$(grep -cE "^###? CMP-[0-9]+" "$f" 2>/dev/null || echo "0") && echo "🧩 $cmp componentes (CMP)" || true
[ -f "$f" ] && placeholders=$(grep -cE '\{[A-Z_]+\}|\[TODO\]|TBD' "$f" 2>/dev/null || echo "0") && echo "📎 Placeholders: $placeholders" || true
```

> 🛑 **GATE:** Si falla checklist estructural → volver a Phase 3 (generation) y corregir.

---

## 4.1.5 Source Reconciliation Check (Brief/Docs → Design)

> 🔴 **MANDATORY — Verificar reconciliación 1:1 contra Brief y docs anteriores.**
>
> Este paso previene pantallas perdidas: Brief §7.2 lista N pantallas pero 15_DESIGN solo tiene N-2.

**Tabla 1: Pantallas (Brief §7.2 → SCR-XXX en 15_DESIGN)**

| #   | Pantalla Brief §7.2  | SCR-XXX en 15_DESIGN | Status |
| --- | -------------------- | -------------------- | ------ |
| 1   | [pantalla del Brief] | SCR-001              | ✅/❌  |

**Tabla 2: Features → Pantalla (02_FEATURE_MAP FT-XXX → SCR-XXX)**

| #   | Feature FT-XXX | Descripción | SCR-XXX asignada | Status |
| --- | -------------- | ----------- | ---------------- | ------ |
| 1   | FT-001         | [feature]   | SCR-001          | ✅/❌  |

**Tabla 3: Entidades → Data Requirements (06_DATA_MODEL E-XXX → pantalla que lo usa)**

| #   | Entidad E-XXX | Campos clave | Pantalla(s) que lo consume | Status |
| --- | ------------- | ------------ | -------------------------- | ------ |
| 1   | E-001         | [campos]     | SCR-001, SCR-003           | ✅/❌  |

**🛑 GATE:** Si CUALQUIER pantalla, feature o entidad tiene Status ❌ sin justificación explícita → **STOP**.
Resolver antes de continuar a multi-agent review.

---

## 4.2 Multi-Agent Deep Review (MANDATORY)

> 🤖 **SIEMPRE ejecutar** — Multi-agent validation para cobertura profunda.
>
> 🔴 **HARD GATE — NO CONTINUAR SIN EJECUTAR**

### Perspectivas (5 agentes)

| Agente                 | Dominio                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `layout-composer`      | US↔SCR coverage, estados UI, responsive, anti-patterns, touch targets   |
| `architect`            | Componentes SK vs nuevos, data requirements ↔ DATA_MODEL, offline-first |
| `security-auditor`     | RBAC en pantallas, validaciones BR visibles, datos sensibles            |
| `documentation-writer` | IDs SCR/FLW/CMP consistentes, cross-refs, naming ↔ GLOSSARY             |
| `product-owner`        | UX flows naturales, valor por pantalla, priorización MVP, SK leverage   |

### Enfoque de Revisión Exhaustiva

> 🎯 **NO usar checklists predefinidos.** Cada perspectiva debe realizar una revisión exhaustiva enfocada en:

1. **Completitud** — ¿Todas las US tienen pantalla (SCR)? ¿Personas tienen acceso correcto?
2. **Coherencia** — ¿Hay contradicciones con docs anteriores (02-14)?
3. **Fidelidad** — ¿Se apega fielmente al Discovery/Proposal sin inventar requisitos?
4. **Calidad** — ¿Hay errores, ambigüedades, o información incompleta?
5. **Oportunidades** — ¿Hay mejoras que agilicen el desarrollo sin agregar scope?
6. **Ruido** — ¿Hay elementos innecesarios o redundantes que quitar?
7. **Reconciliación vs Brief** — Verificar 1:1 que CADA pantalla de §7.2, CADA feature FT-XXX, y CADA entidad E-XXX tiene su correspondiente SCR-XXX y data requirements en 15_DESIGN. NO aprobar si falta alguno sin justificación explícita.

### Docs a Consultar

- `docs/planning/00_DISCOVERY_BRIEF.md` (source of truth)
- `docs/planning/01_PROPOSAL.md` → `14_TRACEABILITY.md` (todos los docs 01-14)
- `docs/planning/15_DESIGN.md` (output a validar)
- `docs/planning/project-config.md` (config del proyecto)
- `docs/reference/features.md` (features del SK)
- `docs/reference/INVENTORY.md` (Starter Kit existente)

### Output Esperado

> 🔴 **CADA perspectiva DEBE incluir resumen de 2-3 líneas con hallazgos específicos.**
> NO dejar "..." ni resúmenes genéricos como "todo bien".

| Perspectiva          | Veredicto | Resumen (OBLIGATORIO: hallazgos específicos) |
| -------------------- | --------- | -------------------------------------------- |
| layout-composer      | ✅/🔴     | [2-3 líneas con hallazgos concretos]         |
| architect            | ✅/🔴     | [2-3 líneas con hallazgos concretos]         |
| security-auditor     | ✅/🔴     | [2-3 líneas con hallazgos concretos]         |
| documentation-writer | ✅/🔴     | [2-3 líneas con hallazgos concretos]         |
| product-owner        | ✅/🔴     | [2-3 líneas con hallazgos concretos]         |

**Veredicto global:** PASS solo si TODAS las perspectivas son PASS.

### 4.2.1 Evaluar Resultado

**Si veredicto = PASS:**
→ Continuar directamente a 4.3

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

**Si gaps 🔴 Critical (US sin pantalla, persona sin acceso):**

> 🔴 **HARD STOP — NO continuar sin aprobación explícita del usuario.**

### 4.2.2 Ciclo de Corrección (si usuario elige "corregir")

1. Aplicar los fixes identificados en `15_DESIGN.md`
2. Actualizar el reporte de validación:
   - Cada gap corregido → marcar como `✅ Corregido`
   - Agregar sección `## Correcciones Aplicadas` con fecha y detalle
3. Volver a mostrar CHECKPOINT 3 con reporte actualizado

> 🔴 **NO crear un reporte nuevo** — actualizar el existente.

---

## 4.3 Generar Reporte de Validación

> 🔴 **MANDATORY ARTIFACT — El agente DEBE crear este archivo**

// turbo

```bash
mkdir -p docs/reports
echo "📁 Directorio docs/reports/ listo"
```

**Guardar reporte en:**

```
docs/reports/validation_design_{VERSION}_{DATE}.md
```

Ejemplo: `docs/reports/validation_design_v1.0_2026-02-09.md`

**EL AGENTE DEBE:**

1. Crear el archivo usando `write_to_file` tool
2. Llenar TODAS las secciones del template (no placeholders)
3. Mostrar al usuario: `📄 Reporte guardado en: docs/reports/validation_design_*.md`

**Template:**

```markdown
# Validation Report: Design {VERSION}

> **Date:** {DATE}
> **Validated by:** AI Agent (Multi-Agent — 5 perspectives)
> **Status:** ✅ PASS / 🔴 FAIL

## 📊 Coverage Summary

| Dimensión  | Items | Covered | Coverage |
| ---------- | ----- | ------- | -------- |
| US → SCR   | X     | Y       | Z%       |
| P → Acceso | X     | Y       | Z%       |
| FT → UI    | X     | Y       | Z%       |
| E → Data   | X     | Y       | Z%       |
| FLW → E2E  | X     | Y       | Z%       |

## 🤖 Veredictos por Perspectiva

| Perspectiva          | Veredicto | Resumen (OBLIGATORIO: hallazgos específicos) |
| -------------------- | --------- | -------------------------------------------- |
| layout-composer      | ✅/🔴     | [2-3 líneas con hallazgos concretos]         |
| architect            | ✅/🔴     | [2-3 líneas con hallazgos concretos]         |
| security-auditor     | ✅/🔴     | [2-3 líneas con hallazgos concretos]         |
| documentation-writer | ✅/🔴     | [2-3 líneas con hallazgos concretos]         |
| product-owner        | ✅/🔴     | [2-3 líneas con hallazgos concretos]         |

## 🧩 SK Components

| Componente | Status      | Uso |
| ---------- | ----------- | --- |
| DataTable  | SK Provided | ... |
| CMP-XXX    | New         | ... |

## ❌ Gaps

| #   | Doc | Elemento | Falta en Design | Severidad | Status          |
| --- | --- | -------- | --------------- | --------- | --------------- |
| 1   | ... | ...      | ...             | 🔴/🟡     | ❌/✅ Corregido |

## 🔄 Drift

| #   | Doc | Dice | Design dice | Status          |
| --- | --- | ---- | ----------- | --------------- |
| 1   | ... | ...  | ...         | ❌/✅ Corregido |

## 🏗️ SK Leverage Check

| Feature del SK | ¿Design lo usa? | Status |
| -------------- | --------------- | ------ |
| ...            | ✅/❌           | ...    |

## Correcciones Aplicadas

<!-- Completar si se ejecutó ciclo de corrección -->

| Fecha | Gap/Drift | Fix Aplicado |
| ----- | --------- | ------------ |

## 🎯 Verdict

[PASS/FAIL with justification]
```

---

## 4.4 Artifact Gate (MANDATORY)

> 🔴 **Verificar que el reporte existe antes de continuar a CHECKPOINT 3.**

// turbo

```bash
ls docs/reports/validation_design_*.md 2>/dev/null && echo "✅ Artifact de validación existe" || echo "🔴 FALTA ARTIFACT — volver a 4.3 y generarlo"
```

> 🔴 **SI NO EXISTE ARTIFACT:**
>
> 1. STOP
> 2. Volver a Phase 4.3
> 3. Generar el archivo
> 4. Solo entonces mostrar CHECKPOINT 3

---

## 5.X: Regenerate §10 Checklist (Post-Fix)

> 🔴 **OBLIGATORIO:** §10 se genera/regenera DESPUÉS de aplicar todos los
> fixes de validación. NUNCA como parte de Pasada 3.

**Regla:**

- Contar IDs reales con `grep` antes de escribir el checklist
- El count del texto DEBE coincidir con el count por grep
- Si hay discrepancia → fix inmediato

**§10 Checklist Pre-Backlog (generar/actualizar en 15_DESIGN.md):**

```markdown
## ✅ Checklist Pre-Backlog

- [ ] TODAS las pantallas del MVP mapeadas (SCR-XXX)
- [ ] FT-XXX cross-ref por pantalla en §1
- [ ] Mínimo 3 flujos con Mermaid (FLW-XXX)
- [ ] Estados por pantalla (loading, empty, error, data)
- [ ] Interaction states por componente interactivo en §4
- [ ] Componentes SK identificados por pantalla
- [ ] Componentes nuevos listados (CMP-XXX)
- [ ] Cross-references P-XXX, US-XXX, BR-XXX, E-XXX, FT-XXX
- [ ] WCAG contrast ratios documentados en §0
- [ ] Motion durations en ms documentados en §0
- [ ] Design tokens validados contra SK/project-config
- [ ] §5.0 Cache model + mutation lifecycle documentado
- [ ] DD Data Impact documentado para decisiones que afectan data
- [ ] OQ heredadas de Brief §7 + clasificación arch/product/cosmetic
- [ ] §8.2 Deferred to Backlog documentado
```

**Verificación automática:**

// turbo

```bash
f="./docs/planning/15_DESIGN.md"
echo "=== §10 Count Verification ==="
SCR=$(grep -cE '^###? SCR-[0-9]+' "$f" 2>/dev/null || echo "0")
FLW=$(grep -cE '^###? FLW-[0-9]+' "$f" 2>/dev/null || echo "0")
CMP=$(grep -cE '^\| CMP-[0-9]+' "$f" 2>/dev/null || echo "0")
DD=$(grep -cE '^\| DD-[0-9]+' "$f" 2>/dev/null || echo "0")
OQ=$(grep -cE '^\| OQ-[0-9]+' "$f" 2>/dev/null || echo "0")
echo "SCR: $SCR | FLW: $FLW | CMP: $CMP | DD: $DD | OQ: $OQ"
```

---

_Validation Complete → Ir a CHECKPOINT 3_
