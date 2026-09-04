# Smart Reminder App — Project Rules & Implementation Plan

## 1. Project Overview

**Problem:** The user frequently forgets everyday items and context-dependent tasks (e.g., items to take with them, time/place-tied actions), and doesn't always remember to set a reminder in the first place.

**Solution:** A mobile app that:
- Lets the user log things to remember with minimal friction (text/voice, natural phrasing)
- Delivers alerts based on context (location, time, calendar) rather than rigid schedules
- Avoids notification fatigue through smart, non-disruptive delivery
- Proactively **suggests** new reminders by learning from a summary of the user's habits, instead of relying only on manual input

---

## 2. Core Rules (Guiding Principles)

These are constraints the implementation must always respect:

1. **Low friction over completeness.** Capturing a reminder should never take more than one natural sentence or voice note. Never force structured fields (date/time/location pickers) as the *only* way to add something.
2. **Context over schedule.** Prefer triggering alerts based on location, calendar proximity, or behavior pattern rather than a fixed clock time, when possible.
3. **Quiet by default.** No alert should interrupt the user unless it is time-critical. Default to batching/summary delivery; escalate to immediate push only for urgent, verified-time-sensitive items.
4. **Suggestions must be explainable.** Any AI-suggested reminder must show *why* it was suggested (e.g., "You usually bring this on Mondays") so the user can trust or dismiss it easily.
5. **User can always override.** Every automated behavior (suggestion, alert timing, batching) must have a simple manual override or dismiss action.
6. **Privacy-first data handling.** Habit/summary data stays local or user-controlled; do not send raw personal logs to third-party services without explicit consent.
7. **Incremental build.** Ship the passive capture + context alert loop first. Do not build the AI suggestion engine until the core loop works reliably.

---

## 3. System Architecture

```
[ Mobile App (Client) ]
   ↕
[ Backend API ]
   ↕
[ Database ]              [ Notification Service ]
   ↕                             ↕
[ Summary/Suggestion Engine (LLM) ]
```

- **Mobile App (Client):** Capture UI (text/voice), alert display, settings, override controls.
- **Backend API:** Handles CRUD for reminders, triggers, and user summary data.
- **Database:** Stores reminders, context triggers, and the evolving user habit summary.
- **Notification Service:** Location geofencing, time-based scheduling, calendar integration, push delivery with batching logic.
- **Summary/Suggestion Engine:** Periodically analyzes logged reminders + behavior to generate a lightweight "user summary" and propose new reminders.

---

## 4. Data Model (Draft)

### `ReminderItem`
| Field | Type | Notes |
|---|---|---|
| id | string | unique id |
| raw_text | string | original natural-language input |
| parsed_action | string | normalized description |
| trigger_type | enum | `location`, `time`, `calendar`, `manual` |
| trigger_value | string | e.g. coordinates, timestamp, event id |
| status | enum | `pending`, `delivered`, `dismissed`, `done` |
| created_at | datetime | |
| source | enum | `user_manual`, `ai_suggested` |

### `UserSummary`
| Field | Type | Notes |
|---|---|---|
| pattern_id | string | |
| description | string | e.g. "Forgets gym bag on Mondays" |
| confidence | float | how strong the pattern is |
| last_updated | datetime | |
| based_on_items | array[ReminderItem.id] | traceability for "why suggested" |

### `NotificationBatch`
| Field | Type | Notes |
|---|---|---|
| batch_id | string | |
| items | array[ReminderItem.id] | grouped items |
| delivery_time | datetime | |
| delivery_type | enum | `summary_brief`, `urgent_push` |

---

## 5. Suggested Tech Stack

- **Mobile:** React Native or Flutter (cross-platform, needed for geofencing + push notifications)
- **Backend:** Node.js (Express/Fastify) or Python (FastAPI)
- **Database:** PostgreSQL (or SQLite for local-first MVP)
- **Notifications:** Firebase Cloud Messaging (push), native geofencing APIs (iOS CoreLocation / Android Geofencing API)
- **Calendar integration:** Google Calendar API / device calendar APIs
- **AI/LLM layer:** Anthropic API (Claude) for parsing natural-language input and generating the user summary + suggestions

---

## 6. MVP vs Phase 2

### MVP (Phase 1)
- Natural-language text capture → parsed into a reminder
- Time-based and location-based triggers
- Basic notification batching (no spam)
- Manual dismiss/edit/done actions

### Phase 2
- Voice capture
- Calendar-based triggers
- User summary generation (pattern detection)
- Proactive AI-suggested reminders with "why suggested" explanation
- Confidence-based suggestion filtering (only suggest high-confidence patterns)

---

## 7. Build Order (First Implementation Steps)

1. Set up mobile app shell + backend API skeleton
2. Implement manual reminder capture (text input → stored `ReminderItem`)
3. Implement time-based trigger + basic push notification
4. Implement location-based trigger (geofencing)
5. Implement notification batching logic (quiet-by-default rule)
6. Add natural-language parsing (LLM call to convert raw text → structured `parsed_action` + `trigger_type`)
7. Build the `UserSummary` generation job (analyze past `ReminderItem` entries for patterns)
8. Build the suggestion delivery flow (surface AI-suggested reminders with explanation + accept/dismiss)
9. Add voice capture
10. Add calendar integration
