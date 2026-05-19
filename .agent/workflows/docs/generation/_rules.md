# Generation Rules (Shared)

> **Carga:** UNA VEZ antes de Batch 1. Aplica a TODOS los batches de Phase 3.

---

## Crear archivos desde templates

```bash
mkdir -p ./docs/planning
for doc in 02_FEATURE_MAP 03_USER_PERSONAS 04_USER_STORIES 05_BUSINESS_RULES 06_DATA_MODEL 07_ARCHITECTURE 08_API_CONTRACTS 09_GLOSSARY; do
  [ ! -f ./docs/planning/${doc}.md ] && cp ./.agent/skills/roles/docs/${doc}.template.md ./docs/planning/${doc}.md
done
```

---

## Starter Kit Awareness (MANDATORY)

> 🔴 **Diferenciar lo existente (SK) de lo nuevo al documentar.**
> INVENTORY.md y CODEBASE.md se cargaron en Phase 1 (context-loading.md).

| En el doc        | Si ya existe en SK                                              | Si es nuevo                    |
| ---------------- | --------------------------------------------------------------- | ------------------------------ |
| 06_DATA_MODEL    | `🏗️ SK` — documentar schema existente, no marcar como "a crear" | `🆕` — diseñar schema completo |
| 07_ARCHITECTURE  | Referenciar stack existente como decisión tomada                | Nuevas decisiones como ADR     |
| 08_API_CONTRACTS | `🏗️ SK` — documentar actions existentes                         | `🆕` — definir nuevas actions  |

---

## Scope Preservation (MANDATORY)

> 🔴 **NO recortar ni consolidar features del Brief. CADA feature §3 → FT-XXX.**

**REGLA:** Al generar 02_FEATURE_MAP y 04_USER_STORIES:

| Situación                                       | Acción                                |
| ----------------------------------------------- | ------------------------------------- |
| Feature §3 MVP → FT-XXX                         | ✅ Obligatorio                        |
| Feature §3 Post-MVP → FT-XXX (marcado post-MVP) | ✅ Documentar                         |
| Feature §3 que "parece redundante"              | ⚠️ NO eliminar — preguntar al usuario |
| Feature §3 que "ya existe en SK"                | ✅ Documentar con `🏗️ SK Provided`    |

**NUNCA:**

- ❌ Asumir que un feature "no es necesario"
- ❌ Consolidar 2+ features en uno sin aprobación
- ❌ Cambiar feature de MVP a Post-MVP sin consultar
- ❌ Omitir features porque "son obvios"

---

## Entity & Screen Reconciliation (MANDATORY)

> 🔴 **ANTES de generar 06_DATA_MODEL, crear tablas de reconciliación.**
>
> Previene: Brief §3.1 lista entidades que nunca llegan a E-XXX.

**Tabla 1: Entidades (Brief §3.1 + §4.1 → docs)**

| #   | Entidad Brief | Brief §ref | E-XXX asignado | Doc destino   | Status |
| --- | ------------- | ---------- | -------------- | ------------- | ------ |
| 1   | [entidad]     | §3.1/§4.1  | E-001          | 06_DATA_MODEL | ✅/❌  |

**Tabla 2: Pantallas (Brief §7.2 → docs)**

| #   | Pantalla Brief | Brief §ref | Anotada para | Status |
| --- | -------------- | ---------- | ------------ | ------ |
| 1   | [pantalla]     | §7.2       | 15_DESIGN    | ✅/❌  |

**Tabla 3: Features → Entidades → Pantallas (Cross-Map)**

| #   | Feature Brief §3 | FT-XXX | Entidades involucradas | Pantallas |
| --- | ---------------- | ------ | ---------------------- | --------- |
| 1   | [feature]        | FT-001 | E-001, E-002           | Dashboard |

**🛑 GATE:** Si CUALQUIER entidad/pantalla del Brief no tiene E-XXX → justificar exclusión o agregar.

---

## ID Formats

> 📎 **SSOT:** Ver `SKILL.md §4` para formatos completos y reglas de estabilidad.

| Tipo      | Formato | Orden              |
| --------- | ------- | ------------------ |
| Features  | FT-XXX  | Orden en §3        |
| Non-Goals | NG-XXX  | Orden de aparición |
| Personas  | P-XXX   | Orden en §2        |
| Stories   | US-XXX  | Por feature        |
| Rules     | BR-XXX  | Orden en §6        |
| Entities  | E-XXX   | Alfabético         |
| ADRs      | ADR-XXX | Orden de decisión  |

---

## Open Questions & Assumptions

> Cada doc DEBE incluir sección `## Open Questions` y `## Assumptions`.

```markdown
## Open Questions

| #     | Pregunta | Impacto       | Owner       |
| ----- | -------- | ------------- | ----------- |
| OQ-01 | ...      | Alto/Med/Bajo | Cliente/Dev |

## Assumptions

| #    | Supuesto | Si es incorrecto |
| ---- | -------- | ---------------- |
| A-01 | ...      | Impacto: ...     |
```

---

_Generation Rules — Shared across all batches_
