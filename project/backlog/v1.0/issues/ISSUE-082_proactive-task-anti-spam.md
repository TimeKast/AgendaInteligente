---
id: ISSUE-082
title: ProactiveTask schema + send-push helper con anti-spam (OPS-1) enforcement
epic: EPIC-CHECKINS
milestone: v1.0
priority: P1
story_points: 3
status: ready
dependencies: [ISSUE-002, ISSUE-080, ISSUE-081]
user_stories: [US-086]
features: [FT-086, FT-087]
screens: []
business_rules: [OPS-1, OPS-2]
agents: [backend-specialist]
skills: [/backend, /database]
entities: [E-040]
---

# ISSUE-082 — ProactiveTask + anti-spam

## Overview

Migration adds `proactive_tasks` table. Helper `enqueueProactiveTask` que enforces anti-spam (OPS-1 max 4/24h, OPS-2 max 1 challenge/week) antes de actually send push.

## Tasks

- [ ] Migration: create `proactive_tasks` table per E-040
- [ ] Helper `enqueueAndSend(userId, type, payload)`:
  - Check anti-spam:
    - Count `proactive_tasks WHERE user_id=? AND status='sent' AND sent_at > now - 24h` → si ≥4, abort with status='cancelled_anti_spam'
    - If type='pattern_challenge': check last_pattern_sent < 7 days ago → si yes, abort
  - Check mute: if NotificationPref.muted_until > now → abort with status='cancelled_muted'
  - Check listening grace: if intensity_mode='listening' AND type IS challenge → abort
  - Create row con status='pending'
  - Call sendPushNotification con payload
  - Update status='sent', sent_at=now
  - Return result
- [ ] Telemetry: count of cancellations per reason
- [ ] Helper `markResponded(taskId)`: set responded_at = now when user opens deep link

## Acceptance Criteria

```gherkin
Scenario: Anti-spam under limit
  Given user has 3 sent tasks in last 24h
  When enqueueAndSend called
  Then 4th task sends successfully

Scenario: Anti-spam over limit
  Given user has 4 sent tasks in last 24h
  When 5th enqueue
  Then status='cancelled_anti_spam', NO push sent

Scenario: Mute respected
  Given muted_until = now + 1h
  When enqueue called
  Then status='cancelled_muted', NO push

Scenario: Pattern challenge weekly limit
  Given last pattern_challenge sent_at = now - 3 days
  When new pattern challenge enqueue
  Then status='cancelled_anti_spam' (OPS-2)
```

## Definition of Done

- [ ] Migration applied
- [ ] Helper tested all branches
- [ ] Telemetry of cancellations visible
- [ ] Anti-spam tests (I-018, I-019)
