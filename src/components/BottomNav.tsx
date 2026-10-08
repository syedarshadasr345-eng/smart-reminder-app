import React from 'react';
import {
  ListTodo,
  PlusCircle,
  Radio,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import type { AppTab } from '../types';
import { audioService } from '../services/audioService';

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  pendingCount: number;
  hasActiveAlert: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  pendingCount,
  hasActiveAlert,
}) => {
  const handleSelectTab = (tab: AppTab) => {
    audioService.unlockAudio();
    audioService.triggerHaptic('light');
    onTabChange(tab);
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <button
        type="button"
        className={`bottom-nav-item ${activeTab === 'reminders' ? 'active' : ''}`}
        onClick={() => handleSelectTab('reminders')}
        aria-label="Reminders list"
      >
        <div className="nav-icon-wrap">
          <ListTodo size={20} />
          {pendingCount > 0 && (
            <span className="nav-badge-count">{pendingCount}</span>
          )}
        </div>
        <span className="nav-label">Reminders</span>
      </button>

      <button
        type="button"
        className={`bottom-nav-item ${activeTab === 'capture' ? 'active' : ''}`}
        onClick={() => handleSelectTab('capture')}
        aria-label="Capture new reminder"
      >
        <div className="nav-icon-wrap action-center">
          <PlusCircle size={22} />
        </div>
        <span className="nav-label">Capture</span>
      </button>

      <button
        type="button"
        className={`bottom-nav-item ${activeTab === 'radar' ? 'active' : ''}`}
        onClick={() => handleSelectTab('radar')}
        aria-label="Context and geofence radar"
      >
        <div className="nav-icon-wrap">
          <Radio size={20} />
          {hasActiveAlert && <span className="nav-badge-dot" />}
        </div>
        <span className="nav-label">Radar</span>
      </button>

      <button
        type="button"
        className={`bottom-nav-item ${activeTab === 'habits' ? 'active' : ''}`}
        onClick={() => handleSelectTab('habits')}
        aria-label="Habit AI and patterns"
      >
        <div className="nav-icon-wrap">
          <Sparkles size={20} />
        </div>
        <span className="nav-label">Habit AI</span>
      </button>

      <button
        type="button"
        className={`bottom-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => handleSelectTab('settings')}
        aria-label="Settings and places"
      >
        <div className="nav-icon-wrap">
          <SlidersHorizontal size={20} />
        </div>
        <span className="nav-label">Settings</span>
      </button>
    </nav>
  );
};
