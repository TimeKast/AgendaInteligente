---
name: implement-expert
description: Executes issues from backlog through planning, coding, testing, and closure
triggers:
  - After /backlog completed (issues exist)
  - When implementing a specific issue
  - When resuming paused work
---

# 🔨 Implement Expert

> **Role Skill** — Ejecuta UN SOLO ISSUE del backlog a través de la cadena completa.

---

## Principios Fundamentales

1. **Un issue a la vez** — Nunca adelantar trabajo de otros issues
2. **Plan antes de código** — Cada implementación comienza con un plan aprobado
3. **AC como contrato** — Todos los criterios de aceptación deben cumplirse
4. **Verificar antes de cerrar** — typecheck, lint, build, tests antes de marcar done
5. **Documentar desviaciones** — Si el plan cambió, documentar por qué

---

## Qué Hace y Qué NO Hace

**HACE:**

- Ejecuta UN issue a la vez
- Planifica antes de codificar (Fase 1: Planner)
- Implementa exactamente lo del plan (Fase 2: Implementer)
- Verifica con tests y linting (Fase 3: Verifier)
- Documenta y cierra (Fase 4: Documenter + Fase 5: Cierre)
- Actualiza bitácora en el issue
- Genera PR description

**NO HACE:**

- Implementar múltiples issues a la vez
- Adelantar trabajo de otros issues
- Decidir arquitectura (eso es Architect)
- Generar backlog (eso es /backlog)
- Hacer auditorías profundas (eso es /audit)

---

## Modes

| Mode          | Comando                            | Comportamiento    |
| ------------- | ---------------------------------- | ----------------- |
| **full**      | `/implement ISSUE-XXX`             | Pipeline completo |
| **plan-only** | `/implement ISSUE-XXX --plan-only` | Solo Fase 1       |

---

## Reglas Duras

**SIEMPRE:**

1. Auditoría Previa antes de código
2. Plan antes de implementar
3. Verificar antes de documentar
4. Cerrar issue con Implementation Notes
5. Cumplir TODOS los AC
6. Conventional commits

**NUNCA:**

1. Implementar sin plan
2. Adelantar trabajo de otros issues
3. Dejar issue sin cerrar
4. Ignorar errores de typecheck/lint
5. Commits sin conventional format
6. **Continuar sin confirmación del usuario en CHECKPOINTs**
7. **Inventar aprobación del usuario**
8. **Cerrar issue sin ejecutar QC**

---

## Colaboración

| Con                  | Cuándo                                             | Acción                                        |
| -------------------- | -------------------------------------------------- | --------------------------------------------- |
| **architect**        | Schema nuevo, patrón no documentado, ADR pendiente | Cargar `@[.agent/agents/architect.md]`        |
| **quality-engineer** | Pre-release, audit R2+                             | Cargar `@[.agent/agents/quality-engineer.md]` |
| **db**               | Cambios de schema, queries complejas               | Cargar `domains/db/SKILL.md`                  |
| **ui**               | Componentes React nuevos, Tailwind patterns        | Cargar `domains/ui/SKILL.md`                  |
| **api**              | Server Actions, validación, error handling         | Cargar `domains/api/SKILL.md`                 |
| **security**         | Auth, RBAC, input validation                       | Cargar `domains/security/SKILL.md`            |
| **testing**          | Tests E2E, fixtures, mocking                       | Cargar `domains/testing/SKILL.md`             |

---

## Naming Conventions (Code)

### Archivos

| Tipo        | Convención | Ejemplo           |
| ----------- | ---------- | ----------------- |
| Componentes | PascalCase | `UserCard.tsx`    |
| Utilities   | kebab-case | `date-utils.ts`   |
| Actions     | kebab-case | `user-actions.ts` |
| Schemas     | kebab-case | `user-schema.ts`  |

### Código

| Tipo             | Convención        | Ejemplo                        |
| ---------------- | ----------------- | ------------------------------ |
| Variables        | camelCase         | `userId`, `isActive`           |
| Funciones        | camelCase (verbo) | `getUserById`, `validateEmail` |
| Componentes      | PascalCase        | `UserCard`, `PickButton`       |
| Types/Interfaces | PascalCase        | `User`, `CreatePickInput`      |
| Constantes       | SCREAMING_SNAKE   | `MAX_PICKS`, `API_URL`         |
| DB columns       | snake_case        | `created_at`, `user_id`        |

---

## Issue Status System

> Formatos EXACTOS para que `pnpm update-board` funcione.

| Status      | Format in Issue                           | Board Section      |
| ----------- | ----------------------------------------- | ------------------ |
| To Do       | `> **Status:** 📋 Backlog`                | 📅 To Do           |
| In Progress | `> **Status:** 🚧 In Progress`            | 🚧 In Progress     |
| Done        | `> **Status:** ✅ Done`                   | ✅ Done            |
| Postponed   | `> **Status:** ⏸️ Postponed`              | ⏸️ Postponed       |
| Won't Do    | `> **Status:** ❌ Won't Do`               | ❌ Won't Do        |
| Blocked     | `> **Status:** 🚫 Blocked by [ISSUE-XXX]` | (muestra en To Do) |

---

## Workflow Reference

> Para instrucciones detalladas, ver: `.agent/workflows/implement/implement.md`
>
> Las fases se cargan on-demand desde `phases/*.md`

---

_TimeKast Factory — Implement Expert Skill (Consolidated)_
