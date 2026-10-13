import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  MapPin,
  Plus,
  Trash2,
  Download,
  Upload,
  Vibrate,
  Volume2,
  CheckCircle2,
} from 'lucide-react';
import type { AppSettings, Place } from '../types';
import { audioService } from '../services/audioService';
import { storageService } from '../services/storageService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  places: Place[];
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetData: () => void;
  onAddPlace?: (place: Place) => void;
  onDeletePlace?: (placeId: string) => void;
  onDataImported?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  places,
  onUpdateSettings,
  onResetData,
  onAddPlace,
  onDeletePlace,
  onDataImported,
}) => {
  const [showAddPlace, setShowAddPlace] = useState(false);
  const [newPlaceName, setNewPlaceName] = useState('');
  const [newPlaceRadius, setNewPlaceRadius] = useState('100');
  const [newPlaceType, setNewPlaceType] = useState<Place['type']>('custom');
  const [importText, setImportText] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState('');

  if (!isOpen) return null;

  const handleCreatePlace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaceName.trim() || !onAddPlace) return;

    audioService.triggerHaptic('success');
    const newPlace: Place = {
      id: `place-custom-${Date.now()}`,
      name: newPlaceName.trim(),
      type: newPlaceType,
      latitude: 37.7749 + (Math.random() - 0.5) * 0.05,
      longitude: -122.4194 + (Math.random() - 0.5) * 0.05,
      radius_meters: parseInt(newPlaceRadius, 10) || 100,
      icon: 'map-pin',
    };

    onAddPlace(newPlace);
    setNewPlaceName('');
    setShowAddPlace(false);
  };

  const handleExportData = () => {
    audioService.triggerHaptic('light');
    const backupJson = storageService.exportBackup();
    navigator.clipboard.writeText(backupJson);
    setCopiedNotification('Backup JSON copied to clipboard!');
    setTimeout(() => setCopiedNotification(''), 3000);
  };

  const handleImportData = () => {
    if (!importText.trim()) return;
    const success = storageService.importBackup(importText.trim());
    if (success) {
      audioService.triggerHaptic('success');
      setCopiedNotification('Backup restored successfully!');
      setShowImportBox(false);
      setImportText('');
      if (onDataImported) onDataImported();
      setTimeout(() => setCopiedNotification(''), 3000);
    } else {
      audioService.triggerHaptic('alert');
      alert('Invalid backup JSON format. Please check and try again.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Settings & Preferences</h3>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {copiedNotification && (
          <div className="copied-toast" style={{ marginBottom: '12px' }}>
            <CheckCircle2 size={13} />
            <span>{copiedNotification}</span>
          </div>
        )}

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
              onUpdateSettings({ ...settings, quiet_hours_enabled: e.target.checked });
            }}
          />
        </div>

        {settings.quiet_hours_enabled && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '4px 0 12px' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Volume2 size={16} color="#818cf8" />
            <div>
              <div className="setting-label">Tactile Audio Chimes</div>
              <div className="setting-desc">Synthesized tones for completions and alerts</div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.sound_enabled}
            onChange={(e) => {
              audioService.triggerHaptic('light');
              onUpdateSettings({ ...settings, sound_enabled: e.target.checked });
            }}
          />
        </div>

        {/* Haptic Feedback */}
        <div className="setting-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Vibrate size={16} color="#c084fc" />
            <div>
              <div className="setting-label">Haptic Vibration Feedback</div>
              <div className="setting-desc">Subtle tactile pulses on tap, swipe, and alert</div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.haptic_enabled !== false}
            onChange={(e) => {
              audioService.triggerHaptic('light');
              onUpdateSettings({ ...settings, haptic_enabled: e.target.checked });
            }}
          />
        </div>

        {/* Geofence Places Manager */}
        <div style={{ marginTop: '16px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Registered Geofence Anchors ({places.length})
            </div>
            {onAddPlace && (
              <button
                type="button"
                className="context-pill"
                style={{ fontSize: '11px', background: 'rgba(16,185,129,0.15)', color: '#34d399', borderColor: 'rgba(16,185,129,0.4)' }}
                onClick={() => setShowAddPlace(!showAddPlace)}
              >
                <Plus size={12} />
                <span>{showAddPlace ? 'Cancel' : 'Add Place'}</span>
              </button>
            )}
          </div>

          {/* Add New Place Form */}
          {showAddPlace && (
            <form onSubmit={handleCreatePlace} style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="text"
                  className="setting-input"
                  placeholder="Place Name (e.g. Grandma's House, Library)"
                  value={newPlaceName}
                  onChange={(e) => setNewPlaceName(e.target.value)}
                  required
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <select
                    className="setting-input"
                    value={newPlaceType}
                    onChange={(e) => setNewPlaceType(e.target.value as Place['type'])}
                  >
                    <option value="custom">Custom Place</option>
                    <option value="home">Home</option>
                    <option value="office">Office</option>
                    <option value="gym">Gym</option>
                    <option value="market">Market</option>
                  </select>
                  <input
                    type="number"
                    className="setting-input"
                    placeholder="Radius (m)"
                    value={newPlaceRadius}
                    onChange={(e) => setNewPlaceRadius(e.target.value)}
                    min={50}
                    max={1000}
                  />
                </div>
                <button
                  type="submit"
                  className="submit-capture-btn"
                  style={{ width: '100%', height: '36px' }}
                >
                  Save Geofence
                </button>
              </div>
            </form>
          )}

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
                  <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                    ({place.type})
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                    {place.radius_meters}m radius
                  </span>
                  {onDeletePlace && places.length > 2 && (
                    <button
                      type="button"
                      className="icon-btn-subtle"
                      onClick={() => onDeletePlace(place.id)}
                      title="Delete place"
                    >
                      <Trash2 size={13} color="#f43f5e" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Backup & Restore */}
        <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Data Backup & Restore
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              className="context-pill"
              style={{ justifyContent: 'center', padding: '8px' }}
              onClick={handleExportData}
            >
              <Download size={13} />
              <span>Copy Backup</span>
            </button>

            <button
              type="button"
              className="context-pill"
              style={{ justifyContent: 'center', padding: '8px' }}
              onClick={() => setShowImportBox(!showImportBox)}
            >
              <Upload size={13} />
              <span>{showImportBox ? 'Close' : 'Import'}</span>
            </button>
          </div>

          {showImportBox && (
            <div style={{ marginTop: '8px' }}>
              <textarea
                className="setting-input"
                style={{ width: '100%', height: '80px', fontSize: '11px', fontFamily: 'monospace' }}
                placeholder="Paste backup JSON here..."
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
              <button
                type="button"
                className="submit-capture-btn"
                style={{ width: '100%', height: '34px', marginTop: '6px' }}
                onClick={handleImportData}
              >
                Restore from Backup
              </button>
            </div>
          )}
        </div>

        {/* Reset Demo Data */}
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
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
