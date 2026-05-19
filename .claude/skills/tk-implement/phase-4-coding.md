# Phase 4 — Implement + Gather Evidence

> **Carga:** SOLO después de CHECKPOINT 1 aprobado.
> **Propósito:** Implementar el plan, ejecutar validaciones, recopilar evidencia.
> **Subagent delegation:** según dominio del issue — ver tabla en SKILL.md.

---

## 4.0 Set Lifecycle Dates (Started)

> 🔴 **ANTES de implementar**, marcar Started en issue y epic.

**Issue:**

1. Abrir el issue file
2. Si `Started:` es `—` → set `Started: YYYY-MM-DD` (hoy)
3. Si `Started:` ya tiene fecha → no cambiar (resume de sesión previa)

**Epic (conditional):**

1. Leer campo `> **Epic:**` del issue
2. Si no tiene epic → skip
3. Abrir archivo del epic en `project/backlog/{version}/epics/`
4. Si `Started:` del epic es `—` → set `Started: YYYY-MM-DD` (primer issue que lo inicia)

**Smoke test:**

```bash
grep -qE "Started:\*\*[[:space:]]+20[0-9]{2}-[0-9]{2}-[0-9]{2}" ./project/backlog/*/issues/${ISSUE_ID}*.md && echo "✅ Started present in issue" || echo "🔴 MISSING Started in issue"
```

---

## 4.1 Implement

**Rol:** Senior Full-Stack Engineer (o subagent delegado).

**Criterios de delegación:**

| Dominio del issue                 | Subagent               |
| --------------------------------- | ---------------------- |
| Server actions, APIs, validación  | `backend-specialist`   |
| Componentes React, páginas, state | `frontend-specialist`  |
| Schema Drizzle, migraciones       | `data-modeler-drizzle` |
| App Flutter                       | `flutter-mobile`       |
| Tests (si AC explícitos)          | `test-engineer`        |
| Issue simple / cross-domain       | main loop inline       |

**Acciones (del subagent o main loop):**

1. Leer plan aprobado de Phase 3
2. Implementar EXACTAMENTE lo del plan
3. NO adelantar trabajo de otros issues (CODING.md §3/§4)
4. Cumplir TODOS los AC
5. Documentar desviaciones si el plan cambió

**Control de flujo:**

- `/park "[idea]"` — parkear ideas emergentes fuera de scope
- Si aparece scope creep → parar y preguntar, no ejecutar unilateralmente

---

## 4.2 Run Validations

> 🔴 Ejecutar TODAS las validaciones. Recopilar resultados para Phase 5.

```bash
pnpm typecheck
```

```bash
pnpm lint
```

```bash
pnpm build
```

**Si el plan incluye tests:**

```bash
pnpm test
```

**Si hay errores:**

1. Corregir
2. Re-ejecutar validaciones
3. Repetir hasta ✅

> ⚠️ Si un error no es fácil de resolver en iteración → parar y escalar al usuario. No introducir hacks (CODING.md §6).

---

## 4.3 Gather Evidence

> 📝 Recopilar artefactos para Phase 5 (QC evaluará esta evidencia sin re-ejecutar).

```markdown
🔄 **Evidence Gathered:**

- Typecheck: ✅ / 🔴
- Lint: ✅ / 🔴
- Build: ✅ / 🔴
- Tests: ✅ / 🔴 / N/A
- Files created: [lista desde git]
- Files modified: [lista desde git]
```

Snippet útil:

```bash
echo "Created:"
git diff --diff-filter=A --name-only
echo "Modified:"
git diff --diff-filter=M --name-only
```

---

_Phase 4 Complete → Phase 5 (QC evaluates evidence)_
