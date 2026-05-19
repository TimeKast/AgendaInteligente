# Phase 2: Prerequisites

> **Carga:** Después de context.md

---

## 2.1: Verify ALL Required Docs Exist (00-14)

// turbo

```bash
echo "📋 Verificando TODOS los docs requeridos (00-14)..."
MISSING=0
for i in 00 01 02 03 04 05 06 07 08 09 10 11 12 13 14; do
  f=$(ls ./docs/planning/${i}_*.md 2>/dev/null | head -1)
  if [ -n "$f" ]; then
    echo "✅ $f"
  else
    echo "❌ ${i}_*.md FALTANTE"
    MISSING=$((MISSING+1))
  fi
done
echo ""
echo "Total faltantes: $MISSING"
[ $MISSING -gt 0 ] && echo "🛑 Ejecutar /docs primero"
```

**Archivos requeridos (TODOS obligatorios):**

| Archivo                               | Estado       | Nota                     |
| ------------------------------------- | ------------ | ------------------------ |
| `docs/planning/00_DISCOVERY_BRIEF.md` | ✅ Requerido | §3, §7 deben estar ✅/🟡 |
| `docs/planning/01_PROPOSAL.md`        | ✅ Requerido | MVP scope                |
| `docs/planning/02_FEATURE_MAP.md`     | ✅ Requerido | Features list            |
| `docs/planning/03_USER_PERSONAS.md`   | ✅ Requerido | Para accesos             |
| `docs/planning/04_USER_STORIES.md`    | ✅ Requerido | Para cross-refs          |
| `docs/planning/05_BUSINESS_RULES.md`  | ✅ Requerido | Para RBAC                |
| `docs/planning/06_DATA_MODEL.md`      | ✅ Requerido | Para data reqs           |
| `docs/planning/07_ARCHITECTURE.md`    | ✅ Requerido | Stack/ADRs               |
| `docs/planning/08_API_CONTRACTS.md`   | ✅ Requerido | Server actions           |
| `docs/planning/09_GLOSSARY.md`        | ✅ Requerido | Terminología             |
| `docs/planning/10_RUNBOOKS.md`        | ✅ Requerido | Ops procedures           |
| `docs/planning/11_TEST_STRATEGY.md`   | ✅ Requerido | Test pyramid             |
| `docs/planning/12_E2E_SCENARIOS.md`   | ✅ Requerido | Playwright flows         |
| `docs/planning/13_RISK_REGISTER.md`   | ✅ Requerido | Risk matrix              |
| `docs/planning/14_TRACEABILITY.md`    | ✅ Requerido | US→Issue mapping (stub)  |

**Si falta CUALQUIER doc:**

```markdown
🛑 **Docs incompletos — No puedo generar Design**

**Faltante(s):**

- [archivo] → no existe

**Acción:** Ejecutar `/docs` primero para generar docs faltantes.
```

---

## 2.2: Verify Coverage Map

**Verificar en 00_DISCOVERY_BRIEF:**

- §3 (Features Core) debe estar ✅ o 🟡
- §7 (UI/UX) debe estar ✅ o 🟡
- Si hay 🔴 en §3 o §7 → STOP → `/discovery`

---

## 2.3: Load Template

// turbo

```bash
cat ./.agent/skills/roles/design/15_DESIGN.template.md 2>/dev/null || cat ./.agent/skills/roles/design/15_DESIGN.template.md
```

**Extraer IDs de todos los docs:**

- Features: FT-XXX
- Personas: P-XXX (accesos)
- Stories: US-XXX (cross-refs)
- Rules: BR-XXX (RBAC)
- Entities: E-XXX (data requirements)
- ADRs: ADR-XXX (architecture)

---

## 2.4: US→SCR Coverage Check (MANDATORY)

> 🔴 **ANTES de CHECKPOINT 1**, verificar que CADA User Story
> tiene al menos una pantalla (SCR) o sub-sección (tab/modal) donde se ejecuta.

**Procedimiento:**

1. Extraer todos los `US-XXX` de `04_USER_STORIES.md`
2. Para cada US, asignar qué `SCR-XXX` la implementa
   (puede ser pantalla propia, tab, modal o sección dentro de otra pantalla)
3. Si una US no tiene SCR asignado → reportar como **gap** en CHECKPOINT 1

**Output esperado en CHECKPOINT 1:**

```markdown
### Cobertura US → SCR

| US     | Descripción              | SCR asignado                 | Nota         |
| ------ | ------------------------ | ---------------------------- | ------------ |
| US-001 | Gestionar Inversionistas | SCR-003, SCR-004             | —            |
| US-004 | Registrar Compromisos    | SCR-004 (tab), SCR-006 (tab) | Relación N:N |
| US-XXX | ...                      | ❌ Sin SCR                   | ⚠️ GAP       |
```

**Si hay gaps:**

- Proponer solución (pantalla nueva, tab, o modal en pantalla existente)
- **NO continuar a generación hasta que el usuario confirme la asignación**

---

## 2.5: FT→SCR Coverage Check (MANDATORY)

> 🔴 **Complementario al check US→SCR.** Verifica que cada Feature del MVP
> tiene al menos una pantalla donde se manifiesta.

**Procedimiento:**

1. Extraer todos los `FT-XXX` de `02_FEATURE_MAP.md`
2. Para cada FT, asignar qué `SCR-XXX` la implementa
3. Si un FT no tiene SCR asignado:
   - ¿Tiene US asociada? → El gap está en la asignación de pantalla
   - ¿No tiene US asociada? → Gap doble: falta US **y** pantalla → reportar
4. Features cross-cutting (ej: RBAC, Auth) pueden marcar "Transversal" en vez de SCR

**Output esperado en CHECKPOINT 1:**

```markdown
### Cobertura FT → SCR

| FT     | Feature             | SCR asignado     | US asociada | Nota                           |
| ------ | ------------------- | ---------------- | ----------- | ------------------------------ |
| FT-001 | CRUD Inversionistas | SCR-003, SCR-004 | US-001      | —                              |
| FT-015 | RBAC                | Transversal      | US-015      | Middleware, no pantalla propia |
| FT-XXX | ...                 | ❌ Sin SCR       | ❌ Sin US   | ⚠️ GAP DOBLE                   |
```

**Si hay gaps:**

- Gap simple (FT sin SCR pero con US) → asignar pantalla
- Gap doble (FT sin SCR ni US) → reportar al usuario para decisión

---

_Phase 2 Complete → Continuar a CHECKPOINT 1_
