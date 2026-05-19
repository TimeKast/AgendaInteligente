# Generation Rules (Shared)

> **Carga:** Antes de cualquier pasada. Contiene reglas compartidas por todas las pasadas.
> **SSOT:** Este archivo para reglas de generación del design.

---

## Verify Mode (Refresh vs Generate)

```bash
# Si archivo existe, estamos en modo REFRESH
if [ -f "./docs/planning/15_DESIGN.md" ]; then
  echo "⚠️ Modo REFRESH: preservar IDs SCR/FLW/CMP/DD existentes"
else
  echo "✅ Modo GENERATE: crear desde template"
fi
```

**Regla de refresh:**

- Si 15_DESIGN.md ya existe → preservar IDs asignados
- Solo agregar/modificar contenido, no reordenar
- Nuevos items reciben siguiente ID disponible

---

## Create File (solo si no existe)

```bash
mkdir -p ./docs/planning
[ ! -f ./docs/planning/15_DESIGN.md ] && cp ./.agent/skills/roles/design/15_DESIGN.template.md ./docs/planning/15_DESIGN.md
```

---

## Starter Kit Awareness (MANDATORY)

> 🔴 **ANTES de diseñar, verificar qué ya existe en INVENTORY.md y CODEBASE.md.**
>
> Estos archivos se cargaron en Phase 1 (context-loading.md).

**REGLA:** Para cada pantalla/componente a diseñar:

| Ya existe en INVENTORY/CODEBASE? | Acción                                           |
| -------------------------------- | ------------------------------------------------ |
| ✅ Existe completo               | Marcar `🏗️ SK Provided` — NO rediseñar           |
| 🟡 Existe parcial                | Marcar `🔧 SK Extended` — diseñar solo extensión |
| ❌ No existe                     | Diseñar completo como `🆕 New`                   |

---

## Design Tokens (MANDATORY)

> 🔴 **OBLIGATORIO:** Leer tokens existentes del SK y documentar en 15_DESIGN.md.

// turbo

```bash
cat ./src/app/globals.css 2>/dev/null | head -100 || echo "No globals.css"
```

// turbo

```bash
cat ./tailwind.config.ts 2>/dev/null | head -80 || echo "No tailwind.config.ts"
```

**Instrucciones:**

1. **Documentar** en 15_DESIGN.md sección "Design Tokens":
   - Paleta de colores (SK base ± cambios del proyecto)
   - Typography scale (fuentes, tamaños)
   - Spacing system (valores base)
   - Breakpoints (responsive)

2. **Si Discovery §4 indica cambio de branding** → definir nuevos tokens aquí

3. **Marcar origen:**
   - `🏗️ SK Default` — usar tokens existentes del SK
   - `🎨 Custom` — tokens modificados para este proyecto

---

## Kit Skills Consultation (Design Enhancement)

> 🎨 **Durante la generación, consultar skills del Kit:**

| Decisión                  | Consultar                                  |
| ------------------------- | ------------------------------------------ |
| Color palette, contrast   | `kit/frontend-design/color-system.md`      |
| Typography scale, pairing | `kit/frontend-design/typography-system.md` |
| UX laws (Hick's, Fitts')  | `kit/frontend-design/ux-psychology.md`     |
| Touch targets, gestures   | `kit/mobile-design/touch-psychology.md`    |
| Animations, transitions   | `kit/frontend-design/animation-guide.md`   |

**Prioridad:** `domains/ui/ (Stack SK) > kit/ (Principios)`

---

## Architect Gating

**Cargar `@[.agent/agents/architect.md]` si encuentras:**

| Situación            | Impacto                      |
| -------------------- | ---------------------------- |
| Offline-first UI     | Cache strategy, sync         |
| Realtime features    | WebSockets vs polling        |
| Complex state        | Global state patterns        |
| Performance-critical | Virtualization, lazy loading |
| Multi-step wizards   | State persistence            |

---

_Design Generation Rules — Shared across all passes_
