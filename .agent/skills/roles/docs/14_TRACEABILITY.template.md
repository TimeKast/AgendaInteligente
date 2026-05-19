# 🔗 Traceability Matrix — {{PROJECT_NAME}}

> **Creado por:** `/docs` (stub con estructura)
> **Poblado por:** `/backlog` (mapeo US→Issue→Test)
> **Propósito:** Validar cobertura Requirements → Issues → Tests → Deploy

---

## Matriz de Trazabilidad

| US-ID  | Descripción     | Issue          | Test               | Deploy     |
| ------ | --------------- | -------------- | ------------------ | ---------- |
| US-001 | Login usuario   | AUTH-001       | auth.spec.ts       | ✅ Prod    |
| US-002 | Dashboard vista | DASH-001       | dashboard.spec.ts  | ✅ Prod    |
| US-003 | CRUD {{entity}} | {{PREFIX}}-001 | {{entity}}.spec.ts | 🚧 Dev     |
| US-004 | ...             | ...            | ...                | ⬜ Pending |

---

## Leyenda de Status

| Status     | Significado                         |
| ---------- | ----------------------------------- |
| ✅ Prod    | Deployed y verificado en producción |
| 🚧 Dev     | En desarrollo o staging             |
| ⬜ Pending | No iniciado                         |
| ❌ Failed  | Falló verificación                  |

---

## Por Feature

### FT-001: {{Nombre Feature}}

| Story  | Issue    | Test | Status  |
| ------ | -------- | ---- | ------- |
| US-001 | AUTH-001 | ✅   | ✅ Prod |
| US-002 | AUTH-002 | ✅   | ✅ Prod |

**Cobertura:** 2/2 stories (100%)

---

### FT-002: {{Nombre Feature}}

| Story  | Issue    | Test | Status |
| ------ | -------- | ---- | ------ |
| US-010 | DASH-001 | ✅   | 🚧 Dev |
| US-011 | DASH-002 | ⬜   | ⬜     |

**Cobertura:** 1/2 stories (50%)

---

## Resumen de Cobertura

| Métrica            | Valor            |
| ------------------ | ---------------- |
| Total User Stories | {{N}}            |
| Con Issue asignado | {{X}} ({{X/N}}%) |
| Con Test           | {{Y}} ({{Y/N}}%) |
| En Producción      | {{Z}} ({{Z/N}}%) |

---

## Gaps Identificados

| US-ID  | Gap       | Acción       |
| ------ | --------- | ------------ |
| US-XXX | Sin issue | Crear issue  |
| US-YYY | Sin test  | Agregar test |

---

_Stub creado por /docs — Poblado por /backlog_
