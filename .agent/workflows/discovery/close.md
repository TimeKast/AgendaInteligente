# Phase 8: Final Brief + Close

> **Propósito:** Generar artefactos finales y handoff.
> **Nota:** CHECKPOINT 2 ya fue aprobado en discovery.md antes de llegar aquí.

---

## Context Check (Pre-Close)

// turbo

```bash
cat ./.agent/workflows/_shared/context-check.md
```

**Enforcement:**

- 🟢 → Continuar a handoff
- 🟡 → Advertir en handoff: "Brief generado con contexto en precaución"
- 🔴 → Advertir: "Contexto degradado — considerar re-validar brief en sesión limpia"

---

## Pre-requisitos

- ✅ CHECKPOINT 2 aprobado
- ✅ Source Fidelity Check: sin drift unauthorized
- ✅ Challenge Pass: sin blockers
- ✅ Coverage ≥ 80% en ✅ o ⚪
- ✅ 0 secciones críticas en 🔴 (§1, §2, §3, §6)

---

## Generar Artefactos

### 1. Crear Discovery Brief

```bash
mkdir -p ./docs/planning
# El agente genera el brief directamente, no copia template
```

### 2. Crear/Actualizar Project Config

```bash
cat ./docs/planning/project-config.md 2>/dev/null || echo "No project-config.md - crear desde template"
```

> 📝 **El project-config es metadata compacta del proyecto** para carga rápida en sesiones.
> Generarlo desde el template en `skills/roles/discovery/project-config.template.md`.
>
> **Frontmatter YAML (OBLIGATORIO):** Rellenar los campos parseables:
>
> - `project`, `client`, `stakeholder` → Brief §1 + §2
> - `project_type` → Brief §1 (tipo de producto)
> - `design_system` → SK default (`neomorphism-2`) salvo que se defina custom
> - `locale` → Brief §9 (idioma UI)
> - `timezone` → Brief §8 (infraestructura), default `America/Mexico_City`
> - `stack` → Brief §8 + SK actual (framework, db, auth)
> - `deadline` → Brief §8 (timeline), o `'TBD'` si no hay fecha definida
> - `structure_version` → siempre `"1.0"` para proyectos nuevos
> - **No incluir** `version` ni `ports` — SSOT en `package.json`
>
> **Secciones body a rellenar desde el Brief:**
>
> - §1-4 Project Info, Problem Statement, Stakeholders, Tech Stack → Brief §1, §2, §8
> - §5 Infrastructure & Services → Brief §5 + §8 + SK defaults. **Todo en una tabla: hosting, DB, APIs, storage.**
> - §6 Related Repos → Solo si multi-repo. Fuente: Brief §8 o contexto del proyecto
> - §7 Roles → Brief §2 (roles RBAC del sistema, NO stakeholders)
> - §8 Client Context → Brief §9 (Branding) + §11 (Visual Direction Seeds)
> - §9 Key Decisions → Top decisiones firmes del Brief Decision Registry
> - §10 Project-Specific Rules → Brief §6 (invariantes y reglas únicas)
> - §11 Scope Boundaries → Brief §3.3 + §1.5 (qué NO es)
> - §12 Pipeline Status → Discovery ✅ Completo, resto ⬜ Pendiente
>
> **Glossario** → NO incluir en project-config (vive en `09_GLOSSARY.md`)

### 3. Verificar Placeholders

El agente DEBE verificar que NO quedaron placeholders:

```bash
grep -nE '\{\{[A-Z_]+\}\}|___|\[\.\.\.\]' docs/planning/00_DISCOVERY_BRIEF.md 2>/dev/null && echo "🔴 Placeholders encontrados" || echo "✅ Sin placeholders"
```

---

## SSOT Outputs

```
docs/planning/00_DISCOVERY_BRIEF.md  ← Brief completo con Source Package, Decision Registry, Confidence Tags
docs/planning/project-config.md      ← Config del proyecto (same data, different format)
```

---

## Handoff

```markdown
## ✅ Discovery Completado

**Proyecto:** [nombre]
**Stakeholder:** [nombre]

### 📊 Fidelity Score

| Métrica              | Valor                               |
| -------------------- | ----------------------------------- |
| Source Fidelity      | X%                                  |
| Traceability Density | X% decisions with source identified |
| Drift Items          | N (N unauthorized, N risky, N safe) |
| Assumptions          | N                                   |
| Open Questions       | N                                   |
| Coverage             | X/11                                |

### 📦 Artefactos

- `docs/planning/00_DISCOVERY_BRIEF.md`
- `docs/planning/project-config.md`

### 📋 Source Package

| Doc | Clasificación |
| --- | ------------- |

[lista de docs fuente para referencia downstream]

### 🤖 Challenge Pass

| Perspectiva     | Veredicto |
| --------------- | --------- |
| product-owner   | ✅/⚠️     |
| architect       | ✅/⚠️     |
| project-planner | ✅/⚠️     |

### ➡️ Próximo paso

`/proposal` para generar propuesta al cliente.
```

---

## Commit (Recommended Next Action)

> ⚠️ **Auto-commit solo si el usuario lo permite o el modo lo requiere.**
> Si hay Open Questions pesadas o assumptions de alto riesgo, considerar esperar antes de cristalizar.

**Sugerencia al usuario:**

```markdown
### 💾 ¿Commitear artefactos?

Los artefactos están listos. ¿Quieres que haga commit?

| OQs pendientes | Assumptions activas | Recomendación    |
| -------------- | ------------------- | ---------------- |
| N              | N                   | Commit / Esperar |
```

**Si el usuario confirma:**

// turbo

```bash
git add docs/planning/00_DISCOVERY_BRIEF.md docs/planning/project-config.md
git commit -m "docs(discovery): generate Discovery Brief

Source Fidelity: X% | Coverage: X/11 | Open Questions: N"
```

---

## Cleanup: Intermediate Artifacts

// turbo

```bash
rm -rf docs/planning/.discovery-wip/
```

> Los artefactos intermedios ya están integrados en el Brief. No se necesitan más.

---

_Phase 8 Complete → Discovery terminado_
