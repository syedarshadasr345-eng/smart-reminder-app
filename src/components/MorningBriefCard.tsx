import React from 'react';
import { Sun, CheckCircle2, X } from 'lucide-react';
import type { ReminderItem } from '../types';

interface MorningBriefCardProps {
  reminders: ReminderItem[];
  onCompleteItem: (id: string) => void;
  onDismissBrief: () => void;
}

export const MorningBriefCard: React.FC<MorningBriefCardProps> = ({
  reminders,
  onCompleteItem,
  onDismissBrief,
}) => {
  const pendingItems = reminders.filter((r) => r.status === 'pending');
  if (pendingItems.length === 0) return null;

  return (
    <div className="morning-brief-card">
      <div className="brief-header">
        <div className="brief-title">
          <Sun size={17} />
          <span>Morning Departure Brief</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="brief-badge">Batched Digest</span>
          <button
            type="button"
            onClick={onDismissBrief}
            style={{ color: '#fef08a', opacity: 0.7, padding: '2px' }}
            title="Dismiss brief"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <p style={{ fontSize: '12px', color: '#fef3c7', marginBottom: '10px' }}>
        Good morning! Here are {pendingItems.length} item{pendingItems.length > 1 ? 's' : ''} batched for your day:
      </p>

      <div className="brief-item-list">
        {pendingItems.slice(0, 4).map((item) => (
          <div key={item.id} className="brief-item">
            <button
              className="reminder-check-btn"
              style={{ width: '18px', height: '18px' }}
              onClick={() => onCompleteItem(item.id)}
              title="Mark done"
            >
              <CheckCircle2 size={13} />
            </button>
            <span style={{ flex: 1, color: '#fff', fontSize: '12px' }}>
              {item.parsed_action}
            </span>
            {item.trigger_config?.time_label && (
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>
                {item.trigger_config.time_label}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
