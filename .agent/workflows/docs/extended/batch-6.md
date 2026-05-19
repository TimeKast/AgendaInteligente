# Batch 6: Operational — Runbooks + Test Strategy (10 + 11)

> **Output:** 10_RUNBOOKS, 11_TEST_STRATEGY
>
> **Depende de:** Todo lo anterior (02-09)

---

## Load Batch 6 Templates

// turbo

```bash
echo "📄 Loading Batch 6 templates..."
cat ./.agent/skills/roles/docs/10_RUNBOOKS.template.md
cat ./.agent/skills/roles/docs/11_TEST_STRATEGY.template.md
```

---

## Generar en este orden

1. **10_RUNBOOKS** — Procedimientos operacionales del DOMINIO
   - RUN-XXX: Derivar de Discovery Brief §8 (Jobs/Operations) + §5 (Integraciones)
   - Enfoque en operaciones del DOMINIO del proyecto (ej: setup de temporada, backfill de datos, corrección de scores emergente)
   - **🔴 NO generar runbooks genéricos de deployment** — eso ya lo cubre Factory `/deploy`
   - Si el proyecto tiene crons/automation → documentar procedimientos de monitoreo y recovery

2. **11_TEST_STRATEGY** — Pirámide de tests
   - Niveles: Unit → Integration → E2E
   - Coverage goals por nivel
   - Herramientas: Vitest, Playwright
   - Derivado de 04_USER_STORIES (qué testear)
   - **DEBE incluir:** Herramientas con versiones, Coverage Targets por capa, Testing de Business Rules (BR-XXX → test strategy)

---

## 🛑 Checkpoint Intermedio 6 (HARD GATE)

> ⚠️ **El agente DEBE pausar aquí para resetear contexto antes de Batch 7.**

**El agente DEBE mostrar vía `notify_user`:**

```markdown
## ✅ Batch 6 Completado (Runbooks + Tests)

**Runbooks:** RUN-001 → RUN-XXX ([N] procedimientos del dominio)
**Test Strategy:** [N] niveles definidos, coverage targets, herramientas

¿Continuar con Batch 7 (E2E Scenarios, Risk Register, Traceability)?
```

**ACTION:** Call `notify_user` with `BlockedOnUser: true`, `ShouldAutoProceed: false`

🛑 **STOP — NO continuar con Batch 7 sin confirmación del usuario.**

---

_Batch 6 Complete → Esperar confirmación → Batch 7_
