import { describe, it, expect, beforeEach } from 'vitest';
import { storageService, DEFAULT_PLACES, INITIAL_REMINDERS } from './storageService';
import type { ReminderItem, Place } from '../types';

describe('StorageService', () => {
  beforeEach(() => {
    storageService.resetToDefault();
  });

  it('retrieves default reminders and places correctly', () => {
    const reminders = storageService.getReminders();
    const places = storageService.getPlaces();

    expect(reminders.length).toBeGreaterThanOrEqual(INITIAL_REMINDERS.length);
    expect(places.length).toBeGreaterThanOrEqual(DEFAULT_PLACES.length);
  });

  it('updates an existing reminder cleanly', () => {
    const reminders = storageService.getReminders();
    const first = reminders[0];
    const updated: ReminderItem = {
      ...first,
      parsed_action: 'Updated Action Text',
      priority: 'urgent',
    };

    storageService.updateReminder(updated);
    const refreshed = storageService.getReminders();
    const found = refreshed.find((r) => r.id === first.id);

    expect(found?.parsed_action).toBe('Updated Action Text');
    expect(found?.priority).toBe('urgent');
  });

  it('adds and deletes a custom place', () => {
    const customPlace: Place = {
      id: 'place-test-123',
      name: 'Coffee Shop Lab',
      type: 'custom',
      latitude: 37.77,
      longitude: -122.41,
      radius_meters: 80,
    };

    storageService.addPlace(customPlace);
    let places = storageService.getPlaces();
    expect(places.some((p) => p.id === 'place-test-123')).toBe(true);

    storageService.deletePlace('place-test-123');
    places = storageService.getPlaces();
    expect(places.some((p) => p.id === 'place-test-123')).toBe(false);
  });

  it('exports and imports backup JSON correctly', () => {
    const exportedJson = storageService.exportBackup();
    expect(typeof exportedJson).toBe('string');

    const parsed = JSON.parse(exportedJson);
    expect(parsed.version).toBe(1);
    expect(Array.isArray(parsed.reminders)).toBe(true);

    const success = storageService.importBackup(exportedJson);
    expect(success).toBe(true);

    const invalidSuccess = storageService.importBackup('invalid-json');
    expect(invalidSuccess).toBe(false);
  });
});
