# Deep-Dive — {{project}}

> **Produced by:** `dsc-feature-specer` agents (Phase 4b, paralelos) + main orchestrator (Phase 4c Tier L dedicated sessions).
> **Consumed by:** `dsc-kit-analyst` (Phase 5), main orchestrator at Phase 6 (synthesis), `/docs` + `/implement` phases downstream.
> **Schema canónico:** [`methodology.md §11`](../methodology.md) (7 fields per-feature).
>
> **Architectural rule for `Rules` field:** when populating BR refs in Rules, the F-code referenced at the END of each BR DEBE include parenthesized 1-line meaning (`(F{N}: {what it locks})`). Bare F-codes force `/implement` consumers to grep `freeze-map.md` for basic semantic. Self-contained at citation site = single-pass per /implement task.

**Run date:** {{YYYY-MM-DD}}
**Feature count:** {{N FTs total}} · {{S}} Tier S · {{M}} Tier M · {{L}} Tier L

---

## Tiering classification (Phase 4a output)

<!-- Tabla de clasificación que sale de Phase 4a. Guía cómo se procesa cada feature en 4b/4c:
     - Tier S = SK-trivial (Configure), 1-fila compact (no 7-fields)
     - Tier M = Extend (kit base + custom), 7-fields estándar
     - Tier L = Build custom (irreversible, state-machine-worthy), 7-fields + sub-ronda clarificación con user -->

| FT-ID | Nombre             | Tier | Razón                                                        |
| ----- | ------------------ | ---- | ------------------------------------------------------------ |
| FT-01 | {{Auth triple}}    | S    | SK ships end-to-end, feature-flag level                      |
| FT-11 | {{Scoring engine}} | L    | Build custom, schema-level decisions, needs /docs state spec |

---

## Tier S features (compact 1-row)

<!-- Solo nombre + SK skill ref + 1-línea descripción. 7-fields overkill aquí. -->

| FT-ID | Feature                                            | SK skill      | 1-línea                                             |
| ----- | -------------------------------------------------- | ------------- | --------------------------------------------------- |
| FT-01 | Auth triple (password + magic-link + Google OAuth) | `sk-security` | Plug NextAuth providers, env-gated, no custom logic |

---

## Tier M features (7-fields compact)

### FT-{{NN}} — {{Feature name}}

| Field           | Detalle                                                                                                                                                                                                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Happy**       | {{Flujo principal step-by-step}}                                                                                                                                                                                                                                           |
| **Edge**        | {{Error/edge cases + cómo se manejan. Si ≥3 estados → usar sub-bullets numerados.}}                                                                                                                                                                                        |
| **Auto/manual** | {{Qué dispara auto vs manual user action}}                                                                                                                                                                                                                                 |
| **Ref**         | {{App similar o screenshot o doc referenciado}}                                                                                                                                                                                                                            |
| **Users**       | {{Roles RBAC que interactúan + permisos}}                                                                                                                                                                                                                                  |
| **Data**        | {{Entidades afectadas + mutation pattern. Listar tables/columns tentativas.}}                                                                                                                                                                                              |
| **Rules**       | {{BR-IDs aplicables (BR-{DOMAIN}-{NN} format) con 1-line summary cada uno. F-code citado al final con paréntesis explicit: `(F{N}: {what it locks})`. Ejemplo: `BR-LB-01 email NEVER in leaderboard payload (F110: fairness invariant — pii nunca en endpoint público)`.}} |

---

## Tier L features (7-fields + state-spec hint para /docs)

### FT-{{NN}} — {{Feature name}}

| Field           | Detalle                                                                                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Happy**       | {{Flujo principal}}                                                                                                                                                           |
| **Edge**        | {{Estados + transiciones como bullets de alto nivel. NO ASCII diagrams (eso es /docs).}}                                                                                      |
| **Auto/manual** | {{Triggers}}                                                                                                                                                                  |
| **Ref**         | {{Reference doc / source §}}                                                                                                                                                  |
| **Users**       | {{Roles}}                                                                                                                                                                     |
| **Data**        | {{Entidades + CHECK constraints tentativas}}                                                                                                                                  |
| **Rules**       | {{BR-IDs críticas con 1-line summary cada uno + F-code parenthesized inline al final (`(F{N}: {meaning})`). Self-contained — `/implement` no debe forzar grep a freeze-map.}} |

**⚠️ Needs /docs elaboration:**

- [ ] State machine diagram (ASCII/mermaid) con transiciones condicionales
- [ ] Golden fixtures spec (per-format/per-scenario)
- [ ] Sequence diagrams para flujos críticos
- [ ] API contract derivado de schema
- [ ] {{otros hints específicos de esta feature}}

**Phase 4c sub-ronda clarifications resueltas (user-validated):**

- Q-L{{N}}.{{n}} `[reversibility: {{high|medium|low}}]` → ({{a/b/c/d}}) {{user response}}
  {{si reversibility=high → flagged as ADR-{{NN}} en `discovery-artifacts/adr-queue.md`}}

---

## Tier L entry slots (parametrized — orchestrator fills from sub-ronda Q-As + ADR queue + freeze-map firms)

> Use this 7-section template for Tier L entries written in Phase 4c. Section §1 is the only one requiring genuine prose synthesis; sections §2-§7 fill from structured inputs (sub-ronda answers + ADR queue + freeze-map). Slot `{{free-text-expand-here}}` is available within any section if a feature has nuance the standard structure can't capture.

```markdown
## FT-{{ID}} — {{Title}} (Tier L · L{{N}})

> **ADRs flagged:** ADR-{{XX}}, ADR-{{YY}}, ADR-{{ZZ}}
> **Inherits from:** {{parent FT name(s) + which decisions cascade to this feature}}
> **Consumed by:** {{child FT name(s) + how they consume this feature}}

### 1. What this feature establishes

<!-- 1-2 paragraphs of synthesis explaining the feature's purpose + why it's Tier L (architectural blast radius). This is the only slot requiring genuine prose. -->

{{prose synthesis}}

### 2. Acceptance criteria (high-level)

<!-- Bullets derived from sub-ronda answers + freeze-map firms. Reference ADRs inline. -->

- {{AC bullet}} `[{{F-code or ADR ref}}]`
- {{AC bullet}}
- {{AC bullet}}
  {{free-text-expand-here}}

### 3. Data model deltas (sketch — finalized in /docs)

<!-- Pseudo-schema or table sketches. Derived from ADR locks. -->

\`\`\`
{{schema sketch}}
\`\`\`
{{free-text-expand-here}}

### 4. Dependencies + downstream feature consumption

<!-- Compact table or graph. Auto-fillable from cross-feature context. -->

- **{{FT-X}}** — {{how this feature is consumed}}
- **{{FT-Y}}** — {{how this feature is consumed}}

### 5. SK leverage hints (for Phase 5)

<!-- Bullets per sk-* skill referenced. Prospective if no derived repo yet. -->

- **`{{sk-skill-name}}`** — {{how used / what's leveraged}}
- {{drift expected vs sk-features-index}}

### 6. Edge cases / OQs deferred to /docs

<!-- Bullet list of remaining open questions for /docs phase. -->

- {{OQ statement}}
- {{OQ statement}}
  {{free-text-expand-here}}

### 7. Risks + adjacent decisions

<!-- H1/H2/M1 risks derived from sub-ronda Qs tagged HIGH-reversibility. Each: 1-2 sentences. -->

- **Risk H1 (HIGH):** {{1-2 sentence concern + mitigation reference}}
- **Risk H2 (HIGH):** {{...}}
- **Risk M1 (MEDIUM):** {{...}}
  {{free-text-expand-here}}
```

> **Filling discipline:** §1 prose, §2-§4 + §6 + §7 mostly auto-derive from inputs the orchestrator already holds (sub-ronda answers, ADR queue rows, freeze-map firms, cross-feature dependencies). §5 references `sk-*` skills by name; verify with `sk-features-index` before locking. Resist filling slots with prose-from-scratch when structured inputs exist.

---

## Business Rules introducidas

<!-- Enumeración completa de BRs surfaced en todos los FT entries.
     Format: BR-{DOMAIN}-{NN}. Domains: AUTH, ID, DUMMY, INV, SINV, TRN, OFF, FMT,
     PICK, LOCK, AP, CANCEL, SCORE, LB, BD, AUTO, NOTIF, ADM, UM, ADS, SURV, RT, etc.
     NO reducir a "top 5-10" — enumerar completo. /docs elabora sin re-descovery. -->

| BR-ID      | Regla             |
| ---------- | ----------------- |
| BR-AUTH-01 | {{regla literal}} |

---

## Factory-ticket candidates (workflow-drift)

<!-- Si el Edge bucket de un FT Tier L excede 500 chars, O si ≥2 FTs Tier L requieren
     diagrams que el 7-fields no captura — surface como candidate `workflow-drift` ticket.
     Orchestrator decide emitir en Phase 8 con user approval. -->

| FT-ID | Trigger | Evidence |
| ----- | ------- | -------- |
|       |         |          |

---

_TimeKast Factory — Deep-Dive (tk-discovery Phase 4 · tiered by complexity)_
