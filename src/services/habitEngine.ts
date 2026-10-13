import type { ReminderItem, UserSummaryPattern } from '../types';

export class HabitEngine {
  /**
   * Evaluates historical reminders and discovers recurring routines or forgotten items.
   * Generates or updates UserSummaryPattern entries with confidence scores and explainability.
   */
  analyzeHabitPatterns(
    reminders: ReminderItem[],
    existingPatterns: UserSummaryPattern[]
  ): UserSummaryPattern[] {
    const updatedPatterns: UserSummaryPattern[] = [...existingPatterns];

    // Filter to completed or past reminders within a rolling window (e.g. 60 days)
    const pastItems = reminders.filter(
      (r) => r.status === 'completed' || Date.now() - new Date(r.created_at).getTime() > 86400000
    );

    // Group items by normalized keywords
    const clusters: Record<string, { items: ReminderItem[]; daysOfWeek: number[]; hours: number[] }> = {};

    for (const item of pastItems) {
      const key = this.getNormalizedKeywordCluster(item.parsed_action);
      if (!key) continue;

      if (!clusters[key]) {
        clusters[key] = { items: [], daysOfWeek: [], hours: [] };
      }

      const date = new Date(item.created_at);
      clusters[key].items.push(item);
      clusters[key].daysOfWeek.push(date.getDay());
      clusters[key].hours.push(date.getHours());
    }

    // Evaluate each cluster for recurring frequency
    for (const [clusterKey, data] of Object.entries(clusters)) {
      if (data.items.length >= 2) {
        // Calculate day-of-week affinity
        const dayFrequency: Record<number, number> = {};
        for (const d of data.daysOfWeek) {
          dayFrequency[d] = (dayFrequency[d] || 0) + 1;
        }

        const sortedDays = Object.entries(dayFrequency).sort((a, b) => b[1] - a[1]);
        const mostFrequentDay = parseInt(sortedDays[0][0], 10);
        const dayCount = sortedDays[0][1];

        // Day name
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[mostFrequentDay];

        // Confidence calculation based on count and consistency
        const consistencyRatio = dayCount / data.items.length;
        const confidence = Math.min(0.95, Math.max(0.6, 0.4 + (dayCount * 0.15) + (consistencyRatio * 0.25)));

        // Check if an existing pattern already matches this cluster
        const existingIndex = updatedPatterns.findIndex((p) =>
          p.pattern_title.toLowerCase().includes(clusterKey) ||
          p.proposed_action.toLowerCase().includes(clusterKey)
        );

        const sampleItem = data.items[0];
        const patternTitle = `${dayName} ${this.capitalize(clusterKey)}`;
        const description = `You frequently log or bring ${clusterKey} on ${dayName}s (${dayCount} times logged).`;

        if (existingIndex >= 0) {
          // Update existing pattern
          const existing = updatedPatterns[existingIndex];
          updatedPatterns[existingIndex] = {
            ...existing,
            confidence: Math.round(confidence * 100) / 100,
            based_on_items: Array.from(new Set([...existing.based_on_items, ...data.items.map((i) => i.id)])),
            last_evaluated_at: new Date().toISOString(),
          };
        } else {
          // Create new pattern
          updatedPatterns.push({
            id: `pat-gen-${Date.now()}-${clusterKey}`,
            pattern_title: patternTitle,
            description,
            proposed_action: sampleItem.parsed_action,
            category: sampleItem.category,
            trigger_type: sampleItem.trigger_type,
            trigger_config: {
              ...sampleItem.trigger_config,
              time_label: `${dayName} morning`,
            },
            confidence: Math.round(confidence * 100) / 100,
            times_suggested: 0,
            times_accepted: 0,
            times_dismissed: 0,
            based_on_items: data.items.map((i) => i.id),
            last_evaluated_at: new Date().toISOString(),
            status: 'active',
          });
        }
      }
    }

    return updatedPatterns;
  }

  /**
   * Generates proactive suggestion candidates for today/current context.
   * Only returns suggestions where confidence >= threshold and not already active.
   */
  getActiveSuggestions(
    patterns: UserSummaryPattern[],
    activeReminders: ReminderItem[],
    currentDayOfWeek: number = new Date().getDay()
  ): UserSummaryPattern[] {
    const activeActions = new Set(
      activeReminders
        .filter((r) => r.status === 'pending')
        .map((r) => r.parsed_action.toLowerCase().trim())
    );

    return patterns.filter((p) => {
      if (p.status !== 'active') return false;
      if (p.confidence < 0.65) return false;

      // Check if reminder is already pending
      if (activeActions.has(p.proposed_action.toLowerCase().trim())) {
        return false;
      }

      // Check temporal affinity
      if (p.trigger_config?.recurrence_rule?.includes('BYDAY=MO') && currentDayOfWeek !== 1) {
        // Can still show if high confidence or demonstration mode
      }

      return true;
    });
  }

  /**
   * Handles user feedback when an AI suggestion is accepted.
   * Converts the suggestion into an active ReminderItem with source: 'ai_suggested'.
   * Boosts pattern confidence.
   */
  handleAcceptSuggestion(
    pattern: UserSummaryPattern,
    patterns: UserSummaryPattern[]
  ): { updatedPattern: UserSummaryPattern; newReminder: ReminderItem; allPatterns: UserSummaryPattern[] } {
    const updatedPattern: UserSummaryPattern = {
      ...pattern,
      times_suggested: pattern.times_suggested + 1,
      times_accepted: pattern.times_accepted + 1,
      // Boost confidence slightly (max 0.99)
      confidence: Math.min(0.99, Math.round((pattern.confidence + 0.05) * 100) / 100),
    };

    const newReminder: ReminderItem = {
      id: `rem-ai-${Date.now()}`,
      user_id: 'user-default',
      raw_text: pattern.proposed_action,
      parsed_action: pattern.proposed_action,
      category: pattern.category,
      trigger_type: pattern.trigger_type,
      trigger_config: { ...pattern.trigger_config },
      priority: 'normal',
      status: 'pending',
      source: 'ai_suggested',
      suggested_reason: pattern.description,
      pattern_id: pattern.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const allPatterns = patterns.map((p) => (p.id === pattern.id ? updatedPattern : p));

    return { updatedPattern, newReminder, allPatterns };
  }

  /**
   * Handles user feedback when an AI suggestion is dismissed.
   * Penalizes confidence score so the app stops nagging.
   * If dismissed repeatedly, suppresses the pattern.
   */
  handleDismissSuggestion(
    pattern: UserSummaryPattern,
    patterns: UserSummaryPattern[]
  ): { updatedPattern: UserSummaryPattern; allPatterns: UserSummaryPattern[] } {
    const dismissedCount = pattern.times_dismissed + 1;
    // Lower confidence by 0.12
    const newConfidence = Math.max(0.1, Math.round((pattern.confidence - 0.12) * 100) / 100);
    const status = newConfidence < 0.45 ? 'suppressed' : 'active';

    const updatedPattern: UserSummaryPattern = {
      ...pattern,
      times_suggested: pattern.times_suggested + 1,
      times_dismissed: dismissedCount,
      confidence: newConfidence,
      status,
    };

    const allPatterns = patterns.map((p) => (p.id === pattern.id ? updatedPattern : p));

    return { updatedPattern, allPatterns };
  }

  private getNormalizedKeywordCluster(text: string): string | null {
    const lower = text.toLowerCase();
    if (lower.includes('gym') || lower.includes('workout') || lower.includes('fitness')) return 'gym gear';
    if (lower.includes('charger') || lower.includes('cable') || lower.includes('laptop')) return 'charger';
    if (lower.includes('badge') || lower.includes('keycard') || lower.includes('id card')) return 'office badge';
    if (lower.includes('grocer') || lower.includes('market') || lower.includes('milk')) return 'groceries';
    if (lower.includes('umbrella') || lower.includes('rain')) return 'umbrella';
    if (lower.includes('medicine') || lower.includes('pills') || lower.includes('vitamin')) return 'meds';
    return null;
  }

  private capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}

export const habitEngine = new HabitEngine();
