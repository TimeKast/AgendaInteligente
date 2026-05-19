# Challenge Pass — {{project_slug}}

> **Produced by:** main orchestrator (Phase 7.2 of `/discovery`) consolidando outputs de los 3 reviewers paralelos (`architect`, `product-owner`, `project-planner`).
> **Consumed by:** main orchestrator en Phase 7.4 Gap Round 2 + Phase 7.5 re-synth + CP2.
> **Lifecycle:** audit-only — archivado a `discovery-artifacts/_audit/challenge-pass.md` en Phase 8 close.

**Run date:** {{YYYY-MM-DD}}
**Brief draft auditado:** `project/{{discovery-dir}}/00_DISCOVERY_BRIEF.md` (Phase 6 first-pass output)

---

## architect — verdict {{🟢 / ⚠️ / 🔴}}

**Lens:** irreversible architectural decisions, tech risks, constraints bypassed. NO produce ADR aquí — flag risks only.

### Findings

| Severity | Finding       | Reference (brief §) | Recommendation                                         |
| -------- | ------------- | ------------------- | ------------------------------------------------------ |
| HIGH     | {{finding 1}} | §{{N}}              | {{ADR required / refactor scope / accept with caveat}} |
| MED      | {{finding 2}} | §{{N}}              | {{...}}                                                |
| LOW      | {{finding 3}} | §{{N}}              | {{...}}                                                |

### Cross-impacts

- {{impact 1: cómo finding A condiciona finding B}}
- {{impact 2}}

---

## product-owner — verdict {{🟢 / ⚠️ / 🔴}}

**Lens:** user-intent preservation, scope drift, MVP boundary integrity, MoSCoW prioritization soundness, features without clear user problem (and vice versa).

### Findings

| Severity | Finding       | Reference (brief §) | Recommendation                                              |
| -------- | ------------- | ------------------- | ----------------------------------------------------------- |
| HIGH     | {{finding 1}} | §{{N}}              | {{stakeholder decision needed / scope-cut / re-prioritize}} |
| MED      | {{finding 2}} | §{{N}}              | {{...}}                                                     |
| LOW      | {{finding 3}} | §{{N}}              | {{...}}                                                     |

---

## project-planner — verdict {{🟢 / ⚠️ / 🔴}}

**Lens:** timeline realism, hidden dependencies, premature commitments, rollback paths, descope plan viability.

### Findings

| Severity | Finding       | Reference (brief §) | Recommendation                                 |
| -------- | ------------- | ------------------- | ---------------------------------------------- |
| HIGH     | {{finding 1}} | §{{N}}              | {{descope item / parallelize / extend window}} |
| MED      | {{finding 2}} | §{{N}}              | {{...}}                                        |
| LOW      | {{finding 3}} | §{{N}}              | {{...}}                                        |

---

## Stakeholder decisions surfaced (Gap Round 2 candidates)

<!-- Filtrar de los HIGH findings los que requieren decisión del user (vs implementation decisions
     que el orchestrator/tech lead resuelve). Estos van a Phase 7.4 mini-batch. -->

| #     | Pregunta para stakeholder | Owner finding                | Buckets afectados             |
| ----- | ------------------------- | ---------------------------- | ----------------------------- |
| GR2-1 | {{pregunta concreta}}     | {{architect / PO / planner}} | {{schema / scope / timeline}} |

---

## ADRs flagged

<!-- Architect HIGH findings que requieren ADR. Agregar a `adr-queue.md` para drafting en /docs. -->

| ADR-ID     | Topic     | Reversibility | Rationale                |
| ---------- | --------- | ------------- | ------------------------ |
| ADR-{{NN}} | {{topic}} | high / medium | {{por qué requiere ADR}} |

---

_TimeKast Factory — Challenge Pass (tk-discovery Phase 7.2 · audit-only)_
