import type { TriggerType, PriorityLevel, ReminderCategory, Place } from '../types';

export interface ParsedReminderResult {
  parsed_action: string;
  category: ReminderCategory;
  trigger_type: TriggerType;
  trigger_config: {
    scheduled_at?: string;
    time_label?: string;
    place_id?: string;
    place_name?: string;
    geofence_event?: 'exit' | 'enter';
    event_keyword?: string;
    lead_time_minutes?: number;
  };
  priority: PriorityLevel;
  confidence: number;
}

export class ParserService {
  /**
   * Parses natural language input into structured reminder data.
   * Can use an offline rule engine or an external LLM (Gemini/Claude).
   */
  async parseInput(
    rawText: string,
    places: Place[],
    apiKey?: string,
    provider: 'local_smart_parser' | 'gemini' | 'claude' = 'local_smart_parser'
  ): Promise<ParsedReminderResult> {
    const trimmed = rawText.trim();
    if (!trimmed) {
      return this.getDefaultResult(trimmed);
    }

    if (provider === 'gemini' && apiKey) {
      try {
        return await this.parseWithGemini(trimmed, places, apiKey);
      } catch (err) {
        console.warn('Gemini parsing failed, falling back to local smart parser:', err);
      }
    }

    // Default fast offline smart parser
    return this.parseLocal(trimmed, places);
  }

  private getDefaultResult(rawText: string): ParsedReminderResult {
    return {
      parsed_action: rawText || 'Reminder',
      category: 'task',
      trigger_type: 'manual',
      trigger_config: {},
      priority: 'normal',
      confidence: 0.5,
    };
  }

  /**
   * Fast client-side semantic parser implementing the rules in smart-reminder-app-skills.md
   */
  parseLocal(rawText: string, places: Place[]): ParsedReminderResult {
    const lower = rawText.toLowerCase();

    // 1. Priority Detection
    let priority: PriorityLevel = 'normal';
    if (/\b(urgent|critical|asap|important|must|immediately|emergency)\b/i.test(lower)) {
      priority = 'urgent';
    } else if (/\b(someday|eventually|whenever|low priority|no rush)\b/i.test(lower)) {
      priority = 'low';
    }

    // 2. Category Detection
    let category: ReminderCategory = 'task';
    if (/\b(keys|wallet|badge|charger|laptop|water bottle|umbrella|bag|jacket|phone|tote|medicine|pills|airpods|headphones|glasses)\b/i.test(lower)) {
      category = 'item';
    } else if (/\b(buy|groceries|milk|eggs|shop|pick up|store|pharmacy|post office|return)\b/i.test(lower)) {
      category = 'errand';
    } else if (/\b(gym|workout|read|stretch|meditate|habit|routine|walk)\b/i.test(lower)) {
      category = 'habit';
    }

    // 3. Location Trigger Detection
    let triggerType: TriggerType = 'manual';
    const triggerConfig: ParsedReminderResult['trigger_config'] = {};
    const confidence = 0.85;

    // Check for exit patterns
    const isExit = /\b(leaving|leave|departing|depart|exit|out of)\b/i.test(lower);

    // Match against known places
    let matchedPlace: Place | undefined;
    for (const place of places) {
      const placeNameLower = place.name.toLowerCase();
      const placeTypeLower = place.type.toLowerCase();
      if (lower.includes(placeNameLower) || lower.includes(placeTypeLower)) {
        matchedPlace = place;
        break;
      }
    }

    if (matchedPlace) {
      triggerType = 'location';
      triggerConfig.place_id = matchedPlace.id;
      triggerConfig.place_name = matchedPlace.name;
      triggerConfig.geofence_event = isExit ? 'exit' : 'enter';
      triggerConfig.time_label = isExit
        ? `When leaving ${matchedPlace.name}`
        : `When arriving at ${matchedPlace.name}`;
    }

    // 4. Time Trigger Detection (if location didn't match or time was also explicitly mentioned)
    if (triggerType === 'manual') {
      const timeResult = this.detectTimePhrase(lower);
      if (timeResult) {
        triggerType = 'time';
        triggerConfig.scheduled_at = timeResult.iso;
        triggerConfig.time_label = timeResult.label;
      }
    }

    // 5. Calendar Event Detection
    if (triggerType === 'manual') {
      const calMatch = lower.match(/\b(?:before|for|during)\s+(?:the\s+)?(meeting|flight|presentation|sync|interview|dentist|doctor|call)\b/i);
      if (calMatch) {
        triggerType = 'calendar';
        triggerConfig.event_keyword = calMatch[1];
        triggerConfig.lead_time_minutes = 30;
        triggerConfig.time_label = `30m before ${calMatch[1]}`;
      }
    }

    // 6. Action Normalization
    // Strip common prefixes: "don't forget", "remind me to", "remember to", "i need to"
    let cleaned = rawText
      .replace(/^(don't forget( to)?|dont forget( to)?|remember to|remind me to|please remind me to|i need to|need to|make sure to)\s+/i, '')
      .replace(/\b(urgent|asap|critically)\b:?/gi, '')
      .replace(/^[:\-\s]+/, '')
      .trim();

    // Capitalize first letter
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    } else {
      cleaned = rawText;
    }

    return {
      parsed_action: cleaned,
      category,
      trigger_type: triggerType,
      trigger_config: triggerConfig,
      priority,
      confidence,
    };
  }

  private detectTimePhrase(lower: string): { iso: string; label: string } | null {
    const now = new Date();

    // "tomorrow morning"
    if (lower.includes('tomorrow morning')) {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return { iso: d.toISOString(), label: 'Tomorrow, 9:00 AM' };
    }

    // "tomorrow afternoon"
    if (lower.includes('tomorrow afternoon')) {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      d.setHours(14, 0, 0, 0);
      return { iso: d.toISOString(), label: 'Tomorrow, 2:00 PM' };
    }

    // "tomorrow evening" / "tomorrow night"
    if (lower.includes('tomorrow evening') || lower.includes('tomorrow night')) {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      d.setHours(19, 0, 0, 0);
      return { iso: d.toISOString(), label: 'Tomorrow, 7:00 PM' };
    }

    // "tomorrow" without specific time -> default 9 AM
    if (lower.includes('tomorrow')) {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return { iso: d.toISOString(), label: 'Tomorrow, 9:00 AM' };
    }

    // "tonight"
    if (lower.includes('tonight')) {
      const d = new Date(now);
      d.setHours(20, 0, 0, 0);
      return { iso: d.toISOString(), label: 'Tonight, 8:00 PM' };
    }

    // "in X hours" / "in X minutes"
    const inHoursMatch = lower.match(/in\s+(\d+)\s+hours?/);
    if (inHoursMatch) {
      const hours = parseInt(inHoursMatch[1], 10);
      const d = new Date(now.getTime() + hours * 3600000);
      return { iso: d.toISOString(), label: `In ${hours} hour${hours > 1 ? 's' : ''}` };
    }

    const inMinsMatch = lower.match(/in\s+(\d+)\s+(?:minutes?|mins?)/);
    if (inMinsMatch) {
      const mins = parseInt(inMinsMatch[1], 10);
      const d = new Date(now.getTime() + mins * 60000);
      return { iso: d.toISOString(), label: `In ${mins} min` };
    }

    // "at 5pm", "at 8:30 am"
    const atTimeMatch = lower.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    if (atTimeMatch) {
      let hours = parseInt(atTimeMatch[1], 10);
      const minutes = atTimeMatch[2] ? parseInt(atTimeMatch[2], 10) : 0;
      const meridiem = atTimeMatch[3];
      if (meridiem === 'pm' && hours < 12) hours += 12;
      if (meridiem === 'am' && hours === 12) hours = 0;

      const d = new Date(now);
      d.setHours(hours, minutes, 0, 0);
      if (d.getTime() < now.getTime()) {
        d.setDate(d.getDate() + 1); // next day if time has passed
      }
      const labelTime = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      return { iso: d.toISOString(), label: `Today, ${labelTime}` };
    }

    // "next monday"
    if (lower.includes('monday') || lower.includes('mon')) {
      const d = this.getNextDayOfWeek(1, 8, 0);
      return { iso: d.toISOString(), label: 'Next Monday, 8:00 AM' };
    }

    return null;
  }

  private getNextDayOfWeek(dayOfWeek: number, hour: number, minute: number): Date {
    const d = new Date();
    const currentDay = d.getDay();
    const distance = (dayOfWeek + 7 - currentDay) % 7 || 7;
    d.setDate(d.getDate() + distance);
    d.setHours(hour, minute, 0, 0);
    return d;
  }

  /**
   * Real LLM Call using Google Gemini REST API if user configures a key
   */
  private async parseWithGemini(rawText: string, places: Place[], apiKey: string): Promise<ParsedReminderResult> {
    const placesList = places.map((p) => `${p.name} (${p.type})`).join(', ');
    const systemPrompt = `You are a smart context-aware reminder parser.
Extract the core actionable task, category, trigger type, and priority from the user's natural language input.
Known user places: ${placesList}.
Available trigger types: "location", "time", "calendar", "manual".
Categories: "item" (for things to bring/take), "errand", "task", "habit".
Priority: "urgent", "normal", "low".
Return strictly valid JSON with this schema:
{
  "parsed_action": "string",
  "category": "item" | "errand" | "task" | "habit",
  "trigger_type": "location" | "time" | "calendar" | "manual",
  "trigger_config": {
    "place_name": "string (optional)",
    "geofence_event": "exit" | "enter" (optional),
    "time_label": "string (optional)"
  },
  "priority": "urgent" | "normal" | "low",
  "confidence": number (0.0 to 1.0)
}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser input: "${rawText}"` }] },
        ],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.statusText}`);
    }

    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(text);

    // Map place_name to known place_id if present
    if (parsed.trigger_config?.place_name) {
      const match = places.find(
        (p) => p.name.toLowerCase() === parsed.trigger_config.place_name.toLowerCase()
      );
      if (match) {
        parsed.trigger_config.place_id = match.id;
      }
    }

    return parsed;
  }
}

export const parserService = new ParserService();
