import React from 'react';
import { Sparkles, Settings, Smartphone, Monitor, Maximize2, Bell } from 'lucide-react';
import { audioService } from '../services/audioService';

interface HeaderProps {
  onOpenHabits: () => void;
  onOpenSettings: () => void;
  viewMode: 'frame' | 'mobile' | 'expanded';
  onCycleViewMode: () => void;
  unreadAlertCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHabits,
  onOpenSettings,
  viewMode,
  onCycleViewMode,
  unreadAlertCount,
}) => {
  return (
    <header className="app-header">
      <div className="brand-badge">
        <div className="brand-logo-icon" style={{ position: 'relative' }}>
          <Bell size={19} />
          {unreadAlertCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                background: '#f43f5e',
                border: '2px solid #0d131f',
              }}
            />
          )}
        </div>
        <div>
          <h1 className="brand-title">Smart Reminder</h1>
          <p className="brand-subtitle">Context & Habit AI</p>
        </div>
      </div>

      <div className="header-actions">
        <button
          type="button"
          className="icon-btn"
          title="Habit Profile & Learned Patterns"
          onClick={() => {
            audioService.triggerHaptic('light');
            onOpenHabits();
          }}
        >
          <Sparkles size={16} color="#c084fc" />
        </button>

        <button
          type="button"
          className="icon-btn"
          title="App Settings & Quiet Hours"
          onClick={() => {
            audioService.triggerHaptic('light');
            onOpenSettings();
          }}
        >
          <Settings size={16} />
        </button>

        <button
          type="button"
          className="icon-btn"
          title={`View Mode: ${viewMode}. Click to toggle (Phone Frame / Mobile Screen / Expanded)`}
          onClick={() => {
            audioService.triggerHaptic('medium');
            onCycleViewMode();
          }}
        >
          {viewMode === 'frame' ? (
            <Smartphone size={16} />
          ) : viewMode === 'mobile' ? (
            <Maximize2 size={16} />
          ) : (
            <Monitor size={16} />
          )}
        </button>
      </div>
    </header>
  );
};
