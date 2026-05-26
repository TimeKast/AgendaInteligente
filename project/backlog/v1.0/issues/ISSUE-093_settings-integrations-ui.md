---
id: ISSUE-093
title: Settings · Integrations UI (SCR-033) — lista multi-cuenta + connect/disconnect + sync
epic: EPIC-CALENDAR
milestone: v1.0
priority: P2
story_points: 3
status: ready
dependencies: [ISSUE-090, ISSUE-091]
user_stories: [US-090, US-090b, US-092]
features: [FT-093]
screens: [SCR-033, SCR-062]
business_rules: [BR-20]
agents: [frontend-specialist]
skills: [/frontend]
components: [CMP-084]
---

# ISSUE-093 — Settings Integrations UI (multi-cuenta)

## Overview

Build SCR-033 Settings · Integrations panel con soporte **multi-cuenta**. Cada `CalendarConnection` aparece como una fila en la lista de Google Calendar con su badge de status, label editable, color (US-090b), botón sync y disconnect individuales. Acción "+ Conectar otra cuenta" siempre visible para sumar conexiones. Placeholders v2 mantenidos (WhatsApp, Outlook deshabilitado v1 — vendrá en v1.5 vía mismo schema).

## Tasks

- [ ] CMP-084 `CalendarConnectionRow` reusable:
  - Icon provider (Google logo v1)
  - `account_label` editable inline (default email)
  - Color dot (paleta predefinida — US-090b)
  - Status badge: "● Conectado" / "⏸ Pausada" (enabled=false) / "○ Error"
  - Subtitle: nombre de la cuenta + count calendarios sincronizados + `last_synced_at` relativo
  - Actions menu: "Sync ahora" / "Pausar" (toggle enabled) / "Editar nombre y color" / "Desconectar"
- [ ] SCR-033 layout:
  - Section "Calendarios"
    - Lista de `CalendarConnectionRow` (N rows, una por conexión activa)
    - Botón persistente "+ Conectar Google Calendar" / "+ Conectar otra cuenta de Google" (texto cambia si ya hay 1+)
  - Section "Próximamente" con cards deshabilitadas: WhatsApp, Outlook Calendar, Apple Calendar (v1.5)
- [ ] Connect button → `GET /api/calendar/google/connect` (OAuth flow con `prompt=select_account`)
- [ ] Disconnect button → confirm modal "Desconectar [account_label]? Los busy slots de esta cuenta dejarán de sincronizar" → `POST /api/calendar/connections/[id]/disconnect`
- [ ] Sync now button → `POST /api/calendar/connections/[id]/sync-now` → toast "Sincronizando..."
- [ ] Pausar toggle → `POST /api/calendar/connections/[id]/toggle` (enabled flip) — los busy slots existentes permanecen pero no se refrescan
- [ ] Editar nombre/color → modal con `account_label` text input + color picker (6-8 colores predefinidos)
- [ ] Empty state: si 0 conexiones, hero card con CTA "Conecta tu primera cuenta de Google Calendar"

## Acceptance Criteria

```gherkin
Scenario: Connect desde UI (primera conexión)
  Given user en /settings/integrations sin conexiones (empty state)
  When tap "Conectar tu primera cuenta"
  Then OAuth flow inicia

Scenario: Add second account
  Given user con 1 conexión activa
  When tap "+ Conectar otra cuenta de Google"
  Then OAuth flow inicia con prompt=select_account

Scenario: Mostrar status post-connect
  Given conectada
  Then row muestra "● Conectado · primary · Última sync: hace 8 min"
  Sync, pausar y disconnect botones visibles en menu

Scenario: Disconnect individual con confirm
  Given user con 2 conexiones
  When tap "Desconectar" en conexión 1
  Then confirm modal con account_label
  When confirmado
  Then conexión 1 removida, conexión 2 intacta, UI refresca lista

Scenario: Pausar conexión
  Given conexión activa
  When tap "Pausar"
  Then row muestra "⏸ Pausada", sync no corre hasta reanudar

Scenario: Editar label y color
  Given conexión con label "foo@gmail.com" y color azul
  When user edita label a "Trabajo" y color a verde
  Then save persiste; los busy slots de esa conexión se tiñen verde en /today y /month

Scenario: Próximamente cards
  Given WhatsApp + Outlook + Apple cards visibles
  Then estado disabled, tooltip "Próximamente v1.5"

Scenario: Component test (RTL)
  Given setup con 2 conexiones mock
  When user clickea Disconnect en la primera
  And confirma en modal
  Then action `disconnectConnection(id1)` se llama
  And lista re-renderiza con solo la 2da conexión
```

## Definition of Done

- [ ] UI responsive (mobile 375px baseline + desktop)
- [ ] Connect/disconnect/sync/pause/edit funcionales por-conexión
- [ ] Component test (RTL) cubre disconnect flow + edit label flow (≥ 2 tests)
- [ ] V2 placeholders styled subtle (ink-hint)
- [ ] Empty state con CTA primary
