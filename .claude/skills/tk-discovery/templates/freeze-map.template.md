# Freeze Map — {{project}}

> **Produced by:** `dsc-freeze-map-extractor` agent (Phase 2 of `/discovery`)
> **Consumed by:** main orchestrator (Phase 3 Gap Interview + Phase 6 synthesis + Phase 7 Challenge Pass) · `/docs` phase downstream.
> **Schema canónico:** [`methodology.md §3`](../methodology.md).
>
> **Cross-ref:** ADRs flagged at Phase 4c sub-ronda time (reversibility=high) are persisted in a separate artifact at `discovery-artifacts/adr-queue.md`. Phase 7 architect agent reads both `freeze-map.md` + `adr-queue.md` as input. See template `adr-queue.template.md`.

**Run date:** {{YYYY-MM-DD}}
**Source package:** {{summary de files consumidos — text count + image count + total KB}}
**SoT hierarchy (declarada por el autor del source, o deducida):**

- {{doc-A}} → SoT principal / SoT crudo / Reference / Legacy / Context
- ...

**Stakeholder:** {{nombre PO}} · **Tech Lead:** {{nombre}} · **Deadline:** {{YYYY-MM-DD}}

**Assets inventoried (sweep de target repo):** {{paths de tokens + iconos + assets branding detectados en target, si aplica}}

---

## Firm Decisions

<!-- Decisiones explícitas del source + confirmadas en Phase 1 bootstrap.
     NO parafrasear la decisión — citar literal cuando sea posible.
     NO promover recommendations a firm.
     Reversibilidad: Low = config change safe · Med = schema/enum change · High = data migration required -->

| #   | Decisión             | Fuente                          | Reversibilidad   |
| --- | -------------------- | ------------------------------- | ---------------- |
| F1  | {{decisión literal}} | {{doc §N o entrevista Phase 1}} | Low / Med / High |
| F2  |                      |                                 |                  |

---

## Open Questions

<!-- OQs explícitas en el source + gaps detectados.
     Impacto: Alto = bloquea data model o architecture · Med = scope o UX · Bajo = detalle UI/copy
     Owner: Cliente (stakeholder decide) · TimeKast (interno) · Deep-Dive (se resuelve en Phase 4) -->

| #   | Pregunta              | Impacto           | Owner                          |
| --- | --------------------- | ----------------- | ------------------------------ |
| OQ1 | {{pregunta concreta}} | Alto / Med / Bajo | Cliente / TimeKast / Deep-Dive |

---

## Contradictions

<!-- Conflictos cross-doc (Estilo-C polished-vs-crudo, v2-vs-v1, etc) O intra-file.
     Citar literal A y B. Proponer acción específica, no "resolver con user" genérico.
     Si la acción es "Phase 3 pregunta específica", especificar el wording. -->

| #   | Doc A dice                    | Doc B dice                    | Qué hacer                                          |
| --- | ----------------------------- | ----------------------------- | -------------------------------------------------- |
| C1  | {{cita literal con path + §}} | {{cita literal con path + §}} | {{Phase 3 batch #1 / default / resolver con user}} |

---

## Recommendations

<!-- Marcadas [RECOMMENDED] — NO son firm. Phase 3 puede promoverlas si user las confirma.
     Fuente: quién la hizo (architect challenge pass, agent inference, source sugerencia, etc) -->

| #   | Recomendación                   | Fuente                       |
| --- | ------------------------------- | ---------------------------- |
| R1  | [RECOMMENDED] {{recomendación}} | {{doc §N / agent / Phase X}} |

---

## Post-MVP / Future

<!-- Items excluded explícitamente del MVP por el stakeholder. NO inferencias.
     Razón: por qué no MVP (scope reduction, timing, complexity, trade-off explícito) -->

| #   | Item     | Por qué no MVP                             |
| --- | -------- | ------------------------------------------ |
| PM1 | {{item}} | {{razón literal del stakeholder o fuente}} |

---

## Phase 3 Resolutions

<!-- Se llena DESPUÉS de Phase 3 Gap Interview.
     Cada resolution referencia su OQ o Contradiction fuente.
     Si una resolution invalida un Firm anterior → también lista ADR-needed o update-F-N. -->

### Estilo-C drift resolutions (contradictions C1-CN)

| #    | Resolución firm | Update de Firm previo                     |
| ---- | --------------- | ----------------------------------------- |
| R-C1 | {{texto}}       | F{{N}} confirma / override / nuevo F{{M}} |

### Scope + operational resolutions (OQ resolutions)

| #    | Resolución firm | Update                    |
| ---- | --------------- | ------------------------- |
| R-Q1 | {{texto}}       | OQ1 cierra / F{{N}} nueva |

### Tension sweep resolutions (derived OQs detectadas en sub-batch cierre)

| #   | Tensión                            | Resolución        |
| --- | ---------------------------------- | ----------------- |
| T1  | {{par de decisions incompatibles}} | {{user decision}} |

---

## Derived OQs (post-Phase-3)

<!-- OQs nuevas que emergieron DURANTE Phase 3 tension sweep.
     Diferentes de las OQs originales porque emergen de la interacción entre resolutions. -->

| #     | Pregunta                                    | Impacto | Owner   |
| ----- | ------------------------------------------- | ------- | ------- |
| OQ-D1 | {{pregunta nueva surgida en tension sweep}} | Med     | Cliente |

---

## Notes for downstream consumers

<!-- Anchors / warnings para Phase 3/4/6 + /docs elaboration:
     - Qué Firm decisions son irreversibles post primer Active
     - Qué OQs son blockers de Phase 4 vs /docs
     - Qué Contradictions requieren PO validation explícita
     - Qué assumption inferida debería ser confirmada con user antes de Phase 6 synthesis -->

1. {{nota 1}}
2. ...

---

_TimeKast Factory — Freeze Map (tk-discovery Phase 2 · produced by dsc-freeze-map-extractor)_
