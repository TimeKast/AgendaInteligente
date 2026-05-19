# Phase 2.1: R1 Checks (Epic/Issue DoD)

> **Scope:** Epic check — completitud, AC, DoD
> **Tiempo:** ~3m
> **Incluye:** R0 + Epic/Issue validation

---

## Epic Completitud Check

// turbo

```bash
echo "🔍 R1: Epic/Issue DoD Check"
echo ""
echo "📋 Issues Status:"
if [ -f "./docs/backlog/BOARD.md" ]; then
  echo "  In Progress: $(grep -c '🚧' ./docs/backlog/BOARD.md 2>/dev/null || echo 0)"
  echo "  Blocked: $(grep -c '🚫\|Blocked' ./docs/backlog/BOARD.md 2>/dev/null || echo 0)"
  echo "  Done: $(grep -c '✅' ./docs/backlog/BOARD.md 2>/dev/null || echo 0)"
else
  echo "  ⬜ No BOARD.md found"
fi
```

---

## AC (Acceptance Criteria) Validation

> El agente debe verificar manualmente:

```markdown
## ✅ AC Check (Manual)

Para cada issue del scope:

- [ ] Todos los AC marcados [x]
- [ ] No hay AC incompletos relevantes al scope
- [ ] Bitácora de implementación actualizada
```

---

## DoD (Definition of Done) Validation

// turbo

```bash
echo "📝 DoD Check (Automated):"
echo ""

# Check for uncommitted changes
UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l)
[ "$UNCOMMITTED" -gt 0 ] && echo "  ⚠️ $UNCOMMITTED uncommitted changes" || echo "  ✅ Clean working tree"

# Check for unresolved TODOs without issue
TODOS=$(grep -rn "TODO" --include="*.ts" --include="*.tsx" . 2>/dev/null | grep -v "node_modules" | grep -v "TODO(.*-[0-9]" | wc -l)
[ "$TODOS" -gt 0 ] && echo "  ⚠️ $TODOS TODOs without issue reference" || echo "  ✅ All TODOs have issue refs"
```

---

## DoD Checklist (Manual)

> El agente debe verificar contra el issue:

```markdown
## 📋 DoD Checklist

**Code Quality:**

- [ ] Código sigue patrones de 04_complementary.md
- [ ] No hay código comentado
- [ ] No hay console.log de debug

**Testing:**

- [ ] Tests requeridos existen
- [ ] Tests pasan (validado en R0)

**Documentation:**

- [ ] Bitácora actualizada en issue
- [ ] Commits documentados en issue

**Scope:**

- [ ] No scope creep (no código extra fuera del issue)
- [ ] Edge cases documentados manejados
```

---

## Pass Criteria

| Check         | Required           |
| ------------- | ------------------ |
| tests (R0)    | ✅ Pass            |
| AC complete   | ✅ All checked     |
| TODOs clean   | ✅ No orphan TODOs |
| DoD checklist | ✅ Pass            |

---

_R1 Complete → Continuar a Report (o R2 si aplica)_
