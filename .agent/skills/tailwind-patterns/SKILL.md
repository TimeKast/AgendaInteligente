---
name: tailwind-patterns
description: Tailwind CSS v4 principles. CSS-first configuration, container queries, modern patterns.
allowed-tools: Read, Write, Edit
---

# Tailwind CSS Patterns (v4 - 2025)

> Modern utility-first CSS with CSS-native configuration.

---

## 1. Tailwind v4 vs v3

| v3 (Legacy)          | v4 (Current)                 |
| -------------------- | ---------------------------- |
| `tailwind.config.js` | CSS-based `@theme` directive |
| PostCSS plugin       | Oxide engine (10x faster)    |
| JIT mode             | Native, always-on            |
| Plugin system        | CSS-native features          |

---

## 2. Configuration in CSS

### Theme Definition

```css
@theme {
  /* Colors - semantic names */
  --color-primary: oklch(0.7 0.15 250);
  --color-surface: oklch(0.98 0 0);

  /* Spacing scale */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 2rem;

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
}
```

---

## 3. Breakpoint System

| Prefix | Min Width | Target            |
| ------ | --------- | ----------------- |
| (none) | 0px       | Mobile-first base |
| `sm:`  | 640px     | Large phone       |
| `md:`  | 768px     | Tablet            |
| `lg:`  | 1024px    | Laptop            |
| `xl:`  | 1280px    | Desktop           |
| `2xl:` | 1536px    | Large desktop     |

### Mobile-First Principle

1. Write mobile styles first (no prefix)
2. Add larger screen overrides with prefixes
3. Example: `w-full md:w-1/2 lg:w-1/3`

---

## 4. Container Queries (v4 Native)

| Type                         | Responds To          |
| ---------------------------- | -------------------- |
| **Breakpoint** (`md:`)       | Viewport width       |
| **Container** (`@container`) | Parent element width |

### When to Use

| Scenario                   | Use                  |
| -------------------------- | -------------------- |
| Page-level layouts         | Viewport breakpoints |
| Component-level responsive | Container queries    |
| Reusable components        | Container queries    |

---

## 5. Dark Mode

| Method  | Behavior                  | Use When              |
| ------- | ------------------------- | --------------------- |
| `class` | `.dark` class toggles     | Manual theme switcher |
| `media` | Follows system preference | No user control       |

### Pattern

| Element    | Light             | Dark                   |
| ---------- | ----------------- | ---------------------- |
| Background | `bg-white`        | `dark:bg-zinc-900`     |
| Text       | `text-zinc-900`   | `dark:text-zinc-100`   |
| Borders    | `border-zinc-200` | `dark:border-zinc-700` |

---

## 6. Layout Patterns

### Flexbox

| Pattern        | Classes                             |
| -------------- | ----------------------------------- |
| Center (both)  | `flex items-center justify-center`  |
| Vertical stack | `flex flex-col gap-4`               |
| Horizontal row | `flex gap-4`                        |
| Space between  | `flex justify-between items-center` |

### Grid

| Pattern             | Classes                                               |
| ------------------- | ----------------------------------------------------- |
| Auto-fit responsive | `grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))]` |
| Bento/Asymmetric    | `grid grid-cols-3 grid-rows-2` with spans             |
| Sidebar layout      | `grid grid-cols-[auto_1fr]`                           |

> **Prefer Bento/asymmetric layouts over symmetric grids.**

---

## 7. Modern Color System

### OKLCH (Recommended in 2025)

| Format    | Advantage                |
| --------- | ------------------------ |
| **OKLCH** | Perceptually uniform     |
| **HSL**   | Intuitive hue/saturation |
| **RGB**   | Legacy compatibility     |

### Color Token Layers

| Layer         | Example           | Purpose            |
| ------------- | ----------------- | ------------------ |
| **Primitive** | `--blue-500`      | Raw values         |
| **Semantic**  | `--color-primary` | Purpose-based      |
| **Component** | `--button-bg`     | Component-specific |

---

## 8. Anti-Patterns

| Don't                       | Do                       |
| --------------------------- | ------------------------ |
| Arbitrary values everywhere | Use design system scale  |
| `!important`                | Fix specificity properly |
| Inline `style=`             | Use utilities            |
| Duplicate long class lists  | Extract component        |
| Use `@apply` heavily        | Prefer components        |

## 9. Content Scanning (v4)

> ⚠️ **Tailwind v4 scans ALL non-gitignored files** for CSS class usage.
> This includes `.md`, `.yaml`, `.json`, and any file with text that looks like a class.

### The Problem

Tailwind v4's Oxide engine auto-detects content sources. If a markdown file contains
CSS-like syntax in backticks, Tailwind tries to generate CSS for it. Malformed or
incomplete patterns (e.g., a function call with no argument) produce invalid CSS
that crashes Turbopack with `"Unexpected end of input"` → 500 on the entire app.

**Real crash scenario (L-11 retrospective):**

A backlog issue markdown file contained a utility class with an incomplete
`var()` function call inside backticks. Tailwind parsed the raw text, generated
CSS with the malformed function, and the compiler crashed.

### The Fix: `@source not`

Exclude directories that contain documentation, config, or non-source files:

```css
/* In globals.css — paths relative to this file's location */
@import 'tailwindcss';
@source not '../../docs';
@source not '../../.agent';
```

### Directories to Exclude

| Directory  | Why Exclude                                   | Risk if Not                     |
| ---------- | --------------------------------------------- | ------------------------------- |
| `docs/`    | Markdown with CSS examples in backticks       | Crash from invalid class syntax |
| `.agent/`  | Skills/rules with CSS patterns in code blocks | Same crash risk                 |
| `scripts/` | Usually already excluded by gitignore         | Low risk                        |

### Rules

1. **Always add `@source not`** for non-source directories that may contain CSS-like text
2. **Paths are relative** to the CSS file location, not project root
3. **`@source not` is a no-op** if the directory doesn't exist — safe for all projects
4. **Order matters:** `@source not` AFTER `@import 'tailwindcss'`

---

## 10. CSS Variable Syntax (v4 BREAKING CHANGE)

> ⚠️ **HARD RULE** — LLMs default to v3 syntax because training data has far more v3 than v4.
> The agent MUST generate v4 syntax when the project uses Tailwind v4.

### Version Detection

Before applying these rules, check the project's Tailwind version in `package.json`.
If v3 → use v3 syntax. If v4 → use v4 syntax. Never assume.

### The Pattern Change

| Version | CSS Variable Syntax         | Description                           |
| ------- | --------------------------- | ------------------------------------- |
| v3      | `{utility}-[var(--{prop})]` | Brackets + explicit `var()` wrapper   |
| v4      | `{utility}-(--{prop})`      | Parentheses only, `var()` is implicit |

Where `{utility}` is any Tailwind utility prefix and `{prop}` is any CSS custom property name.

### When to Use Each v4 Pattern

| Condition                                | Pattern                  | Description                                       |
| ---------------------------------------- | ------------------------ | ------------------------------------------------- |
| Property has `@theme` mapping            | `{utility}-{token-name}` | Use the token name directly, no parentheses       |
| Property has NO `@theme` mapping         | `{utility}-(--{prop})`   | Use parentheses with the CSS custom property      |
| One-off arbitrary value (not a variable) | `{utility}-[{literal}]`  | Bracket syntax for literal values like hex colors |

### How the Agent Should Generate Code

The agent reads the pattern table above and applies it:

- For background with a themed color → use the token name directly
- For background with an unthemed CSS variable → use parentheses with double-dash
- For a one-off hex color → use bracket syntax with the literal value

### Key Differences Summary

| Aspect           | v3 Approach                | v4 Approach                        |
| ---------------- | -------------------------- | ---------------------------------- |
| CSS variables    | Bracket + explicit `var()` | Parentheses, implicit `var()`      |
| Theme tokens     | Not applicable             | Direct token name usage            |
| Arbitrary values | Brackets for everything    | Brackets only for one-off literals |
| Configuration    | JavaScript config file     | CSS-native `@theme` directive      |

> 🔴 **CRITICAL:** This skill file intentionally uses abstract placeholders (`{utility}`,
> `{prop}`, `{token-name}`, `{literal}`) instead of real CSS classes. This prevents
> Tailwind v4 Oxide from scanning this file and crashing projects that don't have
> `@source not` configured for `.agent/`. See §9 and `factory-ops §10` for context.

---

> **Remember:** Tailwind v4 is CSS-first. Embrace CSS variables and native features.
