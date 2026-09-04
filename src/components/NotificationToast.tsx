import React, { useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import type { TriggerAlertEvent } from '../services/triggerEngine';

interface NotificationToastProps {
  alert: TriggerAlertEvent | null;
  onDismiss: () => void;
  onComplete: (reminderId: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  alert,
  onDismiss,
  onComplete,
}) => {
  useEffect(() => {
    if (!alert) return;

    // Auto-dismiss toast after 7 seconds
    const timer = setTimeout(() => {
      onDismiss();
    }, 7000);

    return () => clearTimeout(timer);
  }, [alert, onDismiss]);

  if (!alert) return null;

  return (
    <div className="system-alert-toast">
      <div className="toast-icon">
        <Bell size={18} />
      </div>

      <div className="toast-content">
        <div className="toast-app-name">
          Smart Reminder {alert.isUrgent ? '• URGENT ALERT' : '• CONTEXT TRIGGER'}
        </div>
        <div className="toast-title">{alert.reminder.parsed_action}</div>
        <div className="toast-reason">{alert.reason}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          className="icon-btn"
          style={{ width: '28px', height: '28px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}
          onClick={() => {
            onComplete(alert.reminder.id);
            onDismiss();
          }}
          title="Mark done"
        >
          <Check size={14} />
        </button>

        <button
          className="toast-close-btn"
          onClick={onDismiss}
          title="Dismiss alert"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
