# Batch 2 — Sub-batch: Generate Next 5 US

> 🔴 **Generar User Stories para los siguientes 5 features NO PROCESADOS.**
>
> Quality Floor y template ya se cargaron en batch-2.md (setup).

---

## Instrucciones

1. **Identificar** los siguientes 5 features de 02_FEATURE_MAP que aún NO tienen stories en 04_USER_STORIES.md
2. **Generar** US para esos 5 features con Gherkin completo (Quality Floor)
3. **Escribir** con `replace_file_content` — buscar footer `_Generado por TimeKast Factory_`, reemplazar con stories + footer de vuelta
4. **Si este es el ÚLTIMO sub-batch** (no quedan más features): agregar también MoSCoW + Dependencias + Open Questions + Assumptions antes del footer

---

## 🛑 STOP — Reportar y pausar

**Después de generar las stories, el agente DEBE:**

```markdown
## ✅ Sub-batch [N] Completado

**Stories generadas:** US-XXX → US-XXX ([N] en este sub-batch)
**Features procesados:** FT-XXX → FT-XXX
**Quality Floor:** [N/N] stories con Gherkin mínimo ✅
**Features restantes:** [M] (o "Ninguno — Batch 2 completo")

¿Continuar con siguiente sub-batch? (o Batch 3 si es el último)
```

**ACTION:** Call `notify_user` with `BlockedOnUser: true`, `ShouldAutoProceed: false`

🛑 **STOP — NO generar más stories. Esperar confirmación.**

---

_Sub-batch complete → Esperar confirmación → Siguiente sub-batch o Batch 3_
