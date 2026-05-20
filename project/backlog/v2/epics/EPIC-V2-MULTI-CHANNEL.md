---
id: EPIC-V2-MULTI-CHANNEL
title: WhatsApp + Telegram + Voice mode bidireccional
milestone: v2
priority: P2
status: placeholder
story_points: ~40
issues: []
features: [FT-310, FT-311, FT-312]
user_stories: [US-310, US-312]
business_rules: []
screens: []
---

# EPIC-V2-MULTI-CHANNEL — Multi-channel conversación

## Goal

Expand agent reach beyond in-app chat. WhatsApp bot for capture + check-ins on user's phone. Telegram alternative cheaper. Voice mode bidireccional con Vapi/ElevenLabs para conversation real-time hands-free.

## When to atomize

When v1 has 100+ active users + clear demand signal en feedback (users asking "can I get my check-ins en WhatsApp?")

## Issues (TBD)

- WhatsApp Business API integration (Twilio or 360dialog)
- Phone number verification flow (user opt-in)
- Message routing (WhatsApp → existing Conversation system)
- Telegram bot setup (cheaper alternative)
- Voice mode bidireccional (Vapi or ElevenLabs Conversational AI)
- Channel preferences per use case (morning ritual = WhatsApp, midday = push, etc)
- Mirror conversation across channels (Brief §5.3)
