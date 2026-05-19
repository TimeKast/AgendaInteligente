---
description: Factory release — merge develop→main with selective exclusions, tag, and push
---

# /release — Merge develop → main

> 🔴 **CORE §5.5 aplica:** NUNCA pushear sin autorización explícita del usuario.

---

## Phase 1: Pre-Release en develop

> 🔴 **NUNCA bumpear versiones en main.** Los bumps ocurren SIEMPRE en develop y llegan a main vía merge.

1. Asegurar que estás en `develop` y todo está commiteado:

```bash
git status
```

Si hay cambios sin commitear → **STOP. Informar al usuario.**

2. **Bump `factoryVersion`** en `package.json`:
   - Preguntar al usuario si es `patch`, `minor`, o `major`
   - Actualizar `factoryVersion` (ej: `3.0.4` → `3.0.5`)
   - **Verificar** que `version` sea **siempre `0.0.0`** (es la versión de apps derivadas, nunca se toca aquí)
   - Commitear: `chore: bump factoryVersion to X.Y.Z`

```bash
# Verificar versiones
grep -E '"version"|"factoryVersion"' package.json
# version DEBE ser 0.0.0
# factoryVersion se bumpa
```

3. Completar/verificar CHANGELOG en `docs/factory/CHANGELOG.md`:
   - Revisar `git log` desde el último tag
   - Actualizar la entrada del nuevo release con fecha de hoy

> 🔴 **GATE OBLIGATORIO — CHANGELOG Review:**
> Después de escribir/actualizar el CHANGELOG, **SIEMPRE** mostrar la entrada completa del release al usuario vía `notify_user` con `BlockedOnUser: true`.
>
> - Incluir el contenido completo de la nueva entrada (desde `## [X.Y.Z]` hasta el `---` separator)
> - **NO** commitear ni continuar hasta que el usuario apruebe el CHANGELOG
> - Si el usuario pide cambios, aplicarlos y volver a mostrar

4. Commitear CHANGELOG si fue aprobado.

5. Verificar `project-config.md` — solo metadata del proyecto (no versiones, esas viven en `package.json`). Commitear si hay cambios.

6. Push develop:

```bash
git push origin develop
```

---

## Phase 2: Inspeccionar origin/main

> 🔴 **GATE OBLIGATORIO** — Si hay commits nuevos en origin/main, **STOP y mostrar al usuario qué cambió antes de continuar.**

5. Fetch y comparar:

```bash
git fetch origin
git log HEAD..origin/main --oneline --format="%h %an %s"
```

**Si hay commits nuevos:**

- Mostrar la lista completa al usuario
- Identificar quién hizo qué
- **STOP — Esperar instrucciones antes de continuar**

**Si no hay commits nuevos:** Continuar.

---

## Phase 3: Merge selectivo

6. Checkout main y pull:

```bash
git checkout main
git pull origin main
```

7. Merge sin commit:

```bash
git merge develop --no-commit --no-ff
```

8. **Eliminar carpetas develop-only:**

```bash
git rm -rf docs/planning/ 2>/dev/null
git rm -rf docs/reports/ 2>/dev/null

# Project-specific dirs (develop-only, never merge to main)
git rm -rf .agent/agents/project/ 2>/dev/null
git rm -rf .agent/skills/project/ 2>/dev/null
git rm -f .agent/registry/project.yaml 2>/dev/null

# docs/backlog/ → solo mantener .gitkeep
git rm -rf docs/backlog/ 2>/dev/null
mkdir -p docs/backlog && touch docs/backlog/.gitkeep && git add docs/backlog/.gitkeep
```

9. **Resolver conflictos de código** — usar versión de develop:

```bash
# Listar conflictos restantes
git diff --name-only --diff-filter=U

# Para cada archivo → tomar develop
git diff --name-only --diff-filter=U | xargs -I {} git checkout develop -- {}

# Si algún archivo fue delete en develop:
git rm <archivo> 2>/dev/null
```

10. **Eliminar scripts desechables** (si existen):

```bash
git rm scripts/fix-*.cjs 2>/dev/null
```

11. **Regenerar vistas del registry** (sin project.yaml, las vistas excluyen entries project-specific):

```bash
python3 .agent/scripts/registry_cli.py rebuild
git add .agent/registry/views/
```

---

## Phase 4: Verificación pre-commit

> 🔴 **GATE OBLIGATORIO** — Verificar ANTES de commitear.

11. **Verificar que no hay conflictos pendientes:**

```bash
git diff --name-only --diff-filter=U
```

**Si hay conflictos → STOP. Resolverlos primero.**

12. **Verificar package.json:**

```bash
grep -E '"version"|"factoryVersion"|"agentKitVersion"' package.json
```

- `version` debe ser `0.0.0`
- `factoryVersion` debe ser la versión del release
- `agentKitVersion` debe existir (viene de develop con el agent kit)

13. **Mostrar resumen al usuario:**
    - Número de archivos cambiados
    - Carpetas develop-only eliminadas confirmado
    - package.json correcto

**STOP — Esperar confirmación para commitear.**

---

## Phase 5: Commit y Tag

14. Commit:

```bash
git add -A
git commit --no-verify -m "Merge develop into main — vX.Y.Z release

<resumen de 1-2 líneas>"
```

15. Tag:

```bash
git tag -a vX.Y.Z -m "vX.Y.Z — <descripción corta>"
```

---

## Phase 6: Push

> 🔴 **GATE OBLIGATORIO — NUNCA pushear sin autorización explícita.**

16. **Mostrar exactamente qué se va a pushear:**

```bash
echo "=== Commits a pushear ==="
git log origin/main..main --oneline
echo ""
echo "=== Tag ==="
git tag -l vX.Y.Z
```

**STOP — Preguntar: "¿Push main + tag a origin?"**

**Solo si el usuario dice SÍ explícitamente:**

```bash
git push origin main
git push origin vX.Y.Z
```

17. Volver a develop y restaurar deps:

```bash
git checkout develop
pnpm install
```

---

## Referencia: Reglas de Merge

> Reglas de merge develop → main (definidas en este workflow)

### NO mergear a main

| Carpeta                        | Tipo         | Razón                                        |
| ------------------------------ | ------------ | -------------------------------------------- |
| `docs/planning/`               | Develop-only | Solo existe en develop — no traer            |
| `docs/backlog/`                | Develop-only | Solo existe en develop (mantener `.gitkeep`) |
| `docs/reports/`                | Develop-only | Se genera de auditorías — no traer si existe |
| `.agent/agents/project/`       | Develop-only | Project-specific agents — no traer           |
| `.agent/skills/project/`       | Develop-only | Project-specific skills — no traer           |
| `.agent/registry/project.yaml` | Develop-only | Project extensions — no traer                |

### SÍ mergear a main

| Carpeta           | Contenido                                             |
| ----------------- | ----------------------------------------------------- |
| `.agent/`         | Agent Kit completo (agents, skills, workflows, rules) |
| `docs/guides/`    | Guías del SK                                          |
| `docs/reference/` | SSOT docs                                             |
| `docs/factory/`   | Changelog                                             |
| `docs/README.md`  | Índice                                                |
| Todo el código    | `src/`, `components/`, `lib/`, etc.                   |

### Versiones en package.json (main)

| Campo             | Valor          | Nota                          |
| ----------------- | -------------- | ----------------------------- |
| `version`         | `0.0.0`        | Para apps derivadas, no tocar |
| `factoryVersion`  | La del release | Se bumpa                      |
| `agentKitVersion` | La de develop  | Viene con el agent kit        |
