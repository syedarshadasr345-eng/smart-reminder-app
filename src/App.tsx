import { useState, useEffect, useMemo } from 'react';
import type {
  ReminderItem,
  Place,
  UserSummaryPattern,
  AppSettings,
  SimulatedContext,
  PriorityLevel,
  ReminderCategory,
  TriggerType,
} from './types';
import { storageService } from './services/storageService';
import { triggerEngine } from './services/triggerEngine';
import type { TriggerAlertEvent } from './services/triggerEngine';
import { habitEngine } from './services/habitEngine';
import { audioService } from './services/audioService';

import { Header } from './components/Header';
import { ContextSimulator } from './components/ContextSimulator';
import { CaptureBar } from './components/CaptureBar';
import { ProactiveCard } from './components/ProactiveCard';
import { MorningBriefCard } from './components/MorningBriefCard';
import { RemindersList } from './components/RemindersList';
import { HabitProfileModal } from './components/HabitProfileModal';
import { SettingsModal } from './components/SettingsModal';
import { NotificationToast } from './components/NotificationToast';

export function App() {
  const [reminders, setReminders] = useState<ReminderItem[]>(() => storageService.getReminders());
  const [places, setPlaces] = useState<Place[]>(() => storageService.getPlaces());
  const [patterns, setPatterns] = useState<UserSummaryPattern[]>(() => storageService.getPatterns());
  const [settings, setSettings] = useState<AppSettings>(() => storageService.getSettings());
  const [context, setContext] = useState<SimulatedContext>(() => storageService.getContext());

  const [activeAlert, setActiveAlert] = useState<TriggerAlertEvent | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHabitsOpen, setIsHabitsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showMorningBrief, setShowMorningBrief] = useState(true);

  // Sync state changes to storage
  useEffect(() => {
    storageService.saveReminders(reminders);
  }, [reminders]);

  useEffect(() => {
    storageService.savePatterns(patterns);
  }, [patterns]);

  useEffect(() => {
    storageService.saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    storageService.saveContext(context);
  }, [context]);

  // Proactive suggestion candidate
  const activeSuggestions = useMemo(() => {
    return habitEngine.getActiveSuggestions(patterns, reminders);
  }, [patterns, reminders]);

  const topSuggestion = activeSuggestions[0] || null;

  // Add a reminder from low-friction capture bar
  const handleAddReminder = (data: {
    raw_text: string;
    parsed_action: string;
    category: ReminderCategory;
    trigger_type: TriggerType;
    trigger_config: Record<string, any>;
    priority: PriorityLevel;
  }) => {
    const newItem: ReminderItem = {
      id: `rem-${Date.now()}`,
      user_id: 'user-default',
      raw_text: data.raw_text,
      parsed_action: data.parsed_action,
      category: data.category,
      trigger_type: data.trigger_type,
      trigger_config: data.trigger_config,
      priority: data.priority,
      status: 'pending',
      source: 'user_manual',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setReminders((prev) => [newItem, ...prev]);
    if (settings.sound_enabled) {
      audioService.playCompleteChime();
    }
  };

  // Toggle completion status
  const handleToggleComplete = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const willBeComplete = r.status !== 'completed';
        if (willBeComplete && settings.sound_enabled) {
          audioService.playCompleteChime();
        }
        return {
          ...r,
          status: willBeComplete ? 'completed' : 'pending',
          completed_at: willBeComplete ? new Date().toISOString() : undefined,
          updated_at: new Date().toISOString(),
        };
      })
    );
  };

  // Delete reminder
  const handleDeleteItem = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  // Accept proactive suggestion
  const handleAcceptSuggestion = (pattern: UserSummaryPattern) => {
    const { newReminder, allPatterns } = habitEngine.handleAcceptSuggestion(
      pattern,
      patterns
    );
    setPatterns(allPatterns);
    setReminders((prev) => [newReminder, ...prev]);
    if (settings.sound_enabled) {
      audioService.playCompleteChime();
    }
  };

  // Dismiss proactive suggestion
  const handleDismissSuggestion = (pattern: UserSummaryPattern) => {
    const { allPatterns } = habitEngine.handleDismissSuggestion(pattern, patterns);
    setPatterns(allPatterns);
  };

  // Simulate leaving current geofence
  const handleSimulateGeofenceExit = () => {
    const updatedCtx: SimulatedContext = {
      ...context,
      currentMovementState: 'departing',
    };
    setContext(updatedCtx);

    const alerts = triggerEngine.evaluateTriggers(
      reminders,
      updatedCtx,
      places,
      settings,
      new Date()
    );

    if (alerts.length > 0) {
      const topAlert = alerts[0];
      setActiveAlert(topAlert);
      if (settings.sound_enabled) {
        audioService.playAlertChime();
      }
    } else {
      const currentPlace = places.find((p) => p.id === context.currentPlaceId);
      setActiveAlert({
        reminder: {
          id: 'mock-none',
          user_id: 'user-default',
          raw_text: '',
          parsed_action: `Left ${currentPlace?.name || 'Home'}. All clear!`,
          category: 'task',
          trigger_type: 'location',
          trigger_config: {},
          priority: 'low',
          status: 'pending',
          source: 'user_manual',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        reason: `Geofence Exit: Departed from ${currentPlace?.name || 'Home'}. No pending exit items.`,
        isUrgent: false,
        shouldBatch: false,
      });
    }
  };

  // Simulate arriving at current geofence
  const handleSimulateGeofenceEntry = () => {
    const updatedCtx: SimulatedContext = {
      ...context,
      currentMovementState: 'arriving',
    };
    setContext(updatedCtx);

    const alerts = triggerEngine.evaluateTriggers(
      reminders,
      updatedCtx,
      places,
      settings,
      new Date()
    );

    if (alerts.length > 0) {
      const topAlert = alerts[0];
      setActiveAlert(topAlert);
      if (settings.sound_enabled) {
        audioService.playAlertChime();
      }
    }
  };

  // Run Habit Analysis
  const handleTriggerAnalysis = () => {
    const analyzed = habitEngine.analyzeHabitPatterns(reminders, patterns);
    setPatterns(analyzed);
  };

  // Reset demo data
  const handleResetData = () => {
    storageService.resetToDefault();
    setReminders(storageService.getReminders());
    setPlaces(storageService.getPlaces());
    setPatterns(storageService.getPatterns());
    setSettings(storageService.getSettings());
    setContext(storageService.getContext());
  };

  return (
    <div className="app-viewport-wrapper">
      <div className={`device-frame ${isExpanded ? 'expanded-view' : ''}`}>
        {/* Dynamic Island / Status Bar */}
        <div className="phone-island-bar">
          <span>9:41</span>
          <div className={`dynamic-island ${activeAlert ? 'alerting' : ''}`}>
            <span className="island-camera-lens" />
            {activeAlert && (
              <span style={{ fontSize: '11px', color: '#c084fc', fontWeight: 600 }}>
                Alert Active
              </span>
            )}
          </div>
          <span>5G • 100%</span>
        </div>

        {/* System Alert Toast (Simulated Push Notification) */}
        <NotificationToast
          alert={activeAlert}
          onDismiss={() => setActiveAlert(null)}
          onComplete={handleToggleComplete}
        />

        {/* Sticky Header */}
        <Header
          onOpenHabits={() => setIsHabitsOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isExpanded={isExpanded}
          onToggleExpanded={() => setIsExpanded(!isExpanded)}
          unreadAlertCount={activeAlert ? 1 : 0}
        />

        {/* Scrollable Content */}
        <main className="app-scroll-content">
          {/* Active Context Simulator Bar */}
          <ContextSimulator
            context={context}
            places={places}
            onUpdateContext={(updates) => setContext((prev) => ({ ...prev, ...updates }))}
            onSimulateGeofenceExit={handleSimulateGeofenceExit}
            onSimulateGeofenceEntry={handleSimulateGeofenceEntry}
          />

          {/* Passive Low-Friction Capture Box */}
          <CaptureBar places={places} onAddReminder={handleAddReminder} />

          {/* Proactive Habit Suggestion Card */}
          {topSuggestion && (
            <ProactiveCard
              pattern={topSuggestion}
              onAccept={handleAcceptSuggestion}
              onDismiss={handleDismissSuggestion}
            />
          )}

          {/* Morning Departure Briefing Card */}
          {showMorningBrief && (
            <MorningBriefCard
              reminders={reminders}
              onCompleteItem={handleToggleComplete}
              onDismissBrief={() => setShowMorningBrief(false)}
            />
          )}

          {/* Active Reminders List */}
          <RemindersList
            reminders={reminders}
            onToggleComplete={handleToggleComplete}
            onDeleteItem={handleDeleteItem}
          />
        </main>
      </div>

      {/* Habit Profile Modal */}
      <HabitProfileModal
        isOpen={isHabitsOpen}
        onClose={() => setIsHabitsOpen(false)}
        patterns={patterns}
        onTriggerAnalysis={handleTriggerAnalysis}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        places={places}
        onUpdateSettings={setSettings}
        onResetData={handleResetData}
      />
    </div>
  );
}

export default App;
