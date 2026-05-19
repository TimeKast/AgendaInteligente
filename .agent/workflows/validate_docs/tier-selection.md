# Phase 1: Tier Selection

> Selección de nivel de validación documental.

---

## Tier Options

```md
## 📋 Selecciona nivel de validación:

| #   | Tier   | Scope                    | Tiempo | Incluye                                      |
| --- | ------ | ------------------------ | ------ | -------------------------------------------- |
| 1   | **V1** | Pipeline Alignment       | ~3-5m  | Chequeo mecánico + semántico por stage       |
| 2   | **V2** | V1 + Semantic Fidelity   | ~8-10m | V1 + re-lectura profunda upstream→downstream |
| 3   | **V3** | V2 + Post-Implementation | ~15m+  | V2 + código vs docs (requiere código)        |

> 📋 **Nota:** El stage del pipeline se auto-detecta en Phase 0

**¿Qué nivel?** (1-3)

> 💡 Shortcut: `/validate_docs V2` para saltar selección.
```

---

## 🛑 STOP — Esperar Selección de Tier

> ⚠️ **MANDATORY STOP**: Usa `notify_user` con `BlockedOnUser: true`
> para mostrar las opciones y ESPERAR la respuesta del usuario.
>
> **NO continúes sin respuesta explícita.**

❌ **PROHIBIDO:**

- Continuar si no hay respuesta del usuario
- Inventar respuestas ("user selects V2")
- Asumir tier por defecto

**Si el usuario ya especificó tier en la invocación** (ej: `/validate_docs V2`), saltar este stop.

---

## Shortcut Handling

| Invocación          | Acción                                           |
| ------------------- | ------------------------------------------------ |
| `/validate_docs`    | Mostrar opciones, esperar                        |
| `/validate_docs V1` | Saltar a pipeline-alignment.md                   |
| `/validate_docs V2` | Saltar a pipeline-alignment + semantic           |
| `/validate_docs V3` | Saltar a todos (pipeline + semantic + post-impl) |

---

## Tier Mapping

| Tier | Validación          | Uso recomendado               |
| ---- | ------------------- | ----------------------------- |
| V1   | Pipeline alignment  | Entre cada fase de generación |
| V2   | Semantic fidelity   | Pre-release de documentación  |
| V3   | Post-implementation | Pre-release de código         |

---

_Tier Selection Complete → Continuar a Phase 2 (Execute Validation)_
