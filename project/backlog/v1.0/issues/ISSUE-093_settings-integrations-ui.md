---
id: ISSUE-093
title: Settings · Integrations UI (SCR-033) + connect/disconnect + manual sync trigger
epic: EPIC-CALENDAR
milestone: v1.0
priority: P2
story_points: 2
status: ready
dependencies: [ISSUE-090, ISSUE-091]
user_stories: [US-090, US-092]
features: [FT-093]
screens: [SCR-033]
business_rules: []
agents: [frontend-specialist]
skills: [/frontend]
components: [CMP-084]
---

# ISSUE-093 — Settings Integrations UI

## Overview

Build SCR-033 Settings · Integrations panel con Google Calendar card showing connection status + actions (sync now / disconnect). Placeholders for v2 integrations (WhatsApp, Outlook, etc).

## Tasks

- [ ] CMP-084 IntegrationCard reusable component:
  - Icon + service name
  - Status badge: "● Conectado" o "○ Desconectado"
  - Subtitle: calendar names + last_synced_at relative
  - Actions: connect / disconnect / sync now
- [ ] SCR-033 layout:
  - Google Calendar card (functional)
  - WhatsApp card (disabled, "Próximamente v2")
  - Outlook Calendar card (disabled, "Próximamente v2")
- [ ] Connect button → `GET /api/google-calendar/connect` (OAuth flow)
- [ ] Disconnect button → confirm modal → `POST /api/google-calendar/disconnect`
- [ ] Sync now button → `POST /api/google-calendar/sync-now` → toast "Sincronizando..."

## Acceptance Criteria

```gherkin
Scenario: Connect from UI
  Given user en /settings/integrations sin conexión
  When she taps "Conectar Google Calendar"
  Then OAuth flow starts

Scenario: Show status after connect
  Given connected
  Then card shows "● Conectado · primary calendar · Última sync: hace 8 min"
  Sync button + Disconnect button visible

Scenario: Disconnect with confirm
  Given connected
  When user taps "Desconectar"
  Then confirm modal
  When confirmed
  Then connection removed, UI updates to disconnected state

Scenario: V2 placeholders
  Given WhatsApp + Outlook cards visible
  Then disabled state, "Próximamente" tooltip
```

## Definition of Done

- [ ] UI responsive
- [ ] Connect/disconnect/sync all functional
- [ ] V2 placeholders styled subtle (ink-hint)
