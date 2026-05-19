---
description: Deploy workflow — merge to main for auto-deploy, or full versioned release
---

# /deploy — Deploy or Release

> 🔴 **CORE-SK §2 aplica:** Reglas de branching adaptivas por fase de proyecto.
> Pre-release (v0.0.0): merge rápido. Post-release (v1.0.0+): autorización obligatoria.

---

## Phase 0: Auto-Detection

**Detectar estado del proyecto y branch:**

// turbo

```bash
CURRENT_BRANCH=$(git branch --show-current)
VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "unknown")
echo "Branch: $CURRENT_BRANCH"
echo "Version: $VERSION"
echo "---"
git status --short
echo "---"
echo "Commits ahead of main:"
git fetch origin 2>/dev/null
git log origin/main..HEAD --oneline 2>/dev/null | head -10
echo "Total: $(git log origin/main..HEAD --oneline 2>/dev/null | wc -l | tr -d ' ')"
```

**Resolver modo automáticamente:**

| Condición                                | Modo detectado            | Explica al usuario                                    |
| ---------------------------------------- | ------------------------- | ----------------------------------------------------- |
| `version = 0.0.0` y NO se pasó `release` | **Deploy**                | "Proyecto en pre-release. Merge rápido a main."       |
| `version = 0.0.0` y se pasó `release`    | **Release** (primera vez) | "Primer release. Vamos a definir la versión inicial." |
| `version > 0.0.0`                        | **Release** (automático)  | "Proyecto en producción. Release completo."           |

Si el usuario pasó argumento de branch (ej: `/deploy feat-x`), usar esa branch como fuente.

---

## Phase 1: Pre-Deploy Checks

### 🛑 CHECKPOINT 1 — Validación y confirmación

**Checks obligatorios:**

```bash
# 1. Working tree limpio
git status --short

# 2. No estamos en main
git branch --show-current

# 3. Hay commits que mergear
git log origin/main..HEAD --oneline | wc -l
```

| Check              | Condición                  | Si falla                              |
| ------------------ | -------------------------- | ------------------------------------- |
| Working tree clean | `git status --short` vacío | 🛑 STOP — commitear o stash primero   |
| No es main         | branch ≠ `main`            | 🛑 STOP — no puedes deploy desde main |
| Hay commits        | count > 0                  | 🛑 STOP — "No hay nada que mergear"   |

**Mostrar resumen y pedir confirmación:**

```markdown
## /deploy — Checkpoint 1

| Item              | Valor                                      |
| ----------------- | ------------------------------------------ |
| Modo              | {Deploy / Release / Release (primera vez)} |
| Branch            | `{BRANCH}` → `main`                        |
| Version actual    | `{VERSION}`                                |
| Commits a mergear | {N}                                        |
| Estado            | {Clean ✅ / Dirty 🔴}                      |

{Si branch ≠ develop:}
| ⚠️ Branch | No es `develop` — confirmar que es correcta |

| #   | Opción    |
| --- | --------- |
| 1   | Continuar |
| 2   | Cancelar  |
```

🛑 **STOP — esperar confirmación.**

### Push branch fuente (si hay commits locales sin push)

```bash
UNPUSHED=$(git log origin/{BRANCH}..HEAD --oneline 2>/dev/null | wc -l)
if [ "$UNPUSHED" -gt 0 ]; then
  echo "Commits sin push: $UNPUSHED"
fi
```

Si hay commits sin push → pushear antes de continuar:

```bash
git push origin {BRANCH}
```

---

## Phase 2: Version Bump + CHANGELOG (solo modo Release)

> ⏭️ **En modo Deploy → saltar directamente a Phase 3.**

### 2.1 Version bump

**Si es primera vez (0.0.0 → primera versión):**

```markdown
## 🎉 Primer Release

Versión actual: `0.0.0`

¿Cuál será la versión inicial? (recomendado: `1.0.0`)
```

**Si ya tiene versión (siguiente release):**

```markdown
## Version Bump

Versión actual: `{VERSION}`

| #   | Tipo  | Nueva versión |
| --- | ----- | ------------- |
| 1   | patch | {X.Y.Z+1}     |
| 2   | minor | {X.Y+1.0}     |
| 3   | major | {X+1.0.0}     |

¿Qué tipo? (1-3)
```

🛑 **STOP — esperar respuesta.**

Actualizar y commitear:

```bash
# Actualizar version en package.json (usar sed o node script)
git add package.json
git commit -m "chore: bump version to {NEW_VERSION}"
```

### 2.2 CHANGELOG

**Revisar commits desde último tag:**

```bash
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "none")
echo "Último tag: $LAST_TAG"
echo "---"
if [ "$LAST_TAG" != "none" ]; then
  git log $LAST_TAG..HEAD --oneline --no-merges
else
  git log --oneline --no-merges -20
fi
```

**Generar/actualizar entrada en `CHANGELOG.md` (root del proyecto).**

Si no existe `CHANGELOG.md`, crearlo con formato estándar:

```markdown
# Changelog

## [{VERSION}] - {YYYY-MM-DD}

### Added

- ...

### Changed

- ...

### Fixed

- ...
```

> 🔴 **GATE OBLIGATORIO — CHANGELOG Review:**
> Mostrar la entrada completa del release al usuario.
> **NO** commitear ni continuar hasta que apruebe.

🛑 **STOP — esperar aprobación del CHANGELOG.**

Commitear:

```bash
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG for v{NEW_VERSION}"
```

### 2.3 Push branch fuente

```bash
git push origin {BRANCH}
```

---

## Phase 3: Inspect origin/main

> 🔴 **GATE OBLIGATORIO** — Si hay commits inesperados en origin/main, STOP.

```bash
git fetch origin
git log {BRANCH}..origin/main --oneline --format="%h %an %s"
```

**Si hay commits en main que no están en la branch fuente:**

```markdown
⚠️ **Main tiene commits que no están en `{BRANCH}`:**

{lista de commits}

| #   | Opción         | Acción                                         |
| --- | -------------- | ---------------------------------------------- |
| 1   | continuar      | Merge de todas formas (puede haber conflictos) |
| 2   | rebase primero | Rebase {BRANCH} sobre main antes de merge      |
| 3   | cancelar       | Abortar deploy                                 |
```

🛑 **STOP — esperar instrucciones.**

**Si no hay commits nuevos → continuar.**

---

## Phase 4: Merge

```bash
git checkout main
git pull origin main
```

**Merge sin commit para inspección:**

```bash
git merge {BRANCH} --no-commit --no-ff
```

**Verificar conflictos:**

```bash
CONFLICTS=$(git diff --name-only --diff-filter=U)
if [ -n "$CONFLICTS" ]; then
  echo "⚠️ Conflictos:"
  echo "$CONFLICTS"
else
  echo "✅ Sin conflictos"
fi
```

**Si hay conflictos:**

```markdown
⚠️ **Conflictos detectados:**

{lista de archivos}

| #   | Opción       | Acción                               |
| --- | ------------ | ------------------------------------ |
| 1   | favor source | Resolver todos a favor de `{BRANCH}` |
| 2   | manual       | Resolver manualmente                 |
| 3   | abort        | Abortar merge                        |
```

🛑 **STOP — esperar instrucciones.**

**Si opción 1:**

```bash
git diff --name-only --diff-filter=U | xargs -I {} git checkout {BRANCH} -- {}
```

---

## Phase 5: Pre-Commit Verification

> ℹ️ **Informativo** — La autorización ya se dio en Checkpoint 1 (Deploy) o CHANGELOG Review (Release).
> Mostrar resumen como confirmación visual, luego continuar automáticamente.

```bash
echo "=== Archivos cambiados ==="
git diff --cached --stat
echo ""
echo "=== Package.json ==="
grep -E '"version"' package.json
echo ""
echo "=== Resumen ==="
echo "Archivos: $(git diff --cached --name-only | wc -l)"
```

**Mostrar resumen (informativo, sin gate):**

```markdown
## ✅ Pre-Commit

| Item               | Valor                         |
| ------------------ | ----------------------------- |
| Modo               | {Deploy / Release v{VERSION}} |
| Branch             | `{BRANCH}` → `main`           |
| Archivos cambiados | {N}                           |
| Versión resultante | {VERSION}                     |
| Tag                | {v{VERSION} / ninguno}        |
```

> Continúa automáticamente al commit.

---

## Phase 6: Commit, Tag, Push

### 6.1 Commit

**Deploy mode:**

```bash
git add -A
git commit --no-verify -m "deploy: merge {BRANCH} into main"
```

**Release mode:**

```bash
git add -A
git commit --no-verify -m "release: v{VERSION} — merge {BRANCH} into main

{resumen de 1-2 líneas}"
```

### 6.2 Tag (solo Release mode)

```bash
git tag -a v{VERSION} -m "v{VERSION} — {descripción corta}"
```

### 6.3 Push

> ℹ️ **Autorización ya otorgada** en Checkpoint 1 (Deploy) o CHANGELOG Review (Release).
> Push procede automáticamente.

```bash
echo "=== Pushing ==="
echo "Commits: $(git log origin/main..main --oneline | wc -l | tr -d ' ')"
```

**Deploy mode:**

```bash
git push origin main
```

**Release mode:**

```bash
git push origin main
git push origin v{VERSION}
```

### 6.4 Volver a branch fuente

```bash
git checkout {BRANCH}
pnpm install 2>/dev/null || npm install 2>/dev/null || true
```

### 6.5 Post-Release Transition (solo primer release — v0.0.0 → v1.0.0+)

> ⚠️ Solo aplica cuando `version` pasó de `0.0.0` a ≥`1.0.0` por primera vez.
> Esta transición es ONE-WAY — no se vuelve a pre-release.

**Si el release es la primera versión (0.0.0 → X.Y.Z):**

1. Verificar si `develop` existe:

```bash
git branch --list develop
```

2. Si no existe, crear desde main:

```bash
git branch develop main
git push origin develop
```

3. Cambiar a develop como branch de trabajo:

```bash
git checkout develop
```

4. Informar al usuario:

```markdown
## 🔒 Transición a Post-Release

| Acción                  | Estado |
| ----------------------- | ------ |
| Tag v{VERSION} en main  | ✅     |
| Branch `develop` creada | ✅     |
| CORE-SK §2 Post-release | Activa |
| Main protegida          | ✅     |

> A partir de ahora:
>
> - `develop` es la rama de trabajo
> - `main` solo recibe merges via `/deploy`
> - Vercel: main = production, develop = preview
>
> ⚠️ Configurar Vercel manualmente: `develop` como preview branch.
```

---

## Post-Deploy

**Mostrar resumen final:**

```markdown
## ✅ {Deploy / Release} Completado

| Item     | Valor                         |
| -------- | ----------------------------- |
| Modo     | {Deploy / Release v{VERSION}} |
| Branch   | `{BRANCH}` → `main`           |
| Versión  | {VERSION}                     |
| Tag      | {v{VERSION} / ninguno}        |
| Ahora en | `{BRANCH}`                    |

{Deploy: "✅ Main actualizado. Vercel debería auto-deployar."}
{Release: "✅ Release v{VERSION} publicado y taggeado."}
```

---

## Shortcuts

```bash
/deploy                 # Auto-detect: si 0.0.0 → deploy, si >0.0.0 → release
/deploy release         # Primera release (0.0.0 → versión real)
/deploy feat-branch     # Deploy desde branch específica
```

---

## Reglas

1. **Auto-detection:** `version = 0.0.0` → deploy rápido. `version > 0.0.0` → release completo.
2. **Branch fuente** = branch actual. Default `develop`, si es otra se confirma en Checkpoint 1.
3. **NUNCA** pushear a main sin autorización explícita (CORE-SK §2).
4. **Deploy** = sin ceremony. No bump, no changelog, no tag.
5. **Release** = full ceremony. Bump + changelog + tag.
6. **Conflictos** = preguntar, nunca resolver silenciosamente.
7. **Primer release** = transición ONE-WAY. Crea `develop`, activa protección de main (CORE-SK §2).

---

_TimeKast Factory — Deploy Workflow v1.1_
