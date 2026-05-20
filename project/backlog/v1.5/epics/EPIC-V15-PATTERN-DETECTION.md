---
id: EPIC-V15-PATTERN-DETECTION
title: pgvector embeddings + repeat detection + quote-back
milestone: v1.5
priority: P2
status: placeholder
story_points: ~25
issues: []
features: [FT-210, FT-211, FT-212, FT-213, FT-214, FT-063, FT-064]
user_stories: [US-210, US-213]
business_rules: [AI-4, OPS-8]
screens: [SCR-023]
---

# EPIC-V15-PATTERN-DETECTION — Long-memory + quote-back

## Goal

Agent gana memory capability: detect repeated language across sheets, quote user's past words with date attribution ("Hace 3 semanas escribiste…"), surface patterns proactively as the "heavy artillery" challenge (max 1/week per OPS-2).

## Prerequisites

- v1 in production con ≥4 semanas de DaySheets per beta user (need data for meaningful pattern detection)
- pgvector enabled (ya done en ISSUE-001)

## Issues (TBD when atomized)

Estimated 6-7 issues:

- SheetEmbedding schema + cron embeddings nightly (OPS-8)
- Embedding generation con OpenAI text-embedding-3-small (cheap, accurate)
- Repeat detection algorithm (cosine similarity > 0.85 in 3+ consecutive sheets same scope)
- Drift detection (structured queries para "quarter win not appearing in day sheets en N days")
- Quote-back tool en agent (`retrieve_past_quote(query)`)
- Proactive challenge weekly picker (selects highest-signal challenge from queue)
- UI for showing quote with date attribution en chat messages

## Anti-pattern reminder

NEVER invent quotes. If agent tool returns empty, agent does NOT fabricate (AI-4 critical).
