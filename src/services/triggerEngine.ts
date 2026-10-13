import type { ReminderItem, Place, AppSettings, SimulatedContext, NotificationBatch } from '../types';

export interface TriggerAlertEvent {
  reminder: ReminderItem;
  reason: string; // e.g. "Triggered by geofence exit: Leaving Home"
  isUrgent: boolean;
  shouldBatch: boolean;
}

export class TriggerEngine {
  /**
   * Checks if a given time falls within the configured Quiet Hours
   */
  isQuietHours(time: Date, settings: AppSettings): boolean {
    if (!settings.quiet_hours_enabled) return false;

    const [startH, startM] = settings.quiet_hours_start.split(':').map(Number);
    const [endH, endM] = settings.quiet_hours_end.split(':').map(Number);

    const currentMinutes = time.getHours() * 60 + time.getMinutes();
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes > endMinutes) {
      // Crosses midnight (e.g. 22:00 to 07:30)
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    } else {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    }
  }

  /**
   * Evaluates all pending reminders against current location, movement, and clock
   */
  evaluateTriggers(
    reminders: ReminderItem[],
    context: SimulatedContext,
    places: Place[],
    settings: AppSettings,
    currentTime: Date
  ): TriggerAlertEvent[] {
    const alerts: TriggerAlertEvent[] = [];
    const inQuietHours = this.isQuietHours(currentTime, settings);

    for (const reminder of reminders) {
      if (reminder.status !== 'pending') continue;

      let triggered = false;
      let reason = '';

      // 1. Location Geofence evaluation
      if (reminder.trigger_type === 'location' && reminder.trigger_config.place_id) {
        const targetPlace = places.find((p) => p.id === reminder.trigger_config.place_id);
        const isCurrentPlace = context.currentPlaceId === reminder.trigger_config.place_id;

        if (reminder.trigger_config.geofence_event === 'exit') {
          // Trigger when user departs from this place
          if (isCurrentPlace && context.currentMovementState === 'departing') {
            triggered = true;
            reason = `Geofence Exit: Leaving ${targetPlace?.name || 'Saved Place'}`;
          }
        } else if (reminder.trigger_config.geofence_event === 'enter') {
          // Trigger when user arrives at this place
          if (isCurrentPlace && (context.currentMovementState === 'arriving' || context.currentMovementState === 'stationary')) {
            triggered = true;
            reason = `Geofence Entry: Arrived at ${targetPlace?.name || 'Saved Place'}`;
          }
        }
      }

      // 2. Time-based trigger evaluation
      if (reminder.trigger_type === 'time' && reminder.trigger_config.scheduled_at) {
        const scheduled = new Date(reminder.trigger_config.scheduled_at);
        // If scheduled within the last 15 minutes or now
        const diffMs = currentTime.getTime() - scheduled.getTime();
        if (diffMs >= 0 && diffMs < 900000) {
          triggered = true;
          reason = `Scheduled Time: ${reminder.trigger_config.time_label || scheduled.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
      }

      // 3. Calendar event trigger evaluation
      if (reminder.trigger_type === 'calendar' && context.upcomingCalendarEvent) {
        const eventTitle = context.upcomingCalendarEvent.title.toLowerCase();
        const keyword = (reminder.trigger_config.event_keyword || '').toLowerCase();
        if (keyword && eventTitle.includes(keyword)) {
          triggered = true;
          reason = `Calendar Event: Upcoming "${context.upcomingCalendarEvent.title}"`;
        }
      }

      if (triggered) {
        const isUrgent = reminder.priority === 'urgent';
        // Non-urgent items should be batched during quiet hours
        const shouldBatch = !isUrgent && inQuietHours;

        alerts.push({
          reminder,
          reason,
          isUrgent,
          shouldBatch,
        });
      }
    }

    return alerts;
  }

  /**
   * Clusters items into a Morning Brief batch
   */
  generateMorningBrief(
    reminders: ReminderItem[],
    morningDate: Date
  ): NotificationBatch | null {
    const todayItems = reminders.filter((r) => r.status === 'pending');
    if (todayItems.length === 0) return null;

    return {
      id: `batch-morning-${morningDate.toISOString().slice(0, 10)}`,
      batch_type: 'morning_brief',
      delivery_time: morningDate.toISOString(),
      title: '☀️ Your Morning Departure Brief',
      message: `You have ${todayItems.length} item${todayItems.length > 1 ? 's' : ''} to remember today.`,
      reminder_ids: todayItems.map((r) => r.id),
      status: 'scheduled',
    };
  }
}

export const triggerEngine = new TriggerEngine();
