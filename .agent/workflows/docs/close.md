# Phase 6: Handoff

> **Carga:** Después de CHECKPOINT 3 aprobado

---

## Handoff Summary

**Mostrar al usuario:**

```markdown
## ✅ Docs Generados

**Proyecto:** [nombre]
**Documentos:** 8/8 core + 5/5 extended

### IDs Creados

| Tipo      | Rango             | Cantidad |
| --------- | ----------------- | -------- |
| Features  | FT-001 → FT-XXX   | [N]      |
| Non-Goals | NG-001 → NG-XXX   | [N]      |
| Personas  | P-001 → P-XXX     | [N]      |
| Stories   | US-001 → US-XXX   | [N]      |
| Rules     | BR-001 → BR-XXX   | [N]      |
| Entities  | E-001 → E-XXX     | [N]      |
| ADRs      | ADR-001 → ADR-XXX | [N]      |

### Artefactos Core (02-09)

- `docs/planning/02_FEATURE_MAP.md`
- `docs/planning/03_USER_PERSONAS.md`
- `docs/planning/04_USER_STORIES.md`
- `docs/planning/05_BUSINESS_RULES.md`
- `docs/planning/06_DATA_MODEL.md`
- `docs/planning/07_ARCHITECTURE.md`
- `docs/planning/08_API_CONTRACTS.md`
- `docs/planning/09_GLOSSARY.md`

### Artefactos Extended (10_RUNBOOKS → 14_TRACEABILITY)

- `docs/planning/10_RUNBOOKS.md`
- `docs/planning/11_TEST_STRATEGY.md`
- `docs/planning/12_E2E_SCENARIOS.md`
- `docs/planning/13_RISK_REGISTER.md` (si generado)
- `docs/planning/14_TRACEABILITY.md` (stub en /docs, poblado en /backlog)

### Métricas

| Métrica                 | Valor                            |
| ----------------------- | -------------------------------- |
| Open Questions          | [X pendientes] ([Y high impact]) |
| Assumptions             | [Z declarados]                   |
| Gaps resueltos          | [N]                              |
| Architect consultations | [M]                              |

---

## 🚀 Próximo Paso

**Flujo:** `/discovery` ✅ → `/proposal` ✅ → `/docs` ✅ → **`/design`** → `/backlog` → `/implement`

Ejecutar:
\`\`\`
/design
\`\`\`

Este comando generará `15_DESIGN.md` basado en los docs creados.
```

---

## SSOT Chain

```
Discovery (00) → Proposal (01) → Docs (02-14) → Design (15) → Backlog → Code
```

---

## Re-Validate Option

> Si la validación multi-agente falló por error del modelo, ofrecer re-ejecutar.

**Mostrar:**

```markdown
| #   | Opción         | Acción                                |
| --- | -------------- | ------------------------------------- |
| 1   | **continuar**  | Proceder con commit                   |
| 2   | **re-validar** | Ejecutar solo validación multi-agente |
| 3   | **cancelar**   | Abortar                               |
```

**Si usuario elige 2 (re-validar):**

- Cargar y ejecutar SOLO la fase de validación del workflow
- Regresar a este checkpoint después

---

## Auto-Commit (post-approval)

> Después de CHECKPOINT aprobado, hacer commit automático.
> 🔴 **Antes de commit: actualizar Pipeline Status en `docs/planning/project-config.md`**
> → Cambiar fila `Docs` de `⬜ Pendiente` a `✅ Completo`

// turbo

```bash
git add docs/planning/0[2-9]_*.md docs/planning/1[0-4]_*.md docs/planning/project-config.md
git commit -m "docs(planning): generate technical documentation"
```

---

_TimeKast Factory — Docs Workflow Complete_
