# {PREFIX}-{NEXT}: 🧪 Epic Tests — {EPIC-NAME}

> **Issue ID:** {PREFIX}-{NEXT}
> **Priority:** P1
> **Effort:** M
> **Story Points:** 5
> **Status:** 📋 Backlog
> **Epic:** [EPIC-{NAME}](../epics/EPIC-{NAME}.md)

---

## 🎯 Objetivo

Completar la cobertura de tests para el epic {EPIC-NAME}, incluyendo unit tests faltantes, integration tests para flujos completos, E2E tests para escenarios críticos, y **ejecutar audit R3 (deep multi-agent review)** como cierre del epic.

---

## 📎 Doc References (Inline)

| Doc  | Sección | Link                                      |
| ---- | ------- | ----------------------------------------- |
| EPIC | {NAME}  | [EPIC-{NAME}.md](../epics/EPIC-{NAME}.md) |

---

## ✅ Criterios de Aceptación

### Unit Tests

- [ ] Cobertura mínima 80% para lógica de negocio del epic
- [ ] Todos los edge cases documentados en issues tienen test
- [ ] Mocks correctamente configurados

### Integration Tests

- [ ] Flujos principales del epic testeados end-to-end con DB
- [ ] Server actions del epic validados con inputs válidos/inválidos
- [ ] Manejo de errores verificado

### E2E Tests (Playwright)

- [ ] Happy path del flujo principal
- [ ] Escenario de error más crítico
- [ ] Mobile viewport verificado (si aplica)

### Audit R3 (Deep Multi-Agent Review)

- [ ] Ejecutar `/audit R3` con scope del epic
- [ ] Hallazgos críticos resueltos (0 unresolved)
- [ ] Reporte de audit guardado en `docs/reports/`

---

## 🥒 Escenarios (Gherkin)

> Basados en los escenarios de los issues del epic.

```gherkin
Escenario: Flujo completo del epic (happy path)
  Dado que estoy autenticado como "{rol}"
  Y {precondiciones del epic}
  Cuando {secuencia de acciones del flujo principal}
  Entonces {resultado esperado del epic}

Escenario: Manejo de error crítico
  Dado que estoy autenticado como "{rol}"
  Cuando {acción que causa error}
  Entonces veo el mensaje de error apropiado
  Y el sistema permanece en estado consistente
```

---

## 🔧 Contexto Técnico

**Tests a crear:**

- `__tests__/unit/{epic-name}/*.test.ts` — Unit tests
- `__tests__/integration/{epic-name}/*.test.ts` — Integration tests
- `e2e/{epic-name}.spec.ts` — E2E tests

**Comando de verificación:**

```bash
# Unit + Integration
pnpm test -- --grep "{epic-name}"

# E2E
pnpm test:e2e -- --grep "{epic-name}"

# Coverage
pnpm test:coverage -- --grep "{epic-name}"
```

---

**Dependencias de Issues:**

- Bloqueado por: TODOS los issues del epic ({PREFIX}-001 a {PREFIX}-{NEXT-1})
- Bloquea a: Cierre del epic

> 📝 **Nota sobre numeración:** `{NEXT}` = siguiente número secuencial después del último issue del epic.
> Ejemplo: Si el epic tiene AUTH-001, AUTH-002, AUTH-003 → este issue es AUTH-004.

---

## 🔍 Coverage Checklist por Issue

| Issue        | Descripción | Unit  | Integration | E2E       |
| ------------ | ----------- | ----- | ----------- | --------- |
| {PREFIX}-001 | {título}    | ✅/⬜ | ✅/⬜       | ✅/⬜/N/A |
| {PREFIX}-002 | {título}    | ✅/⬜ | ✅/⬜       | ✅/⬜/N/A |

---

## 🚫 Out of Scope

- Tests de performance (diferente issue)
- Tests de seguridad (audit)
- Refactoring de tests existentes (a menos que fallen)

---

## 📝 Implementation Evidence

### Tests Creados

| Fecha      | Test File | Tipo | Coverage |
| ---------- | --------- | ---- | -------- |
| YYYY-MM-DD | {file}    | unit | {%}      |

### Issues Encontrados

| Fecha      | Issue     | Acción      |
| ---------- | --------- | ----------- |
| YYYY-MM-DD | {bug/gap} | {qué hacer} |

---

## Commits

- `abc1234` — test: add unit tests for {epic-name}
- `def5678` — test: add E2E tests for {epic-name}

---

_Creado: {{DATE}}_
_Última actualización: {{DATE}}_
