import React from 'react';
import { Sparkles, Settings, Smartphone, Maximize2, Bell } from 'lucide-react';

interface HeaderProps {
  onOpenHabits: () => void;
  onOpenSettings: () => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  unreadAlertCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHabits,
  onOpenSettings,
  isExpanded,
  onToggleExpanded,
  unreadAlertCount,
}) => {
  return (
    <header className="app-header">
      <div className="brand-badge">
        <div className="brand-logo-icon" style={{ position: 'relative' }}>
          <Bell size={20} />
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
          <p className="brand-subtitle">Context & Habit-Aware</p>
        </div>
      </div>

      <div className="header-actions">
        <button
          className="icon-btn"
          title="Habit Profile & Learned Patterns"
          onClick={onOpenHabits}
        >
          <Sparkles size={17} color="#c084fc" />
        </button>

        <button
          className="icon-btn"
          title="App Settings & Quiet Hours"
          onClick={onOpenSettings}
        >
          <Settings size={17} />
        </button>

        <button
          className="icon-btn"
          title={isExpanded ? 'Mobile View' : 'Expanded View'}
          onClick={onToggleExpanded}
        >
          {isExpanded ? <Smartphone size={17} /> : <Maximize2 size={17} />}
        </button>
      </div>
    </header>
  );
};
