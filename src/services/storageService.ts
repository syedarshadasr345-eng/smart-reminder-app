import type { ReminderItem, Place, UserSummaryPattern, AppSettings, NotificationBatch, SimulatedContext } from '../types';

const STORAGE_KEYS = {
  REMINDERS: 'smart_reminders_items',
  PLACES: 'smart_reminders_places',
  PATTERNS: 'smart_reminders_patterns',
  SETTINGS: 'smart_reminders_settings',
  BATCHES: 'smart_reminders_batches',
  CONTEXT: 'smart_reminders_simulated_context',
};

export const DEFAULT_PLACES: Place[] = [
  {
    id: 'place-home',
    name: 'Home',
    type: 'home',
    address: '221B Baker St, West End',
    latitude: 37.7749,
    longitude: -122.4194,
    radius_meters: 100,
    icon: 'home',
  },
  {
    id: 'place-office',
    name: 'Office',
    type: 'office',
    address: 'Salesforce Tower, Downtown',
    latitude: 37.7897,
    longitude: -122.3972,
    radius_meters: 150,
    icon: 'briefcase',
  },
  {
    id: 'place-gym',
    name: 'Metro Gym',
    type: 'gym',
    address: '450 Fitness Blvd',
    latitude: 37.7651,
    longitude: -122.4210,
    radius_meters: 100,
    icon: 'dumbbell',
  },
  {
    id: 'place-market',
    name: 'Whole Foods Market',
    type: 'market',
    address: '399 4th St',
    latitude: 37.7820,
    longitude: -122.4010,
    radius_meters: 120,
    icon: 'shopping-cart',
  },
];

export const INITIAL_REMINDERS: ReminderItem[] = [
  {
    id: 'rem-1',
    user_id: 'user-default',
    raw_text: "don't forget my badge tomorrow when leaving home",
    parsed_action: 'Take office security badge & lanyard',
    category: 'item',
    trigger_type: 'location',
    trigger_config: {
      place_id: 'place-home',
      place_name: 'Home',
      geofence_event: 'exit',
      time_label: 'When leaving Home',
    },
    priority: 'urgent',
    status: 'pending',
    source: 'user_manual',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'rem-2',
    user_id: 'user-default',
    raw_text: 'review project slide deck before 2pm sync',
    parsed_action: 'Review Q3 roadmap slide deck',
    category: 'task',
    trigger_type: 'time',
    trigger_config: {
      scheduled_at: new Date(Date.now() + 3600000 * 3).toISOString(),
      time_label: 'Today, 2:00 PM',
    },
    priority: 'normal',
    status: 'pending',
    source: 'user_manual',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'rem-3',
    user_id: 'user-default',
    raw_text: 'grab milk and organic eggs from market',
    parsed_action: 'Buy fresh milk and pasture-raised eggs',
    category: 'errand',
    trigger_type: 'location',
    trigger_config: {
      place_id: 'place-market',
      place_name: 'Whole Foods Market',
      geofence_event: 'enter',
      time_label: 'When near Market',
    },
    priority: 'low',
    status: 'pending',
    source: 'user_manual',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  // Completed items that back up habit summaries
  {
    id: 'rem-hist-1',
    user_id: 'user-default',
    raw_text: 'gym gear monday morning',
    parsed_action: 'Pack gym bag (shorts, shoes, bottle)',
    category: 'habit',
    trigger_type: 'time',
    trigger_config: {
      time_label: 'Mon 7:30 AM',
    },
    priority: 'normal',
    status: 'completed',
    source: 'user_manual',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    completed_at: new Date(Date.now() - 86400000 * 7 + 3600000).toISOString(),
  },
  {
    id: 'rem-hist-2',
    user_id: 'user-default',
    raw_text: 'bring gym shoes monday',
    parsed_action: 'Pack gym bag (shorts, shoes, bottle)',
    category: 'habit',
    trigger_type: 'time',
    trigger_config: {
      time_label: 'Mon 7:30 AM',
    },
    priority: 'normal',
    status: 'completed',
    source: 'user_manual',
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 14).toISOString(),
    completed_at: new Date(Date.now() - 86400000 * 14 + 3600000).toISOString(),
  },
  {
    id: 'rem-hist-3',
    user_id: 'user-default',
    raw_text: 'dont forget workout shaker monday',
    parsed_action: 'Pack gym bag (shorts, shoes, bottle)',
    category: 'habit',
    trigger_type: 'time',
    trigger_config: {
      time_label: 'Mon 7:30 AM',
    },
    priority: 'normal',
    status: 'completed',
    source: 'user_manual',
    created_at: new Date(Date.now() - 86400000 * 21).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 21).toISOString(),
    completed_at: new Date(Date.now() - 86400000 * 21 + 3600000).toISOString(),
  },
  {
    id: 'rem-hist-4',
    user_id: 'user-default',
    raw_text: 'take laptop charger before leaving office',
    parsed_action: 'Pack laptop USB-C fast charger',
    category: 'item',
    trigger_type: 'location',
    trigger_config: {
      place_id: 'place-office',
      place_name: 'Office',
      geofence_event: 'exit',
    },
    priority: 'normal',
    status: 'completed',
    source: 'user_manual',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    completed_at: new Date(Date.now() - 86400000 * 3 + 1800000).toISOString(),
  },
];

export const INITIAL_PATTERNS: UserSummaryPattern[] = [
  {
    id: 'pat-1',
    pattern_title: 'Monday Morning Gym Gear',
    description: 'You frequently log or bring gym gear on Monday mornings before 8:00 AM.',
    proposed_action: 'Pack gym bag (clothes, trainers & protein shaker)',
    category: 'habit',
    trigger_type: 'time',
    trigger_config: {
      scheduled_at: '2026-09-08T07:30:00.000Z',
      time_label: 'Monday, 7:30 AM',
      recurrence_rule: 'FREQ=WEEKLY;BYDAY=MO',
    },
    confidence: 0.88,
    times_suggested: 3,
    times_accepted: 2,
    times_dismissed: 0,
    based_on_items: ['rem-hist-1', 'rem-hist-2', 'rem-hist-3'],
    last_evaluated_at: new Date().toISOString(),
    status: 'active',
  },
  {
    id: 'pat-2',
    pattern_title: 'Office Departure Charger Check',
    description: 'You often forget your laptop charger when departing the office around 6:00 PM.',
    proposed_action: 'Unplug and grab laptop charger & earbuds',
    category: 'item',
    trigger_type: 'location',
    trigger_config: {
      place_id: 'place-office',
      place_name: 'Office',
      geofence_event: 'exit',
      time_label: 'When leaving Office',
    },
    confidence: 0.79,
    times_suggested: 2,
    times_accepted: 2,
    times_dismissed: 0,
    based_on_items: ['rem-hist-4'],
    last_evaluated_at: new Date().toISOString(),
    status: 'active',
  },
  {
    id: 'pat-3',
    pattern_title: 'Saturday Farmers Market Tote',
    description: 'You frequently visit Whole Foods or the market on weekend mornings.',
    proposed_action: 'Take reusable cloth grocery bags',
    category: 'item',
    trigger_type: 'location',
    trigger_config: {
      place_id: 'place-market',
      place_name: 'Whole Foods Market',
      geofence_event: 'enter',
      time_label: 'When near Market',
    },
    confidence: 0.65,
    times_suggested: 1,
    times_accepted: 1,
    times_dismissed: 0,
    based_on_items: [],
    last_evaluated_at: new Date().toISOString(),
    status: 'active',
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  quiet_hours_enabled: true,
  quiet_hours_start: '22:00',
  quiet_hours_end: '07:30',
  morning_brief_time: '08:00',
  sound_enabled: true,
  ai_provider: 'local_smart_parser',
};

export const DEFAULT_CONTEXT: SimulatedContext = {
  currentPlaceId: 'place-home',
  currentMovementState: 'stationary',
  simulatedTime: new Date().toISOString(),
  useRealTime: true,
  upcomingCalendarEvent: {
    id: 'evt-1',
    title: 'Product Review Sync',
    start_time: new Date(Date.now() + 3600000 * 2).toISOString(),
  },
};

class StorageService {
  private memStore: Record<string, string> = {};

  private getStoreItem(key: string): string | null {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        return localStorage.getItem(key);
      } catch {
        return this.memStore[key] || null;
      }
    }
    return this.memStore[key] || null;
  }

  private setStoreItem(key: string, value: string): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, value);
        return;
      } catch {
        // Fallback to memory
      }
    }
    this.memStore[key] = value;
  }

  private clearStore(): void {
    this.memStore = {};
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.clear();
      } catch {
        // Ignore
      }
    }
  }

  getReminders(): ReminderItem[] {
    const raw = this.getStoreItem(STORAGE_KEYS.REMINDERS);
    if (!raw) {
      this.saveReminders(INITIAL_REMINDERS);
      return INITIAL_REMINDERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_REMINDERS;
    }
  }

  saveReminders(items: ReminderItem[]): void {
    this.setStoreItem(STORAGE_KEYS.REMINDERS, JSON.stringify(items));
  }

  getPlaces(): Place[] {
    const raw = this.getStoreItem(STORAGE_KEYS.PLACES);
    if (!raw) {
      this.savePlaces(DEFAULT_PLACES);
      return DEFAULT_PLACES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_PLACES;
    }
  }

  savePlaces(places: Place[]): void {
    this.setStoreItem(STORAGE_KEYS.PLACES, JSON.stringify(places));
  }

  getPatterns(): UserSummaryPattern[] {
    const raw = this.getStoreItem(STORAGE_KEYS.PATTERNS);
    if (!raw) {
      this.savePatterns(INITIAL_PATTERNS);
      return INITIAL_PATTERNS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_PATTERNS;
    }
  }

  savePatterns(patterns: UserSummaryPattern[]): void {
    this.setStoreItem(STORAGE_KEYS.PATTERNS, JSON.stringify(patterns));
  }

  getSettings(): AppSettings {
    const raw = this.getStoreItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      this.saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  saveSettings(settings: AppSettings): void {
    this.setStoreItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  getContext(): SimulatedContext {
    const raw = this.getStoreItem(STORAGE_KEYS.CONTEXT);
    if (!raw) {
      this.saveContext(DEFAULT_CONTEXT);
      return DEFAULT_CONTEXT;
    }
    try {
      return { ...DEFAULT_CONTEXT, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_CONTEXT;
    }
  }

  saveContext(ctx: SimulatedContext): void {
    this.setStoreItem(STORAGE_KEYS.CONTEXT, JSON.stringify(ctx));
  }

  getBatches(): NotificationBatch[] {
    const raw = this.getStoreItem(STORAGE_KEYS.BATCHES);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  saveBatches(batches: NotificationBatch[]): void {
    this.setStoreItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
  }

  updateReminder(updated: ReminderItem): void {
    const list = this.getReminders();
    const index = list.findIndex((r) => r.id === updated.id);
    if (index !== -1) {
      list[index] = updated;
      this.saveReminders(list);
    }
  }

  addPlace(place: Place): void {
    const places = this.getPlaces();
    places.push(place);
    this.savePlaces(places);
  }

  deletePlace(placeId: string): void {
    const places = this.getPlaces().filter((p) => p.id !== placeId);
    this.savePlaces(places);
  }

  exportBackup(): string {
    const data = {
      version: 1,
      exported_at: new Date().toISOString(),
      reminders: this.getReminders(),
      places: this.getPlaces(),
      patterns: this.getPatterns(),
      settings: this.getSettings(),
    };
    return JSON.stringify(data, null, 2);
  }

  importBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.reminders)) this.saveReminders(data.reminders);
      if (Array.isArray(data.places)) this.savePlaces(data.places);
      if (Array.isArray(data.patterns)) this.savePatterns(data.patterns);
      if (data.settings && typeof data.settings === 'object') this.saveSettings(data.settings);
      return true;
    } catch {
      return false;
    }
  }

  resetToDefault(): void {
    this.clearStore();
    this.saveReminders(INITIAL_REMINDERS);
    this.savePlaces(DEFAULT_PLACES);
    this.savePatterns(INITIAL_PATTERNS);
    this.saveSettings(DEFAULT_SETTINGS);
    this.saveContext(DEFAULT_CONTEXT);
  }
}

export const storageService = new StorageService();
