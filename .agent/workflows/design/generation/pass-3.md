# Pass 3: Wireframes

> **Output:** §9 Wireframes Textuales
> **Carga:** Después de checkpoint inter-pasada 2
>
> **§10 Checklist se genera DESPUÉS de Phase 5 (Validation fixes).**

---

## Scope

> 🔴 **OBLIGATORIO:** Cada pantalla SCR-XXX documentada en §1 del design DEBE tener un wireframe.

**Input:** Pantallas ya generadas en §1-§8 de `15_DESIGN.md`.
**Output:** Sección §9 agregada al final de `15_DESIGN.md`.

---

## Formato por Wireframe

Cada wireframe DEBE incluir estos 4 elementos:

### 1. Layout ASCII

```
### SCR-XXX: {Nombre de Pantalla}

┌─────────────────────────────┐
│         [Header]            │
│                             │
│  {Elementos principales}    │
│  del layout con cajas       │
│  ASCII representando los    │
│  componentes reales         │
│                             │
│       [   CTA   ]           │
│                             │
└─────────────────────────────┘
```

### 2. Nota Mobile

```
- Mobile: {Cómo cambia el layout en viewport < 768px}
```

### 3. States

```
- States: {loading, empty, error, data — los que apliquen}
```

### 4. RBAC

```
- RBAC: {Roles que acceden a esta pantalla, o "público"}
```

---

## Template de §9

Agregar al final de `15_DESIGN.md`:

```markdown
---

## §9: Wireframes Textuales

> Representación ASCII de cada pantalla para referencia rápida en `/backlog` y `/implement`.

### SCR-001: {Nombre}

┌─────────────────────────────┐
│ [Logo/Header] │
│ │
│ {Layout del contenido} │
│ │
└─────────────────────────────┘

- Mobile: {adaptación responsive}
- States: {loading, empty, error, data}
- RBAC: {roles con acceso}

### SCR-002: {Nombre}

{... mismo formato ...}
```

---

## Reglas

**SIEMPRE:**

1. Un wireframe por cada SCR-XXX listada en §1
2. Usar box-drawing characters (`┌ ─ ┐ │ └ ┘`) para consistencia
3. Incluir los 4 elementos (layout, mobile, states, RBAC)
4. Referenciar componentes SK y CMP-XXX dentro del wireframe
5. Mantener el wireframe simple — es referencia rápida, no mockup completo

**NUNCA:**

1. Omitir pantallas que están en §1
2. Crear wireframes sin nota de mobile
3. Generar imágenes en lugar de texto
4. Poner wireframes en archivo separado (siempre §9 de `15_DESIGN.md`)

---

## Validación Automática (grep checks)

// turbo

```bash
# Verificar SCR IDs
grep -qE "SCR-[0-9]{3}" ./docs/planning/15_DESIGN.md && echo "✅ Screens present" || echo "❌ Missing SCR IDs"
```

// turbo

```bash
# Verificar FLW IDs y Mermaid
grep -qE "FLW-[0-9]{3}" ./docs/planning/15_DESIGN.md && echo "✅ Flows present" || echo "❌ Missing FLW IDs"
grep -q "\`\`\`mermaid" ./docs/planning/15_DESIGN.md && echo "✅ Mermaid present" || echo "❌ Missing Mermaid diagrams"
```

// turbo

```bash
# Verificar OQ y Assumptions
grep -q "## Open Questions" ./docs/planning/15_DESIGN.md && echo "✅ Open Questions" || echo "❌ Missing OQ"
grep -q "## Assumptions" ./docs/planning/15_DESIGN.md && echo "✅ Assumptions" || echo "❌ Missing Assumptions"
```

// turbo

```bash
# Contar pantallas en §1 vs wireframes en §9
echo "=== SCR count ==="
grep -c "^### SCR-" docs/planning/15_DESIGN.md || echo "0"
echo "=== Wireframe sections ==="
grep -c "SCR-[0-9]" docs/planning/15_DESIGN.md || echo "0"
```

---

_Pass 3 Complete → Orchestrator maneja CHECKPOINT 2_
