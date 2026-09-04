import React from 'react';
import { X, RotateCcw, MapPin } from 'lucide-react';
import type { AppSettings, Place } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  places: Place[];
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  places,
  onUpdateSettings,
  onResetData,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Settings & Preferences</h3>
          <button className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Quiet Hours */}
        <div className="setting-row">
          <div>
            <div className="setting-label">Quiet Hours (Batch Non-Urgent)</div>
            <div className="setting-desc">Suppress non-urgent alerts during rest time</div>
          </div>
          <input
            type="checkbox"
            checked={settings.quiet_hours_enabled}
            onChange={(e) =>
              onUpdateSettings({ ...settings, quiet_hours_enabled: e.target.checked })
            }
          />
        </div>

        {settings.quiet_hours_enabled && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '8px 0 14px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Quiet Start:
              </div>
              <input
                type="time"
                className="setting-input"
                style={{ width: '100%' }}
                value={settings.quiet_hours_start}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, quiet_hours_start: e.target.value })
                }
              />
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Quiet End:
              </div>
              <input
                type="time"
                className="setting-input"
                style={{ width: '100%' }}
                value={settings.quiet_hours_end}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, quiet_hours_end: e.target.value })
                }
              />
            </div>
          </div>
        )}

        {/* Morning Briefing Time */}
        <div className="setting-row">
          <div>
            <div className="setting-label">Morning Departure Brief</div>
            <div className="setting-desc">Time when batched digest is delivered</div>
          </div>
          <input
            type="time"
            className="setting-input"
            value={settings.morning_brief_time}
            onChange={(e) =>
              onUpdateSettings({ ...settings, morning_brief_time: e.target.value })
            }
          />
        </div>

        {/* Tactile Audio Chimes */}
        <div className="setting-row">
          <div>
            <div className="setting-label">Tactile Audio Chime</div>
            <div className="setting-desc">Play soft synthesized tone when alerts trigger</div>
          </div>
          <input
            type="checkbox"
            checked={settings.sound_enabled}
            onChange={(e) =>
              onUpdateSettings({ ...settings, sound_enabled: e.target.checked })
            }
          />
        </div>

        {/* Geofence Places Display */}
        <div style={{ marginTop: '16px', marginBottom: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Registered Geofence Anchors ({places.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {places.map((place) => (
              <div
                key={place.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={13} color="#34d399" />
                  <span style={{ fontWeight: 500 }}>{place.name}</span>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                  {place.radius_meters}m radius
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Reset Demo Data */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            className="context-pill"
            style={{ width: '100%', justifyContent: 'center', padding: '10px', color: '#fda4af', borderColor: 'rgba(244, 63, 94, 0.3)' }}
            onClick={() => {
              if (confirm('Reset demo data to initial defaults?')) {
                onResetData();
                onClose();
              }
            }}
          >
            <RotateCcw size={13} />
            <span>Reset to Initial Demo State</span>
          </button>
        </div>
      </div>
    </div>
  );
};
