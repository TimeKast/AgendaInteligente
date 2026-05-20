# 08 — API Contracts

> **Source:** [07_ARCHITECTURE.md](./07_ARCHITECTURE.md) + [06_DATA_MODEL.md](./06_DATA_MODEL.md)
> **Scope:** v1 MVP. Prefer **Server Actions** for mutations; **Route Handlers** for streaming, webhooks, and Inngest entry. RSC for reads (no separate read API).

---

## Conventions

| Pattern                                  | Use case                                                                                                                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Server Actions** (`src/lib/actions/*`) | Form submits, mutations (create/update/delete). Returned via React, no manual fetch.                                                                                           |
| **Route Handler** `/api/*`               | Streaming responses (SSE chat), webhooks (Inngest, Stripe v2), file upload (audio blob), public endpoints (auth callbacks).                                                    |
| **Input validation**                     | Zod schemas in `src/lib/validations/*` (shared client + server).                                                                                                               |
| **Auth**                                 | NextAuth middleware → `getCurrentUser()` helper. All protected routes/actions return `403` if no session.                                                                      |
| **Tenant scope**                         | `scopedDb(userId)` enforced (ADR-010, BR-1).                                                                                                                                   |
| **Error format**                         | `{ error: { code: string, message: string, field?: string } }` — codes namespaced (`AUTH_REQUIRED`, `VALIDATION_FAILED`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL`). |
| **Success format**                       | Direct payload (no `{ data: ... }` wrapper).                                                                                                                                   |

---

## Auth (NextAuth)

### `GET/POST /api/auth/[...nextauth]`

NextAuth v5 standard handlers. Providers: `google`, `credentials`.

**Credentials provider signin:**

```ts
// Client
await signIn('credentials', {
  email: 'user@example.com',
  password: 'plaintext',
  redirect: false,
});
```

**Google OAuth:** standard `/api/auth/signin/google`.

**Session shape:**

```ts
type Session = {
  user: {
    id: string; // uuid
    email: string;
    name?: string;
    image?: string;
  };
  expires: ISO8601;
};
```

---

## Server Actions — Activities

### `createActivity(input)`

```ts
// src/lib/actions/activity.ts
'use server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/helpers';
import { scopedDb } from '@/lib/db/scoped';

const CreateActivitySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  project_id: z.string().uuid().optional(), // defaults to Inbox if omitted
  scheduled_date: z.string().date().optional(),
  scheduled_time: z.string().time().optional(),
  time_blocks: z.array(z.enum(['morning', 'afternoon', 'evening'])).optional(),
  deadline: z.string().datetime().optional(),
  estimated_minutes: z.number().int().min(1).optional(),
  priority: z.number().int().min(1).max(5).default(3),
  recurrence_rule: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export async function createActivity(input: z.infer<typeof CreateActivitySchema>) {
  const user = await requireAuth();
  const parsed = CreateActivitySchema.parse(input);
  const db = scopedDb(user.id);
  // ...insert + return Activity
}
```

**Returns:** `Activity` (entity from E-005)

**Errors:**

- `AUTH_REQUIRED` (401) — no session
- `VALIDATION_FAILED` (400) — Zod failure, `field` populated
- `INTERNAL` (500) — DB error

### `updateActivity(id, patch)`

Patch any subset of fields. Validates transitions (BR-8) if `status` changes.

### `deleteActivity(id)`

Soft delete (`deleted_at = now`).

### `transitionActivity(id, toStatus, reason?)`

Validates BR-8 transition. If `toStatus ∈ {skipped, blocked}` and intensity mode applies, may trigger challenge in conversation.

### `bulkReorderActivities(reorderMap)`

For drag-and-drop reorder in Today view.

---

## Server Actions — Projects / Categories

### `createCategory({name, color, icon})`

### `updateCategory(id, patch)`

### `deleteCategory(id, cascadeConfirmed)` — if has projects, requires `cascadeConfirmed=true` (US-012)

### `reorderCategories(ids)` — array of IDs in new order

### `createProject({category_id, name, ...})`

### `updateProject(id, patch)` — including `status` transitions

### `deleteProject(id, cascadeConfirmed)`

---

## Server Actions — Sheets

### `updateDaySheetField(date, field, value)`

```ts
const FieldSchema = z.enum([
  'notes_dreams',
  'intention',
  'gratitude',
  'identity_statement',
  'wins_planned',
  'avoidance',
  'energy_physical',
  'energy_mental',
  'energy_emotional',
  'evening_win',
  'evening_lesson',
  'tomorrow_top',
  'insight',
]);
```

Upserts DaySheet for `(user_id, date)`. If first non-null morning field set, sets `morning_completed_at` when ritual finishes (computed in service).

### `updateWeekSheetField(week_starting, field, value)`

Similar; week_starting must be a Sunday in user TZ (server validates).

### `completeMorningRitual(date)` / `completeEveningRitual(date)`

Sets respective timestamp.

### `generateWeeklyPostMortem(week_starting)`

Triggers Inngest event `weekly.post_mortem.requested` (background job to keep request fast).

---

## Server Actions — Goals

### `createGoal({title, scope, deadline, ...})`

### `updateGoal(id, patch)`

### `reviewGoal(id, {review_score, review_notes, status_override?})`

Computes status from review_score per BR-9 unless explicit override.

### `linkGoal(goal_id, target_type, target_id)` / `unlinkGoal(link_id)`

Polymorphic link (BR-6).

### `listGoals({scope?, status?})`

Used in RSC; in Server Action form for client-side refresh.

---

## Server Actions — Settings

### `updateNotificationPref(patch)`

```ts
const PatchSchema = z.object({
  morning_time: z.string().time().optional(),
  midday_time: z.string().time().optional(),
  evening_time: z.string().time().optional(),
  weekly_kickoff_dow: z.number().int().min(0).max(6).optional(),
  weekly_kickoff_time: z.string().time().optional(),
  weekly_review_dow: z.number().int().min(0).max(6).optional(),
  weekly_review_time: z.string().time().optional(),
  weekend_enabled: z.boolean().optional(),
  push_enabled: z.boolean().optional(),
  email_enabled: z.boolean().optional(),
});
```

### `setIntensityMode(mode)`

If `mode === 'listening'`, sets `intensity_expires_at = now + 48h` (OPS-4).

### `muteNotificationsUntil(timestamp)` / `unmuteNotifications()`

### `setPreferredLanguage(lang)` / `setTimezone(tz)`

### `deleteAccount({password_confirm?})`

Soft delete (BR-14). Returns export URL for ZIP download.

---

## Server Actions — Onboarding

### `completeOnboarding({language, timezone, push_granted, mic_granted, onboarding_context, notification_pref, google_calendar_connect_token?})`

Single atomic action that:

1. Updates User fields
2. Creates NotificationPref
3. Optionally completes Google Calendar OAuth (if token)
4. Sets `onboarding_completed_at = now`
5. Returns redirect URL to `/today`

---

## Route Handlers (HTTP endpoints)

### `POST /api/voice/transcribe`

**Use case:** Whisper fallback when Web Speech API unavailable.

**Request:**

- Headers: `Content-Type: multipart/form-data`, session cookie
- Body: `audio` field (Blob, max 30s, max 5MB)

**Response:**

```json
{ "text": "agendá llamar a Juan mañana diez de la mañana proyecto Genomma" }
```

**Errors:**

- `401 AUTH_REQUIRED`
- `429 RATE_LIMITED` — max 60/hour per user
- `413 PAYLOAD_TOO_LARGE` — >5MB
- `415 UNSUPPORTED_MEDIA_TYPE` — not audio
- `502 UPSTREAM_ERROR` — Whisper API error

**Side effects:** Increment `usage_meters.whisper_seconds_count`.

---

### `POST /api/ai/parse-task`

**Use case:** After STT (Web Speech or Whisper), parse text → structured task preview.

**Request:**

```json
{
  "text": "agendá llamar a Juan mañana 10am proyecto Genomma alta prioridad"
}
```

**Response:**

```json
{
  "preview": {
    "title": "Llamar a Juan",
    "project_id_suggestion": "uuid-of-genomma-project",
    "project_name_match": "Empresa Genomma",
    "project_confidence": 0.92,
    "scheduled_date": "2026-05-20",
    "scheduled_time": "10:00",
    "priority": 5,
    "deadline": null,
    "estimated_minutes": null,
    "tags": []
  },
  "alternatives": {
    "project_id": [{ "id": "uuid-other-1", "name": "Personal", "confidence": 0.05 }]
  }
}
```

**Errors:**

- `401`, `429` (max 200/hour per user), `502`

**Side effects:** `usage_meters.ai_calls_count += 1`, `ai_tokens_input/output` updated.

**Implementation:** Claude Haiku with `create_activity_preview` tool (AI-9). System prompt includes user's categories/projects as context.

---

### `POST /api/ai/chat`

**Use case:** Streaming conversation with agent.

**Request:**

```json
{
  "conversation_id": "uuid-or-null-to-create",
  "context": "morning_ritual" | "evening_ritual" | "weekly_kickoff" | "weekly_review" | "free_chat",
  "linked_sheet": { "type": "day", "id": "uuid" } | null,
  "message": "estoy más enfocado hoy"
}
```

**Response:** Server-Sent Events stream of tokens.

```
event: token
data: {"text": "\"Más"}

event: token
data: {"text": " enfocado\" —"}

...

event: done
data: {"message_id": "uuid", "challenges_fired": ["vague_language"]}
```

**Errors:** Standard. SSE error event for mid-stream failures.

**Side effects:**

- Inserts `Message` row (role=user, then role=agent)
- Updates `usage_meters`
- May fire tool calls (saves to DB via Server Actions internally)
- May fire challenge → next message will be the challenge follow-up

**Anti-prompt-injection:** All write tools have Zod-validated inputs. Free text in `message` cannot directly mutate DB.

---

### `GET /api/google-calendar/connect`

OAuth flow start. Redirects to Google with scope `calendar.readonly`.

### `GET /api/google-calendar/callback`

OAuth callback. Stores encrypted tokens (BR-12). Redirects to `/settings/integrations`.

### `POST /api/google-calendar/disconnect`

Server Action style. Deletes `GoogleCalendarConnection` row.

### `POST /api/google-calendar/sync-now`

Manual trigger (user button). Returns 202 + Inngest event fired.

---

### `POST /api/push/subscribe`

**Request:**

```json
{
  "subscription": {
    /* PushSubscription JSON */
  }
}
```

**Response:** `{ "ok": true }`

Stores subscription endpoint + keys for sending pushes later.

### `POST /api/push/unsubscribe`

Removes subscription.

---

### `GET /api/account/export`

Generates ZIP of all user's data as JSON. Async if data large (returns 202 + later callback).

**Response (small):** `200` with `application/zip`.
**Response (async):** `202 { "job_id": "...", "estimated_seconds": 30 }` + push notification when ready.

---

### `POST /api/inngest`

Inngest webhook entry. Standard Inngest SDK handler. **No auth on this endpoint** — secured by Inngest signing key validation.

---

### Health / status

### `GET /api/health`

```json
{ "ok": true, "version": "1.0.0", "ts": "2026-05-19T15:00:00Z" }
```

Public, no auth. Used by Vercel + monitoring.

---

## Inngest events

Inngest functions consume named events. Defined in `src/lib/jobs/*`.

### Event: `user.signed_up`

Triggered on user creation. Fires:

- `morning_check_in.schedule` (set up recurring per-user)
- `evening_check_in.schedule`
- `weekly_kickoff.schedule`
- `weekly_review.schedule`
- `gentle_mode.expire.schedule` (14 days out)

### Event: `morning.check_in.due`

Per-user recurring. Fires `morning-check-in.ts`.

### Event: `midday.check_in.due`

Conditional: only if morning DaySheet has wins_planned and at least one not done.

### Event: `evening.check_in.due`

### Event: `weekly.kickoff.due`

### Event: `weekly.review.due`

Triggers post-mortem generation + push.

### Event: `weekly.post_mortem.requested`

Manually-triggered or as part of weekly review.

### Event: `listening.mode.expired`

Hourly cron picks up users to revert (OPS-4).

### Event: `recurrence.materialize.due`

Daily cron. Expands RRULEs.

### Event: `google_calendar.sync.due`

Every 15 min per connected user.

### Event: `silence.detection.due`

Daily cron. OPS-3.

### Event: `purge.soft_deleted.due`

Daily cron. BR-14.

### Event: `usage.meter.bucket.rotate`

Monthly cron. Closes prior month's bucket.

### Event: `pattern.detection.nightly` (v1.5)

Nightly cron. Embeddings + repeat detection.

---

## Validation schemas (shared)

```ts
// src/lib/validations/activity.ts
export const ActivityStatusSchema = z.enum([
  'pending',
  'in_progress',
  'done',
  'skipped',
  'blocked',
]);

export const ReasonCategorySchema = z.enum(['time', 'priority', 'blocked', 'didnt_want', 'other']);

// src/lib/validations/goal.ts
export const GoalScopeSchema = z.enum(['quarter', 'year', '5year', 'life']);
export const GoalStatusSchema = z.enum(['active', 'achieved', 'partial', 'abandoned']);

// src/lib/validations/intensity.ts
export const IntensityModeSchema = z.enum(['sharp', 'standard', 'gentle', 'listening']);
```

---

## Rate limits (Upstash Redis)

| Endpoint                             | Limit                  | Window            |
| ------------------------------------ | ---------------------- | ----------------- |
| `POST /api/auth/credentials` (login) | 5 per IP, 20 per email | 15 min (OPS-9)    |
| `POST /api/auth/signup`              | 3 per IP               | 1 hour            |
| `POST /api/voice/transcribe`         | 60                     | 1 hour per user   |
| `POST /api/ai/parse-task`            | 200                    | 1 hour per user   |
| `POST /api/ai/chat`                  | 100                    | 1 hour per user   |
| Server Actions (default)             | 200                    | 1 minute per user |

Exceeded → `429` with `Retry-After` header.

---

## Pagination (where needed)

`messages` (chat history):

```
GET /api/conversations/[id]/messages?before=<message_id>&limit=50
```

Returns `{ messages: Message[], has_more: boolean }`.

---

_Generated by `/docs` Batch 5 — 2026-05-19_
