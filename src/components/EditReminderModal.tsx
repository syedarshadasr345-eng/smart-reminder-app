import React, { useState } from 'react';
import { X, Check, Trash2, MapPin, Clock } from 'lucide-react';
import type { ReminderItem, Place, PriorityLevel, ReminderCategory, TriggerType } from '../types';
import { audioService } from '../services/audioService';

interface EditReminderModalProps {
  reminder: ReminderItem | null;
  places: Place[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: ReminderItem) => void;
  onDelete: (id: string) => void;
}

export const EditReminderModal: React.FC<EditReminderModalProps> = ({
  reminder,
  places,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!isOpen || !reminder) return null;

  return (
    <EditReminderForm
      key={reminder.id}
      reminder={reminder}
      places={places}
      onClose={onClose}
      onSave={onSave}
      onDelete={onDelete}
    />
  );
};

interface EditReminderFormProps {
  reminder: ReminderItem;
  places: Place[];
  onClose: () => void;
  onSave: (updated: ReminderItem) => void;
  onDelete: (id: string) => void;
}

const EditReminderForm: React.FC<EditReminderFormProps> = ({
  reminder,
  places,
  onClose,
  onSave,
  onDelete,
}) => {
  const [actionText, setActionText] = useState(reminder.parsed_action);
  const [category, setCategory] = useState<ReminderCategory>(reminder.category);
  const [priority, setPriority] = useState<PriorityLevel>(reminder.priority);
  const [triggerType, setTriggerType] = useState<TriggerType>(reminder.trigger_type);
  const [placeId, setPlaceId] = useState(reminder.trigger_config.place_id || places[0]?.id || '');
  const [geofenceEvent, setGeofenceEvent] = useState<'exit' | 'enter'>(
    reminder.trigger_config.geofence_event || 'exit'
  );
  const [timeLabel, setTimeLabel] = useState(reminder.trigger_config.time_label || '');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionText.trim()) return;

    audioService.triggerHaptic('success');

    const selectedPlace = places.find((p) => p.id === placeId);
    const updatedTriggerConfig = { ...reminder.trigger_config };

    if (triggerType === 'location') {
      updatedTriggerConfig.place_id = placeId;
      updatedTriggerConfig.place_name = selectedPlace?.name || 'Saved Place';
      updatedTriggerConfig.geofence_event = geofenceEvent;
      updatedTriggerConfig.time_label = `When ${geofenceEvent === 'exit' ? 'leaving' : 'near'} ${selectedPlace?.name || 'Place'}`;
    } else if (triggerType === 'time') {
      updatedTriggerConfig.time_label = timeLabel || 'Scheduled Alert';
    }

    const updated: ReminderItem = {
      ...reminder,
      parsed_action: actionText.trim(),
      category,
      priority,
      trigger_type: triggerType,
      trigger_config: updatedTriggerConfig,
      updated_at: new Date().toISOString(),
    };

    onSave(updated);
    onClose();
  };

  const handleDelete = () => {
    audioService.triggerHaptic('alert');
    onDelete(reminder.id);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 className="modal-title">Edit Reminder</h3>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Action / What to Remember
              </label>
              <input
                type="text"
                className="setting-input"
                style={{ width: '100%', fontSize: '14px', padding: '10px 12px' }}
                value={actionText}
                onChange={(e) => setActionText(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Category
                </label>
                <select
                  className="setting-input"
                  style={{ width: '100%', padding: '8px 10px' }}
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ReminderCategory)}
                >
                  <option value="item">Item to pack</option>
                  <option value="task">Task / Work</option>
                  <option value="errand">Errand</option>
                  <option value="habit">Habit Routine</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Priority
                </label>
                <select
                  className="setting-input"
                  style={{ width: '100%', padding: '8px 10px' }}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                >
                  <option value="low">Low (Quiet Digest)</option>
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent (Immediate Push)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Trigger Type
              </label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <button
                  type="button"
                  className={`tab-btn ${triggerType === 'location' ? 'active' : ''}`}
                  style={{ flex: 1, padding: '6px' }}
                  onClick={() => setTriggerType('location')}
                >
                  <MapPin size={12} style={{ marginRight: '4px' }} /> Location
                </button>
                <button
                  type="button"
                  className={`tab-btn ${triggerType === 'time' ? 'active' : ''}`}
                  style={{ flex: 1, padding: '6px' }}
                  onClick={() => setTriggerType('time')}
                >
                  <Clock size={12} style={{ marginRight: '4px' }} /> Time
                </button>
              </div>

              {triggerType === 'location' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>Place</label>
                    <select
                      className="setting-input"
                      style={{ width: '100%' }}
                      value={placeId}
                      onChange={(e) => setPlaceId(e.target.value)}
                    >
                      {places.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>Geofence Event</label>
                    <select
                      className="setting-input"
                      style={{ width: '100%' }}
                      value={geofenceEvent}
                      onChange={(e) => setGeofenceEvent(e.target.value as 'exit' | 'enter')}
                    >
                      <option value="exit">When Leaving</option>
                      <option value="enter">When Arriving</option>
                    </select>
                  </div>
                </div>
              )}

              {triggerType === 'time' && (
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>Time Label</label>
                  <input
                    type="text"
                    className="setting-input"
                    style={{ width: '100%' }}
                    placeholder="e.g. Today 4:00 PM or Monday 8 AM"
                    value={timeLabel}
                    onChange={(e) => setTimeLabel(e.target.value)}
                  />
                </div>
              )}
            </div>

            {reminder.source === 'ai_suggested' && reminder.suggested_reason && (
              <div style={{ fontSize: '11px', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)', padding: '8px', borderRadius: '8px', color: '#c084fc' }}>
                ✨ <strong>AI Suggestion Reason:</strong> {reminder.suggested_reason}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                className="icon-btn"
                style={{ width: '42px', height: '42px', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '10px' }}
                onClick={handleDelete}
                title="Delete Reminder"
              >
                <Trash2 size={16} />
              </button>

              <button
                type="submit"
                className="submit-capture-btn"
                style={{ flex: 1, height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Check size={16} />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
