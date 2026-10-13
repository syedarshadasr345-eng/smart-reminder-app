import { describe, it, expect } from 'vitest';
import { triggerEngine } from './triggerEngine';
import { DEFAULT_PLACES, DEFAULT_SETTINGS, DEFAULT_CONTEXT, INITIAL_REMINDERS } from './storageService';
import type { SimulatedContext } from '../types';

describe('TriggerEngine', () => {
  it('should correctly detect quiet hours', () => {
    const nightTime = new Date('2026-09-04T23:30:00'); // 11:30 PM
    const isQuiet = triggerEngine.isQuietHours(nightTime, DEFAULT_SETTINGS);
    expect(isQuiet).toBe(true);

    const daytime = new Date('2026-09-04T14:00:00'); // 2:00 PM
    const isQuietDay = triggerEngine.isQuietHours(daytime, DEFAULT_SETTINGS);
    expect(isQuietDay).toBe(false);
  });

  it('should trigger geofence exit alert when departing place', () => {
    const context: SimulatedContext = {
      ...DEFAULT_CONTEXT,
      currentPlaceId: 'place-home',
      currentMovementState: 'departing',
    };

    const alerts = triggerEngine.evaluateTriggers(
      INITIAL_REMINDERS,
      context,
      DEFAULT_PLACES,
      DEFAULT_SETTINGS,
      new Date('2026-09-04T12:00:00')
    );

    expect(alerts.length).toBeGreaterThan(0);
    const exitAlert = alerts.find((a) => a.reason.includes('Geofence Exit'));
    expect(exitAlert).toBeDefined();
    expect(exitAlert?.reminder.parsed_action).toContain('badge');
  });

  it('should generate morning brief batch for pending items', () => {
    const brief = triggerEngine.generateMorningBrief(INITIAL_REMINDERS, new Date());
    expect(brief).toBeDefined();
    expect(brief?.batch_type).toBe('morning_brief');
    expect(brief?.reminder_ids.length).toBeGreaterThan(0);
  });
});
