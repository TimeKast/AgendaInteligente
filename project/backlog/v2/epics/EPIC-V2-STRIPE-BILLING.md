---
id: EPIC-V2-STRIPE-BILLING
title: Stripe billing + pricing tiers activos + feature gating
milestone: v2
priority: P1
status: placeholder
story_points: ~20
issues: []
features: [FT-320, FT-321]
user_stories: [US-320]
business_rules: [BR-10]
screens: [SCR-036]
---

# EPIC-V2-STRIPE-BILLING — Monetización activa

## Goal

Activar billing real. Define pricing tiers (recomendación Brief: $8/mes free completo + IA pago, o A/B test). Stripe integration. Feature gating por plan. Past_due grace period (BR-10).

## When to atomize

Pre-launch público o cuando user count + retention metrics justify monetization. NO en v1 — F-27 decisión del Discovery defer billing.

## Issues (TBD)

- Stripe account + product/price setup
- Stripe Checkout integration (subscription flow)
- Stripe webhooks (subscription.created/updated/deleted)
- Customer portal (manage subscription, cancel, update payment method)
- Feature gating middleware (check plan + features jsonb)
- UI: Settings · Billing real (no placeholder)
- Plan limits enforcement (max_projects, max_ai_calls, etc)
- Past_due grace flow (BR-10): warning emails, 3-day grace, auto-downgrade
- Telemetry: conversion funnel from free to paid

## Pricing reminder (from Brief)

Recomendación inicial:

- Free: completo pero IA limited to 20 calls/month
- Pro: $8/mes o $80/año (descuento anual) → IA ilimitada + Google Calendar + Quarter+ sheets

Pricing final se decide pre-launch.
