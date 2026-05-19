# Phase 1: Context Loading

> **Propósito:** Cargar knowledge base, agentes, skills, y SSOT docs.
> **Se ejecuta SIEMPRE.**

---

## 1.1 Load Knowledge Base

// turbo

```bash
cat ./.agent/skills/roles/proposal/SKILL.md
```

// turbo

```bash
cat ./docs/planning/project-config.md 2>/dev/null || echo "No project-config.md"
```

---

## 1.2 SSOT Documents (MANDATORY)

> 🔴 **OBLIGATORIO** — Proposal deriva de Discovery Brief.
>
> **Chain:** Discovery (00) → **Proposal** (01)

// turbo

```bash
cat ./docs/planning/00_DISCOVERY_BRIEF.md 2>/dev/null || echo "⚠️ No 00_DISCOVERY_BRIEF.md - CRÍTICO para proposal"
```

---

## 1.3 Kit Skills Loading

> 🎯 **Skills del Kit para propuestas**

// turbo

```bash
# Brainstorming (SIEMPRE cargar para propuestas)
cat ./.agent/skills/brainstorming/SKILL.md 2>/dev/null | head -60 || echo "No brainstorming skill"
```

// turbo

```bash
# App builder (para proyectos nuevos)
cat ./.agent/skills/app-builder/SKILL.md 2>/dev/null | head -60 || echo "No app-builder skill"
```

// turbo

```bash
# Architecture (scope técnico)
cat ./.agent/skills/architecture/SKILL.md 2>/dev/null | head -60 || echo "No architecture skill"
```

---

## 1.4 Agent Context Loading

> 🤖 **Agentes para proposal**

// turbo

```bash
cat ./.agent/agents/project-planner.md
```

// turbo

```bash
cat ./.agent/agents/product-manager.md
```

---

_Phase 1 Complete → Continuar a Phase 2 (Prerequisites)_
