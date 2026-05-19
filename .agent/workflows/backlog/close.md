# Phase 8: Close

> **Carga:** Solo después de CHECKPOINT 3 aprobado (full) o validation-lite (add).

---

## 8.1 Generate Board

> 🔴 **PROHIBIDO GENERAR BOARD.md MANUALMENTE**
>
> BOARD.md se auto-genera en cada commit via pre-commit hook.

// turbo

```bash
echo "📋 Ejecutando update-board para validación..."
pnpm update-board
echo "✅ BOARD.md actualizado (se regenerará en cada commit)"
```

---

## 8.2 Create README (si es nueva versión, full mode only)

```markdown
# Backlog M{N}

> **Milestone:** M{N}
> **Created:** {DATE}
> **Status:** 📋 Planning

## Summary

- **Epics:** [N]
- **Issues:** [M]
- **Effort Total:** [X] story points

## Epics

| Epic      | Description   | Issues | Effort |
| --------- | ------------- | ------ | ------ |
| EPIC-AUTH | Autenticación | 5      | L      |

## Priority Distribution

| Priority | Count | %   |
| -------- | ----- | --- |
| P0       | X     | Y%  |
| P1       | A     | B%  |
| P2       | C     | D%  |

## Next Steps

1. Review issues with team
2. Start with P0 blockers
3. `/implement {FIRST-ISSUE}`
```

---

## 8.3 Handoff Summary

**Mostrar al usuario:**

```markdown
## ✅ Backlog Generado

**Proyecto:** [nombre]
**Milestone:** M{N}
**Epics:** [N] epics creados
**Issues:** [M] issues totales

**Distribución por prioridad:**

- P0: [X]
- P1: [Y]
- P2: [Z]

**Cobertura:**

- Stories: [A/B] ([C%])
- Pantallas: [D/E] ([F%])

**Artefactos:**

- `docs/backlog/M{N}/README.md`
- `docs/backlog/M{N}/epics/*.md`
- `docs/backlog/M{N}/issues/*.md`
- `docs/backlog/BOARD.md`

**Próximo paso:**

| #   | Acción        | Comando                       |
| --- | ------------- | ----------------------------- |
| 1   | Validar docs  | `/validate_docs`              |
| 2   | Revisar BOARD | `cat docs/backlog/BOARD.md`   |
| 3   | Implementar   | `/implement {FIRST-P0-ISSUE}` |
```

---

## SSOT Chain Position

```
/start → /discovery → /proposal → /docs → /design → /backlog → /implement → /audit
                                                          ↑
                                                      COMPLETED
```

---

## Re-Validate Option (full mode only)

```markdown
| #   | Opción         | Acción                                |
| --- | -------------- | ------------------------------------- |
| 1   | **continuar**  | Proceder con commit                   |
| 2   | **re-validar** | Ejecutar solo validación multi-agente |
| 3   | **cancelar**   | Abortar                               |
```

---

## Auto-Commit (post-approval)

> 🔴 **Antes de commit: actualizar Pipeline Status en `docs/planning/project-config.md`**
> → Cambiar fila `Backlog` de `⬜ Pendiente` a `✅ Completo`

// turbo

```bash
git add docs/backlog/ docs/reports/ docs/planning/14_TRACEABILITY.md docs/planning/project-config.md
git commit -m "docs(backlog): generate issues and epics"
```

---

_Backlog Workflow Complete_
