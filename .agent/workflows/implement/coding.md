# Phase 4: Implement + Gather Evidence

> **Carga:** Solo DESPUÉS de CHECKPOINT 1 aprobado.
> **Propósito:** Implementar lo del plan, ejecutar validaciones, recopilar evidencia.

---

## 4.0 Set Lifecycle Dates (Started)

> 🔴 **ANTES de implementar, marcar Started en issue y epic.**

**Issue:**

1. Abrir el issue file
2. Si `Started:` es `—` → set `Started: YYYY-MM-DD` (fecha de hoy)
3. Si `Started:` ya tiene fecha → no cambiar (resume de sesión previa)

**Epic (conditional):**

1. Leer campo `> **Epic:**` del issue
2. Si tiene epic → abrir archivo del epic
3. Si `Started:` del epic es `—` → set `Started: YYYY-MM-DD` (este es el primer issue que inicia)
4. Si `Started:` del epic ya tiene fecha → no cambiar

**Smoke test:**

```bash
grep -qF "Started:" ./docs/backlog/*/issues/${ISSUE_ID}*.md && echo "✅ Started present in issue" || echo "🔴 MISSING Started in issue"
```

---

## 4.1 Implement

**Rol:** Senior Full-Stack Engineer

> Skills y agents ya fueron cargados en Phase 1.
> No re-cargar ni re-determinar aquí.

**Acciones:**

1. Leer plan de Phase 3
2. Implementar EXACTAMENTE lo del plan
3. NO adelantar trabajo de otros issues
4. Cumplir TODOS los AC
5. Documentar desviaciones si el plan cambió

**Control de flujo:**

```bash
/pause ISSUE-XXX    # Para pausar
/park "[idea]"      # Para ideas descubiertas
```

---

## 4.2 Run Validations

> 🔴 Ejecutar TODAS las validaciones. Recopilar resultados como evidencia para Phase 5.

// turbo

```bash
pnpm typecheck
```

// turbo

```bash
pnpm lint
```

// turbo

```bash
pnpm build
```

**Si el plan incluye tests:**

// turbo

```bash
pnpm test
```

**Si hay errores:**

1. Corregir
2. Re-ejecutar validaciones
3. Repetir hasta ✅

---

## 4.3 Gather Evidence

> 📝 Recopilar artefactos para Phase 5 (QC evaluará esta evidencia).

```markdown
🔄 **Evidence Gathered:**

- Typecheck: ✅/🔴
- Lint: ✅/🔴
- Build: ✅/🔴
- Tests: ✅/🔴/N/A
- Files created: [lista]
- Files modified: [lista]
```

---

_Phase 4 Complete → Continuar a Phase 5 (QC evaluates evidence)_
