import { describe, it, expect } from 'vitest';
import { parserService } from './parserService';
import { DEFAULT_PLACES } from './storageService';

describe('ParserService', () => {
  it('should parse simple item with location exit trigger', () => {
    const raw = "don't forget my badge tomorrow when leaving home";
    const result = parserService.parseLocal(raw, DEFAULT_PLACES);

    expect(result.parsed_action).toContain('badge');
    expect(result.trigger_type).toBe('location');
    expect(result.trigger_config.geofence_event).toBe('exit');
    expect(result.trigger_config.place_id).toBe('place-home');
  });

  it('should parse urgent task priority', () => {
    const raw = 'urgent: review legal contract before 5pm';
    const result = parserService.parseLocal(raw, DEFAULT_PLACES);

    expect(result.priority).toBe('urgent');
    expect(result.parsed_action).toContain('Review legal contract');
  });

  it('should parse category for errand or item', () => {
    const itemRaw = 'take laptop charger and airpods';
    const itemResult = parserService.parseLocal(itemRaw, DEFAULT_PLACES);
    expect(itemResult.category).toBe('item');

    const errandRaw = 'buy organic milk and eggs from market';
    const errandResult = parserService.parseLocal(errandRaw, DEFAULT_PLACES);
    expect(errandResult.category).toBe('errand');
  });

  it('should detect calendar cues like flight or meeting', () => {
    const raw = 'take passport for the flight';
    const result = parserService.parseLocal(raw, DEFAULT_PLACES);

    expect(result.trigger_type).toBe('calendar');
    expect(result.trigger_config.event_keyword).toBe('flight');
  });
});
