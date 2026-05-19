---
description: Auto-carga el transition más reciente de .claude/transitions/ y retoma sesión con contexto mínimo. Úsalo después de /clear.
---

# /continue

Carga el transition más reciente y brief al usuario con el estado exacto para retomar. Contraparte de `/handoff`.

---

## Instrucciones al agente

### 1. Localizar el transition más reciente

> ⚠️ **No** usar `LATEST_DATE=$(...)` con command substitution — el allow list de `settings.json` matchea por prefix del string completo, y assignments como `LATEST_DATE=` no matchean `Bash(ls *)`. Dispara prompt en cada `/continue`. Descomponer en calls Bash discretas:

1. **Listar fechas disponibles:**

   ```bash
   ls -1 .claude/transitions/
   ```

   Del output, filtrar mentalmente líneas que matchean `YYYY-MM-DD` y tomar la última en orden descendente (la más reciente). Si el directorio no existe o el output está vacío → reportar "⚠️ No hay transitions guardados. Ejecuta /handoff en la próxima sesión para crear uno." y detener.

2. **Listar archivos dentro de esa fecha:**

   ```bash
   ls -1 .claude/transitions/<DATE-RESOLVED>/
   ```

   Del output, filtrar líneas que matchean `^[0-9]{6}\.md$` y tomar la última en orden descendente. Si vacío → misma advertencia y detener.

3. **Path resuelto:** `.claude/transitions/<DATE>/<FILE>` — usar directo con Read tool.

> Parseo del output (filtrar YYYY-MM-DD, ordenar desc) lo hace el agente inline, no shell — evita pipes y subshells que chocarían con el matching por prefix.

### 2. Leer el transition

Usar Read tool sobre el path resuelto. El archivo contiene secciones estándar: Focus, Current Work, Recent Decisions, Blockers, Next Steps, Modified Files, Commits.

### 3. Brief al user en ≤6 líneas

```
📂 Retomando: .claude/transitions/YYYY-MM-DD/HHMMSS.md
🎯 Focus: <primera línea del Focus>
🔄 Last work: <1-line summary del Current Work>
🚧 Blockers: <N blockers — "ninguno" si vacío>
➡️  Next: <primer item de Next Steps>

¿Procedo con "Next"?
```

**No ejecutar** el next step automáticamente. Esperar confirmación del user.

### 4. Pasada oportunista de cleanup (opcional, 1× por /continue)

Después del brief, chequear transitions con `stat` o filename date. Dos chequeos independientes:

**4a. Activos (fuera de `archive/`):** disparar sugerencia si se cumple **cualquiera**:

- **Stale:** hay archivos >14 días (excluir `archive/`)
- **Acumulación:** el total de transitions activos es >7

Acción propuesta → **archivar** (mover a `.claude/transitions/archive/YYYY-MM-DD/`) preservando jerarquía de fechas.

**4b. Archivo retention (>30 días en `archive/`):** disparar sugerencia si hay archivos en `archive/` con más de 30 días.

Acción propuesta → **borrar** (`rm`) — el archive no es SSOT, es buffer de recuperación.

**Formato combinado (máximo 1 prompt por sesión):**

```
🧹 Cleanup sugerido:
   • N transitions activos >14 días o acumulados (>7)  → archivar
   • M transitions en archive/ >30 días                → borrar

¿Procedo?
```

- Si los dos chequeos aplican → una sola propuesta combinada, no dos prompts
- Si solo uno aplica → mostrar solo esa línea
- Si el user confirma → ejecutar las operaciones aprobadas
- Si el user ignora → no insistir, solo mostrar una vez por sesión
- Si el user quiere granularidad ("archiva sí, borra no") → respetar

### 5. Reglas

- **NUNCA** borrar transitions sin confirmación explícita
- **NUNCA** ejecutar el "Next Step" del transition sin que el user diga "sí" o "procede"
- Si el user dice "procede" y el next step implica HIGH risk (commit, schema change, deploy) → aplicar CC.md §3 (Plan Mode antes)
- Si el transition tiene >7 días → advertir: "⚠️ Transition de hace >7 días — verificar que el contexto siga aplicando antes de ejecutar"

### 6. Edge cases

- **Transition corrupto** (secciones faltantes) → degradar gracefully: leer lo que haya, reportar "Transition parcial — verificar contenido"
- **Conflicto con trabajo en curso:** si hay cambios unstaged en git al invocar /continue → advertir "Working tree no limpio: ¿quieres incorporar cambios al plan o los stasheamos primero?"
- **Branch diferente:** si el transition menciona una branch distinta a la actual → reportar discrepancia, NO cambiar de branch automático
