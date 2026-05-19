---
trigger: always_on
---

# GIT — Commits, Push & Branching Rules

> Reglas de git. Extiende `CORE.md`. Precede a TODA ejecución de comandos git.

---

## 1. 🔴 NUNCA usar --no-verify

```
❌ PROHIBIDO: git commit --no-verify / git commit -n
❌ PROHIBIDO: git push --no-verify
❌ PROHIBIDO: --no-gpg-sign, -c commit.gpgsign=false
✅ OBLIGATORIO: Si hooks fallan → investigar root cause → corregir → reintentar sin flags
✅ OBLIGATORIO: Si un hook obstaculiza legítimamente → proponer ajustarlo, no bypassearlo
✅ EXCEPCIÓN: Merge commits sin staged changes normales (workflows de release lo declaran explícitamente)
```

---

## 2. 🔴 NUNCA ejecutar git push sin autorización

```
❌ PROHIBIDO: git push sin confirmación del usuario
✅ OBLIGATORIO: Mostrar branch, remote, commits → ESPERAR confirmación
✅ EXCEPCIÓN: Workflows con checkpoint gate aprobado por el usuario = autorización implícita
```

---

## 3. Commits — Conventional Commits + keyword-based issue tracking

> ⚠️ **Scope del enforcement:** `.claude/hooks/validate-commit.sh` es un PreToolUse hook de Claude Code — valida solo commits ejecutados por el agente via Bash tool. Commits manuales del usuario en terminal pasan por `.husky/pre-commit` (lint-staged) y **no** por este hook. La convención de abajo es igual obligatoria para ambos casos (consistencia del historial), pero el enforcement automático aplica solo al agente.

### 3.1 Subject format (Conventional Commits)

```
<type>(<scope>): <título en imperativo, ≤72 chars>
```

**Types permitidos:**

| Type       | Cuándo                                                     |
| ---------- | ---------------------------------------------------------- |
| `feat`     | Funcionalidad nueva visible al usuario                     |
| `fix`      | Corrección de bug                                          |
| `docs`     | Solo docs (README, planning, backlog, JSDoc, skills/rules) |
| `chore`    | Mantenimiento (deps, configs, housekeeping)                |
| `refactor` | Cambio de código sin efecto funcional                      |
| `perf`     | Mejora de performance                                      |
| `test`     | Agregar/modificar tests                                    |
| `build`    | Build system, bundler, release tooling                     |
| `ci`       | CI/CD (GitHub Actions, hooks, pipelines)                   |
| `style`    | Formatting, whitespace (sin cambios lógicos)               |
| `revert`   | Revertir un commit previo                                  |

**Scope:** módulo/área afectada (`auth`, `db`, `backlog`, `hooks`, `cc`, `sk`, etc). Opcional si el cambio es global.

### 3.2 Issue references — keyword-based (footer)

Los commits referencian issues mediante **keywords explícitos en el footer del body**, NO en el subject.

```
feat(hooks): ship close/ref distinction parser

<detalle del cambio>

Closes: FX-008
Refs: PL-001, EPIC-FACTORY-ROBUSTNESS
```

| Keyword   | Semántica                                                   | Hook behavior                         |
| --------- | ----------------------------------------------------------- | ------------------------------------- |
| `Closes:` | Este commit completa el issue — debe estar ✅ + Evidence    | Valida ✅ en epic + Evidence presente |
| `Refs:`   | Referencia contextual (blocked-by, related-to, parent epic) | Bypass — solo contexto humano         |

**Reglas:**

```
✅ OBLIGATORIO: Subject libre de IDs (e.g. `feat(auth): add session rotation`)
✅ OBLIGATORIO: Usar `Closes: <ID>` en el footer del commit que completa el issue
✅ PERMITIDO:  `Closes: FX-001, FX-002` si un commit cierra múltiples issues
✅ PERMITIDO:  `Refs: <ID>` sin check — para contexto (blocked-by, related-to)
❌ PROHIBIDO:  Poner ID de issue en subject (ambigüedad con keyword; el hook lo ignora)
```

### 3.3 Multi-commit por issue

Un issue puede requerir múltiples commits (WIP, refactor por pasos, test separado). Solo el commit **final** (el que lleva el issue a DoD) usa `Closes:`. Los intermedios no llevan keyword, o usan `Refs:` si vale la pena dejar el rastro.

```
chore(hooks): scaffold close/ref parser             ← sin Closes, pasa
test(hooks): add close/ref parser tests             ← sin Closes, pasa
refactor(hooks): ship close/ref hook                ← con Closes:, valida

  Closes: FX-008
```

### 3.4 Docs sync

```
✅ OBLIGATORIO: Actualizar /docs si el cambio afecta comportamiento documentado
```

---

## 4. Branching — Adaptive por fase de proyecto

### Detección de fase (obligatoria antes de aplicar reglas)

1. **Override explícito primero.** Si `project/planning/project-config.md` declara `branching: develop-first` o `branching: main-first` en la sección `## 1. Identity`, esa preferencia manda — la auto-detección se salta.
2. **Auto-detección (fallback).** Si no hay override, leer `version` de `package.json`:
   - `"0.0.0"` → Pre-release (main-first)
   - `"X.Y.Z"` (X ≥ 1) → Post-release (develop-first)

> El override permite a un proyecto en v0.0.0 ya adoptar develop-first (convención de equipo), y a un proyecto post-release declarar un modo explícito si `/deploy` no fue la vía del primer release.

### Pre-release (v0.0.0)

```
✅ PERMITIDO: Push a main directo, sin merge ni PR
✅ PERMITIDO: Trabajar en develop si el developer prefiere
ℹ️  Vercel: main = preview deployment
```

### Post-release (v1.0.0+)

```
❌ PROHIBIDO: Merge o push a main sin autorización explícita del usuario
✅ OBLIGATORIO: develop es la rama de trabajo
✅ OBLIGATORIO: Mostrar qué se mergea → ESPERAR autorización → Ejecutar
ℹ️  Vercel: main = production, develop = preview
ℹ️  Para deploy: usar /deploy (merge develop → main)
```

### Transición (ONE-WAY, irreversible)

Cuando `/deploy` ejecuta el primer release (version bump a ≥1.0.0):

1. Tag `main` como vX.Y.Z
2. Crear rama `develop` desde `main` (si no existe)
3. Activar protección de main (Post-release aplica)

---

_TimeKast Factory — Git Rules (L1 Peer)_
