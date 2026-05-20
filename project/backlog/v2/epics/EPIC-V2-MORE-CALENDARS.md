---
id: EPIC-V2-MORE-CALENDARS
title: Outlook + iCal + Apple Calendar + Calendar write-back
milestone: v2
priority: P3
status: placeholder
story_points: ~15
issues: []
features: [FT-330, FT-331, FT-340]
user_stories: [US-340]
business_rules: [BR-12]
screens: [SCR-033]
---

# EPIC-V2-MORE-CALENDARS — Multi-calendar

## Goal

Expand calendar integration beyond Google (covered in v1 EPIC-CALENDAR). Add Outlook (Microsoft Graph), iCal/Apple (CalDAV). Implement calendar write-back (push tareas ancladas como eventos al calendario externo).

## When to atomize

When v1 has user feedback requesting non-Google calendars. Most users use Google; Outlook is enterprise; iCal/Apple is power user.

## Issues (TBD)

- Microsoft Graph OAuth + Outlook calendar API
- iCal CalDAV integration (app-specific passwords)
- Multi-calendar sync abstraction (provider interface)
- Calendar write-back: anchored tasks pushed como eventos al primary calendar
- Calendar write-back requires elevated scope → OAuth verification needed (R-T-002 redux)
- UI: Integrations panel expanded con multiple providers
