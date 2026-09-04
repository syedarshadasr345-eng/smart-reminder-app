import React, { useState } from 'react';
import {
  Check,
  MapPin,
  Clock,
  Calendar,
  AlertCircle,
  Sparkles,
  Trash2,
  Inbox,
} from 'lucide-react';
import type { ReminderItem } from '../types';

interface RemindersListProps {
  reminders: ReminderItem[];
  onToggleComplete: (id: string) => void;
  onDeleteItem: (id: string) => void;
}

export const RemindersList: React.FC<RemindersListProps> = ({
  reminders,
  onToggleComplete,
  onDeleteItem,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'location' | 'time' | 'completed'>('all');

  const filteredReminders = reminders.filter((item) => {
    if (activeTab === 'completed') return item.status === 'completed';
    if (item.status === 'completed') return false;

    if (activeTab === 'location') return item.trigger_type === 'location';
    if (activeTab === 'time') return item.trigger_type === 'time';
    return true;
  });

  return (
    <div>
      <div className="section-header" style={{ marginBottom: '12px' }}>
        <h2 className="section-title">Your Reminders</h2>

        <div className="filter-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'location' ? 'active' : ''}`}
            onClick={() => setActiveTab('location')}
          >
            Location
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'time' ? 'active' : ''}`}
            onClick={() => setActiveTab('time')}
          >
            Time
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Done
          </button>
        </div>
      </div>

      {filteredReminders.length === 0 ? (
        <div className="empty-state">
          <Inbox className="empty-icon" />
          <p>No {activeTab !== 'all' ? activeTab : ''} reminders found.</p>
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
                <button
                  type="button"
                  className={`reminder-check-btn ${isCompleted ? 'checked' : ''}`}
                  onClick={() => onToggleComplete(item.id)}
                  title={isCompleted ? 'Mark pending' : 'Mark completed'}
                >
                  <Check size={14} />
                </button>

                <div className="reminder-content">
                  <div className="reminder-action-text">{item.parsed_action}</div>

                  <div className="reminder-meta-row">
                    {/* Trigger badge */}
                    {item.trigger_type === 'location' && (
                      <span className="trigger-badge location">
                        <MapPin size={10} />
                        {item.trigger_config.time_label || item.trigger_config.place_name || 'Geofence'}
                      </span>
                    )}

                    {item.trigger_type === 'time' && (
                      <span className="trigger-badge time">
                        <Clock size={10} />
                        {item.trigger_config.time_label || 'Scheduled'}
                      </span>
                    )}

                    {item.trigger_type === 'calendar' && (
                      <span className="trigger-badge calendar">
                        <Calendar size={10} />
                        {item.trigger_config.time_label || 'Event trigger'}
                      </span>
                    )}

                    {/* Priority badge */}
                    {item.priority === 'urgent' && (
                      <span className="trigger-badge" style={{ background: 'rgba(244,63,94,0.15)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.3)' }}>
                        <AlertCircle size={10} /> Urgent
                      </span>
                    )}

                    {/* AI Suggested Origin badge */}
                    {item.source === 'ai_suggested' && (
                      <span className="source-ai-badge" title={item.suggested_reason || 'AI Habit Suggestion'}>
                        <Sparkles size={9} /> Habit AI
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="delete-item-btn"
                  onClick={() => onDeleteItem(item.id)}
                  title="Delete reminder"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
