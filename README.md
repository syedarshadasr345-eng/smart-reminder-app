# Smart Reminder App 🔔⚡

An intelligent, context-aware mobile reminder application built to solve everyday forgetfulness through **passive, low-friction capture**, **context-driven alerts (geofences, time, calendar)**, **quiet-by-default batched delivery**, and **proactive habit learning**.

Built following the guiding principles in [`smart-reminder-app-rules.md`](./smart-reminder-app-rules.md) and [`smart-reminder-app-skills.md`](./smart-reminder-app-skills.md).

---

## Key Features

### 1. Passive, Low-Friction Capture
- **Natural Language Parsing**: Just type or say *"don't forget my badge tomorrow when leaving home"*. The app automatically extracts the core action, resolves geofences or timestamps, and sets category/priority.
- **Microphone Dictation**: Tap the microphone button to dictate reminders hands-free using the Web Speech API.
- **Live Semantic Preview**: Dynamic tags display detected attributes (*"When leaving Home"*, *"Urgent"*, *"Item"*) in real-time as you type.

### 2. Context-Aware Alerts
- **Geofencing**: Circular geofence entry & exit evaluation (e.g. *"When leaving Home"*, *"When arriving at Office"*).
- **Time Scheduling**: Resolves relative time phrases (*"tomorrow morning"*, *"in 2 hours"*, *"next Monday at 8am"*).
- **Calendar Event Cues**: Triggers prep checklists before upcoming calendar events (*"30m before Flight to New York"*).
- **Interactive Context Simulator**: On-screen tester allows instant simulation of geofence exit/entry, time checkpoints, and calendar events without having to physically walk outside.

### 3. Non-Disruptive Delivery & Quiet Hours
- **Morning Departure Brief**: Clusters non-urgent daily reminders into an 8:00 AM morning digest card.
- **Quiet Hours**: Suppresses non-urgent alerts during sleep hours (10:00 PM – 7:30 AM).
- **Urgency Escalation**: Reminders explicitly marked `urgent` immediately bypass quiet hours and fire active notifications.

### 4. Proactive Habit AI Engine
- **Pattern Learning**: Analyzes completed and historical reminders over a rolling 30–60 day window.
- **Explainable Suggestions**: Every AI-suggested reminder displays a human-readable reason (*"Why suggested: You frequently log or bring gym gear on Monday mornings"*).
- **Adaptive Feedback Loop**:
  - **Accept**: Converts suggestion to an active reminder (`source: 'ai_suggested'`) and reinforces pattern confidence.
  - **Dismiss**: Decreases pattern confidence to stop nagging; automatically suppresses patterns if dismissed repeatedly.

---

## System Architecture

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                           SMART REMINDER CLIENT                        │
 │  ┌───────────────────────┐  ┌────────────────────┐  ┌────────────────┐ │
 │  │ Low-Friction Capture  │  │ Morning Brief Card │  │ Proactive Card │ │
 │  └──────────┬────────────┘  └─────────┬──────────┘  └───────┬────────┘ │
 │             │ Local-First Store       │                     │          │
 │  ┌──────────▼─────────────────────────▼─────────────────────▼────────┐ │
 │  │        Local Storage / SQLite (Zero-Latency Offline Cache)        │ │
 │  └──────────┬─────────────────────────┬──────────────────────────────┘ │
 │             │                         │                                │
 │  ┌──────────▼─────────────┐ ┌─────────▼──────────────────────────────┐ │
 │  │ Context Trigger Engine │ │ Habit Engine & Pattern Learner         │ │
 │  │ (Geofences & Batches)  │ │ (Rolling window analysis & Confidence) │ │
 │  └────────────────────────┘ └────────────────────────────────────────┘ │
 └─────────────────────────────┬──────────────────────────────────────────┘
                               │ HTTPS (Sync & Remote LLM)
 ┌─────────────────────────────▼──────────────────────────────────────────┐
 │                        BACKEND & SUPABASE LAYER                        │
 │  - PostgreSQL Database with Row-Level Security (RLS)                   │
 │  - schema.sql: places, reminders, user_summary_patterns, batches       │
 │  - Optional Gemini / Claude REST API endpoints for deep parsing        │
 └────────────────────────────────────────────────────────────────────────┘
```

---

## Directory Layout

```
├── src/
│   ├── components/
│   │   ├── CaptureBar.tsx          # Low-friction natural language input & voice mic
│   │   ├── ContextSimulator.tsx    # Interactive geofence, time, & calendar simulator
│   │   ├── Header.tsx              # Sticky header with habit & settings triggers
│   │   ├── HabitProfileModal.tsx   # Habit profile inspector & confidence meters
│   │   ├── MorningBriefCard.tsx    # Batched 8:00 AM departure digest card
│   │   ├── NotificationToast.tsx   # Simulated push/local alert banner
│   │   ├── ProactiveCard.tsx       # AI habit suggestion card with explainability
│   │   ├── RemindersList.tsx       # Filter tabs (All, Location, Time, Done)
│   │   └── SettingsModal.tsx       # Quiet hours, morning brief time, places
│   ├── services/
│   │   ├── audioService.ts         # Web Audio API tactile synthesized sound chimes
│   │   ├── habitEngine.ts          # Pattern discovery & adaptive feedback loop
│   │   ├── parserService.ts        # Natural language semantic parser & LLM hook
│   │   ├── storageService.ts       # Persistence & realistic seed data
│   │   └── triggerEngine.ts        # Geofence & quiet hours evaluation engine
│   ├── types/
│   │   └── index.ts                # ReminderItem, Place, UserSummaryPattern, etc.
│   ├── App.tsx                     # Main application container & state orchestration
│   └── index.css                   # Obsidian dark glassmorphism styling system
├── supabase/
│   └── schema.sql                  # Production PostgreSQL migration with RLS
├── smart-reminder-app-rules.md     # Core project constraints & principles
├── smart-reminder-app-skills.md    # Discrete skills specifications
└── package.json
```

---

## Getting Started

### 1. Run Locally
```bash
npm install
npm run dev
```
Open **`http://localhost:5173/`** in your browser (Google Chrome or Microsoft Edge recommended for voice dictation).

### 2. Run Automated Unit Tests
```bash
npm test
```
Executes 11 unit tests covering parser semantics, geofence trigger evaluation, and habit feedback loops via Vitest.

### 3. Production Build
```bash
npm run build
```

---

## How to Test the Interactive Simulator

1. **Test Passive Capture**:
   - In the capture box at the bottom, type:
     *"don't forget keys when leaving home tomorrow"*
   - Watch the live preview chip detect *"Take keys"* and trigger *"When leaving Home"*.
   - Click **Save** (or press Enter) to add it.

2. **Test Geofence Triggers**:
   - In the top **Context Simulator**, click **"Leave Home (Exit Geofence)"**.
   - Watch the dynamic island pulse and a native-style notification toast drop down alerting you about your office badge!

3. **Test Proactive Habit Suggestions**:
   - Look at the **Proactive Suggestion** card at the top.
   - Note the **"Why suggested: You frequently log or bring gym gear on Monday mornings"** explainability tag.
   - Click **"+ Add to Reminders"** to accept it, or **"Not Today"** to dismiss it and lower the pattern confidence score.

4. **Inspect Habit Profile**:
   - Click the **Sparkles icon** (`✨`) in the top-right header.
   - Review your learned patterns, confidence levels, and traceability links (*"Supported by 3 historical logs"*).
   - Click **"Re-analyze History"** to recalculate patterns on demand.

5. **Test Quiet Hours & Morning Brief**:
   - Open **Settings (`⚙️`)** and verify Quiet Hours (10:00 PM – 7:30 AM) and Morning Brief (8:00 AM).
   - In the Context Simulator, open advanced controls to switch between Live Device Time, 8:00 AM Morning Brief, and 11:00 PM Quiet Hours.
