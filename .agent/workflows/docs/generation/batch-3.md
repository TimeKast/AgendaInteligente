# Batch 3: Business Rules (05)

> **Output:** 05_BUSINESS_RULES
>
> **Depende de:** Batch 2 (04_USER_STORIES para cross-ref BR→US)

---

## Cargar template

// turbo

```bash
echo "📄 Loading Batch 3 template..."
cat ./.agent/skills/roles/docs/05_BUSINESS_RULES.template.md
```

---

## Generar

1. **05_BUSINESS_RULES** — Derivar de Brief §6
   - BR-XXX invariantes y validaciones
   - Estados y transiciones
   - Cálculos con fórmulas explícitas (CALC-XXX)
   - Cross-ref: BR→US, BR→E-XXX (si schema ya está en Brief)

---

## Architect Gating

> 📎 **SSOT:** Ver `SKILL.md §7` para reglas completas de escalamiento.

**Cargar `@[.agent/agents/architect.md]` si:**

| Situación                      | Afecta |
| ------------------------------ | ------ |
| Data model complejo            | 06     |
| Decisión infra con tradeoffs   | 07     |
| Gap 🟡 que afecta arquitectura | 06, 07 |
| Soft-delete vs hard-delete     | 06     |

---

## 🛑 Checkpoint Intermedio 3 (HARD GATE)

> ⚠️ **El agente DEBE pausar aquí para resetear contexto antes de Phase 4 (Technical docs).**

**El agente DEBE mostrar vía `notify_user`:**

```markdown
## ✅ Batch 3 Completado (Business Rules)

**Business Rules:** BR-001 → BR-XXX ([N] total)
**Cross-refs verificados:** BR→US: [N/total]

¿Continuar con Phase 4 (Technical + Operational docs)?
```

**ACTION:** Call `notify_user` with `BlockedOnUser: true`, `ShouldAutoProceed: false`

🛑 **STOP — NO continuar con Phase 4 sin respuesta del usuario.**

---

_Batch 3 Complete → Esperar confirmación → Phase 4 (Extended Docs)_
