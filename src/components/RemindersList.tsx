import React, { useState, useMemo } from 'react';
import {
  Check,
  MapPin,
  Clock,
  Calendar,
  AlertCircle,
  Sparkles,
  Trash2,
  Inbox,
  Search,
  Edit3,
  X,
  Share2,
  CheckCircle2,
} from 'lucide-react';
import type { ReminderItem } from '../types';
import { audioService } from '../services/audioService';

interface RemindersListProps {
  reminders: ReminderItem[];
  onToggleComplete: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onEditItem: (item: ReminderItem) => void;
  onClearCompleted?: () => void;
}

export const RemindersList: React.FC<RemindersListProps> = ({
  reminders,
  onToggleComplete,
  onDeleteItem,
  onEditItem,
  onClearCompleted,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'exit' | 'enter' | 'time' | 'urgent' | 'completed'
  >('all');
  const [copiedNotification, setCopiedNotification] = useState(false);

  const counts = useMemo(() => {
    return {
      all: reminders.filter((r) => r.status !== 'completed').length,
      exit: reminders.filter(
        (r) =>
          r.status !== 'completed' &&
          r.trigger_type === 'location' &&
          r.trigger_config.geofence_event === 'exit'
      ).length,
      enter: reminders.filter(
        (r) =>
          r.status !== 'completed' &&
          r.trigger_type === 'location' &&
          r.trigger_config.geofence_event === 'enter'
      ).length,
      time: reminders.filter((r) => r.status !== 'completed' && r.trigger_type === 'time')
        .length,
      urgent: reminders.filter((r) => r.status !== 'completed' && r.priority === 'urgent')
        .length,
      completed: reminders.filter((r) => r.status === 'completed').length,
    };
  }, [reminders]);

  const filteredReminders = useMemo(() => {
    return reminders.filter((item) => {
      // 1. Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesAction = item.parsed_action.toLowerCase().includes(q);
        const matchesRaw = item.raw_text.toLowerCase().includes(q);
        const matchesPlace =
          item.trigger_config.place_name?.toLowerCase().includes(q) || false;
        if (!matchesAction && !matchesRaw && !matchesPlace) return false;
      }

      // 2. Tab filter
      if (activeFilter === 'completed') return item.status === 'completed';
      if (item.status === 'completed') return false;

      if (activeFilter === 'exit') {
        return (
          item.trigger_type === 'location' &&
          item.trigger_config.geofence_event === 'exit'
        );
      }
      if (activeFilter === 'enter') {
        return (
          item.trigger_type === 'location' &&
          item.trigger_config.geofence_event === 'enter'
        );
      }
      if (activeFilter === 'time') return item.trigger_type === 'time';
      if (activeFilter === 'urgent') return item.priority === 'urgent';

      return true;
    });
  }, [reminders, searchQuery, activeFilter]);

  const handleShareChecklist = () => {
    audioService.triggerHaptic('light');
    const pendingItems = reminders
      .filter((r) => r.status !== 'completed')
      .map((r, i) => `${i + 1}. ${r.parsed_action} (${r.trigger_config.time_label || r.trigger_type})`)
      .join('\n');

    const textToCopy = `📋 Smart Reminder Checklist:\n${pendingItems || 'No pending items!'}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  return (
    <div>
      {/* Header & Quick Action */}
      <div className="section-header" style={{ marginBottom: '10px' }}>
        <div>
          <h2 className="section-title">Your Reminders</h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {counts.all} pending • {counts.completed} completed
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className="icon-btn"
            style={{ width: '32px', height: '32px' }}
            title="Copy checklist to clipboard"
            onClick={handleShareChecklist}
          >
            <Share2 size={14} />
          </button>
        </div>
      </div>

      {copiedNotification && (
        <div className="copied-toast">
          <CheckCircle2 size={13} />
          <span>Checklist copied to clipboard!</span>
        </div>
      )}

      {/* Instant Search Bar */}
      <div className="search-bar-wrap">
        <Search size={15} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search reminders by keyword or place..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => setSearchQuery('')}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Horizontal Scrollable Filter Chips */}
      <div className="filter-chips-scroll">
        <button
          type="button"
          className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => {
            audioService.triggerHaptic('light');
            setActiveFilter('all');
          }}
        >
          All ({counts.all})
        </button>

        <button
          type="button"
          className={`filter-chip ${activeFilter === 'exit' ? 'active' : ''}`}
          onClick={() => {
            audioService.triggerHaptic('light');
            setActiveFilter('exit');
          }}
        >
          Leaving ({counts.exit})
        </button>

        <button
          type="button"
          className={`filter-chip ${activeFilter === 'enter' ? 'active' : ''}`}
          onClick={() => {
            audioService.triggerHaptic('light');
            setActiveFilter('enter');
          }}
        >
          Arriving ({counts.enter})
        </button>

        <button
          type="button"
          className={`filter-chip ${activeFilter === 'time' ? 'active' : ''}`}
          onClick={() => {
            audioService.triggerHaptic('light');
            setActiveFilter('time');
          }}
        >
          Time ({counts.time})
        </button>

        <button
          type="button"
          className={`filter-chip ${activeFilter === 'urgent' ? 'active' : ''}`}
          onClick={() => {
            audioService.triggerHaptic('light');
            setActiveFilter('urgent');
          }}
        >
          🚨 Urgent ({counts.urgent})
        </button>

        <button
          type="button"
          className={`filter-chip ${activeFilter === 'completed' ? 'active' : ''}`}
          onClick={() => {
            audioService.triggerHaptic('light');
            setActiveFilter('completed');
          }}
        >
          Done ({counts.completed})
        </button>
      </div>

      {/* Reminders List Items */}
      {filteredReminders.length === 0 ? (
        <div className="empty-state">
          <Inbox className="empty-icon" />
          <p>
            {searchQuery
              ? `No reminders matching "${searchQuery}"`
              : activeFilter === 'completed'
              ? 'No completed reminders yet.'
              : 'No reminders found in this view.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredReminders.map((item) => {
            const isCompleted = item.status === 'completed';

            return (
              <div
                key={item.id}
                className={`reminder-card ${isCompleted ? 'completed' : ''}`}
              >
                {/* Complete Toggle Checkbox */}
                <button
                  type="button"
                  className={`reminder-check-btn ${isCompleted ? 'checked' : ''}`}
                  onClick={() => {
                    audioService.triggerHaptic('light');
                    onToggleComplete(item.id);
                  }}
                  title={isCompleted ? 'Mark pending' : 'Mark completed'}
                >
                  <Check size={14} />
                </button>

                {/* Reminder Content */}
                <div
                  className="reminder-content"
                  onClick={() => onEditItem(item)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="reminder-action-text">{item.parsed_action}</div>

                  <div className="reminder-meta-row">
                    {/* Location Badge */}
                    {item.trigger_type === 'location' && (
                      <span className="trigger-badge location">
                        <MapPin size={10} />
                        {item.trigger_config.time_label ||
                          item.trigger_config.place_name ||
                          'Geofence'}
                      </span>
                    )}

                    {/* Time Badge */}
                    {item.trigger_type === 'time' && (
                      <span className="trigger-badge time">
                        <Clock size={10} />
                        {item.trigger_config.time_label || 'Scheduled'}
                      </span>
                    )}

                    {/* Calendar Badge */}
                    {item.trigger_type === 'calendar' && (
                      <span className="trigger-badge calendar">
                        <Calendar size={10} />
                        {item.trigger_config.time_label || 'Event trigger'}
                      </span>
                    )}

                    {/* Priority Badge */}
                    {item.priority === 'urgent' && (
                      <span
                        className="trigger-badge"
                        style={{
                          background: 'rgba(244,63,94,0.15)',
                          color: '#fb7185',
                          border: '1px solid rgba(244,63,94,0.3)',
                        }}
                      >
                        <AlertCircle size={10} /> Urgent
                      </span>
                    )}

                    {/* AI Suggested Origin Badge */}
                    {item.source === 'ai_suggested' && (
                      <span
                        className="source-ai-badge"
                        title={item.suggested_reason || 'AI Habit Suggestion'}
                      >
                        <Sparkles size={9} /> Habit AI
                      </span>
                    )}
                  </div>
                </div>

                {/* Edit & Delete Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    className="icon-btn-subtle"
                    onClick={() => {
                      audioService.triggerHaptic('light');
                      onEditItem(item);
                    }}
                    title="Edit reminder"
                  >
                    <Edit3 size={14} />
                  </button>

                  <button
                    type="button"
                    className="delete-item-btn"
                    onClick={() => {
                      audioService.triggerHaptic('alert');
                      onDeleteItem(item.id);
                    }}
                    title="Delete reminder"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clear Completed Footer Button */}
      {activeFilter === 'completed' && counts.completed > 0 && onClearCompleted && (
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            type="button"
            className="clear-completed-btn"
            onClick={() => {
              audioService.triggerHaptic('medium');
              onClearCompleted();
            }}
          >
            <Trash2 size={13} />
            <span>Clear all completed reminders</span>
          </button>
        </div>
      )}
    </div>
  );
};
