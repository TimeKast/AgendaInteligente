# Design System Guide

> The TimeKast Factory design system uses **Neomorphism 2.0** — a soft, tactile visual language where shadow defines edges instead of borders.

---

## 1. Core Concept

In neomorphism, surfaces "push out" (outset) or "push in" (inset) from the background. There are no visible borders — everything is defined by light and shadow.

**Key principle:** `--border: transparent` across all themes. Components never use `border` for visual edges.

---

## 2. Neo Shadow Tokens

All shadows are defined as CSS custom properties in `src/app/globals.css` and adapt automatically per theme.

### Token Reference

| Token                | Effect              | Size   | Use Case                          |
| -------------------- | ------------------- | ------ | --------------------------------- |
| `--neo-outset-sm`    | Raised, subtle      | 3px    | Buttons default, cards small      |
| `--neo-outset`       | Raised, standard    | 6px    | Cards, containers                 |
| `--neo-outset-lg`    | Raised, prominent   | 10px   | Hero cards, modals                |
| `--neo-outset-hover` | Raised, hover state | 8px    | Button hover                      |
| `--neo-inset-sm`     | Sunken, subtle      | 2px    | Inputs, switches, select triggers |
| `--neo-inset`        | Sunken, standard    | 3px    | Input focused, active states      |
| `--neo-pressed`      | Deeply sunken       | 4px    | Button active/pressed state       |
| `--neo-float`        | Elevated overlay    | 8+32px | Dialogs, dropdowns, popovers      |
| `--neo-flat`         | No shadow           | none   | Disabled states                   |

### How They're Built

Each token uses two sub-values that change per theme:

```css
/* Light theme */
--neo-light: rgba(245, 245, 245, 0.55); /* highlight */
--neo-dark: rgba(136, 150, 171, 0.35); /* shadow */

/* Dark theme */
--neo-light: rgba(35, 55, 80, 0.7);
--neo-dark: rgba(10, 15, 25, 0.7);
```

The outset tokens create a dual shadow (dark bottom-right, light top-left):

```css
--neo-outset-sm: 3px 3px 6px var(--neo-dark), -3px -3px 6px var(--neo-light);
```

---

## 3. Utility Classes

Use these CSS classes directly in your components. All classes automatically set `border: none`.

### Base Classes

| Class              | Maps to              | When to use                  |
| ------------------ | -------------------- | ---------------------------- |
| `neo-outset`       | `--neo-outset`       | Containers, cards            |
| `neo-outset-sm`    | `--neo-outset-sm`    | Buttons, small cards, tags   |
| `neo-outset-lg`    | `--neo-outset-lg`    | Hero sections, large cards   |
| `neo-outset-hover` | `--neo-outset-hover` | Button hover state           |
| `neo-inset-sm`     | `--neo-inset-sm`     | Inputs, switches, checkboxes |
| `neo-inset`        | `--neo-inset`        | Focus states for inputs      |
| `neo-pressed`      | `--neo-pressed`      | Active/pressed button state  |
| `neo-float`        | `--neo-float`        | Modals, dropdowns, popovers  |
| `neo-flat`         | `none`               | Disabled states              |

### Composite Classes

| Class             | Behavior                                                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| `neo-interactive` | `outset-sm` → hover:`outset` → active:`pressed`                                                 |
| `neo-focus`       | Adds ring + outset-sm on focus-visible _(currently unused — manual focus classes used instead)_ |
| `neo-focus-inset` | Adds ring + inset on focus-visible _(currently unused)_                                         |

---

## 4. Decision Table: Which Shadow to Use

```
Is it a container/surface?
├── Yes → neo-outset (card, section)
│         neo-outset-sm (small card, tag)
│
Is it an input/control that receives data?
├── Yes → neo-inset-sm (resting)
│         neo-inset (focused)
│
Is it a button/interactive element?
├── Yes → neo-outset-sm (resting)
│         neo-outset (hover)
│         neo-pressed (active)
│
Is it an overlay/floating panel?
├── Yes → neo-float (dialog, dropdown, popover)
│
Is it disabled?
└── Yes → neo-flat
```

---

## 5. Color Architecture

### Token Categories

| Category     | Tokens                                                     | Purpose               |
| ------------ | ---------------------------------------------------------- | --------------------- |
| **Base**     | `--background`, `--foreground`                             | Page and text         |
| **Surfaces** | `--card`, `--sidebar-bg`, `--header-bg`                    | Structural containers |
| **Brand**    | `--primary`, `--secondary`, `--accent`                     | Brand identity        |
| **Status**   | `--success`, `--error`, `--warning`, `--info`              | Feedback              |
| **Inputs**   | `--input-bg`                                               | Form fields           |
| **Tables**   | `--table-header-bg`, `--table-row-bg`, `--table-row-hover` | Data display          |

### Principle: Card = Background

In neomorphism, `--card` must be the **same color** as `--background`. The card's "edge" is visible only through shadow, not color difference.

```css
--background: #e0e5ec;
--card: #e0e5ec; /* Same! */
```

---

## 6. Theming

### Available Themes

The kit ships with 3 themes defined in `globals.css`:

| Theme    | Selector          | Background            |
| -------- | ----------------- | --------------------- |
| Light    | `:root`, `.light` | `#e0e5ec` (warm gray) |
| Dark     | `.dark`           | `#1a2332` (navy)      |
| Midnight | `.midnight`       | (custom slate)        |

### Creating a Custom Theme

1. Add a new CSS block in `globals.css` with your theme selector
2. Define ALL token categories (base, surfaces, brand, status, neo)
3. The neo tokens adapt automatically if you set `--neo-light` and `--neo-dark`

```css
.my-theme {
  --background: #your-bg;
  --foreground: #your-text;
  --card: #your-bg; /* Same as background! */

  /* Set these two and all neo shadows adapt */
  --neo-light: rgba(255, 255, 255, 0.5); /* highlight direction */
  --neo-dark: rgba(0, 0, 0, 0.2); /* shadow direction */

  /* The rest follows automatically */
  --neo-outset: 6px 6px 12px var(--neo-dark), -6px -6px 12px var(--neo-light);
  /* ... copy the full set from an existing theme */
}
```

### Legacy Shadow Compatibility

The kit maps standard shadow tokens to neo equivalents:

```css
--shadow-sm → var(--neo-outset-sm)
--shadow-md → var(--neo-outset)
--shadow-lg → var(--neo-outset-lg)
```

This means any library that uses `shadow-sm/md/lg` will automatically get neo shadows.

---

## 7. Component Patterns

### How Components Use the System

| Component Type   | Resting            | Hover          | Active                    | Focus              |
| ---------------- | ------------------ | -------------- | ------------------------- | ------------------ |
| **Button**       | `neo-outset-sm`    | `neo-outset`   | `neo-pressed`             | ring               |
| **Card**         | `neo-outset`       | —              | —                         | —                  |
| **Input**        | `neo-inset-sm`     | —              | —                         | `neo-inset` + ring |
| **FormSelect**   | `neo-inset-sm`     | —              | —                         | `neo-inset` + ring |
| **Dialog**       | `neo-float`        | —              | —                         | —                  |
| **Dropdown**     | `neo-float`        | —              | —                         | —                  |
| **Tab (active)** | `neo-inset-sm`     | —              | —                         | —                  |
| **Switch**       | `neo-inset-sm`     | —              | —                         | ring               |
| **NeoCheckbox**  | `neo-inset`        | —              | `neo-outset-sm` (checked) | —                  |
| **Badge**        | `--badge-*` tokens | —              | —                         | —                  |
| **Pagination**   | `neo-outset-sm`    | `neo-inset-sm` | `neo-inset`               | —                  |
| **Disabled**     | `neo-flat`         | —              | —                         | —                  |

### Rules

1. **Never use `border` for visual edges** — use shadow
2. **Never hardcode shadow values** — use neo tokens
3. **`border: transparent`** is the default (set by utility classes)
4. **Containers outset, inputs inset** — the fundamental pattern
5. **Float for overlays** — dialogs, dropdowns, popovers stand above
6. **Use Tailwind arbitrary values** for CSS custom properties: `bg-(--table-row-bg)`, `text-(--table-header-foreground)` — never `style={{}}`

---

_TimeKast Factory — Design System Guide_

---

## 8. Known Exceptions

Some contexts legitimately require patterns that differ from the rules above:

| Context                             | Why                                  | Example                                                    |
| ----------------------------------- | ------------------------------------ | ---------------------------------------------------------- |
| Layout shells (`Sidebar`, `Header`) | Tokens not in `@theme inline`        | `style={{ backgroundColor: 'var(--sidebar-bg)' }}`         |
| Tiny notification badges (8-10px)   | Neo tokens produce oversized shadows | `shadow-sm` is acceptable                                  |
| Safe area insets                    | No Tailwind equivalent               | `style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}` |

---

## See Also

- [`sk-ui`](../skills/sk-ui/SKILL.md) — Kit-shipped UI primitives (tables, forms, dialogs)
- [`sk-crud-scaffold`](../skills/sk-crud-scaffold/SKILL.md) — Gold standard CRUD orchestrator
- [`kb-ui`](../skills/kb-ui/SKILL.md) — Portable layout / responsive patterns
- [`sk-tokens-neomorphism`](../skills/sk-tokens-neomorphism/SKILL.md) — Tokens + theming ref
