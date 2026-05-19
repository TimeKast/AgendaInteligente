---
description: Investigación sistemática de bugs - sin crear issue formal
---

# /debug — Investigación Sistemática

> **Flujo:** Utility (cualquier momento)
> **Propósito:** Debuggear problemas rápidamente sin pasar por el pipeline completo de issue → implement.

---

## Invocación

```bash
/debug "descripción del error"
/debug "API returns 500 on /api/users"
/debug "form no guarda datos"
```

---

## Phase 1: Context Loading (MANDATORY)

### Skill base (SIEMPRE cargar)

// turbo

```bash
cat ./.agent/skills/systematic-debugging/SKILL.md
```

### Skill de dominio (elegir UNO según el error)

```bash
# Si es error de API/Server Actions:
cat ./.agent/skills/domains/api/SKILL.md

# Si es error de DB/Schema/Queries:
cat ./.agent/skills/domains/db/SKILL.md

# Si es error de UI/Components:
cat ./.agent/skills/domains/ui/SKILL.md
```

---

### Confirmar contexto cargado

> El agente DEBE mostrar qué skills cargó antes de investigar.

// turbo

```bash
cat ./.agent/workflows/_shared/checkpoint-transparency.md
```

---

## Phase 2: Síntoma

Recopilar información del problema:

```markdown
## 🔍 Debug: [Descripción breve]

### 1. Síntoma

- **Qué pasa:** [descripción]
- **Error:** `[mensaje de error si existe]`
- **Archivo:** `[filepath]`
- **Línea:** [número si aplica]

### 2. Contexto

- **Pasos para reproducir:**
  1. [paso 1]
  2. [paso 2]
  3. [resultado esperado vs actual]
- **Cambios recientes:** [git log -5]
- **Frecuencia:** Siempre / A veces / Raro
```

---

## Phase 3: Hipótesis

Formular posibles causas ordenadas por probabilidad:

```markdown
### 3. Hipótesis

| #   | Causa posible    | Probabilidad | Por qué     |
| --- | ---------------- | ------------ | ----------- |
| 1   | [más probable]   | 🔴 Alta      | [evidencia] |
| 2   | [segunda opción] | 🟡 Media     | [evidencia] |
| 3   | [menos probable] | 🟢 Baja      | [evidencia] |
```

---

## Phase 4: Investigación

Verificar cada hipótesis sistemáticamente:

```markdown
### 4. Investigación

**Hipótesis 1:** [descripción]

- Verificación: [qué revisé]
- Resultado: ✅ Confirmado / ❌ Descartado

**Hipótesis 2:** [descripción]

- Verificación: [qué revisé]
- Resultado: ✅ Confirmado / ❌ Descartado
```

**Técnicas de investigación:**

```bash
# Cambios recientes
git log --oneline -10
git diff HEAD~3

# Buscar patrones
grep -r "errorPattern" --include="*.ts"

# Logs
tail -f logs/error.log
```

---

## Phase 5: Root Cause & Fix

````markdown
### 5. Root Cause

🎯 **[Explicación de por qué ocurrió]**

### 6. Fix

```typescript
// Antes (broken)
[código problemático]

// Después (fixed)
[código corregido]
```
````

### 7. Prevención

🛡️ [Cómo evitar que vuelva a ocurrir]

- [ ] Test agregado
- [ ] Validación añadida
- [ ] Documentación actualizada

````

---

## Phase 6: Commit

> ⚠️ **No hay issue formal, pero SÍ hay commit**

```bash
git add [archivos]
git commit -m "fix: [descripción breve del fix]

Root cause: [explicación]
Prevention: [qué se agregó para prevenir]"
````

---

## Agentes Opcionales

> Solo invocar si el problema lo requiere:

| Situación              | Agente                                 | Cuándo                         |
| ---------------------- | -------------------------------------- | ------------------------------ |
| Problema arquitectural | `@[.agent/agents/architect.md]`        | El bug revela fallo de diseño  |
| Gap de testing         | `@[.agent/agents/quality-engineer.md]` | Se necesitan tests preventivos |

---

## Reglas

**SIEMPRE:**

1. Reproducir antes de arreglar
2. Hipótesis ordenadas por probabilidad
3. Verificar cada hipótesis sistemáticamente
4. Documentar root cause
5. Commit con explicación

**NUNCA:**

1. Cambios random ("a ver si esto funciona")
2. Ignorar evidencia
3. Asumir sin probar
4. Fix sin entender el por qué
5. Olvidar prevención

---

## Principios

- **Preguntar antes de asumir** — obtener contexto completo
- **Probar hipótesis** — no adivinar
- **Explicar por qué** — no solo qué arreglar
- **Prevenir recurrencia** — tests, validación

---

_TimeKast Factory — Debug Workflow_
