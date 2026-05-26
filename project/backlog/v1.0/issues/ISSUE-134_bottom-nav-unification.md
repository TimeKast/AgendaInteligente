---
id: ISSUE-134
title: Bottom nav unificada `AgendaBottomNav` — siempre horizontal, 7 items + overflow "Más"
epic: EPIC-PWA-SETTINGS
milestone: v1.0
priority: P0
story_points: 5
status: ready
dependencies: [ISSUE-001]
user_stories: [US-134]
features: [FT-134]
screens: []
business_rules: []
agents: [frontend-specialist]
skills: [/frontend]
components: [CMP-130]
---

# ISSUE-134 — Bottom nav siempre horizontal (CMP-130 `AgendaBottomNav`)

## Overview

Unifica la navegación principal en un solo componente `AgendaBottomNav` que aparece SIEMPRE como bottom nav horizontal en TODOS los breakpoints (mobile, tablet, desktop). Reemplaza el split previo CMP-003 (mobile bottom) + CMP-004 (desktop sidebar) — ambos quedan deprecated por iteración prototipo.

7 items en orden: **Today / Plan / Tasks / Goals / Chat / Categorías / Settings**. Si el viewport no cabe los 7 (< 360px), los últimos 2 colapsan en menú "Más".

## Tasks

- [ ] CMP-130 `AgendaBottomNav` en `src/components/agenda-inteligente/AgendaBottomNav.tsx`:
  - Layout `position: fixed; bottom: 0; left: 0; right: 0`
  - Safe-area-inset-bottom respetado (iOS notch)
  - 7 items con icon (Lucide) + label corta
  - Active state: `text-ink-primary` + indicator
  - Inactive: `text-ink-hint`
  - Responsive sizing: icons + labels más grandes en >=md, más compactos en mobile <360px
- [ ] Config de items en `src/config/agenda-navigation.ts` (SSOT):
  ```ts
  export const AGENDA_NAV_ITEMS = [
    { id: 'today', label: 'Today', href: '/today', icon: 'sunrise' },
    { id: 'plan', label: 'Plan', href: '/week', icon: 'calendar' },
    { id: 'tasks', label: 'Tasks', href: '/tasks', icon: 'list-check' },
    { id: 'goals', label: 'Goals', href: '/goals', icon: 'target' },
    { id: 'chat', label: 'Chat', href: '/chat', icon: 'message-circle' },
    { id: 'categories', label: 'Categorías', href: '/categories', icon: 'folder' },
    { id: 'settings', label: 'Settings', href: '/settings', icon: 'settings' },
  ] as const;
  ```
- [ ] Overflow logic: si `useMediaQuery('(max-width: 360px)')` activo, los últimos 2 items colapsan en un 6to item "Más" que abre un sheet/popover con los items overflow
- [ ] Eliminar referencias a desktop sidebar (`Sidebar` componentless en este shell): el shell `(agendaInteligente)/layout.tsx` solo monta `AgendaBottomNav` + main content con `padding-bottom` para no taparse
- [ ] Marcar CMP-003 (BottomNav legacy) y CMP-004 (DesktopSidebar) como deprecated en `15_DESIGN.md` (no hacer cambios al doc — ya marcado per prompt)
- [ ] Verificar que ninguna ruta del shell `(agendaInteligente)/` referencia el sidebar viejo

## Acceptance Criteria

```gherkin
Scenario: Bottom nav siempre visible
  Given user en mobile 375px
  When navega entre /today, /week, /tasks, /goals
  Then AgendaBottomNav permanece visible
  Active state cambia al item correcto

Scenario: Bottom nav en desktop
  Given user en desktop 1440px
  Then AgendaBottomNav SIGUE en la parte inferior horizontal
  NO se transforma en sidebar
  Items con iconos + labels más grandes

Scenario: Viewport estrecho <360px
  Given user en 320px width
  Then bottom nav muestra 5 items + 1 "Más"
  Tap "Más" abre sheet con los 2 items overflow (Categorías + Settings o Goals + Chat según prioridad config)

Scenario: Safe-area iOS
  Given user en iPhone con notch
  Then bottom nav respeta safe-area-inset-bottom (no se solapa con home indicator)

Scenario: Component test (RTL)
  Given AgendaBottomNav renderizado
  When user clickea item "Tasks"
  Then router.push('/tasks') llamado
  Active state passa al item Tasks

Scenario: Component test overflow
  Given matchMedia mock con max-width 320
  Then DOM muestra exactamente 6 botones (5 items + "Más")
  Click en "Más" abre el sheet con 2 items
```

## Definition of Done

- [ ] CMP-130 implementado y montado en shell `(agendaInteligente)/layout.tsx`
- [ ] Config nav en archivo SSOT con types derivados
- [ ] Safe-area iOS testeado en dispositivo real o emulador
- [ ] Responsive 320px / 375px / 768px / 1440px sin overflow horizontal
- [ ] Active state derivado de `usePathname()` (no manual)
- [ ] CMP-003 + CMP-004 referencias removidas o marcadas deprecated en código
- [ ] Component test (RTL) ≥ 3 (navigation, overflow, active state)
