export type TriggerType = 'location' | 'time' | 'calendar' | 'manual';

export type PriorityLevel = 'low' | 'normal' | 'urgent';

export type ReminderStatus = 'pending' | 'delivered' | 'snoozed' | 'dismissed' | 'completed';

export type ReminderSource = 'user_manual' | 'ai_suggested';

export type ReminderCategory = 'item' | 'task' | 'errand' | 'habit';

export interface TriggerConfig {
  // Time trigger config
  scheduled_at?: string; // ISO string
  recurrence_rule?: string; // e.g. "FREQ=WEEKLY;BYDAY=MO"
  time_label?: string; // e.g. "Tomorrow, 8:00 AM"

  // Location trigger config
  place_id?: string;
  place_name?: string;
  geofence_event?: 'exit' | 'enter'; // e.g. "exit" home

  // Calendar trigger config
  event_keyword?: string; // e.g. "Dentist", "Flight", "Gym"
  lead_time_minutes?: number; // e.g. 45 min before
}

export interface ReminderItem {
  id: string;
  user_id: string;
  raw_text: string;
  parsed_action: string;
  category: ReminderCategory;
  trigger_type: TriggerType;
  trigger_config: TriggerConfig;
  priority: PriorityLevel;
  status: ReminderStatus;
  source: ReminderSource;
  suggested_reason?: string; // Explainability: "Why suggested"
  pattern_id?: string;
  created_at: string;
  updated_at: string;
  delivered_at?: string;
  completed_at?: string;
}

export interface Place {
  id: string;
  name: string;
  type: 'home' | 'office' | 'gym' | 'market' | 'custom';
  address?: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  icon?: string;
}

export interface UserSummaryPattern {
  id: string;
  pattern_title: string;
  description: string; // e.g. "Frequently forgets gym gear on Monday mornings"
  proposed_action: string;
  category: ReminderCategory;
  trigger_type: TriggerType;
  trigger_config: TriggerConfig;
  confidence: number; // 0.0 to 1.0
  times_suggested: number;
  times_accepted: number;
  times_dismissed: number;
  based_on_items: string[]; // Reminder IDs
  last_evaluated_at: string;
  status: 'active' | 'suppressed' | 'graduated_to_recurring';
}

export interface NotificationBatch {
  id: string;
  batch_type: 'morning_brief' | 'evening_summary' | 'departure_checklist' | 'urgent_push';
  delivery_time: string;
  title: string;
  message: string;
  reminder_ids: string[];
  status: 'scheduled' | 'delivered' | 'dismissed';
}

export interface SimulatedContext {
  currentPlaceId: string; // ID of current place (e.g. 'place-home', 'place-office')
  currentMovementState: 'stationary' | 'departing' | 'arriving';
  simulatedTime: string; // ISO string for simulated clock or 'real'
  useRealTime: boolean;
  upcomingCalendarEvent?: {
    id: string;
    title: string;
    start_time: string;
  } | null;
}

export interface AppSettings {
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // e.g. "22:00"
  quiet_hours_end: string; // e.g. "07:30"
  morning_brief_time: string; // e.g. "08:00"
  sound_enabled: boolean;
  haptic_enabled?: boolean;
  ai_provider: 'local_smart_parser' | 'gemini' | 'claude';
  gemini_api_key?: string;
  claude_api_key?: string;
}

export type AppTab = 'reminders' | 'capture' | 'radar' | 'habits' | 'settings';
