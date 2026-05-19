# Phase 2: Prerequisites

> **Carga:** Después de context-loading.md

---

## 2.1 Verify Discovery Brief

// turbo

```bash
ls -la ./docs/planning/00_DISCOVERY_BRIEF.md 2>/dev/null || echo "❌ Discovery Brief not found"
```

**Si no existe:**

```markdown
⚠️ **Discovery Brief no encontrado**
**Acción:** Ejecutar `/discovery` primero.
```

---

## 2.2 Load Discovery Brief

// turbo

```bash
cat ./docs/planning/00_DISCOVERY_BRIEF.md
```

---

## 2.3 Validate Coverage Map

**Verificar que §1, §2, §3, §6 están ✅ en el Brief.**

| Sección | Contenido         | Requerido |
| ------- | ----------------- | --------- |
| §1      | Idea General      | ✅        |
| §2      | Usuarios y Roles  | ✅        |
| §3      | Features Core     | ✅        |
| §6      | Reglas de Negocio | ✅        |

**Si alguna está 🔴 → STOP**

---

## 2.4 Verify Templates Exist

// turbo

```bash
ls -la ./.agent/skills/roles/docs/*.template.md
```

> ℹ️ **Templates se cargan per-batch en Phase 3-4** (ver WF-015).
> Aquí solo verificamos que existen.

---

## 🛑 CHECKPOINT 1: Pre-Generation

**Mostrar:**

```markdown
## 📋 Pre-Generation Summary

**Discovery Brief:** Cargado ✅
**Coverage Map:** §1,§2,§3,§6 = ✅
**Templates:** Listos ✅
**Docs a generar:**

- **Core (02-09):** 02_FEATURE_MAP, 03_USER_PERSONAS, 04_USER_STORIES, 05_BUSINESS_RULES, 06_DATA_MODEL, 07_ARCHITECTURE, 08_API_CONTRACTS, 09_GLOSSARY
- **Extended (10-14):** 10_RUNBOOKS, 11_TEST_STRATEGY, 12_E2E_SCENARIOS, 13_RISK_REGISTER, 14_TRACEABILITY

| #   | Opción   | Acción                 |
| --- | -------- | ---------------------- |
| 1   | generar  | Crear todos los docs   |
| 2   | solo X   | Generar doc específico |
| 3   | cancelar | Salir                  |

**¿Qué quieres hacer?** (1-3)
```

**ACTION:** Call `notify_user` with `BlockedOnUser: true`

🛑 **STOP AQUÍ — NO continuar sin respuesta del usuario.**

---

_Phase 2 Complete → ESPERAR CHECKPOINT 1 → Continuar a Phase 3 (Generation)_
