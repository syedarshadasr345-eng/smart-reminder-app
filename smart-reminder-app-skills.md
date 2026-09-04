# Smart Reminder App — Skills

These are discrete, reusable skills the coding agent should apply when working on this project. Each skill defines *when* to use it and *how* to execute it correctly.

---

## Skill: Natural-Language Reminder Parsing

**When to use:** Whenever raw user text/voice input needs to be converted into a structured `ReminderItem`.

**How to execute:**
1. Take the raw input string (e.g., "don't forget my badge tomorrow").
2. Extract the core action/object (`parsed_action`), e.g., "bring badge".
3. Detect trigger type: `time`, `location`, `calendar`, or `manual` (default to `manual` if none is detected).
4. Extract the trigger value (e.g., "tomorrow" → resolved date/time; "before leaving office" → location trigger).
5. Never discard the original raw text — always store it alongside the parsed result for traceability and re-parsing later.
6. If parsing confidence is low, mark the item as `needs_review` instead of guessing a trigger.

---

## Skill: Context Trigger Implementation

**When to use:** When building or modifying any alert-triggering logic (location, time, calendar).

**How to execute:**
1. Location triggers → implement via geofencing (entry/exit radius around a saved place, e.g., "home", "office").
2. Time triggers → implement via scheduled local notifications, respecting device timezone.
3. Calendar triggers → poll/subscribe to calendar events; when an event is detected, check if any reminder items are tagged as related (by keyword or manual link) and prep them for delivery.
4. Always attach a `trigger_type` and `trigger_value` to every reminder so delivery logic has a single source of truth.

---

## Skill: Non-Disruptive Notification Batching

**When to use:** Any time you're implementing or touching notification delivery logic.

**How to execute:**
1. Default every non-urgent reminder into a `NotificationBatch` rather than firing immediately.
2. Deliver batches at sensible checkpoints (e.g., morning brief, "leaving home" event) rather than as they're created.
3. Only bypass batching for `urgent_push` — time-critical items confirmed to be within a short window (e.g., <30 min).
4. Always allow the user to configure quiet hours and override batch timing in settings.
5. Test that no code path sends more than one push notification per batch delivery.

---

## Skill: User Summary / Pattern Detection

**When to use:** When implementing or updating the habit-analysis job that powers proactive suggestions.

**How to execute:**
1. Pull a rolling window (e.g., last 30–60 days) of `ReminderItem` entries.
2. Group by similar `parsed_action` + recurring `trigger_value` patterns (e.g., same action logged on the same weekday repeatedly).
3. Only create/update a `UserSummary` pattern entry when confidence crosses a minimum threshold (avoid noisy, one-off suggestions).
4. Store `based_on_items` so every pattern can point back to the specific reminders that justified it.
5. Re-run this job on a schedule (e.g., nightly) rather than on every single new item, to avoid overreacting to one data point.

---

## Skill: Proactive Suggestion Delivery

**When to use:** When surfacing AI-generated reminder suggestions to the user.

**How to execute:**
1. Never insert an AI-suggested reminder directly as an active reminder — always deliver it as a *suggestion* requiring accept/dismiss.
2. Always show the "why" (pull the human-readable `description` from the matching `UserSummary` entry).
3. If dismissed, lower the confidence score for that pattern so it's suggested less aggressively next time.
4. If accepted, convert it into a normal `ReminderItem` with `source: ai_suggested`.

---

## Skill: Privacy-Safe Data Handling

**When to use:** Any time reminder data, summaries, or logs are stored, transmitted, or sent to an external AI/LLM service.

**How to execute:**
1. Strip or minimize personally identifiable details before sending text to any external LLM API call (only send what's needed for parsing/summary generation).
2. Store raw personal logs locally or in the user's own backend instance — never in a shared/third-party analytics store.
3. Any LLM call for parsing or summary generation should be stateless per-request; do not persist prompts/responses beyond what's needed for the feature.
4. Provide a clear way for the user to delete their full history and reset their `UserSummary`.

---

## Skill: Incremental Feature Gating

**When to use:** Throughout the build, to enforce the MVP → Phase 2 rollout order defined in the rules file.

**How to execute:**
1. Before implementing any Phase 2 feature (voice capture, calendar triggers, AI suggestions), confirm the MVP loop (manual capture → time/location trigger → batched notification → dismiss/done) is fully working and tested.
2. Gate new features behind flags if needed so the core loop is never broken by in-progress work.
