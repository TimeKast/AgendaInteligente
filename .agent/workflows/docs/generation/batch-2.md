# Batch 2 — Setup: User Stories (04)

> **Output:** 04_USER_STORIES
>
> **Depende de:** Batch 1 (02_FEATURE_MAP → FT-XXX para derivar US)
>
> **Estrategia:** Sub-batching de 5 features. Este archivo configura el doc.
> La generación se hace en sub-batches via `batch-2-sub.md`.

---

## Quality Floor (OBLIGATORIO)

> 🔴 **CADA User Story DEBE cumplir estos mínimos:**

| Prioridad       | Mínimo Gherkin                   | Cross-refs                |
| --------------- | -------------------------------- | ------------------------- |
| **Must Have**   | 2 scenarios (happy + error/edge) | FT-XXX + BR-XXX si aplica |
| **Should Have** | 1 scenario (happy path)          | FT-XXX                    |

**Reglas adicionales:**

- Cada scenario DEBE usar Given/When/Then con **datos concretos** (no genéricos)
- Si la US referencia una BR-XXX, el scenario DEBE validar esa BR explícitamente
- Cross-ref obligatorio: US→FT-XXX (feature que implementa), US→P-XXX (persona)

---

## Cargar template

// turbo

```bash
echo "📄 Loading Batch 2 template..."
cat ./.agent/skills/roles/docs/04_USER_STORIES.template.md
```

---

## Crear archivo con header

**Usar `write_to_file`** para crear `docs/planning/04_USER_STORIES.md` con:

- Header + metadata
- Tabla de TODAS las épicas derivadas de 02_FEATURE_MAP
- Footer placeholder: `_Generado por TimeKast Factory_`
- **SIN stories aún** — solo estructura

---

## Planificar sub-batches

1. Listar TODOS los FT-XXX de 02_FEATURE_MAP
2. Dividir en grupos de **5 features**
3. Anotar cuántos sub-batches serán necesarios
4. **Mostrar plan vía `notify_user`:**

```markdown
## 📋 Batch 2 Setup Listo

**Archivo creado:** 04_USER_STORIES.md (header + épicas)
**Features totales:** [N] FT-XXX
**Sub-batches planificados:** [M] (de ~5 features cada uno)

Sub-batch 1: FT-001 → FT-005
Sub-batch 2: FT-006 → FT-010
...

¿Iniciar generación de sub-batch 1?
```

**ACTION:** Call `notify_user` with `BlockedOnUser: true`, `ShouldAutoProceed: false`

🛑 **STOP — NO generar stories todavía. Esperar confirmación.**

---

_Batch 2 Setup Complete → Sub-batches se ejecutan via batch-2-sub.md_
