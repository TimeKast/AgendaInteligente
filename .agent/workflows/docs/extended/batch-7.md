# Batch 7: Operational — E2E + Risk + Traceability (12 + 13 + 14)

> **Output:** 12_E2E_SCENARIOS, 13_RISK_REGISTER, 14_TRACEABILITY
>
> **Depende de:** Todo lo anterior (02-11)

---

## Load Batch 7 Templates

// turbo

```bash
echo "📄 Loading Batch 7 templates..."
cat ./.agent/skills/roles/docs/12_E2E_SCENARIOS.template.md
cat ./.agent/skills/roles/docs/13_RISK_REGISTER.template.md
cat ./.agent/skills/roles/docs/14_TRACEABILITY.template.md
```

---

## Generar en este orden

1. **12_E2E_SCENARIOS** — Flujos críticos
   - E2E-XXX con pasos y assertions
   - Prioridad: P0 → P1 → P2
   - Fixture data
   - Derivado de 04_USER_STORIES + 05_BUSINESS_RULES
   - **DEBE incluir detalle de CADA flujo P0** (no solo listado)

2. **13_RISK_REGISTER** — Riesgos identificados
   - RSK-XXX con impacto × probabilidad × mitigación
   - Matriz de riesgos
   - **DEBE incluir detalle expandido para TODOS los riesgos Alto** (no solo Alto-A)
   - Derivado de Discovery §8

3. **14_TRACEABILITY** — Stub de trazabilidad
   - US-XXX → Issue → Test → Deploy
   - Stub que `/backlog` poblará

---

## 🛑 Checkpoint Intermedio 7 (HARD GATE)

> ⚠️ **El agente DEBE pausar aquí para resetear contexto antes de Phase 5 (Validation).**

**El agente DEBE mostrar vía `notify_user`:**

```markdown
## ✅ Batch 7 Completado (E2E + Risk + Traceability)

**E2E Scenarios:** E2E-001 → E2E-XXX ([N] flujos críticos, [N] P0 detallados)
**Risk Register:** RSK-001 → RSK-XXX ([N] riesgos, [N] Alto detallados)
**Traceability:** Stub generado

¿Continuar con Phase 5 (Validation & Gap Analysis)?
```

**ACTION:** Call `notify_user` with `BlockedOnUser: true`, `ShouldAutoProceed: false`

🛑 **STOP — NO continuar a Phase 5 (Validation) sin confirmación del usuario.**

---

_Batch 7 Complete → Esperar confirmación → Phase 5 (Validation)_
