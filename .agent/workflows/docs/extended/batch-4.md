# Batch 4: Architecture + Data Model (07 + 06)

> **Output:** 07_ARCHITECTURE, 06_DATA_MODEL
>
> **Depende de:** Batches 2-3 (04_USER_STORIES + 05_BUSINESS_RULES)
>
> ⚠️ **Orden crítico:** 07 se genera ANTES que 06 para que las ADRs
> informen decisiones del Data Model (ej: cardinalidad, jerarquías, SSOT patterns).

---

## Load Batch 4 Templates

// turbo

```bash
echo "📄 Loading Batch 4 templates..."
echo "⚠️ ORDEN: Generar 07_ARCHITECTURE PRIMERO, después 06_DATA_MODEL (ADRs informan schema)"
cat ./.agent/skills/roles/docs/07_ARCHITECTURE.template.md
cat ./.agent/skills/roles/docs/06_DATA_MODEL.template.md
```

## Load Architect Agent

> 🤖 **Cargar architect para decisiones técnicas de 07_ARCHITECTURE y 06_DATA_MODEL.**

// turbo

```bash
cat ./.agent/agents/architect.md
```

## Load DB Patterns

// turbo

```bash
# DB patterns para 06_DATA_MODEL (Drizzle, schema, migrations)
cat ./.agent/skills/domains/db/SKILL.md 2>/dev/null | head -100 || echo "No domains/db skill"
```

---

## Generar en este orden

1. **07_ARCHITECTURE** — Stack decisions y ADRs
   - ADR-XXX decisiones con opciones consideradas
   - Stack patterns: caching, auth, realtime
   - Cross-ref: ADR→US, ADR→BR
   - **🔴 ADR Generation Guard:**
     - Leer Brief Decision Registry (§ final del Brief). Para cada decisión "Firm" con `risk_if_wrong` High, crear un ADR documentando decisión, alternativas, y rationale.
     - Si Brief §4 describe relaciones de datos no triviales (cardinalidad, ownership, 1:N vs 1:1), crear ADR.
     - Cada ADR DEBE cross-referenciar la sección del Brief de donde se deriva.

2. **06_DATA_MODEL** — Derivar de 04_USER_STORIES + 05_BUSINESS_RULES + **07_ARCHITECTURE ADRs**
   - E-XXX entidades con campos, tipos, FK
   - Timestamps (createdAt, updatedAt)
   - Indexes para queries frecuentes
   - Cross-ref: E→US, E→BR
   - Verificar Entity Reconciliation (tabla de `_rules.md`)
   - **🔴 Respetar ADRs de 07:** Si un ADR define cardinalidad, jerarquía, o estructura (ej: "1 Pick → N PickSelectionDetail"), el schema DEBE reflejarlo.
   - **🔴 Brief fields check:** Verificar que campos derivados de Business Rules en §6 (ej: `is_main_block` para lockdown) existan como columnas.

---

## 🛑 Checkpoint Intermedio 4 + Cross-Validation (HARD GATE)

> ⚠️ **Antes de presentar el checkpoint, el agente DEBE ejecutar cross-validation silenciosa:**
>
> 1. **ADR ↔ Data Model:** Para cada ADR en 07 que afecta schema, verificar que 06 lo refleja
> 2. **Decision Registry → Docs:** Para cada decisión "Firm" del Brief, verificar que aparece en el doc correcto
> 3. **Brief §6 fields → 06 columns:** Verificar que campos de Business Rules mapean a columnas del Data Model
> 4. **Entity Reconciliation count:** Verificar que 06 cubre el mismo # de entidades que Brief §4.1
>
> **Si detecta inconsistencia → corregir el doc ANTES de presentar el checkpoint.**

**El agente DEBE mostrar vía `notify_user`:**

```markdown
## ✅ Batch 4 Completado (Architecture + Data Model)

**Architecture:** ADR-001 → ADR-XXX ([N] decisiones, [N] del Decision Registry)
**Data Model:** E-001 → E-XXX ([N] entidades)
**Entity Reconciliation:** [N/total] entidades del Brief cubiertas

### Cross-Validation Results

| Check                         | Result |
| ----------------------------- | ------ |
| ADR ↔ Data Model consistency  | ✅/🔴  |
| Decision Registry propagation | ✅/🔴  |
| Brief §6 fields → columns     | ✅/🔴  |
| Entity count match            | ✅/🔴  |

¿Continuar con Batch 5 (API Contracts)?
```

**ACTION:** Call `notify_user` with `BlockedOnUser: true`, `ShouldAutoProceed: false`

🛑 **STOP — NO continuar con Batch 5 sin confirmación del usuario.**

---

_Batch 4 Complete → Esperar confirmación → Batch 5_
