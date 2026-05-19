# EPIC-{PREFIX}: {Título}

> **Status:** 📋 Backlog
> **Milestone:** {version}
> **Dimension:** {emoji} {dimension}
> **Total Issues:** {N}
> **Story Points:** {N}
> **Created:** {{DATE}}
> **Started:** —
> **Completed:** —

## Objetivo

{Descripción del epic y qué problema resuelve — 2-3 oraciones}

## Issues

| #   | Issue                                     | Título        | SP  | Status |
| --- | ----------------------------------------- | ------------- | --- | ------ |
| 1   | [{PREFIX}-001](../issues/{PREFIX}-001.md) | {título}      | {N} | 📋     |
| 2   | [{PREFIX}-002](../issues/{PREFIX}-002.md) | {título}      | {N} | 📋     |
| {N} | [{PREFIX}-NNN](../issues/{PREFIX}-NNN.md) | 🧪 Epic Tests | {N} | 📋     |

> 🔴 **REGLAS:**
>
> - Cada epic SIEMPRE termina con un issue de testing como **último número secuencial** (no 999).
> - Los IDs reflejan el **orden de implementación** (topological sort por dependencias).
> - Issue-N NUNCA depende de Issue-M donde M > N.
> - Status parseable: 📋 Backlog | 🚧 In Progress | ✅ Done | ❌ Won't Do

## Scope

**Incluido:**

- {Feature 1}
- {Feature 2}

**Excluido:**

- {Feature para otro epic}
- {Out of scope}

## Dependencias

- {PREFIX} desbloquea {OTRO-PREFIX} — {razón}
- Requiere {OTRO-PREFIX} — {razón}

---

_EPIC-{PREFIX} — {Título}_
