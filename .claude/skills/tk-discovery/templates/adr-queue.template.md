# ADR Queue — {{project}}

> **Phase 4c output (Tier L sub-ronda time)** — auto-populated por main orchestrator cuando un Tier L sub-ronda answer locks una decisión con `reversibility: high`. Persists durable post-Phase-8.
> **Consumed by:** Phase 7 architect agent (validation, NO rediscovery) + `/docs` phase (ADR drafting backlog).
>
> **Architectural rule:** orchestrator NEVER drafts the ADR text in this file — solo flagea que el ADR se necesita + cita la decisión locked + razón de reversibilidad. El drafting completo del ADR es `/docs` phase deliverable.

---

## Auto-flagged ADRs (Phase 4c sub-ronda time)

| ADR-NN | Topic                                             | Locked decision       | Phase 4c session      | Why ADR (reversibility rationale)                                                                                    | Status |
| ------ | ------------------------------------------------- | --------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------- | ------ |
| ADR-NN | {{topic — schema decision / state machine / etc}} | {{(a) option chosen}} | L{{N}} Q-L{{N}}.{{n}} | {{schema migration cost / state machine blast radius / recompute contract / cross-source unification / audit trail}} | open   |

---

## Heurística reversibility (referencia)

**HIGH (auto-emit ADR):**

- Schema-level: column shape, polymorphism, JSONB structure
- State machine transitions: multi-state lockdown invariants, lifecycle stage irreversibility
- Idempotency / recomputation contract: scope, transaction boundary, monotonicity
- Cross-source consistency: multi-API reconciliation, normalization
- Audit / versioning strategy: snapshot vs log vs hybrid

**MEDIUM (no auto-emit, surface a Phase 7 architect):**

- UI exposure decisions (wizard knob vs hidden DB-only)
- Default values per format vs per torneo
- Integration semantics (provider-priority cascades)

**LOW (no flag):**

- Copy strings, terminology choices
- Operational ergonomics: logs format, retry params within bounded ranges
- Cosmetic UI decisions

---

_TimeKast Factory — adr-queue (Phase 4c auto-populated)_
