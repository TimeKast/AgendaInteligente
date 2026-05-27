---
id: ISSUE-090c
title: Settings → Integrations page (SCR-033) — connections list + connect/disconnect UI
epic: EPIC-CALENDAR
milestone: v1.0
priority: P2
story_points: 1
status: ready
dependencies: [ISSUE-090, ISSUE-090b]
user_stories: [US-090, US-090b]
features: [FT-090]
screens: [SCR-033, SCR-062]
business_rules: []
agents: [frontend-specialist]
skills: [/frontend]
---

# ISSUE-090c — Calendar integrations settings page

## Overview

UI thin layer sobre Slice A1 + A2. Una sola página `/settings/integrations` con la lista de conexiones del user + botón conectar. Sin lógica de negocio nueva — solo llama las routes existentes.

## Tasks

- [ ] **Page `/settings/integrations`:**
  - Server component que hace `SELECT calendar_connections WHERE user_id = $1` via scopedDb.
  - Lista: cada item muestra `account_label` (default = email) + provider icon + status badge (enabled/paused) + last_synced_at (si existe) + last_sync_error (si existe, en rojo).
  - Empty state: "Conecta tu primer calendario para sincronizar tus eventos."
  - CTA primario "Conectar Google Calendar" — link a `/api/calendar/google/connect`.
- [ ] **Connection card actions:**
  - "Pausar" / "Reanudar" toggle → server action `setConnectionEnabled(id, enabled)` con `scopedDb('calendarConnections')`.
  - "Renombrar" → inline edit del `account_label`, server action `setConnectionLabel(id, label)`.
  - "Desconectar" → confirm modal → POST `/api/calendar/connections/[id]/disconnect`.
- [ ] **Toast surfaces:**
  - On mount: si query param `?connected=1` → "Calendario conectado", `?error=already_connected` → "Esa cuenta ya está conectada".
  - On action: optimistic toggle + toast con undo (4s).
- [ ] **Multi-cuenta UX:**
  - Cuando hay 1+ conexión activa, botón "Conectar Google Calendar" cambia a "+ Conectar otra cuenta".
  - Lista ordenada por `connected_at DESC`.

## Acceptance Criteria

```gherkin
Scenario: Empty state primera visita
  Given user sin conexiones
  When navega a /settings/integrations
  Then ve empty state + CTA "Conectar Google Calendar"

Scenario: Lista con 2 cuentas
  Given user tiene cuentas foo@gmail.com (work) y bar@gmail.com (personal)
  Then ve 2 cards, work primero (más reciente)
  And cada card muestra label + provider icon + enabled badge

Scenario: Pausar conexión
  Given conexión activa
  When tap "Pausar"
  Then optimistic toggle a paused
  And toast "Pausado" con undo 4s
  And next refresh confirma estado persistido

Scenario: Renombrar
  Given conexión con label "foo@gmail.com"
  When user tap edit + escribe "Trabajo" + enter
  Then label persiste como "Trabajo"
  And ya no muestra el email como label

Scenario: Desconectar con confirm
  Given conexión activa
  When tap "Desconectar"
  Then modal confirm con texto "Esto eliminará la conexión y revocará el acceso"
  When confirm
  Then row borrado + redirect a /settings/integrations con toast "Desconectado"
```

## Definition of Done

- [ ] Mobile-first responsive 375px baseline (SK.md §3.2)
- [ ] Component tests para toggle/rename/disconnect (RTL)
- [ ] E2E test del flujo connect → list → disconnect (con OAuth stub)
- [ ] Accessibility: keyboard nav, aria-labels en botones de acción
- [ ] Loading states durante server actions (optimistic + rollback on error)

## Notas técnicas

- **Reusar `withSelf` pattern** para nuevas server actions (setConnectionEnabled, setConnectionLabel).
- **No mostrar tokens** ni siquiera enmascarados — opacity total al user, son secretos del sistema.
- **Last sync error display**: si `last_sync_error IS NOT NULL`, render con icon warning + botón "Reintentar sync" que dispara un manual sync (ISSUE-091 territory).
