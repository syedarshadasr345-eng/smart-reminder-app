import { describe, it, expect } from 'vitest';
import { habitEngine } from './habitEngine';
import { INITIAL_PATTERNS, INITIAL_REMINDERS } from './storageService';
import type { UserSummaryPattern, ReminderItem } from '../types';

describe('HabitEngine', () => {
  it('should return active high-confidence suggestions that are not already pending', () => {
    const activeReminders: ReminderItem[] = [
      {
        id: 'rem-other',
        user_id: 'user-default',
        raw_text: 'call mom',
        parsed_action: 'Call mom',
        category: 'task',
        trigger_type: 'time',
        trigger_config: {},
        priority: 'normal',
        status: 'pending',
        source: 'user_manual',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const suggestions = habitEngine.getActiveSuggestions(INITIAL_PATTERNS, activeReminders);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].confidence).toBeGreaterThanOrEqual(0.65);
    expect(suggestions[0].description).toBeDefined();
  });

  it('should increase confidence when a suggestion is accepted', () => {
    const pattern = INITIAL_PATTERNS[0];
    const initialConfidence = pattern.confidence;

    const { updatedPattern, newReminder } = habitEngine.handleAcceptSuggestion(pattern, INITIAL_PATTERNS);

    expect(updatedPattern.confidence).toBeGreaterThanOrEqual(initialConfidence);
    expect(updatedPattern.times_accepted).toBe(pattern.times_accepted + 1);
    expect(newReminder.source).toBe('ai_suggested');
    expect(newReminder.parsed_action).toBe(pattern.proposed_action);
  });

  it('should decrease confidence and suppress when a suggestion is dismissed repeatedly', () => {
    const pattern: UserSummaryPattern = {
      ...INITIAL_PATTERNS[0],
      confidence: 0.50,
      times_dismissed: 2,
    };

    const { updatedPattern } = habitEngine.handleDismissSuggestion(pattern, [pattern]);

    expect(updatedPattern.confidence).toBeLessThan(0.50);
    expect(updatedPattern.times_dismissed).toBe(3);
    expect(updatedPattern.status).toBe('suppressed');
  });

  it('should discover recurring patterns from completed reminders', () => {
    const discovered = habitEngine.analyzeHabitPatterns(INITIAL_REMINDERS, []);
    expect(discovered.length).toBeGreaterThan(0);
    const gymPattern = discovered.find((p) => p.pattern_title.toLowerCase().includes('gym gear'));
    expect(gymPattern).toBeDefined();
    expect(gymPattern?.confidence).toBeGreaterThan(0.5);
  });
});
