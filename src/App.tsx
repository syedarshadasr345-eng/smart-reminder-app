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
  AppTab,
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
import { BottomNav } from './components/BottomNav';
import { ContextRadarView } from './components/ContextRadarView';
import { EditReminderModal } from './components/EditReminderModal';

export function App() {
  const [reminders, setReminders] = useState<ReminderItem[]>(() => storageService.getReminders());
  const [places, setPlaces] = useState<Place[]>(() => storageService.getPlaces());
  const [patterns, setPatterns] = useState<UserSummaryPattern[]>(() => storageService.getPatterns());
  const [settings, setSettings] = useState<AppSettings>(() => storageService.getSettings());
  const [context, setContext] = useState<SimulatedContext>(() => storageService.getContext());

  const [activeTab, setActiveTab] = useState<AppTab>('reminders');
  const [viewMode, setViewMode] = useState<'frame' | 'mobile' | 'expanded'>('frame');
  const [activeAlert, setActiveAlert] = useState<TriggerAlertEvent | null>(null);
  const [isHabitsOpen, setIsHabitsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderItem | null>(null);
  const [showMorningBrief, setShowMorningBrief] = useState(true);

  // Sync state changes to storage
  useEffect(() => {
    storageService.saveReminders(reminders);
  }, [reminders]);

  useEffect(() => {
    storageService.savePlaces(places);
  }, [places]);

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

  const pendingCount = useMemo(() => {
    return reminders.filter((r) => r.status !== 'completed').length;
  }, [reminders]);

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

  // Save edited reminder
  const handleSaveEditedReminder = (updated: ReminderItem) => {
    setReminders((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  // Clear all completed reminders
  const handleClearCompleted = () => {
    setReminders((prev) => prev.filter((r) => r.status !== 'completed'));
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
    audioService.triggerHaptic('medium');
    const analyzed = habitEngine.analyzeHabitPatterns(reminders, patterns);
    setPatterns(analyzed);
  };

  // Add custom geofenced place
  const handleAddPlace = (newPlace: Place) => {
    setPlaces((prev) => [...prev, newPlace]);
  };

  // Delete geofenced place
  const handleDeletePlace = (placeId: string) => {
    setPlaces((prev) => prev.filter((p) => p.id !== placeId));
  };

  // Refresh all state after backup import
  const handleDataImported = () => {
    setReminders(storageService.getReminders());
    setPlaces(storageService.getPlaces());
    setPatterns(storageService.getPatterns());
    setSettings(storageService.getSettings());
    setContext(storageService.getContext());
  };

  // Reset demo data
  const handleResetData = () => {
    storageService.resetToDefault();
    handleDataImported();
  };

  // Cycle viewMode: frame -> mobile -> expanded -> frame
  const handleCycleViewMode = () => {
    setViewMode((prev) => {
      if (prev === 'frame') return 'mobile';
      if (prev === 'mobile') return 'expanded';
      return 'frame';
    });
  };

  return (
    <div className={`app-viewport-wrapper mode-${viewMode}`}>
      <div className={`device-frame view-${viewMode}`}>
        {/* Dynamic Island / Status Bar (shown in frame mode) */}
        {viewMode === 'frame' && (
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
        )}

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
          viewMode={viewMode}
          onCycleViewMode={handleCycleViewMode}
          unreadAlertCount={activeAlert ? 1 : 0}
        />

        {/* Scrollable Content Container */}
        <main className="app-scroll-content">
          {/* TAB 1: REMINDERS LIST VIEW */}
          {activeTab === 'reminders' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Proactive Habit Suggestion Card (if candidate available) */}
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

              {/* Reminders List with Search, Filter Chips, Edit */}
              <RemindersList
                reminders={reminders}
                onToggleComplete={handleToggleComplete}
                onDeleteItem={handleDeleteItem}
                onEditItem={(item) => setEditingReminder(item)}
                onClearCompleted={handleClearCompleted}
              />
            </div>
          )}

          {/* TAB 2: QUICK CAPTURE VIEW */}
          {activeTab === 'capture' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="section-header" style={{ marginBottom: '4px' }}>
                <div>
                  <h2 className="section-title">Quick Capture</h2>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Type or speak naturally — AI extracts action, place & time
                  </p>
                </div>
              </div>

              {/* Low-Friction Capture Box */}
              <CaptureBar places={places} onAddReminder={handleAddReminder} />

              {/* Recent Pending Reminders */}
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Recently Added ({reminders.slice(0, 3).length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {reminders.slice(0, 3).map((r) => (
                    <div key={r.id} className="reminder-card" style={{ padding: '10px 12px' }}>
                      <div className="reminder-content">
                        <div className="reminder-action-text" style={{ fontSize: '13px' }}>
                          {r.parsed_action}
                        </div>
                        <div className="reminder-meta-row">
                          <span className="trigger-badge location" style={{ fontSize: '10px' }}>
                            {r.trigger_config.time_label || r.trigger_type}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTEXT RADAR VIEW */}
          {activeTab === 'radar' && (
            <ContextRadarView
              context={context}
              places={places}
              settings={settings}
              reminders={reminders}
              onUpdateContext={(updates) => setContext((prev) => ({ ...prev, ...updates }))}
              onSimulateGeofenceExit={handleSimulateGeofenceExit}
              onSimulateGeofenceEntry={handleSimulateGeofenceEntry}
            />
          )}

          {/* TAB 4: HABIT AI VIEW */}
          {activeTab === 'habits' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="section-header" style={{ marginBottom: '4px' }}>
                <div>
                  <h2 className="section-title">Personal Habit Profile</h2>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Ongoing AI routine learning & proactive forgetfulness patterns
                  </p>
                </div>
                <button
                  type="button"
                  className="context-pill"
                  style={{ fontSize: '11px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.4)' }}
                  onClick={handleTriggerAnalysis}
                >
                  <span>Re-analyze</span>
                </button>
              </div>

              {/* Privacy Badge */}
              <div
                style={{
                  background: 'rgba(168, 85, 247, 0.08)',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  fontSize: '12px',
                  color: '#e2e8f0',
                  lineHeight: 1.4,
                }}
              >
                🔒 <strong>Privacy-First:</strong> Routines are evaluated on-device from your completed reminders.
              </div>

              {/* Discovered Patterns */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {patterns.map((pattern) => {
                  const confidencePercent = Math.round(pattern.confidence * 100);
                  return (
                    <div key={pattern.id} className={`habit-pattern-card ${pattern.status}`}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                          {pattern.pattern_title}
                        </h4>
                        <span style={{ fontSize: '11px', color: '#c084fc', fontWeight: 600 }}>
                          {confidencePercent}% confidence
                        </span>
                      </div>

                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.4 }}>
                        {pattern.description}
                      </p>

                      <div style={{ fontSize: '11px', background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: '6px', color: '#e2e8f0', marginBottom: '8px' }}>
                        💡 <strong>Proposed Action:</strong> {pattern.proposed_action}
                      </div>

                      <div className="confidence-meter-track">
                        <div
                          className="confidence-meter-fill"
                          style={{ width: `${confidencePercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: SETTINGS & PLACES VIEW */}
          {activeTab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="section-header" style={{ marginBottom: '4px' }}>
                <div>
                  <h2 className="section-title">Settings & Geofences</h2>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Quiet hours, delivery digest, audio chimes & saved places
                  </p>
                </div>
              </div>

              {/* Embedded Settings Form */}
              <div className="settings-embedded-container">
                {/* Quiet Hours */}
                <div className="setting-row">
                  <div>
                    <div className="setting-label">Quiet Hours (Batch Non-Urgent)</div>
                    <div className="setting-desc">Suppress non-urgent alerts during rest time</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.quiet_hours_enabled}
                    onChange={(e) => {
                      audioService.triggerHaptic('light');
                      setSettings({ ...settings, quiet_hours_enabled: e.target.checked });
                    }}
                  />
                </div>

                {settings.quiet_hours_enabled && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '4px 0 12px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Quiet Start:</div>
                      <input
                        type="time"
                        className="setting-input"
                        style={{ width: '100%' }}
                        value={settings.quiet_hours_start}
                        onChange={(e) => setSettings({ ...settings, quiet_hours_start: e.target.value })}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Quiet End:</div>
                      <input
                        type="time"
                        className="setting-input"
                        style={{ width: '100%' }}
                        value={settings.quiet_hours_end}
                        onChange={(e) => setSettings({ ...settings, quiet_hours_end: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Morning Brief Time */}
                <div className="setting-row">
                  <div>
                    <div className="setting-label">Morning Departure Brief</div>
                    <div className="setting-desc">Daily digest delivery time</div>
                  </div>
                  <input
                    type="time"
                    className="setting-input"
                    value={settings.morning_brief_time}
                    onChange={(e) => setSettings({ ...settings, morning_brief_time: e.target.value })}
                  />
                </div>

                {/* Sound Chimes */}
                <div className="setting-row">
                  <div>
                    <div className="setting-label">Synthesized Audio Chimes</div>
                    <div className="setting-desc">Tones for completions and alerts</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.sound_enabled}
                    onChange={(e) => {
                      audioService.triggerHaptic('light');
                      setSettings({ ...settings, sound_enabled: e.target.checked });
                    }}
                  />
                </div>

                {/* Haptic Feedback */}
                <div className="setting-row">
                  <div>
                    <div className="setting-label">Haptic Vibration</div>
                    <div className="setting-desc">Tactile response on mobile devices</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.haptic_enabled !== false}
                    onChange={(e) => {
                      audioService.triggerHaptic('light');
                      setSettings({ ...settings, haptic_enabled: e.target.checked });
                    }}
                  />
                </div>
              </div>

              {/* Geofenced Places List */}
              <div style={{ marginTop: '6px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Saved Geofence Anchors ({places.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {places.map((place) => (
                    <div
                      key={place.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600, color: '#f8fafc' }}>{place.name}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '6px' }}>
                          ({place.type})
                        </span>
                      </div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                        {place.radius_meters}m boundary
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Export / Reset */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="context-pill"
                  style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
                  onClick={() => {
                    audioService.triggerHaptic('light');
                    const json = storageService.exportBackup();
                    navigator.clipboard.writeText(json);
                    alert('Data backup JSON copied to clipboard!');
                  }}
                >
                  Export Backup
                </button>
                <button
                  type="button"
                  className="context-pill"
                  style={{ flex: 1, justifyContent: 'center', padding: '10px', color: '#fda4af', borderColor: 'rgba(244, 63, 94, 0.3)' }}
                  onClick={() => {
                    if (confirm('Reset demo data to initial defaults?')) {
                      handleResetData();
                    }
                  }}
                >
                  Reset Demo
                </button>
              </div>
            </div>
          )}

          {/* Collapsible Quick Context Bar (available across tabs) */}
          <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
            <ContextSimulator
              context={context}
              places={places}
              onUpdateContext={(updates) => setContext((prev) => ({ ...prev, ...updates }))}
              onSimulateGeofenceExit={handleSimulateGeofenceExit}
              onSimulateGeofenceEntry={handleSimulateGeofenceEntry}
            />
          </div>
        </main>

        {/* Fixed Mobile Bottom Navigation Tab Bar */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingCount={pendingCount}
          hasActiveAlert={activeAlert !== null}
        />
      </div>

      {/* Edit Reminder Modal */}
      <EditReminderModal
        reminder={editingReminder}
        places={places}
        isOpen={editingReminder !== null}
        onClose={() => setEditingReminder(null)}
        onSave={handleSaveEditedReminder}
        onDelete={handleDeleteItem}
      />

      {/* Habit Profile Modal (opened via Header) */}
      <HabitProfileModal
        isOpen={isHabitsOpen}
        onClose={() => setIsHabitsOpen(false)}
        patterns={patterns}
        onTriggerAnalysis={handleTriggerAnalysis}
      />

      {/* Settings Modal (opened via Header) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        places={places}
        onUpdateSettings={setSettings}
        onResetData={handleResetData}
        onAddPlace={handleAddPlace}
        onDeletePlace={handleDeletePlace}
        onDataImported={handleDataImported}
      />
    </div>
  );
}

export default App;
