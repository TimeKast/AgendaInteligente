---
id: ISSUE-104
title: Account deletion + data export ZIP + soft-delete grace banner + purge cron (BR-14)
epic: EPIC-PWA-SETTINGS
milestone: v1.0
priority: P1
story_points: 4
status: ready
dependencies: [ISSUE-002, ISSUE-005, ISSUE-080]
user_stories: [US-123]
features: [FT-123]
screens: [SCR-037, SCR-059, SCR-054]
business_rules: [BR-14]
risks: [R-C-001]
agents: [backend-specialist, frontend-specialist]
skills: [/backend, /frontend]
---

# ISSUE-104 — Account deletion + export

## Overview

GDPR-equivalent compliance flow. Users can export all their data (ZIP de JSON) y solicitar account deletion. Soft delete inmediato (`deleted_at = now`), 30-day grace para cancel, hard purge cron daily.

## Tasks

- [ ] SCR-037 Settings · Privacy layout:
  - Section "Tu data":
    - "Descargar mis datos" button → triggers export
    - Description: "Recibirás un ZIP con todos tus sheets, activities, goals, conversations"
  - Section "Borrar cuenta":
    - "Borrar cuenta" destructive button
    - Description: "Soft delete 30 días, podés cancelar dentro"
- [ ] Export flow:
  - Server Action `requestAccountExport(userId)`:
    - For small datasets: inline ZIP generation, stream to response
    - For large datasets: enqueue Inngest event `account.export.requested`, response 202, send push when ready
  - Includes: User profile, NotificationPref, Categories, Projects, Activities, Subtasks, Goals, GoalLinks, DaySheets, WeekSheets, Conversations + Messages, Subscriptions, UsageMeters
  - Format: nested JSON dentro de ZIP con per-entity files
  - NO incluye: password_hash, encrypted tokens, audio (none stored)
- [ ] Account deletion flow:
  - SCR-037 button → SCR-054 ConfirmDialog (extended variant)
  - Modal: warning + "Descargar datos primero" CTA inline
  - Type "BORRAR" confirmation input
  - Submit → Server Action `requestAccountDeletion(userId)`:
    - Set User.deleted_at = now
    - Soft delete cascade ALL tenant-owned rows (deleted_at = now)
    - Auto-logout (clear sessions)
  - Send confirmation email "Tu cuenta se borrará permanentemente en 30 días. Cancelá si cambiaste de opinión."
- [ ] Soft delete grace:
  - SCR-059 banner aparece en Today si User.deleted_at NOT NULL
  - "Tu cuenta está marcada para borrarse en N días. [Cancelar borrado]"
  - Cancel → User.deleted_at = NULL + cascade un-soft-delete? OR just unset User flag (other rows stay soft-deleted but they're isolated by deleted_at on user)
- [ ] Inngest cron `purge.soft_deleted.due` daily:
  - Query users con `deleted_at < now - 30 days`
  - For each: hard delete user + cascade (ON DELETE CASCADE configurado en FKs)
  - Optional: dump final ZIP to S3 con TTL 90 días para compliance redundancy
  - Telemetry: count of purges per day
- [ ] Reminder emails: day 7 + day 25 antes del purge ("Faltan X días para el borrado permanente")

## Acceptance Criteria

```gherkin
Scenario: Export data
  Given alice en /settings/privacy
  When she taps "Descargar mis datos"
  Then ZIP downloaded con JSON files per entity
  Contains all alice's data + no other user's data
  No sensitive fields (password_hash, encrypted_tokens) included

Scenario: Initiate deletion
  Given alice taps "Borrar cuenta"
  When modal shows + she types "BORRAR" + confirms
  Then User.deleted_at = now
  Auto-logout
  Confirmation email sent

Scenario: Grace banner
  Given alice deleted_at = -3 days
  When she logs back in within 30 days
  Then SCR-059 banner: "Cuenta marcada para borrarse en 27 días. [Cancelar borrado]"
  When she clicks cancel
  Then deleted_at = NULL
  Full access restored

Scenario: Purge cron
  Given user deleted_at = -31 days
  When daily cron runs
  Then User row + all cascaded data hard deleted
  Telemetry log

Scenario: Cross-tenant isolation in export
  Given userA exports
  Then ZIP contains ONLY userA's data
  No userB's data leaked (scopedDb enforced)
```

## Definition of Done

- [ ] Export ZIP downloadable + valid JSON inside
- [ ] Soft delete + grace + cancel tested
- [ ] Purge cron tested (use time-travel helper)
- [ ] Reminder emails fire correctly
- [ ] E2E-009 + E2E-015 passing
- [ ] Privacy policy mentions retention (separate doc, not en this issue but referenced)
- [ ] Compliance review (R-C-001) checkpoint pre-launch
