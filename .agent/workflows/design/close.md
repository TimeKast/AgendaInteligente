# Phase 6: Handoff

> **Carga:** Después de CHECKPOINT 3 aprobado

---

## 5.1: Handoff Format

```markdown
## ✅ Design Completado

**Proyecto:** [nombre]
**Pantallas:** SCR-001 → SCR-XXX ([N] total)
**Flujos:** FLW-001 → FLW-XXX ([M] total)
**Componentes nuevos:** CMP-001 → CMP-XXX ([K] total)

**Artefacto:**

- `docs/planning/15_DESIGN.md`

**Open Questions:** [X pendientes] ([Y high impact])
**Assumptions:** [Z declarados]
**Architect Consultations:** [N si hubo]

---

## 🚀 Próximo Paso

**SSOT Chain:**
```

Discovery (00) → Proposal (01) → Docs (02-14) → Design (15) ✅ → Backlog → Code

```

Ejecutar:
```

/backlog

```

Este comando generará issues a partir de la documentación y diseño creados.
```

---

## 5.2: SSOT Chain Position

```
Discovery (00) → Proposal (01) → Docs (02-14) → Design (15) → Backlog → Code
                                                    ↑
                                                COMPLETED
```

---

## 5.3: Files Generated

| Archivo                      | Contenido                         |
| ---------------------------- | --------------------------------- |
| `docs/planning/15_DESIGN.md` | Especificación de diseño completa |

---

## 5.4: Next Workflow

**Workflow:** `/backlog`

**Lo que hará:**

- Leer 15_DESIGN.md
- Crear issues por pantalla (SCR-XXX)
- Crear issues por componente nuevo (CMP-XXX)
- Asignar prioridades según flujos críticos

---

## 5.5 Re-Validate Option

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
> → Cambiar fila `Design` de `⬜ Pendiente` a `✅ Completo`

// turbo

```bash
git add docs/planning/15_DESIGN.md docs/planning/project-config.md
git commit -m "docs(design): generate Design specification"
```

---

_TimeKast Factory — Design Workflow Handoff_
