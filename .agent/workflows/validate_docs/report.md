# Phase: Report Generation

> **Propósito:** Consolidar hallazgos de todas las fases en un reporte único.
>
> 🔴 **MANDATORY ARTIFACT — El agente DEBE crear este archivo.**

---

## Generar Reporte

// turbo

```bash
mkdir -p docs/reports
echo "📁 Directorio docs/reports/ listo"
```

**Guardar reporte en:**

```
docs/reports/validate_docs_{STAGE}_{TIER}_{DATE}.md
```

Ejemplo: `docs/reports/validate_docs_post-backlog_V2_2026-02-14.md`

**EL AGENTE DEBE:**

1. Crear el archivo usando `write_to_file` tool
2. Llenar TODAS las secciones — no dejar placeholders
3. Mostrar al usuario: `📄 Reporte guardado en: docs/reports/validate_docs_*.md`

---

## Template de Reporte

```markdown
# Document Validation Report

> **Date:** {DATE}
> **Stage:** {STAGE} (post-discovery | post-proposal | post-docs | post-design | post-backlog)
> **Tier:** {TIER} (V1 | V2 | V3)
> **Status:** ✅ PASS / 🔴 FAIL
> **Validated by:** AI Agent

---

## 📊 Executive Summary

[2-3 líneas: ¿Los docs están alineados? ¿Hay gaps críticos? ¿Es construible?]

## 📋 V1: Pipeline Alignment

### Coverage por Stage

| Stage          | Checks | Passed | Failed | Gaps | Drift |
| -------------- | :----: | :----: | :----: | :--: | :---: |
| post-discovery |   N    |   N    |   N    |  N   |   N   |
| post-proposal  |   N    |   N    |   N    |  N   |   N   |
| post-docs      |   N    |   N    |   N    |  N   |   N   |
| post-design    |   N    |   N    |   N    |  N   |   N   |
| post-backlog   |   N    |   N    |   N    |  N   |   N   |

### Gaps Encontrados

| #   | Fuente | Elemento | Debería estar en | Severidad | Status |
| --- | ------ | -------- | ---------------- | :-------: | :----: |
| 1   | ...    | ...      | ...              |   🔴/🟡   |   ❌   |

### Drift Encontrado

| #   | Fuente dice | Doc dice | Doc afectado | Severidad | Status |
| --- | ----------- | -------- | ------------ | :-------: | :----: |
| 1   | ...         | ...      | ...          |   🔴/🟡   |   ❌   |

## 🔍 V2: Semantic Fidelity (si aplica)

### Matriz de Fidelidad

| Par              |  P1   | P2  | P3  | P4  | P5  | P6  | P7  |
| ---------------- | :---: | :-: | :-: | :-: | :-: | :-: | :-: |
| Brief → Proposal | ✅/🔴 | ... | ... | ... | ... | ... | ... |
| Brief → Docs     |  ...  | ... | ... | ... | ... | ... | ... |
| All → Design     |  ...  | ... | ... | ... | ... | ... | ... |
| All → Backlog    |  ...  | ... | ... | ... | ... | ... | ... |

> P1=Intención, P2=Implícitos, P3=Creep, P4=Prioridad, P5=Construible, P6=Terminología, P7=SK

### Hallazgos Semánticos

[Lista de hallazgos con citas textuales de upstream vs downstream]

## 🏗️ V3: Post-Implementation (si aplica)

### Resumen

| Área                 | Passed | Failed | Status |
| -------------------- | :----: | :----: | :----: |
| Schema vs Data Model |   N    |   N    | ✅/🔴  |
| Actions vs API       |   N    |   N    | ✅/🔴  |
| BR vs Code           |   N    |   N    | ✅/🔴  |
| UI vs Design         |   N    |   N    | ✅/🔴  |
| Project Docs         |   N    |   N    | ✅/🔴  |

### Hallazgos Post-Implementation

[Lista de hallazgos con path de código + referencia a doc]

## 🎯 Verdict

**Pipeline Alignment (V1):** ✅ PASS / 🔴 FAIL
**Semantic Fidelity (V2):** ✅ PASS / 🔴 FAIL / ⏭️ Skipped
**Post-Implementation (V3):** ✅ PASS / 🔴 FAIL / ⏭️ Skipped

**Overall:** ✅ PASS / 🔴 FAIL

**Recomendaciones:**

1. [Lo más urgente de corregir]
2. [Segundo más urgente]
3. ...
```

---

## Artifact Gate (MANDATORY)

// turbo

```bash
ls docs/reports/validate_docs_*.md 2>/dev/null && echo "✅ Artifact de validación existe" || echo "🔴 FALTA ARTIFACT — volver a generarlo"
```

> 🔴 **SI NO EXISTE ARTIFACT:** STOP → Generar el archivo → Solo entonces completar.

---

## Presentar al Usuario

> 🔴 **OBLIGATORIO:** Mostrar resumen ejecutivo al usuario con `notify_user`.

**Incluir en el mensaje:**

1. Stage detectado y tier ejecutado
2. Veredicto global (PASS/FAIL)
3. Conteo de hallazgos por severidad (🔴 Critical / 🟡 Warning / 🔵 Info)
4. Top 3 hallazgos más importantes
5. Path al reporte completo

**ACTION:** Call `notify_user` with:

- `PathsToReview`: path al reporte generado
- `BlockedOnUser`: true si hay 🔴 Critical findings

---

_Validation Complete_
