---
description: Validate documentation pipeline alignment, semantic fidelity, and post-implementation consistency. Auto-detects pipeline stage.
---

# /validate_docs — Document Pipeline Validation

> Validación independiente de la cadena de documentación.
> Complementa (no reemplaza) las validaciones inline de cada workflow.
> Puede correr **async** en cualquier momento del pipeline.

---

## ⚠️ AGENT ENFORCEMENT RULES

> **IMPORTANTE:** El agente DEBE seguir estas reglas SIN EXCEPCIÓN.

1. **Este workflow es de SOLO LECTURA** — No modifica archivos, solo audita y reporta
2. **Auto-detectar stage del pipeline** — No asumir, verificar qué docs existen
3. **Leer documentos COMPLETOS vía `cat`** — TODOS los docs se cargan con el bloque `cat` obligatorio de Phase 1.5
4. **NO sustituir `cat` con lectura parcial** — `view_file` con rangos NO es sustituto. El `cat` garantiza lectura completa
5. **Hallazgos con evidencia** — Citar sección + contenido, no "hay inconsistencias"
6. **Reportar gaps como tablas** — No párrafos vagos

---

## Diferencia con `/audit`

| `/validate_docs`                     | `/audit`                              |
| ------------------------------------ | ------------------------------------- |
| **Documentación** del proyecto       | **Código** del proyecto               |
| Pipeline: Discovery → Backlog        | Código: lint, tests, security, bundle |
| "¿Los docs son fieles al Discovery?" | "¿El código funciona y es seguro?"    |
| Corre durante o después de docs      | Corre después de implementar          |

---

## Phase 0: Auto-Detect Pipeline Stage

// turbo

```bash
echo "🔍 Detecting pipeline stage..."
STAGE="none"

if ls ./docs/backlog/*/epics/*.md 1>/dev/null 2>&1; then
  STAGE="post-backlog"
  echo "📂 Stage: POST-BACKLOG (full pipeline)"
elif [ -f "./docs/planning/15_DESIGN.md" ]; then
  STAGE="post-design"
  echo "📂 Stage: POST-DESIGN (Discovery → Proposal → Docs → Design)"
elif [ -f "./docs/planning/06_DATA_MODEL.md" ]; then
  STAGE="post-docs"
  echo "📂 Stage: POST-DOCS (Discovery → Proposal → Docs)"
elif [ -f "./docs/planning/01_PROPOSAL.md" ]; then
  STAGE="post-proposal"
  echo "📂 Stage: POST-PROPOSAL (Discovery → Proposal)"
elif [ -f "./docs/planning/00_DISCOVERY_BRIEF.md" ]; then
  STAGE="post-discovery"
  echo "📂 Stage: POST-DISCOVERY (solo Brief)"
else
  echo "🔴 No docs found in docs/planning/. Nothing to validate."
fi

echo ""
echo "📋 Docs encontrados:"
ls ./docs/planning/*.md 2>/dev/null | while read f; do echo "  ✅ $(basename $f)"; done
[ -d "./docs/backlog" ] && echo "  ✅ docs/backlog/ ($(ls ./docs/backlog/*/issues/*.md 2>/dev/null | wc -l | tr -d ' ') issues)"
```

---

## Phase 1: Tier Selection

// turbo

```bash
cat ./.agent/workflows/validate_docs/tier-selection.md
```

// turbo

```bash
cat ./.agent/workflows/_shared/checkpoint-transparency.md
```

**🛑 CHECKPOINT: Esperar selección de tier (1-3) o usar shortcut**

---

## Phase 1.5: Load ALL Planning Docs

> 🔴 **MANDATORY — Sin esto la validación NO tiene valor.**

// turbo

```bash
cat ./.agent/workflows/validate_docs/load-docs.md
```

> Ejecutar el bloque `cat` de `load-docs.md` ANTES de cualquier validación.
> **🛑 NO CONTINUAR sin haber ejecutado los `cat` de todos los docs.**

---

## Phase 2: Execute Validation

> Cargar fases según tier.

### V1 (Pipeline Alignment):

// turbo

```bash
cat ./.agent/workflows/validate_docs/pipeline-alignment.md
```

### V2 (V1 + Semantic Fidelity):

// turbo

```bash
cat ./.agent/workflows/validate_docs/pipeline-alignment.md
cat ./.agent/workflows/validate_docs/semantic-fidelity.md
```

### V3 (V2 + Post-Implementation):

// turbo

```bash
cat ./.agent/workflows/validate_docs/pipeline-alignment.md
cat ./.agent/workflows/validate_docs/semantic-fidelity.md
cat ./.agent/workflows/validate_docs/post-implementation.md
```

---

## Phase 3: Report

// turbo

```bash
cat ./.agent/workflows/validate_docs/report.md
```

---

## Shortcuts

```bash
/validate_docs        # Interactive tier selection
/validate_docs V1     # Pipeline alignment only
/validate_docs V2     # V1 + semantic fidelity
/validate_docs V3     # Full validation (V2 + code vs docs)
```

---

## Gates/Escalation

| Trigger                  | Acción                                |
| ------------------------ | ------------------------------------- |
| Brief no existe          | 🔴 STOP — Correr `/discovery` primero |
| Gap crítico en MVP scope | 🔴 BLOCKER — Notificar usuario        |
| Drift > 30% scope        | ⚠️ Escalar a product-owner            |
| Contradicción técnica    | ⚠️ Escalar a architect                |

---

_TimeKast Factory — Document Validation Workflow_
