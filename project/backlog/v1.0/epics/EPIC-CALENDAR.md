---
id: EPIC-CALENDAR
title: Multi-calendar connections (Google read-only, multi-cuenta v1)
milestone: v1.0
priority: P1
status: ready
story_points: 16
issues: [ISSUE-090, ISSUE-091, ISSUE-092, ISSUE-093]
features: [FT-090, FT-091, FT-092, FT-093, FT-094]
user_stories: [US-090, US-090b, US-091, US-092]
business_rules: [BR-12, BR-20, OPS-6]
risks: [R-T-002]
screens: [SCR-033, SCR-021, SCR-062]
---

# EPIC-CALENDAR — Multi-calendar connections

## Goal

OAuth flow para conectar **N cuentas** de Google Calendar (trabajo + personal, etc.) con scope `calendar.readonly`. Sync busy slots cada 15 min por conexión. Mostrar slots ocupados agregados cross-cuenta en planning + Today grid + Month. Tokens encriptados (BR-12), UNIQUE por (user, provider, external_account_id) (BR-20). Label + color por conexión para distinguir visualmente.

## Why this matters

Decisión X10a del Discovery: must-have v1. Iteración prototipo amplió de "single Google connection" a "multi-cuenta multi-provider" — el modelo single no servía para users con cuenta de trabajo + personal (caso típico). Schema preparado también para Apple/Outlook (v1.5) sin migration destructiva.

R-T-002 (OAuth verification process) requires early start (sprint 1 of dev).

## Dependencies

- EPIC-AUTH (User table + scopedDb + pgcrypto helpers)

## Out of scope (este epic)

- Apple / Outlook connectors funcionales (v1.5 — el schema ya soporta provider enum, solo falta cada OAuth flow)
- Calendar write-back (v2)
- Discord integration (v2 — FT-313 diferido per prototipo)

## Issues

| ID        | Title                                                                                           | SP  | Priority |
| --------- | ----------------------------------------------------------------------------------------------- | --- | -------- |
| ISSUE-090 | CalendarConnection schema (multi-cuenta, multi-provider) + pgcrypto tokens + OAuth flow Google  | 5   | P1       |
| ISSUE-091 | CalendarBusySlot schema (+ connection_id FK) + sync cron (15 min) via Inngest per-conexión      | 4   | P1       |
| ISSUE-092 | Display busy slots cross-cuenta en Week planning / Today grid / Month + warning al schedulear   | 4   | P1       |
| ISSUE-093 | Settings · Integrations UI (SCR-033) — lista multi-cuenta + connect/disconnect/sync/label/color | 3   | P2       |
