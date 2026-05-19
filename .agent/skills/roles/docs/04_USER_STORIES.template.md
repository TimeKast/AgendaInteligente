# 📝 User Stories - {{PROJECT_NAME}}

> Generado desde Discovery Brief §3 + 02_FEATURE_MAP por `/docs`
> **Fuente:** `docs/planning/00_DISCOVERY_BRIEF.md`, `docs/planning/02_FEATURE_MAP.md`
> **SSOT:** Este documento define user stories con acceptance criteria.

---

## Épicas

| ID  | Épica      | Descripción           | Prioridad | Stories |
| --- | ---------- | --------------------- | --------- | ------- |
| E1  | {{Nombre}} | {{Descripción corta}} | 🔴 Must   | {{N}}   |
| E2  | {{Nombre}} | {{Descripción corta}} | 🔴 Must   | {{N}}   |
| E3  | {{Nombre}} | {{Descripción corta}} | 🟡 Should | {{N}}   |

---

## Stories por Épica

### Épica E1: {{Nombre de la Épica}}

#### US-001: {{Título corto}}

| Atributo       | Valor           |
| -------------- | --------------- |
| **Feature**    | FT-XXX          |
| **Prioridad**  | 🔴 Must Have    |
| **Persona**    | P-XXX ({{Rol}}) |
| **Estimación** | S / M / L / XL  |

**Como** {{rol de usuario}},
**quiero** {{acción que quiere realizar}}
**para** {{beneficio que obtiene}}.

```gherkin
Scenario: Happy path — {{descripción}}
  Given {{contexto inicial}}
  When {{acción del usuario}}
  Then {{resultado esperado}}

Scenario: Error — {{descripción}}
  Given {{contexto inicial}}
  When {{acción que causa error}}
  Then {{mensaje de error}} (BR-XXX)
```

---

## Priorización MoSCoW

### 🔴 Must Have (MVP)

| Count | Épicas |
| ----- | ------ |
| {{N}} | E1-EX  |

### 🟡 Should Have

| Count | Épicas |
| ----- | ------ |
| {{N}} | EX-EY  |

**Total:** {{N}} user stories

---

## Dependencias entre Stories

```
US-001 ({{desc}}) ──► US-XXX ({{desc}})
                  ──► US-YYY ({{desc}})
```

---

## Open Questions

| #     | Pregunta     | Respuesta |
| ----- | ------------ | --------- |
| OQ-01 | {{Pregunta}} | {{Resp}}  |

---

## Assumptions

| #    | Supuesto     | Si es incorrecto |
| ---- | ------------ | ---------------- |
| A-01 | {{Supuesto}} | Impacto: ...     |

---

_Generado por TimeKast Factory — /docs_
