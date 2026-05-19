# Design Engineering

## Purpose

Execution skill for turning visual direction into production-ready UI changes.
Does not choose art direction from scratch — implements, refines, systematizes, and polishes UI using the approved skin, layout rules, token system, iconography rules, and motion profile.

## Use This Skill When

- a screen needs visual polish in code
- a selected skin must be implemented
- the UI feels correct but generic
- tables, cards, filters, forms, or dashboards need refinement
- design tokens need to be applied consistently
- icon wrappers or visual variants need to be introduced
- hover/focus/selected/pressed states need improvement
- UI refactors must preserve product logic

## Do Not Use This Skill For

- backend or database work
- API design
- choosing the product visual strategy from scratch
- pure critique without implementation intent
- performance tuning unrelated to UI

## Inputs To Gather

Before implementation, collect or infer:

1. **Visual direction** — selected skin, visual tone, trust vs novelty posture
2. **Layout direction** — shell type, density, page composition expectations
3. **Theme direction** — primitives, semantic tokens, component tokens, skin overrides
4. **Iconography direction** — base icon family, accent icon rules, container treatment
5. **Motion direction** — motion tone, state transitions, reduced motion expectations
6. **Domain constraints** — finance/admin/operator/consumer, trust requirements, a11y needs

If any are missing, proceed conservatively and state assumptions.

## Required Process

### Step 1 — Identify UI Scope

- Which screen(s) or components are affected
- Whether the task is shell-level, component-level, or page-level
- What should remain untouched

### Step 2 — Identify Visual Problems

Classify current issues:

- weak hierarchy
- same-depth surfaces
- generic layout
- poor spacing rhythm
- dry tables
- weak nav identity
- inconsistent icon treatment
- poor interaction feedback
- weak dark mode contrast
- excessive card repetition

### Step 3 — Map to System Decisions

Translate visual intent into:

- token choices
- variant decisions
- wrapper components
- layout primitives
- motion primitives
- icon treatment rules

### Step 4 — Implement with Restraint

**Prefer:**

- reusable abstractions
- semantic tokens
- stable component APIs
- low-risk visual refactors
- strong consistency across related surfaces

**Avoid:**

- random one-off styling
- visual overcorrection
- adding effects without hierarchy
- touching unrelated logic
- introducing patterns that conflict with the design system

### Step 5 — Validate

Check:

- hierarchy is clearer
- components still align with the active skin
- dark/light mode still works
- contrast remains safe
- spacing is consistent
- responsive behavior is intact
- interaction states feel intentional
- the UI looks more premium without losing trust

## Common High-Leverage Targets

This skill is especially valuable for:

| Target                | Why                                  |
| --------------------- | ------------------------------------ |
| Page headers          | First thing users see, sets tone     |
| Search/filter bars    | Repeated across modules, high impact |
| Data tables           | Usually the weakest visual element   |
| KPI cards             | Opportunity for accent/emphasis      |
| Dashboards            | Composition defines premium feel     |
| Sidebars/topbars      | Shell identity                       |
| Form layouts          | Consistent input treatment           |
| Modal/drawer surfaces | Elevated surface hierarchy           |
| Empty/loading states  | Often forgotten, hurts polish        |

## System Rules

- Favor semantic tokens over raw values
- Favor component variants over repeated class strings
- Favor wrapper components over repeated visual patterns
- Respect the domain: finance/admin tools should not be over-styled
- Premium does not mean flashy
- Strong hierarchy beats decorative effects
- Accent treatments should have a role
- Every visual change should improve clarity, consistency, or feel

## Anti-Patterns

- "premium" = more blur, more gradient, more glow
- hardcoded visual values everywhere
- every card styled the same way
- nav and content surfaces blending together
- no visual distinction between base, panel, and overlay
- styling that makes data harder to scan
- mixing multiple style families in one pass
