# Phase 1: Tier Selection

> Selección de nivel de auditoría basado en scope y riesgo.

---

## Tier Options

```md
## 🧪 Selecciona nivel de auditoría:

| #   | Tier   | Scope                   | Tiempo | Incluye                                  |
| --- | ------ | ----------------------- | ------ | ---------------------------------------- |
| 1   | **R0** | Test gate               | ~2-5m  | unit + integration + E2E tests           |
| 2   | **R1** | Epic/Issue DoD          | ~3m    | R0 + AC check + DoD validation           |
| 3   | **R2** | Security/Build          | ~5m    | R1 + build + security + deps             |
| 4   | **R3** | Deep Multi-Agent Review | ~10m   | R2 + `/orchestrate` con 7 perspectivas   |
| 5   | **R4** | Pre-release             | ~15m+  | R3 + lighthouse + knip + bundle-analyzer |

> 📋 **Nota:** lint/typecheck ya corre automático en pre-commit

**¿Qué nivel?** (1-5)

> 💡 Shortcut: `/audit R2` para saltar selección.
```

---

## 🛑 STOP — Esperar Selección de Tier

> ⚠️ **MANDATORY STOP**: Usa `notify_user` con `BlockedOnUser: true`
> para mostrar las opciones y ESPERAR la respuesta del usuario.
>
> **NO continúes sin respuesta explícita.**

❌ **PROHIBIDO:**

- Continuar si no hay respuesta del usuario
- Inventar respuestas ("user selects R2")
- Asumir tier por defecto

**Si el usuario ya especificó tier en la invocación** (ej: `/audit R2`), saltar este stop.

---

## Shortcut Handling

| Invocación  | Acción                                   |
| ----------- | ---------------------------------------- |
| `/audit`    | Mostrar opciones, esperar                |
| `/audit R0` | Saltar a checks-r0.md                    |
| `/audit R1` | Saltar a checks-r0.md + checks-r1.md     |
| `/audit R2` | Saltar a checks-r0.md + r1 + r2          |
| `/audit R3` | Saltar a r0 + r1 + r2 + r3 (multi-agent) |
| `/audit R4` | Saltar a todos los checks (r0-r4)        |

---

## Tier → Agentes a Cargar

Después de selección, cargar agentes adicionales según tier:

```bash
# R2+ → Cargar agentes de seguridad
if [ "$TIER" = "R2" ] || [ "$TIER" = "R3" ] || [ "$TIER" = "R4" ]; then
  cat ./.agent/agents/security-auditor.md
  cat ./.agent/agents/backend-specialist.md
fi

# R3+ → Cargar agentes para deep review
if [ "$TIER" = "R3" ] || [ "$TIER" = "R4" ]; then
  cat ./.agent/agents/architect.md
  cat ./.agent/agents/frontend-specialist.md
fi

# R4 → Cargar agentes completos
if [ "$TIER" = "R4" ]; then
  cat ./.agent/agents/devops-engineer.md
  cat ./.agent/agents/performance-optimizer.md
  cat ./.agent/agents/test-engineer.md
fi
```

---

## Tier Mapping to QC Levels

| Tier | QC Level   | Uso                         |
| ---- | ---------- | --------------------------- |
| R0   | —          | Quick test gate             |
| R1   | QC-Epic    | Epic completion validation  |
| R2   | —          | Security-sensitive changes  |
| R3   | QC-Deep    | Multi-agent codebase review |
| R4   | QC-Release | Pre-deploy validation       |

---

_Tier Selection Complete → Continuar a Phase 2 (Quality Gate)_
