---
description: Session bridging — destila estado de la sesión a un transition doc antes de /clear. Opcional focus para próxima sesión.
argument-hint: '["focus para próxima sesión"]'
---

# /handoff

Genera un transition document con el estado de la sesión actual para que el próximo arranque con contexto mínimo y foco claro. Complementa auto-memory (facts durables) — transitions capturan estado efímero.

**Argumento:** `$ARGUMENTS` (opcional — focus de la próxima sesión)

---

## Instrucciones al agente

### 1. Generar path del transition (3 pasos, 0 prompts)

**Paso 1 — obtener fecha y hora UTC:**

```bash
date -u +%Y-%m-%d/%H%M%S
```

El output tiene shape `YYYY-MM-DD/HHMMSS` (ej: `2026-04-25/143052`). Parsear mentalmente: directorio = primera parte, archivo = segunda parte + `.md`.

**Paso 2 — crear el directorio del día explícitamente, con la fecha LITERAL:**

```bash
mkdir -p .claude/transitions/<YYYY-MM-DD-LITERAL>
```

> 🔴 **Sustituye la fecha en el string ANTES de mandar el comando**, no uses `$(date ...)`. El permission matcher de CC hace literal-check del string completo **antes** del shell expansion. `mkdir -p .claude/transitions/$(date ...)` no matchea `Bash(mkdir -p .claude/transitions/**)` porque el matcher ve `$(...)` como literal — disparaba prompt en cada `/handoff` en versiones previas. La fecha LITERAL (ej. `mkdir -p .claude/transitions/2026-04-25`) sí matchea y pasa sin prompt.

**Paso 3 — `Write` tool al path completo:**

`.claude/transitions/<DATE>/<HHMMSS>.md`

> 🔴 **El `mkdir` del paso 2 NO es opcional.** En este harness el `Write` tool dispara un safety prompt cuando tiene que crear un directorio padre que no existe — incluso con `Write(.claude/**)` + `Write(.claude/transitions/**)` ya en el allowlist (verificado empíricamente 2026-05-07). Pre-creando el dir con `mkdir`, el `Write` escribe a un path cuyo padre ya existe y no dispara el safety check.
>
> Nota histórica: una versión previa de este comando decía "Write crea los dirs padres automáticamente sin prompt" — eso era falso para este harness. La mecánica correcta es la de los 3 pasos arriba.

Siempre desde repo root.

### 2. Destilar la sesión

Analizar la conversación actual y separar:

**Efímero → transition** (scoped a próxima sesión):

- Current work: qué estabas haciendo AHORA (último paso en ejecución)
- Recent session decisions: acuerdos tomados esta sesión que aún no están en `PENDING.md` / `docs/` / memory
- Active blockers / open questions
- Next steps: 1-3 acciones concretas para arrancar la próxima sesión
- Modified files: archivos tocados con 1-line de qué cambió
- Commits referenciados esta sesión (SHAs cortos)

**Durable → auto-memory / docs / PENDING.md** (NO va al transition):

- Decisiones arquitectónicas → `PENDING.md` o doc relevante
- Convenciones nuevas → `auto-memory` (project/feedback type)
- Preferencias del user → `auto-memory` (user/feedback type)

Si identificás algo durable durante el destilado, proponé al user dónde guardarlo **antes** de escribir el transition.

### 3. Escribir el transition document

Usar Write tool (NO bash heredoc). Formato:

```markdown
# Transition — YYYY-MM-DD HH:MM:SS UTC

> **Focus próxima sesión:** <de $ARGUMENTS, o "continuar en progreso" si vacío>
> **Session duration aprox:** <estimación>
> **Branch:** <git branch actual>

## Current Work

<1-3 párrafos: qué estabas haciendo, en qué fase, último paso completado>

## Recent Decisions (session-scoped)

<bullet list — decisiones tomadas esta sesión que aún no están persistidas>

## Active Blockers / Open Questions

<bullet list — preguntas abiertas, cosas que esperan respuesta del user, errores pendientes>

## Next Steps

1. <acción concreta 1 — con paths/comandos si aplican>
2. <acción concreta 2>
3. <acción concreta 3>

## Modified Files (this session)

| File            | Change         |
| --------------- | -------------- |
| path/to/file.ts | 1-line summary |

## Commits (this session)

| SHA     | Subject          |
| ------- | ---------------- |
| abc1234 | feat(scope): ... |

## Durable State (already persisted elsewhere — for reference)

<opcional — si durante el destilado algo fue al PENDING/docs/memory, referenciar aquí con path para que el próximo `/continue` sepa dónde mirar>

---

_TimeKast Factory — transition YYYY-MM-DD/HHMMSS_
```

### 4. Report al user

Después de escribir, reportar en ≤5 líneas:

```
📝 Transition guardado: .claude/transitions/YYYY-MM-DD/HHMMSS.md
🎯 Focus: <resumen del focus>
📊 Destilado: N decisiones session-scoped, M next steps, K files modified

Siguiente paso:
→ Ejecuta `/clear` — al limpiar, `/continue` se dispara solo y retoma este transition.
```

### 5. Reglas duras

- **NUNCA** auto-borrar transitions viejos sin confirmación del user
- **NUNCA** escribir algo durable al transition sin proponer primero guardarlo en memory/PENDING/docs
- **NO** mezclar handoff con commits — el handoff se hace DESPUÉS de committear lo que estaba listo; los cambios unstaged se documentan pero no se committean aquí
- **NO** ejecutar `/clear` — eso es acción del usuario (CC no puede limpiarse solo)

### 6. Edge cases

- Si no hay trabajo en curso → preguntar al user "¿querés un transition de cierre de día o abortamos?"
- Si hay cambios unstaged importantes → listar en "Next Steps" como "Review + stage: <files>"
- Si la sesión tuvo >5 commits → priorizar los últimos 3 en el transition, mencionar total
