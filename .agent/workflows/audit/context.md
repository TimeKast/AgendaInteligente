# Phase 0: Context Loading

> **Carga:** Automática al inicio de /audit

---

## Phase 0.5: Context Status (MANDATORY)

> 🔴 **MANDATORY OUTPUT — NO SKIP**

// turbo

```bash
cat ./.agent/workflows/_shared/context-check.md
```

**Enforcement:**

- 🟢 → Continuar a Phase 1 (Rules Loading)
- 🟡/🔴 → STOP. Mensaje: "⚠️ Contexto en [🟡/🔴] ([X]%). Recomiendo abrir un chat nuevo. ¿Continúo aquí?"

---

## Phase 1: Rules Loading

// turbo

```bash
cat ./.agent/rules/04_complementary.md 2>/dev/null || cat ./.agent/rules/04_complementary.md
```

// turbo

```bash
cat ./.agent/rules/DOR_DOD.md 2>/dev/null || cat ./.agent/rules/DOR_DOD.md
```

// turbo

```bash
cat ./docs/planning/project-config.md 2>/dev/null || echo "No project-config.md"
```

// turbo

```bash
cat ./docs/reference/INVENTORY.md 2>/dev/null || echo "No INVENTORY.md"
```

// turbo

```bash
cat ./docs/reference/CODEBASE.md 2>/dev/null || echo "No CODEBASE.md"
```

## Phase 2: Skill Loading

> Cargar skill de code review para criterios de calidad.

// turbo

```bash
cat ./.agent/skills/code-review-checklist/SKILL.md 2>/dev/null || cat ./.agent/skills/code-review-checklist/SKILL.md
```

---

## Phase 1.5: Kit Skills Loading

> 🎯 **Skills del Kit para auditoría**

// turbo

```bash
# Vulnerability scanner (SIEMPRE en audit)
cat ./.agent/skills/vulnerability-scanner/SKILL.md 2>/dev/null | head -80 || echo "No vulnerability-scanner"
```

// turbo

```bash
# Testing patterns
cat ./.agent/skills/testing-patterns/SKILL.md 2>/dev/null | head -60 || echo "No testing-patterns"
```

// turbo

```bash
# Code review checklist
cat ./.agent/skills/code-review-checklist/SKILL.md 2>/dev/null | head -60 || echo "No code-review-checklist"
```

---

## Phase 1.8: Agent Context Loading

> 🤖 **Agentes para audit**
>
> Ver REGISTRY de agents: `.agent/registry/views/agents.md`

// turbo

```bash
# Quality Engineer (SIEMPRE en audit)
cat ./.agent/agents/quality-engineer.md
```

**Agentes adicionales por tier (cargar después de selección):**

| Tier | Agentes adicionales                                     |
| ---- | ------------------------------------------------------- |
| R0   | —                                                       |
| R1   | —                                                       |
| R2   | security-auditor, backend-specialist                    |
| R3   | + devops-engineer, performance-optimizer, test-engineer |

```bash
# Si R2+
cat ./.agent/agents/security-auditor.md
cat ./.agent/agents/backend-specialist.md

# Si R3
cat ./.agent/agents/devops-engineer.md
cat ./.agent/agents/performance-optimizer.md
cat ./.agent/agents/test-engineer.md
```

---

## Phase 2: Environment & Capabilities

// turbo

```bash
echo "📍 Environment:"
echo "  Node: $(node -v)"
echo "  pnpm: $(pnpm -v)"
echo "  Git: $(git rev-parse --short HEAD 2>/dev/null || echo 'no git')"
echo "  Uncommitted: $(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
```

// turbo

```bash
echo ""
echo "🔍 Capabilities:"
grep -q '"lint"' package.json && echo "  ✅ lint" || echo "  ⬜ lint"
grep -q '"typecheck"' package.json && echo "  ✅ typecheck" || echo "  ⬜ typecheck"
grep -q '"test"' package.json && echo "  ✅ test" || echo "  ⬜ test"
grep -q '"build"' package.json && echo "  ✅ build" || echo "  ⬜ build"
grep -q '"test:e2e"' package.json && echo "  ✅ test:e2e" || echo "  ⬜ test:e2e"
grep -q '"test:coverage"' package.json && echo "  ✅ test:coverage" || echo "  ⬜ test:coverage"
grep -q '"lighthouse"' package.json && echo "  ✅ lighthouse" || echo "  ⬜ lighthouse"
```

---

_Phase 0 Complete → Continuar a Phase 1 (Tier Selection)_
