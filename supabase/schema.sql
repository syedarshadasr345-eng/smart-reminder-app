-- ==========================================================
-- SMART REMINDER APP — POSTGRESQL / SUPABASE DATABASE SCHEMA
-- Matches data model in smart-reminder-app-rules.md & implementation_plan.md
-- ==========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Places (Geofence anchors for Home, Office, Gym, etc.)
CREATE TABLE IF NOT EXISTS public.places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('home', 'office', 'gym', 'market', 'custom')),
    address TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    radius_meters INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Reminders Table
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    raw_text TEXT NOT NULL,
    parsed_action TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'task' CHECK (category IN ('item', 'task', 'errand', 'habit')),
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('location', 'time', 'calendar', 'manual')),
    trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'urgent')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'snoozed', 'dismissed', 'completed')),
    source TEXT NOT NULL DEFAULT 'user_manual' CHECK (source IN ('user_manual', 'ai_suggested')),
    suggested_reason TEXT,
    pattern_id UUID,
    delivered_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. User Summary / Learned Habit Patterns (Proactive Engine)
CREATE TABLE IF NOT EXISTS public.user_summary_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pattern_title TEXT NOT NULL,
    description TEXT NOT NULL,
    proposed_action TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'task',
    trigger_type TEXT NOT NULL DEFAULT 'time',
    trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    confidence NUMERIC(3,2) NOT NULL DEFAULT 0.50 CHECK (confidence >= 0 AND confidence <= 1.0),
    times_suggested INTEGER NOT NULL DEFAULT 0,
    times_accepted INTEGER NOT NULL DEFAULT 0,
    times_dismissed INTEGER NOT NULL DEFAULT 0,
    based_on_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    last_evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suppressed', 'graduated_to_recurring')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Notification Batches (Quiet hours & Morning Brief digests)
CREATE TABLE IF NOT EXISTS public.notification_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    batch_type TEXT NOT NULL CHECK (batch_type IN ('morning_brief', 'evening_summary', 'departure_checklist', 'urgent_push')),
    delivery_time TIMESTAMPTZ NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    reminder_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_reminders_user_status ON public.reminders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_reminders_trigger_type ON public.reminders(user_id, trigger_type);
CREATE INDEX IF NOT EXISTS idx_patterns_user_confidence ON public.user_summary_patterns(user_id, confidence);

-- Row Level Security (RLS)
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_summary_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_batches ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Users can only access their own records)
CREATE POLICY "Users can manage their own places" ON public.places
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own reminders" ON public.reminders
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own patterns" ON public.user_summary_patterns
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own notification batches" ON public.notification_batches
    FOR ALL USING (auth.uid() = user_id);
