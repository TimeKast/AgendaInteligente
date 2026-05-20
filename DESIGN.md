# DESIGN.md — AgendaInteligente

> Claude Design–compatible design system spec (9 sections).
> Upload to claude.ai/design → organization settings → "Set up your design system" to make new projects inherit this identity.
> **SSOT:** [`project/planning/14_DESIGN_BRIEF.md`](./project/planning/14_DESIGN_BRIEF.md)

---

## 1. Visual Theme

**Skin family:** `editorial`
**Whitelabel mode:** `client` (cliente = product owner; assets pendientes; tokens son la identidad actual)
**Variance:** medium · **Motion:** calm · **Density:** medium

**Vibe en 1 párrafo:**

AgendaInteligente se siente como un **cuaderno de planeación cálido y serio**. Una PWA mobile-first donde cada escala de tiempo (Day, Week, Quarter, Year, 5-Year, Life) vive en su propia "página" con su color accent sutil. Fondo crema en lugar de blanco quirúrgico. Headlines en serifa generosa. Líneas warm ecru en lugar de bordes grises duros. La densidad es spacious mobile, comfortable desktop. El movimiento es **calm**: transitions suaves sin bouncy spring. El usuario abre un cuaderno reflexivo, no una app coachy de productividad-gamificada.

**Tone:** warm + serious + reflective. Asistente profesional neutro, no coach motivacional.

---

## 2. Color Palette

### Light mode (canonical default)

#### Neutral foundation

| Token           | OKLCH                   | Hex approx | Uso                            |
| --------------- | ----------------------- | ---------- | ------------------------------ |
| `--bg`          | `oklch(0.97 0.012 75)`  | `#FBF7EF`  | Background base (cream)        |
| `--bg-elevated` | `oklch(0.94 0.014 75)`  | `#F2EDDF`  | Card, modal, sheet container   |
| `--bg-sunken`   | `oklch(0.91 0.016 75)`  | `#E8E2D2`  | Subtle sunken areas, input bg  |
| `--ink-primary` | `oklch(0.21 0.012 60)`  | `#2A2826`  | Body text, headlines           |
| `--ink-soft`    | `oklch(0.32 0.012 60)`  | `#4A4540`  | Secondary text                 |
| `--ink-hint`    | `oklch(0.52 0.018 65)`  | `#7A6E64`  | Placeholders, hints            |
| `--slate`       | `oklch(0.45 0.010 220)` | `#5B6B6B`  | UI labels, captions            |
| `--rule`        | `oklch(0.79 0.020 75)`  | `#C9BAA5`  | Dividers (warm ecru, NOT gray) |

#### Primary action (no blue, no purple)

| Token                    | OKLCH                  | Uso                            |
| ------------------------ | ---------------------- | ------------------------------ |
| `--accent-primary`       | `oklch(0.21 0.012 60)` | Primary CTA bg (warm charcoal) |
| `--accent-on`            | `oklch(0.97 0.012 75)` | Text on primary CTA            |
| `--accent-primary-hover` | `oklch(0.17 0.012 60)` | Hover state                    |

#### Per-scope accents (used in scope chips, sheet headers, ONLY as secondary signal)

| Scope   | Token             | OKLCH                   | Hex approx               |
| ------- | ----------------- | ----------------------- | ------------------------ |
| Day     | `--scope-day`     | `oklch(0.50 0 0)`       | `#5C5C5C`                |
| Week    | `--scope-week`    | `oklch(0.20 0 0)`       | `#1F1F1F`                |
| Quarter | `--scope-quarter` | `oklch(0.51 0.045 145)` | `#5C7B5C` (sage)         |
| Year    | `--scope-year`    | `oklch(0.52 0.140 50)`  | `#A85530` (burnt orange) |
| 5-Year  | `--scope-5year`   | `oklch(0.44 0.060 240)` | `#3F5E78` (steel blue)   |
| Life    | `--scope-life`    | `oklch(0.42 0.070 15)`  | `#7B3F4A` (wine red)     |

#### Functional colors

| Token       | OKLCH                   | Uso                              |
| ----------- | ----------------------- | -------------------------------- |
| `--success` | `oklch(0.55 0.080 145)` | Task done, save confirm          |
| `--warning` | `oklch(0.65 0.130 75)`  | Risk alert, deadline approaching |
| `--danger`  | `oklch(0.50 0.150 25)`  | Destructive action, error        |
| `--info`    | `oklch(0.55 0.060 240)` | Tip, suggestion (secondary)      |

### Dark mode (optional toggle)

```css
[data-theme='dark'] {
  --bg: oklch(0.16 0.008 60);
  --bg-elevated: oklch(0.2 0.01 60);
  --bg-sunken: oklch(0.13 0.006 60);
  --ink-primary: oklch(0.92 0.012 75);
  --ink-soft: oklch(0.78 0.014 70);
  --ink-hint: oklch(0.55 0.014 65);
  --slate: oklch(0.62 0.01 220);
  --rule: oklch(0.32 0.014 65);
  --accent-primary: oklch(0.92 0.012 75);
  --accent-on: oklch(0.16 0.008 60);
  --accent-primary-hover: oklch(0.96 0.012 75);
  /* Scope accents: reduce chroma by ~20% for dark mode comfort */
  --scope-quarter: oklch(0.62 0.036 145);
  --scope-year: oklch(0.65 0.112 50);
  --scope-5year: oklch(0.58 0.048 240);
  --scope-life: oklch(0.55 0.056 15);
}
```

### Accessibility constraints

- All `--ink-*` over `--bg`/`--bg-elevated`/`--bg-sunken` ≥ 4.5:1 (body) or ≥ 3:1 (large)
- `--accent-on` over `--accent-primary` ≥ 4.5:1
- Scope accents are NEVER used as text on plain background — always with high-contrast pair or as small badges with explicit text color
- Tested with axe-core in CI; manual contrast spot-check on every new combo

---

## 3. Typography

### Type stack

| Token            | Stack                                       | Weight range  |
| ---------------- | ------------------------------------------- | ------------- |
| `--font-display` | `"Source Serif 4", "Lora", Georgia, serif`  | 400, 500, 600 |
| `--font-body`    | `"Inter", system-ui, sans-serif`            | 400, 500, 600 |
| `--font-mono`    | `"JetBrains Mono", ui-monospace, monospace` | 400, 500      |

Both Source Serif 4 and Inter are open source (OFL), no licensing pendiente.

### Scale (mobile-first; desktop scales up via clamp)

| Token            | Size | Line-height | Weight                     | Family  | Uso                                 |
| ---------------- | ---- | ----------- | -------------------------- | ------- | ----------------------------------- |
| `--text-h1`      | 28px | 1.2         | 500                        | display | Sheet title, screen primary heading |
| `--text-h2`      | 22px | 1.25        | 500                        | display | Section heading dentro de sheet     |
| `--text-h3`      | 18px | 1.3         | 500                        | display | Sub-section / form group            |
| `--text-body-l`  | 17px | 1.5         | 400                        | body    | Sheet content, agent messages       |
| `--text-body`    | 16px | 1.5         | 400                        | body    | Default UI text                     |
| `--text-body-s`  | 14px | 1.45        | 400                        | body    | Captions, secondary info            |
| `--text-caption` | 12px | 1.4         | 500 (uppercase, ls=0.04em) | body    | Section labels, badges              |
| `--text-mono`    | 14px | 1.4         | 400                        | mono    | Time strings, counters              |

### Italic usage

- Italic serif para **reflective prompts** del agente (ej: _"¿Quién fuiste hoy?"_)
- Italic serif para **placeholders** evocativos en sheets (ej: _"Una intención, en una frase"_)
- Italic sans NUNCA — reservado a serif

### Microcopy length rules

- Agent messages: 1-3 oraciones, casi siempre (BR AI-3)
- Empty states: 1 oración + 1 CTA
- Errors: 1 oración (blame system, never user)
- Button labels: 1-3 palabras, sentence case (NO "All Caps")

---

## 4. Layout & Spacing

### Geometry tokens

| Token                   | Value | Uso                             |
| ----------------------- | ----- | ------------------------------- |
| `--radius-xs`           | 4px   | Small chips, badges             |
| `--radius-sm`           | 6px   | Input fields, small buttons     |
| `--radius-base`         | 10px  | Default UI elements             |
| `--radius-card`         | 14px  | Cards, modals, sheet containers |
| `--radius-pill`         | 999px | Tag chips, scope badges         |
| `--border-width`        | 1px   | Standard hairline               |
| `--border-width-strong` | 1.5px | Emphasis border                 |

### Spacing scale (multiplicador de `--spacing-unit = 4px`)

| Token        | Value | Uso típico               |
| ------------ | ----- | ------------------------ |
| `--space-1`  | 4px   | Tight inline elements    |
| `--space-2`  | 8px   | Compact gaps             |
| `--space-3`  | 12px  | Default small gap        |
| `--space-4`  | 16px  | Card padding mobile      |
| `--space-5`  | 20px  | Form field gaps          |
| `--space-6`  | 24px  | Section padding          |
| `--space-8`  | 32px  | Major section gaps       |
| `--space-12` | 48px  | Page-level breaks        |
| `--space-16` | 64px  | Hero/empty state padding |

### Container widths

| Token                 | Value            | Uso                                        |
| --------------------- | ---------------- | ------------------------------------------ |
| `--container-mobile`  | 100% (max 480px) | Phone content area                         |
| `--container-tablet`  | 768px            | Tablet centered                            |
| `--container-desktop` | 1080px           | Desktop split (sidebar 240px + main 840px) |
| `--container-reading` | 640px            | Long-form text (post-mortem, life sheet)   |

### Layout shells

| Breakpoint          | Shell                                               |
| ------------------- | --------------------------------------------------- |
| < 768px (mobile)    | Bottom nav 5 items + FAB mic + full-bleed content   |
| 768-1023px (tablet) | Top nav minimalist + content centered 768px         |
| ≥ 1024px (desktop)  | Split: left sidebar 240px (scope nav) + main canvas |

### Safe areas

- iOS: respetar `safe-area-inset-bottom` para bottom nav (no overlapping con home indicator)
- iOS notch / dynamic island: respetar `safe-area-inset-top` en header

### Touch targets

- Mobile: mínimo 48×48px (excede WCAG 2.5.5 standard)
- Mic FAB: 56×56px
- Spacing entre tap targets: ≥8px

---

## 5. Components / UI Patterns

> Lista alta — detalle por componente vive en `15_DESIGN.md` (próximo paso del pipeline).

### Core primitives

| Component            | Notas                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Button**           | Primary (warm charcoal bg), Secondary (outline rule), Ghost (text only), Destructive (danger). NO pill button como primary — usa `--radius-base`. |
| **Input / Textarea** | Bg `--bg-sunken`, border `--rule`, focus ring `--accent-primary` 2px. Sin floating labels (anti-pattern).                                         |
| **Card**             | Bg `--bg-elevated`, radius `--radius-card`, sin sombra dura (max `0 1px 2px rgba(0,0,0,0.04)`).                                                   |
| **Modal**            | Centered en desktop, bottom-sheet en mobile. Backdrop `rgba(0,0,0,0.4)` con blur sutil 4px.                                                       |
| **Toast**            | Top-right desktop, top-center mobile. Auto-dismiss 4s. NO emoji decorativo.                                                                       |
| **Badge / Chip**     | Pill radius, padding compacto, font caption uppercase. Scope chips usan scope accent.                                                             |
| **Avatar**           | Initials sobre bg con seed determinístico (no random); fallback Lucide `user`.                                                                    |
| **Icon button**      | 40×40px tap area aún si visual es 24×24.                                                                                                          |
| **FAB mic**          | 56×56px, bottom-right (mobile), warm charcoal bg, mic icon Lucide stroke 1.75.                                                                    |

### Product-specific patterns

| Pattern                                           | Descripción                                                                                                                                                                         |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sheet view (Day/Week/Quarter/Year/5Year/Life)** | "Página" estilo cuaderno con scope accent bar lateral, headline serif, secciones divididas con `--rule`, campos completables inline.                                                |
| **Activity card**                                 | Lista item con checkbox-tap, title (sans), project label (caption uppercase), opcional deadline badge (warning si próximo), priority dots (1-5). Swipe → status options.            |
| **Chat message bubble**                           | NO bubble convencional. Agent message = serif italic, ink-soft, sin background. User message = sans, ink-primary, slightly bg-elevated. Diferencia tipográfica > diferencia visual. |
| **Mic capture sheet**                             | Modal mobile bottom-sheet: waveform animado durante grabación, transcript streaming text, preview parsed task con fields editables, confirm/edit/cancel.                            |
| **Intensity selector**                            | 4 radio cards con emoji funcional (🔥⊙🌱🤍) + label + descripción 1 línea.                                                                                                          |
| **Empty state**                                   | Illustration NONE. Serif italic 1-line "No hay nada todavía. Mañana a las 8 abro tu día." + opcional CTA secondary.                                                                 |

### Iconography

- **Library:** Lucide React (incluido en TimeKast kit)
- **Stroke:** 1.5 default, 1.75 en buttons/CTAs
- **Size:** 16px (inline), 20px (default), 24px (prominent), 32px (FAB)
- **Color:** hereda `currentColor`; NUNCA fill irregular

---

## 6. Iconography & Imagery

### Iconography rules

- ✅ Lucide React line icons exclusivamente
- ✅ Stroke uniforme (1.5-1.75)
- ❌ Mezclar libraries (Lucide + Heroicons + emoji custom)
- ❌ Icon mascotas / character illustrations
- ❌ Skeuomorphic icons (e.g., "real notebook" 3D)
- ❌ Color icons (fill colorful) salvo casos explícitos (success ✓, warning ⚠)

### Imagery

**Photography:** ninguna. El producto es self-contained — no necesita stock photos, hero images, ni testimonios visuales.

**Illustrations:** ninguna en MVP. Si v2 introduce empty states ilustrados, deben ser:

- Line illustrations consistentes con icon style
- Monocromáticas con warm accent
- Nunca cartoonish ni 3D rendered

**Avatars de usuarios:** initials fallback. Si user sube foto vía Google OAuth, mostrar; sino, initials sobre warm bg con seed determinístico.

---

## 7. Do's and Don'ts

### Do's

- ✅ Usar serifa generosa para sheet titles y agent reflective prompts
- ✅ Fondo crema en lugar de white quirúrgico
- ✅ Lines/dividers warm ecru en lugar de gray cliché
- ✅ Spacing generoso mobile (16-24px padding cards)
- ✅ Scope accents como **secondary signal** (chip, header bar lateral), nunca primary CTA
- ✅ Primary CTA = warm charcoal sobre cream
- ✅ Transitions calm (120-320ms, cubic-bezier standard)
- ✅ Sentence case en labels y buttons ("Guardar", no "GUARDAR")
- ✅ Microcopy seca: "Guardado." "Mañana a las 8 abro tu día."
- ✅ Italic serif para prompts reflexivos del agente

### Don'ts

- ❌ **LILA BAN:** purple/violet como primary o accent dominante (#7C3AED, #A78BFA, etc.). Solo aparece en scope `5-Year` (steel blue tirando a violeta) y solo como accent secundario.
- ❌ Azul SaaS genérico como primary (#0066FF, #2563EB, #3B82F6)
- ❌ Gradientes saturados (azul→violeta, naranja→rosa)
- ❌ Glassmorphism (blur exagerado en cards/modals — eso es iOS-native style descartado)
- ❌ Neumorphism (sombras dobles cliché)
- ❌ Drop shadows ofuscantes (`box-shadow: 0 4px 12px rgba(0,0,0,0.15)+`)
- ❌ Bouncy spring transitions (anti-pattern editorial)
- ❌ Border-radius irregular (`10px 22px 4px 18px`)
- ❌ Pasteles infantiles, mascotas, ilustraciones cute
- ❌ Emojis decorativos en copy del agente (solo emojis funcionales: 🎙️ 🔥 ⊙ 🌱 🤍)
- ❌ "¡Tú puedes!", "¡Vamos!", "¡Increíble trabajo!" microcopy
- ❌ All-caps en buttons o labels visibles (excepto caption tipográfica con tracking explícito)
- ❌ Streaks, achievements, badges gamificados (v2 si se decide)
- ❌ Densidad tipo ClickUp / Notion (información apretada)

---

## 8. Tone & Voice

> Voz documentada en `00_DISCOVERY_BRIEF.md §9` y `feedback_agent_voice` memory.

### Voice principles

| #   | Principle                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------ |
| 1   | **Asistente profesional neutro.** Ni coach motivacional, ni amigo informal.                            |
| 2   | **Una pregunta por turno.** El agente nunca lista opciones múltiples.                                  |
| 3   | **1-3 oraciones por respuesta.** Casi siempre.                                                         |
| 4   | **Específico sobre general.** "¿Qué hiciste en lugar de eso?" > "Cuéntame más."                        |
| 5   | **Identidad sobre logro.** "¿Quién fuiste hoy?" antes de "¿Qué hiciste?"                               |
| 6   | **Cita palabras del user con fecha** (v1.5+). "Hace 3 semanas escribiste: '\_\_\_\_'". Nunca inventar. |
| 7   | **Sin moralización.** Nunca "deberías"; pregunta en lugar.                                             |
| 8   | **Recovery sin shame.** Días perdidos NO resetean nada. "Bienvenido. Hoy."                             |
| 9   | **Out-of-scope redirect.** Therapy/médico/legal/general chat → redirige sin opinar.                    |
| 10  | **Crisis exit.** Auto/hetero-lesión → sale de personaje + línea de crisis local.                       |

### Microcopy examples

| Contexto            | ✅ Bueno                                                                    | ❌ Malo                                                     |
| ------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Save confirmation   | "Guardado."                                                                 | "¡Guardado con éxito! ✅"                                   |
| Onboarding close    | "Mañana a las 8 abro tu primer día. Hasta entonces."                        | "¡Te veo mañana, campeón! 🎯"                               |
| Error system        | "Algo se rompió de nuestro lado. Reintentá."                                | "¡Oops! Inténtalo de nuevo 😅"                              |
| Empty state today   | "No hay nada para hoy todavía. Si querés, agregá una tarea con el botón ↓." | "¡Tu día está vacío! Empieza ahora con tu primera tarea 🚀" |
| Morning open EN     | "Morning. What's today's intention — one sentence."                         | "Hi there! Ready to crush the day? 💪"                      |
| Morning open ES     | "Buenos días. ¿Cuál es la intención de hoy — una sola frase?"               | "¡Hola! ¿Listos para arrasar hoy? 🌟"                       |
| Vague challenge     | "¿Qué significa 'más enfocado' concretamente?"                              | "¡Vamos, dame más detalles! 🤔"                             |
| Premium upsell (v2) | "Abrí las wall scopes."                                                     | "¡Desbloquea más features! 🔓"                              |

### Language

- **Español:** registro neutro LatAm. **`tú` (NUNCA `vos/tenés/querés/listá/incluí/dale/che`)**
- **English:** plain, terse. No fluff.
- Detection: browser default at signup; override en settings; agent cita past words en idioma original que el user escribió.

---

## 9. AI Generation Prompt Template

> Use as starting prompt cuando se genera UI con un AI builder (Claude code, Bolt, v0, Lovable) para mantener consistencia con este design system.

```markdown
Build a UI screen for the AgendaInteligente product. Apply the following
design constraints strictly:

## Visual identity

- Skin family: editorial (book-meets-product aesthetic)
- Vibe: warm cuaderno-reflexivo, serious, mobile-first PWA
- Tone: asistente profesional neutro (NO coach motivacional, NO amigo informal)

## Color (light mode canonical)

- Background: oklch(0.97 0.012 75) (cream #FBF7EF)
- Card / elevated: oklch(0.94 0.014 75)
- Ink primary (text/headlines): oklch(0.21 0.012 60) (warm charcoal #2A2826)
- Ink soft: oklch(0.32 0.012 60)
- Ink hint: oklch(0.52 0.018 65)
- Dividers / rules: oklch(0.79 0.020 75) (warm ecru, NOT gray)
- Primary CTA bg: warm charcoal (--ink-primary)
- Primary CTA text: cream (--bg)
- Scope accents (only as secondary signal — chips, header bars, NEVER primary CTA):
  Day=#5C5C5C, Week=#1F1F1F, Quarter=#5C7B5C (sage),
  Year=#A85530 (burnt orange), 5Year=#3F5E78 (steel blue), Life=#7B3F4A (wine red)

## Typography

- Headlines / sheet titles: "Source Serif 4" or "Lora", weight 500
- Body / UI: "Inter", weight 400-500
- Italic serif for agent reflective prompts and evocative placeholders
- Microcopy: terse, sentence case, no exclamations, no emojis decorativos

## Layout

- Mobile-first PWA. Bottom nav 5 items (Today / Week / Goals / Chat / Settings)
- FAB mic button bottom-right (56×56px, warm charcoal)
- Spacious mobile (padding 16-24px), comfortable desktop
- Container max: 480px mobile, 1080px desktop with sidebar 240px + main 840px
- Touch targets ≥48×48px

## Geometry

- Radius: cards 14px, buttons 10px, chips pill, inputs 6px
- Dividers: 1px warm ecru `--rule`, NOT gray
- Sin sombras duras. Max box-shadow: 0 1px 2px rgba(0,0,0,0.04)

## Motion (calm)

- Transitions 120-320ms, cubic-bezier(0.4, 0, 0.2, 1) o ease-out
- NO bouncy spring, NO bounce, NO parallax

## Iconography

- Lucide React line icons exclusivamente, stroke 1.5-1.75
- 20px default, 24px prominent, 32px FAB
- color: currentColor; sin fills colorful

## HARD BANS

- NO purple/violet como primary o accent dominante (LILA BAN) — except scope-5year/life as secondary
- NO azul SaaS genérico (#2563EB, #0066FF, #6366F1)
- NO glassmorphism / blur exagerado
- NO neumorphism (sombras dobles)
- NO gradientes saturados
- NO bouncy spring animations
- NO emojis decorativos en copy (solo funcionales: 🎙️🔥⊙🌱🤍)
- NO "¡Tú puedes!" / "¡Vamos!" / coachy microcopy
- NO all-caps buttons (excepto caption tipográfica con tracking)
- NO streaks/gamification badges (deferred v2)
- NO ilustraciones cute, mascots, photography stock

## Voice (Spanish content)

- `tú` informal LatAm neutro (NUNCA `vos/tenés/querés/dale/che`)
- 1 pregunta por turno del agente
- 1-3 oraciones por respuesta
- Sin moralización ("deberías")
- Specific > general
- Identity > achievement: "¿Quién fuiste hoy?" before "¿Qué hiciste?"

Now generate: [INSERT SPECIFIC SCREEN/COMPONENT REQUEST]
```

---

## Implementation reference

| Concern                               | Where to look                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------ |
| Full token spec                       | [`project/planning/14_DESIGN_BRIEF.md`](./project/planning/14_DESIGN_BRIEF.md)             |
| Screen inventory + flows + wireframes | [`project/planning/15_DESIGN.md`](./project/planning/15_DESIGN.md) (next: `/design`)       |
| Component implementation              | TimeKast kit `src/components/ui/` (shadcn/ui base) + custom in `src/components/<feature>/` |
| Tailwind tokens                       | `tailwind.config.ts` (consume CSS vars)                                                    |
| Theme switching                       | CSS var swap via `[data-theme="dark"]` on `<html>`                                         |

---

_Generated by `/design-brief` v3.3 — 2026-05-19 — visual-design-director persona_
_Compatible with Claude Design organization settings (claude.ai/design)_
