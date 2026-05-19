# Batch 5: API Contracts (08)

> **Output:** 08_API_CONTRACTS
>
> **Depende de:** Batch 4 (06_DATA_MODEL + 07_ARCHITECTURE)

---

## Load Batch 5 Template

// turbo

```bash
echo "📄 Loading Batch 5 template..."
cat ./.agent/skills/roles/docs/08_API_CONTRACTS.template.md
```

---

## Generar

1. **08_API_CONTRACTS** — Server Actions y I/O
   - Server Actions por feature
   - Input/Output schemas (Zod, derivados del Data Model)
   - Error handling patterns
   - Cross-ref: Action→US, Action→E-XXX

---

## 🛑 Checkpoint Intermedio 5 (HARD GATE)

> ⚠️ **El agente DEBE pausar aquí para resetear contexto antes de Batch 6 (Operational).**

**El agente DEBE mostrar vía `notify_user`:**

```markdown
## ✅ Batch 5 Completado (API Contracts)

**API Contracts:** [N] server actions documentadas
**Cross-refs verificados:** Action→US: [N/total], Action→E: [N/total]

¿Continuar con Batch 6 (Operational: Runbooks, Tests)?
```

**ACTION:** Call `notify_user` with `BlockedOnUser: true`, `ShouldAutoProceed: false`

🛑 **STOP — NO continuar con Batch 6 sin confirmación del usuario.**

---

_Batch 5 Complete → Esperar confirmación → Batch 6_
