# fx-workflow-authoring — Changelog

> Audit trail for the meta-skill that codifies CC-native workflow authoring doctrine. Convention: [Keep a Changelog](https://keepachangelog.com).
>
> **Scope rule:** heavy multi-file skills MAY maintain a CHANGELOG when version evolution narrative would otherwise leak into the executable body. This skill follows its own doctrine: body is ahistorical, evolution lives here.

---

## [Unreleased] — date TBD upon merge

### Added

- Initial v2 skill — CC-native workflow authoring doctrine.
- `SKILL.md` monolithic entry covering 17 sections: framing CC-native authoring, ontology table (agents = subprocesses aislados), 9 principios, file structure, frontmatter shape, SKILL.md sections in order, CP1 vs CP2 doctrine, subprocess delegation policy, skill grounding rule, invalidation handling rule, companions decision tree, wrapper rules, heavy vs ligero, heavy checklist, verificación funcional, boundary, post-change validation.
- `anti-patterns.md` with 14 sections + greps for CI: runtime/execution, structure, AG carry-overs (rescue exercise), frontmatter, scope, CC-specific gotchas, skill body discipline, subprocess skill citation, heavy without companions, wrapper anti-patterns, no-template-no-artifact (hard rule), missing invalidation handling, subprocess tools allowlist, review checklist final.
- `templates/` folder with 6 concrete skeleton files (not prose describing them):
  - `tk-skill.template.md` — SKILL.md skeleton with 11 sections marker "aplica si workflow tiene X".
  - `slash-command.template.md` — thin wrapper with mode detection + delegate.
  - `workflow-changelog.template.md` — Keep-a-Changelog buckets + Rationale + Verification path.
  - `checkpoint-inline.template.md` — CP1 compact mode + verbose mode + invalidation rule + sub-ronda.
  - `checkpoint-planmode.template.md` — CP2 synthesis structured (6 sub-sections).
  - `subprocess-prompt.template.md` — frontmatter with role-based tools allowlist + Mandate + Skill grounding + Input contract + Cuándo NO usar + Return summary.

### Rationale

- v1 framing was AG→CC translation; v2 reframes as CC-native authoring doctrine, with AG legacy material relegated to `anti-patterns.md §3` as a rescue exercise.
- v1 ontology described agents as "QUIÉN lo hace — persona"; v2 corrects to "subprocesses aislados con contexto propio" — the operative valor is isolation + load control + parallelism, not roleplay.
- v1 shipped templates as prose descriptions; v2 ships real skeleton files in `templates/` that authors can copy and fill.
- v1 ≤200 LOC SKILL.md constraint (AG residue) dropped. Monolithic SKILL.md works when well-structured with explicit turn boundaries and H2/H3 navigation; partir solo si secciones temáticamente separables, no por número de líneas.
- v1 missing 4 critical rules surfaced during external review and now codified:
  - **No template, no artifact** (hard rule).
  - **Wrapper no contradice skill** (wrapper redefinitions of checkpoint semantics are forbidden).
  - **Invalidation handling obligatoria** for any heavy workflow with checkpoints.
  - **Subprocess tools allowlist** with role-based defaults (writers get Write; auditors stay read-only).
- A cohesive walkthrough file referencing a single existing workflow was rejected during design: it risks biasing authors of new workflows to replicate that workflow's specific shape (multi-turn vs lineal, extraction vs synthesis, etc.) without filtering by their own domain. Doctrine in this skill is portable and does not anchor to any single existing workflow.

### Verification path

- All 6 template files exist under `templates/` and are referenced from at least one section of `SKILL.md` or `anti-patterns.md`.
- `anti-patterns.md §14` greps return empty (or expected matches) when run against this skill itself.
- `SKILL.md §15 Verificación funcional` applied to a hypothetical heavy workflow answers all 12 checklist questions without "depende" or "quizá".
- v1 `fx-workflow-authoring/` remains untouched for fallback comparison (side-by-side approach).

---

## How to add an entry

When making a change to `SKILL.md`, `anti-patterns.md`, or any `templates/*.template.md`:

1. Choose semantic version slot under `[Unreleased]` if no release is scheduled, or create a new versioned section above (e.g., `## [1.1.0] — 2026-MM-DD`).
2. Bucket the change: **Added** / **Changed** / **Deprecated** / **Removed** / **Fixed** / **Security**.
3. Write the entry as a behavior delta — what the skill describes now that it didn't before. Generic phrasing — no specific project names.
4. Reference the exact section/file modified (e.g., `See SKILL.md §8 Subprocess delegation`).
5. If the change has consequences for existing `tk-*` skills (e.g., a new rule added), note them under "Verification path."

---

_TimeKast Factory — fx-workflow-authoring CHANGELOG_
