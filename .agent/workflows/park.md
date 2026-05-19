---
description: Park workflow - capture ideas and tech debt for later
---

# /park — Parking Lot

> **Flujo:** Utility (cualquier momento)
> **Propósito:** Capturar ideas, deuda técnica, y consideraciones futuras sin interrumpir el flujo actual.

---

## Invocación

```bash
/park "[descripción breve]"              # Park rápido
/park "[descripción]" --type=tech-debt   # Con tipo específico
/park "[descripción]" --source=ISSUE-XXX # Con origen
```

---

## 🌳 Cuándo Usar

```
Durante /implement y encuentras:
│
├─► Idea para mejorar algo → /park "Idea: ..."
├─► Deuda técnica → /park "Tech debt: ..."
├─► Bug menor no relacionado → /park "Bug: ..."
├─► Feature para después → /park "Future: ..."
└─► Doc que falta → /park "Doc: ..."
```

**Regla:** Si no es del issue actual → PARK, no implementar.

---

## Phase 1: Context Loading

// turbo

```bash
cat ./.agent/skills/roles/backlog/parking.template.md
```

---

## Phase 2: Determine Location

**Estructura:**

```
docs/backlog/{version}/
├── parking/           # Parking lot
│   ├── PARK-001-*.md
│   ├── PARK-002-*.md
│   └── ...
├── epics/
└── issues/
```

// turbo

```bash
# Encontrar siguiente número
LAST=$(ls -1 ./docs/backlog/*/parking/PARK-*.md 2>/dev/null | tail -1 | grep -oE "PARK-[0-9]+" | grep -oE "[0-9]+" || echo "0")
NEXT=$(printf "%03d" $((LAST + 1)))
echo "Next PARK ID: PARK-${NEXT}"
```

---

## Phase 3: Create Parking Entry

```bash
mkdir -p ./docs/backlog/{version}/parking
```

**Crear archivo:**

```
PARK-{NUM}-{slug}.md
```

**Contenido mínimo:**

```markdown
# PARK-{NUM}: {Título}

> **ID:** PARK-{NUM}
> **Status:** 📦 Parked
> **Type:** 💡 Idea | 🔧 Tech Debt | 🐛 Bug | 📝 Doc | 🔮 Future
> **Priority:** TBD
> **Source:** {origen}
> **Created:** {fecha}

## Descripción

{lo que el usuario pasó}

## Contexto

**Origen:** {durante qué issue/sesión}
**Por qué se aparcó:** {razón}

## Para Revisión

- [ ] Cuando termine MVP
- [ ] Cuando haya tiempo
```

---

## Phase 4: Quick Confirmation

```markdown
## 📦 Parked: PARK-{NUM}

**Título:** {descripción breve}
**Tipo:** {tipo}
**Ubicación:** `docs/backlog/{version}/parking/PARK-{NUM}-{slug}.md`

**Continúa con:** /implement {ISSUE-ID} (o lo que estabas haciendo)
```

---

## Tipos

| Tipo          | Emoji | Cuándo                                   |
| ------------- | ----- | ---------------------------------------- |
| **Idea**      | 💡    | Mejora potencial, feature futura         |
| **Tech Debt** | 🔧    | Refactor, cleanup, optimización          |
| **Bug**       | 🐛    | Bug menor no relacionado al issue actual |
| **Doc**       | 📝    | Documentación faltante                   |
| **Future**    | 🔮    | Consideración para versiones futuras     |

---

## Revisar Parking Lot

```bash
ls -la ./docs/backlog/*/parking/
```

---

## Promover a Issue

Cuando un PARK item se vuelve prioritario:

1. Leer el PARK item
2. Crear issue con `/backlog` o manualmente
3. Marcar PARK como promovido:
   ```markdown
   > **Status:** ✅ Promoted → {ISSUE-ID}
   ```

---

## Reglas

**SIEMPRE:**

1. Park rápido, no interrumpir flujo
2. Incluir contexto de origen
3. Tipo claro (💡/🔧/🐛/📝/🔮)

**NUNCA:**

1. Implementar algo que debería estar parked
2. Park sin descripción clara
3. Olvidar revisar parking lot periódicamente

---

## Flujo Completo

```
/start → /discovery → /proposal → /docs → /design → /backlog → /implement → /audit
                                                       │
                                                       └─► /park (durante)

```

---

_TimeKast Factory — Park Workflow_
