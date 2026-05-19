# {PREFIX}-{N}: 🎨 @ui-critic Audit + Fix — {EPIC-NAME}

> **Issue ID:** {PREFIX}-{N}
> **Priority:** P1
> **Effort:** S
> **Story Points:** 2
> **Status:** 📋 Backlog
> **Epic:** [EPIC-{NAME}](../epics/EPIC-{NAME}.md)
> **Skills:** `domains/ui`, `design-system-principles`, `design-engineering`
> **Agents:** `ui-critic`, `frontend-specialist`
> **Owner:** {OWNER}

---

## 🎯 Objetivo

Ejecutar auditoría de design system compliance + visual quality sobre todos los componentes y screens implementados en el epic {EPIC-NAME}. Corregir violaciones de design system (BLOCKER) y los 3 fixes de mayor impacto visual.

---

## 📎 Doc References (Inline)

| Doc  | Sección | Link                                      |
| ---- | ------- | ----------------------------------------- |
| EPIC | {NAME}  | [EPIC-{NAME}.md](../epics/EPIC-{NAME}.md) |

---

## ✅ Criterios de Aceptación

### Design System Compliance (OBLIGATORIO)

- [ ] DS1: Ningún color hardcoded — todos usan design tokens
- [ ] DS2: Ningún componente inline que duplique UI kit (verificado contra INVENTORY.md)
- [ ] DS3: Valores de radius, shadow, spacing consistentes con la escala del sistema
- [ ] DS4: Verificado en TODOS los temas del proyecto (light, dark, midnight u otros)
- [ ] DS5: Surface hierarchy distinguible (base vs panel vs overlay)
- [ ] DS6: No se usan utilidades genéricas del framework donde existen tokens custom

### Visual Quality (BEST EFFORT)

- [ ] Corregir top 3 fixes de mayor impacto visual identificados por @ui-critic
- [ ] Score promedio ≥ 7/10 en dimensiones de calidad (o justificar excepciones)

---

## 🥒 Escenarios (Gherkin)

```gherkin
Escenario: Compliance del design system
  Dado que ejecuto @ui-critic sobre los componentes del epic
  Cuando analiza tokens, componentes, y temas
  Entonces el compliance report es ✅ PASS (0 BLOCKERs)

Escenario: Verificación multi-theme
  Dado que el proyecto tiene temas light, dark, y midnight
  Cuando reviso cada componente del epic en los 3 temas
  Entonces no hay elementos invisibles, ilegibles, ni inconsistentes

Escenario: Corrección de top fixes
  Dado que @ui-critic identifica las mejoras de mayor impacto
  Cuando corrijo las top 3
  Entonces el score promedio de calidad visual mejora respecto al estado anterior
```

---

## 🔧 Contexto Técnico

**Componentes a auditar:**

> Listar todos los componentes/screens creados o modificados por los issues del epic:

- `{component-1}` — de {PREFIX}-001
- `{component-2}` — de {PREFIX}-002
- _(agregar todos al implementar)_

**Invocación:**

1. Cargar agent `@ui-critic` + skills `design-system-principles`, `design-engineering`
2. Ejecutar Part 1 (Compliance) sobre cada componente
3. Ejecutar Part 2 (Quality) sobre cada screen/página
4. Corregir BLOCKERs → re-verificar
5. Corregir top 3 quality fixes

---

**Dependencias de Issues:**

- Bloqueado por: TODOS los issues de implementación del epic ({PREFIX}-001 a {PREFIX}-{N-2})
- NO bloqueado por: Issue de testing ({PREFIX}-{LAST} — 🧪 Tests)
- Bloquea a: Nada (issue de testing puede avanzar en paralelo)

> 📝 **Nota sobre numeración:** `{N}` = penúltimo issue, justo antes de 🧪 Tests.
> Ejemplo: Si el epic tiene AUTH-001 a AUTH-003 → este es AUTH-004, y 🧪 Tests es AUTH-005.

---

## 🚫 Out of Scope

- Refactoring funcional (solo visual)
- Cambiar architecture de componentes
- Fixes que requieran cambios de schema o API
- Agregar tests (eso es el issue de 🧪 Tests)

---

## 📝 Implementation Evidence

### Compliance Report

| ID  | Check                    | Status | Evidence |
| --- | ------------------------ | ------ | -------- |
| DS1 | Token Usage              | ✅/🔴  | {detail} |
| DS2 | Component Reuse          | ✅/🔴  | {detail} |
| DS3 | Scale Consistency        | ✅/🟡  | {detail} |
| DS4 | Multi-Theme              | ✅/🔴  | {detail} |
| DS5 | Surface Hierarchy        | ✅/🟡  | {detail} |
| DS6 | Framework Token Override | ✅/🔴  | {detail} |

**Compliance Verdict:** ✅/🔴

### Quality Fixes Applied

| #   | Fix                | Before | After  |
| --- | ------------------ | ------ | ------ |
| 1   | {highest leverage} | {desc} | {desc} |
| 2   | {second}           | {desc} | {desc} |
| 3   | {third}            | {desc} | {desc} |

---

## Commits

_(se llena durante /implement)_

---

_Creado: {{DATE}}_
_Última actualización: {{DATE}}_
