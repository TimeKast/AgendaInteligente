# tk-discovery — Changelog

> Audit trail for the `/discovery` workflow and its supporting files (skill body, methodology, templates, scoped agents). Convention: [Keep a Changelog](https://keepachangelog.com).
>
> **Scope rule:** heavy multi-phase workflows under `tk-*` MAY maintain a CHANGELOG when version evolution narrative would otherwise leak into the executable skill body. Kit skills (`sk-*`, `kb-*`) do NOT need a CHANGELOG — that overhead is overkill for single-purpose reference skills.

---

## [Unreleased] — date TBD upon merge

### Added

- **R1** Tier L sub-rondas may share a single turn when features share architectural blast radius (data model, state machine, vendor surface). Question floor remains per-feature; no upper bound on questions per sub-ronda. See SKILL.md §Phase 4c.
- **R2** Source-arrival post-CP1: orchestrator computes delta size against current freeze-map. Below 30% threshold → in-place patch. At or above 30% → prompt user to choose between in-place patch vs full regeneration. See SKILL.md §Invalidation handling cross-phase.
- **R3** Adaptive intake: when N source files == 1, orchestrator performs inline extraction and skips Phase 1.2.5 cross-file reconciliation. When N ≥ 2, standard agent dispatch + cross-file reconciliation apply. See SKILL.md §Phase 1.2.2 and §Phase 1.2.5.
- **R4** Tier L entry template with parametrized slots in `templates/deep-dive.template.md`. Section §1 ("What this establishes") is the only slot requiring genuine prose synthesis; sections §2–§7 fill from sub-ronda Q-As, ADR queue rows, and freeze-map firms. Slot `{free-text-expand-here}` available for nuance.
- **CHANGELOG** — this file. Audit trail for tk-discovery workflow changes.

### Changed

- **R5** Phase 8 close includes a stripping sub-step prior to closure: remove journey narrative from durable artifacts (brief Resolved-section, freeze-map Resolutions sections, adr-queue session column, deep-dive Tier L sub-ronda headers). See SKILL.md §Phase 8 step 3.
- **R5** Output lifecycle reclassified: `challenge-pass.md`, `cross-file-reconciliation.md`, and `explore-pass.md` are audit-only and archive to `discovery-artifacts/_audit/` at Phase 8 close. They are not consumed by downstream phases. See SKILL.md §Archivos de output and §Phase 8 step 5.
- **R5.2** Phase 8 step 2 (GR2-traceability check): before stripping `§Resolved During Discovery` from the brief, orchestrator verifies that every Gap Round 2 stakeholder decision is reflected as a Firm in the brief proper or in `freeze-map.md`. If only present in the journey-form section, elevate to Firm form first.
- **R6** Skill body and methodology body are ahistorical: instructions describe current behavior without comparing to prior versions or referencing internal calibration runs. Version evolution narrative lives in this CHANGELOG, not in the executable skill body.

### Removed

- Project-name leakage from skill body, methodology body, templates, and scoped agent contracts. References to specific client and calibration-project names replaced with generic placeholders (`{project-slug}`, `{source}`).
- Workflow-evolution tags stripped: `(NEW v...)` markers, `post-refactor` notes, version-refinements header blocks, and `Closes WD-...` footers.
- Domain-content leakage from a calibration project (heuristic examples and edge case templates) replaced with generic equivalents in `SKILL.md` Phase 4c reversibility heuristic, `templates/adr-queue.template.md`, and `agents/dsc-feature-specer.md`.
- Stale references to a `dsc-brief-synthesizer` agent that does not exist (Phase 6 is orchestrator-direct). Stripped from `templates/freeze-map.template.md`, `templates/sk-leverage.template.md`, and `agents/dsc-feature-specer.md`.
- Bounded-range ceiling on Tier L sub-ronda question count (`2-4 clarificaciones`) replaced with floor-only formulation (`minimum 2, no upper bound`).

### Refactor

Workflow internal cleanup that pairs with the Performance bucket. Targets context-loading cost of subprocesses and removes a spec drift between Phase 6.2 and Phase 7.5 detected during this audit.

- **R12** Phase 6.2 / Phase 7.5 spec drift fixed. Both sub-phases previously defined the same post-GR2 re-synth operation, which left the orchestrator with two duplicated specs to reconcile. Phase 6.2 is now the single source of truth (criterio de "cambios materiales", Edit-vs-Write strategy, quantitative gate); Phase 7.5 collapses to a one-line reference back to 6.2.
- **R13** Phase 6.2 re-synth introduces an explicit "material changes" predicate (≥3 firms modified OR ≥1 firm affecting brief §1/§3/§6/§8 OR ≥1 MoSCoW reclassification) and an Edit-vs-Write strategy threshold: `delta_pct < 30%` AND no architectural-firm change → Edit incremental (section-by-section); otherwise Write full re-synth. Edit is materially faster in output tokens for the typical GR2 patch and reduces regression risk on v1 content.
- **R14** `methodology.md` (640 LOC) split into a `methodology/` sub-folder of six topical sub-files: `source-classification.md` (former §1), `intake.md` (former §2 + §6 + §7 + §10 + §16), `freeze-map.md` (former §3 + §4 + §8 + §15), `deep-dive.md` (former §5 + §11), `kit-leverage.md` (former §12), `factory-tickets.md` (former §13 + §14). `methodology.md` is preserved as a thin index pointing to each sub-file (not deleted) for back-compat with older instruction refs and human readers. Each subprocess prompt now cites the specific sub-file path it needs, reducing context cost per agent invocation. SKILL.md and the four `dsc-*` agent files updated to cite the sub-file paths.
- **R15** `fx-workflow-authoring` doctrine updated to reflect the lessons here so the next `tk-*` author is not forced to re-discover them: §11 Companions decision tree row clarifies the methodology single-file vs sub-folder decision criteria + the "thin index, do not delete" rule on split; §8 Subprocess delegation gains a "Model selection per agent" subsection codifying when to override `inherit` to `sonnet` (alias — the `model:` field accepts only `sonnet`/`opus`/`haiku`/`inherit`, never full model IDs); §14 heavy-workflow checklist gains a model-selection row.

### Performance

Wall-clock optimizations targeting the 3+ hour baseline observed in production runs. Estimated combined impact: -40 to -60 min per discovery (the larger PR2 refactor adds another -10 to -20 min via methodology context pruning).

- **R7** Phase 4b dispatches all Tier S/M batches in a single message (parallel) instead of one batch at a time with per-batch user checkpoint. Wall-clock = `max(batch time)` rather than `sum`. Single post-all-batches checkpoint replaces per-batch checkpoints. Concurrency cap: 10 simultaneous specers; partition into 2 internal serial waves if N > 10. See SKILL.md §Phase 4b.
- **R8** Phase 1.2.2 circuit breaker raised from 10 → 20 concurrent intake agents. Anthropic API handles 20+ concurrent calls in practice; conservative cap was losing parallelism on large source packages. User-facing prompt before dispatch preserved.
- **R9** Phase 1.3 asset sweep migrated from `-not -path` post-filter to `-prune` directory-cut for `node_modules`, `.next`, `.git`, `dist`, `build`. Saves seconds-to-minutes on large monorepos because traversal stops at the directory entry instead of descending then filtering.
- **R10** Phase 7 challenge dispatch co-loads Plan Mode primitives (`EnterPlanMode`, `ExitPlanMode`) via `ToolSearch` in the same message as the 3-agent dispatch. By the time agents finish + GR2 processes, CP2 enters without a tool-loading gap. Pre-load note in CP2 §Mecanismo updated to reflect new dispatch site.
- **R11** `dsc-intake-analyst` and `dsc-feature-specer` set `model: sonnet` (overriding `inherit`). The `model:` field accepts only the aliases `sonnet`/`opus`/`haiku`/`inherit` (never full model IDs); the alias resolves to the latest Sonnet at run time. Both agents run structured-text extraction following fixed schemas in massively-parallel patterns; Sonnet handles this profile well and runs ~3-5× faster than Opus. Other discovery agents (`dsc-freeze-map-extractor`, `dsc-kit-analyst`, `architect`, `product-owner`, `project-planner`) keep `inherit` because their tasks involve denser cross-source reasoning where Opus depth is justified.

### Rationale

Post-mortem of a recent production discovery run (~4-hour duration) surfaced three observations:

- Workflow-evolution narrative in the skill body confused the executing agent: retrospective phrasing read as current behavior instruction.
- Project-name and calibration-project leakage in examples compromised skill portability across new projects.
- Journey narrative in durable artifacts created cognitive noise for downstream phases (`/docs`, `/design`, `/backlog`, `/implement`) which need final state, not the path taken to reach it.

### Verification path

- Grep for client project names, calibration project IDs, and workflow-evolution vocabulary returns zero hits across `SKILL.md`, `methodology.md`, `templates/*.md`, and `agents/dsc-*.md`.
- Skill body and methodology body contain no version-evolution tags or retrospective phrasing.
- Phase 8 close step list includes stripping and audit-archival action items.
- Phase 4c rule states minimum question count, no upper bound.

---

## How to add an entry

When making a change to `SKILL.md`, `methodology.md`, `templates/*.md`, or scoped `agents/dsc-*.md`:

1. Choose semantic version slot under `[Unreleased]` if no release is scheduled, or create a new versioned section above `[Unreleased]` (e.g., `## [5.1.0] — 2026-MM-DD`).
2. Bucket the change: **Added** (new behaviors), **Changed** (modified behaviors), **Deprecated** (still works, slated for removal), **Removed** (deleted), **Fixed** (bug fixes), **Security** (security-relevant).
3. Write the entry as a behavior delta — what the workflow does now that it didn't do before, or vice versa. Use generic phrasing — no specific project names or calibration IDs.
4. Reference the exact section/file modified (e.g., `See SKILL.md §Phase 4c`) so future readers can locate the change.
5. If the change has user-visible consequences during a `/discovery` run, note them under "Verification path."
