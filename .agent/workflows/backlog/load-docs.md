# Phase 3: Load Planning Docs (Tiered)

> **Carga:** Después de prerequisites.md
> **Solo full mode.** En add mode → usar load-backlog.md.
>
> 🔴 **Estrategia:** Tier 1 completo, Tier 2 targeted, Tier 3 skip.
> Ver SKILL.md §2 para justificación de cada tier.

---

## 3.1 Tier 1: `cat` completo (genera issues directamente)

> 🟢 **SIEMPRE cargar completos** — sin estos no se pueden generar issues.

// turbo

```bash
echo "📄 Cargando Tier 1 docs (fuente directa de issues)..."
echo ""

for i in 00 02 03 04 05 06 07 15; do
  f=$(ls ./docs/planning/${i}_*.md 2>/dev/null | head -1)
  if [ -n "$f" ]; then
    echo "========================================"
    echo "=== $(basename $f) ==="
    echo "========================================"
    cat "$f"
    echo ""
  else
    echo "🔴 ${i}_*.md — NO ENCONTRADO (Tier 1 — BLOCKER)"
  fi
done
```

---

## 3.2 Tier 2: Targeted loading (referencia contextual)

> 🟡 **Cargar solo lo relevante** — no todos los epics necesitan estos docs.

### 3.2a Proposal (solo scope/timeline)

// turbo

```bash
echo "📄 Tier 2: Proposal (head -50)..."
f=$(ls ./docs/planning/01_*.md 2>/dev/null | head -1)
if [ -n "$f" ]; then
  echo "=== $(basename $f) (primeras 50 líneas) ==="
  head -50 "$f"
else
  echo "⚠️ 01_PROPOSAL.md no encontrado (Tier 2 — warning)"
fi
```

### 3.2b Glossary (naming consistency)

// turbo

```bash
echo "📄 Tier 2: Glossary (head -30)..."
f=$(ls ./docs/planning/09_*.md 2>/dev/null | head -1)
if [ -n "$f" ]; then
  echo "=== $(basename $f) (primeras 30 líneas) ==="
  head -30 "$f"
else
  echo "⚠️ 09_GLOSSARY.md no encontrado (Tier 2 — warning)"
fi
```

### 3.2c Risk Register (para detectar ADRs)

// turbo

```bash
echo "📄 Tier 2: Risk Register..."
f=$(ls ./docs/planning/13_*.md 2>/dev/null | head -1)
if [ -n "$f" ]; then
  echo "=== $(basename $f) ==="
  cat "$f"
else
  echo "⚠️ 13_RISK_REGISTER.md no encontrado (Tier 2 — warning)"
fi
```

### 3.2d API Contracts, Test Strategy, E2E Scenarios (ON DEMAND)

> ⚠️ **NO cargar aquí.** Cargar durante epic-generation.md cuando el epic lo necesite:
>
> - `08_API_CONTRACTS.md` → cuando epic tiene API/integración
> - `11_TEST_STRATEGY.md` → cuando se genera testing issue del epic
> - `12_E2E_SCENARIOS.md` → cuando se genera testing issue del epic

```markdown
📝 Docs de carga on-demand (se cargan en epic-generation.md):

- 08_API_CONTRACTS.md → epics con API/integración
- 11_TEST_STRATEGY.md → testing issues
- 12_E2E_SCENARIOS.md → testing issues
```

---

## 3.3 Tier 3: Skip

> 🔴 **NO cargar** — no son input al backlog.

```markdown
⏭️ Docs que NO se cargan:

- 10_RUNBOOKS.md → post-deploy, no genera issues
- 14_TRACEABILITY.md → es OUTPUT del backlog, se pobla en Phase 6b
```

---

## 3.4 Extraer IDs para Cross-References

**De los docs Tier 1 extraer:**

| Tipo           | Formato | Uso en Issues         |
| -------------- | ------- | --------------------- |
| Features       | F-XXX   | Issues por feature    |
| Stories        | US-XXX  | "Implementa US-003"   |
| Personas       | P-XXX   | "Como P-001 (Admin)…" |
| Business Rules | BR-XXX  | Para AC               |
| Entities       | E-XXX   | Contexto técnico      |
| Pantallas      | SCR-XXX | Cross-refs            |
| Flujos         | FLW-XXX | Cross-refs            |
| Componentes    | CMP-XXX | Cross-refs            |

---

_Load Docs Complete → Ir a CHECKPOINT 1_
