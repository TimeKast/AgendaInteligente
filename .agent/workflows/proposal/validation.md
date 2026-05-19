# Phase 4: Validation (Drift/Gap Analysis)

> **Carga:** Después de generation.md
>
> 🔍 **OBLIGATORIO** — Comparar PROPOSAL.md contra Discovery Brief.

---

## 3.1 Self-Validation (Checklist Mecánica)

> 📝 Los docs (00_DISCOVERY_BRIEF + 01_PROPOSAL) ya están en contexto desde Phase 1-2.
> **NO recargar** — solo verificar estructura.

**Checklist (el agente valida TODO):**

- `01_PROPOSAL.md` existe y no está vacío
- Tiene todas las secciones requeridas del template (Resumen, Objetivos, Solución, Usuarios, Alcance, Timeline, Supuestos)
- No contiene placeholders (`{...}`, `[TODO]`, `TBD`)
- Metadata block presente (proyecto, versión, fecha)
- Timeline tiene fechas o duración coherente
- Alcance MVP y Post-MVP están claramente separados

// turbo

```bash
echo "🔍 Self-Validation: 01_PROPOSAL.md..."
f="./docs/planning/01_PROPOSAL.md"
[ -f "$f" ] && echo "✅ Archivo existe" || echo "🔴 NO EXISTE — STOP"
[ -f "$f" ] && lines=$(wc -l < "$f") && echo "📏 $lines líneas" || true
[ -f "$f" ] && placeholders=$(grep -cE '\{[A-Z_]+\}|\[TODO\]|TBD' "$f" 2>/dev/null || echo "0") && echo "📎 Placeholders: $placeholders" || true
```

> 🛑 **GATE:** Si falla cualquier check mecánico → volver a Phase 2 (generation) y corregir.

---

## 3.1.5 Source Reconciliation Check (Brief → Proposal)

> 🔴 **MANDATORY — Verificar que la Proposal cubre TODO el Brief §3.**

**Tabla 1: Features MVP (Brief §3 MVP → Proposal Alcance MVP)**

| #   | Feature Brief §3 (MVP) | ¿En Proposal Alcance MVP? | Status |
| --- | ---------------------- | ------------------------- | ------ |
| 1   | [feature del Brief]    | ✅/❌                     |        |

> Listar CADA feature marcada como MVP en el Brief §3 y verificar que aparece en Proposal §6 "Incluye".

**Tabla 2: Features para Fases Posteriores (Brief §3.6 → Proposal Evolución Planificada)**

| #   | Feature Brief §3.6 (Posterior) | ¿En Proposal "Evolución Planificada"? | Status |
| --- | ------------------------------ | ------------------------------------- | ------ |
| 1   | [feature posterior]            | ✅/❌                                 |        |

> Listar CADA feature posterior en Brief §3.6 y verificar que aparece en Proposal §6 "Evolución Planificada".

**🛑 GATE:** Si un feature MVP del Brief falta en Proposal → **STOP**. Agregar antes de continuar.

> ⚠️ Si la Proposal decide mover algo de MVP a Post-MVP deliberadamente, debe documentarse
> como decisión explícita en §7 "Supuestos y Decisiones Pendientes".

---

## 3.2 Multi-Agent Deep Review (MANDATORY)

> 🤖 **SIEMPRE ejecutar** — Multi-agent validation para cobertura profunda.
>
> 🔴 **HARD GATE — NO CONTINUAR SIN EJECUTAR**

### Perspectivas (5 agentes)

| Agente             | Dominio                                                                    |
| ------------------ | -------------------------------------------------------------------------- |
| `project-planner`  | Timeline, fases, dependencias, priorización MVP                            |
| `architect`        | Viabilidad técnica, stack, riesgos de arquitectura, aprovechamiento del SK |
| `security-auditor` | Requisitos de seguridad, RBAC, gaps de compliance                          |
| `product-owner`    | Valor de negocio, scope vs problema real, UX coherente                     |
| `skeptical-client` | Claridad de lenguaje, ataque a pain points, credibilidad, ROI implícito    |

### Enfoque de Revisión Exhaustiva

> 🎯 **NO usar checklists predefinidos.** Cada perspectiva debe realizar una revisión exhaustiva enfocada en:

1. **Completitud** — ¿Cubre todos los requisitos del Discovery Brief?
2. **Coherencia** — ¿Hay contradicciones internas o con docs anteriores?
3. **Fidelidad** — ¿Se apega fielmente al Discovery sin inventar requisitos?
4. **Calidad** — ¿Hay errores, ambigüedades, o información incompleta?
5. **Oportunidades** — ¿Hay mejoras que agilicen el desarrollo sin agregar scope?
6. **Ruido** — ¿Hay elementos innecesarios o redundantes que quitar?
7. **Reconciliación vs Brief** — ¿Todos los features MVP del Brief §3 están reflejados en la Proposal? ¿Las exclusiones coinciden?

### Docs a Consultar

- `docs/planning/00_DISCOVERY_BRIEF.md` (source of truth)
- `docs/planning/01_PROPOSAL.md` (output a validar)
- `docs/planning/project-config.md` (config del proyecto)
- `docs/reference/features.md` (features del SK — evitar duplicar)

### Output Esperado

> 🔴 **CADA perspectiva DEBE incluir resumen de 2-3 líneas con hallazgos específicos.**
> NO dejar "..." ni resúmenes genéricos como "todo bien".

| Perspectiva      | Veredicto | Resumen (OBLIGATORIO: hallazgos específicos)   |
| ---------------- | --------- | ---------------------------------------------- |
| project-planner  | ✅/🔴     | [2-3 líneas con hallazgos concretos]           |
| architect        | ✅/🔴     | [2-3 líneas con hallazgos concretos]           |
| security-auditor | ✅/🔴     | [2-3 líneas con hallazgos concretos]           |
| product-owner    | ✅/🔴     | [2-3 líneas con hallazgos concretos]           |
| skeptical-client | ✅/🔴     | [2-3 líneas: claridad, pain points, confianza] |

**Veredicto global:** PASS solo si TODAS las perspectivas son PASS.

### 3.2.1 Evaluar Resultado

**Si veredicto = PASS:**
→ Continuar directamente a 3.3

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

### 3.2.2 Ciclo de Corrección (si usuario elige "corregir")

1. Aplicar los fixes identificados en `01_PROPOSAL.md`
2. Actualizar el reporte de validación:
   - Cada gap corregido → marcar como `✅ Corregido`
   - Agregar sección `## Correcciones Aplicadas` con fecha y detalle
3. Volver a mostrar 3.3 (CHECKPOINT 3) con reporte actualizado

> 🔴 **NO crear un reporte nuevo** — actualizar el existente.

---

## 3.3 Generar Reporte de Validación

> 🔴 **MANDATORY ARTIFACT — El agente DEBE crear este archivo**

// turbo

```bash
mkdir -p docs/reports
echo "📁 Directorio docs/reports/ listo"
```

**Guardar reporte en:**

```
docs/reports/validation_proposal_{VERSION}_{DATE}.md
```

Ejemplo: `docs/reports/validation_proposal_v1.0_2026-02-09.md`

**EL AGENTE DEBE:**

1. Crear el archivo usando `write_to_file` tool
2. Llenar TODAS las secciones del template (no placeholders)
3. Mostrar al usuario: `📄 Reporte guardado en: docs/reports/validation_proposal_*.md`

**Template:**

```markdown
# Validation Report: Proposal {VERSION}

> **Date:** {DATE}
> **Validated by:** AI Agent (Multi-Agent — 4 perspectives)
> **Status:** ✅ PASS / 🔴 FAIL

## 📊 Coverage Summary

| Sección Discovery  | Cobertura | Status |
| ------------------ | --------- | ------ |
| §1 (Idea)          | X%        | ✅/🔴  |
| §2 (Usuarios)      | Y%        | ✅/🔴  |
| §3 (Features)      | Z%        | ✅/🔴  |
| §4 (Restricciones) | W%        | ✅/🔴  |

## 🤖 Veredictos por Perspectiva

| Perspectiva      | Veredicto | Resumen (OBLIGATORIO: hallazgos específicos)   |
| ---------------- | --------- | ---------------------------------------------- |
| project-planner  | ✅/🔴     | [2-3 líneas con hallazgos concretos]           |
| architect        | ✅/🔴     | [2-3 líneas con hallazgos concretos]           |
| security-auditor | ✅/🔴     | [2-3 líneas con hallazgos concretos]           |
| product-owner    | ✅/🔴     | [2-3 líneas con hallazgos concretos]           |
| skeptical-client | ✅/🔴     | [2-3 líneas: claridad, pain points, confianza] |

## ❌ Gaps

| #   | Elemento del Discovery | Severidad | Status          |
| --- | ---------------------- | --------- | --------------- |
| 1   | ...                    | 🔴/🟡     | ❌/✅ Corregido |

## 🔄 Drift

| #   | Discovery dice | Proposal dice | Status          |
| --- | -------------- | ------------- | --------------- |
| 1   | ...            | ...           | ❌/✅ Corregido |

## 🏗️ SK Leverage Check

| Feature del SK | ¿Mencionado en Proposal? | Status |
| -------------- | ------------------------ | ------ |
| ...            | ✅/❌                    | ...    |

## Correcciones Aplicadas

<!-- Completar si se ejecutó ciclo de corrección -->

| Fecha | Gap/Drift | Fix Aplicado |
| ----- | --------- | ------------ |

## 🎯 Verdict

[PASS/FAIL with justification]
```

---

## 3.4 Artifact Gate (MANDATORY)

> 🔴 **Verificar que el reporte existe antes de continuar a CHECKPOINT 3.**

// turbo

```bash
ls docs/reports/validation_proposal_*.md 2>/dev/null && echo "✅ Artifact de validación existe" || echo "🔴 FALTA ARTIFACT — volver a 3.3 y generarlo"
```

> 🔴 **SI NO EXISTE ARTIFACT:**
>
> 1. STOP
> 2. Volver a Phase 3.3
> 3. Generar el archivo
> 4. Solo entonces mostrar CHECKPOINT 3

---

_Validation Complete → Ir a CHECKPOINT 3_
