# Batch 1: Foundation (02 + 03 + 09)

> **Output:** 02_FEATURE_MAP, 03_USER_PERSONAS, 09_GLOSSARY
>
> **Carga:** Después de CHECKPOINT 1 aprobado + `_rules.md` leído.

---

## Cargar templates de este batch

// turbo

```bash
echo "📄 Loading Batch 1 templates..."
cat ./.agent/skills/roles/docs/02_FEATURE_MAP.template.md
cat ./.agent/skills/roles/docs/03_USER_PERSONAS.template.md
cat ./.agent/skills/roles/docs/09_GLOSSARY.template.md
```

---

## Generar en este orden

1. **02_FEATURE_MAP** — Extraer TODOS los features de Brief §3
   - MVP features con FT-XXX
   - Post-MVP features marcados
   - Non-Goals con NG-XXX
   - Cross-ref: §3 features → FT-XXX (1:1 obligatorio)

2. **03_USER_PERSONAS** — Extraer personas de Brief §2
   - Perfiles con P-XXX
   - JTBD (Jobs To Be Done) por persona
   - RBAC Matrix: P-XXX × recurso → permiso

3. **09_GLOSSARY** — Vocabulario del dominio
   - Términos técnicos y de negocio
   - Derivado de §3+§6 del Brief

---

## 🛑 Checkpoint Intermedio 1 (HARD GATE)

> ⚠️ **El agente DEBE pausar aquí para resetear contexto antes de Batch 2.**

**El agente DEBE mostrar vía `notify_user`:**

```markdown
## ✅ Batch 1 Completado (Foundation)

**Feature Map:** FT-001 → FT-XXX ([N] features, [M] MVP / [K] Post-MVP)
**Personas:** P-001 → P-XXX ([N] personas)
**Glossary:** [N] términos
**Coverage vs Brief §3:** [N/total] features mapeados

¿Continuar con Batch 2 (User Stories)?
```

**ACTION:** Call `notify_user` with `BlockedOnUser: true`, `ShouldAutoProceed: false`

🛑 **STOP — NO continuar con Batch 2 sin respuesta del usuario.**

---

_Batch 1 Complete → Esperar confirmación → Batch 2_
