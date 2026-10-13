import React from 'react';
import {
  MapPin,
  Compass,
  ArrowUpRight,
  ArrowDownLeft,
  Moon,
  Navigation,
  ShieldCheck,
} from 'lucide-react';
import type { Place, SimulatedContext, AppSettings, ReminderItem } from '../types';
import { audioService } from '../services/audioService';

interface ContextRadarViewProps {
  context: SimulatedContext;
  places: Place[];
  settings: AppSettings;
  reminders: ReminderItem[];
  onUpdateContext: (updates: Partial<SimulatedContext>) => void;
  onSimulateGeofenceExit: () => void;
  onSimulateGeofenceEntry: () => void;
}

export const ContextRadarView: React.FC<ContextRadarViewProps> = ({
  context,
  places,
  settings,
  reminders,
  onUpdateContext,
  onSimulateGeofenceExit,
  onSimulateGeofenceEntry,
}) => {
  const currentPlace = places.find((p) => p.id === context.currentPlaceId) || places[0];

  // Count pending reminders linked to this place
  const placeReminders = reminders.filter(
    (r) =>
      r.status === 'pending' &&
      r.trigger_type === 'location' &&
      r.trigger_config.place_id === context.currentPlaceId
  );

  const handlePlaceChange = (placeId: string) => {
    audioService.triggerHaptic('medium');
    onUpdateContext({ currentPlaceId: placeId, currentMovementState: 'stationary' });
  };

  const handleExit = () => {
    audioService.triggerHaptic('alert');
    onSimulateGeofenceExit();
  };

  const handleEntry = () => {
    audioService.triggerHaptic('success');
    onSimulateGeofenceEntry();
  };

  return (
    <div className="radar-view-container">
      {/* Header Info */}
      <div className="section-header" style={{ marginBottom: '14px' }}>
        <div>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Compass size={18} color="#10b981" />
            <span>Context Radar</span>
          </h2>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Real-time geofence detection & context evaluation
          </p>
        </div>

        {/* Quiet hours status indicator */}
        <div
          className={`radar-quiet-badge ${settings.quiet_hours_enabled ? 'enabled' : 'disabled'}`}
          title="Quiet hours rule: non-urgent notifications are batched"
        >
          <Moon size={12} />
          <span>{settings.quiet_hours_enabled ? 'Quiet Batching On' : 'Immediate Push'}</span>
        </div>
      </div>

      {/* Visual Animated Radar Screen */}
      <div className="radar-screen">
        <div className="radar-sweep-beam" />
        <div className="radar-ring radar-ring-3" />
        <div className="radar-ring radar-ring-2" />
        <div className="radar-ring radar-ring-1" />

        {/* Center Current Location Beacon */}
        <div className="radar-center-beacon">
          <div className="radar-beacon-pulse" />
          <div className="radar-beacon-dot">
            <Navigation size={12} />
          </div>
          <span className="radar-beacon-label">{currentPlace?.name || 'Current Zone'}</span>
        </div>

        {/* Surrounding Geofence Nodes */}
        {places.map((place, idx) => {
          if (place.id === context.currentPlaceId) return null;
          // Position relative around radar circle
          const angles = [45, 140, 230, 315];
          const angle = angles[idx % angles.length];
          const rad = (angle * Math.PI) / 180;
          const radiusPercent = 38; // percentage from center
          const left = 50 + radiusPercent * Math.cos(rad);
          const top = 50 + radiusPercent * Math.sin(rad);

          return (
            <button
              key={place.id}
              type="button"
              className="radar-place-node"
              style={{ left: `${left}%`, top: `${top}%` }}
              onClick={() => handlePlaceChange(place.id)}
              title={`Switch simulated location to ${place.name}`}
            >
              <div className="node-icon">
                <MapPin size={10} />
              </div>
              <span className="node-title">{place.name}</span>
            </button>
          );
        })}
      </div>

      {/* Motion & Geofence Simulation Controls */}
      <div className="radar-controls-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Current Geofence Zone
            </span>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <MapPin size={15} color="#10b981" />
              <span>{currentPlace?.name}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 400 }}>
                ({currentPlace?.radius_meters}m boundary)
              </span>
            </div>
          </div>

          <select
            className="setting-input"
            style={{ padding: '6px 10px', fontSize: '12px' }}
            value={context.currentPlaceId}
            onChange={(e) => handlePlaceChange(e.target.value)}
          >
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            type="button"
            className={`radar-action-btn exit ${context.currentMovementState === 'departing' ? 'active' : ''}`}
            onClick={handleExit}
          >
            <ArrowUpRight size={16} />
            <div>
              <div className="btn-main">Simulate Leaving</div>
              <div className="btn-sub">Triggers Exit Checklist</div>
            </div>
          </button>

          <button
            type="button"
            className={`radar-action-btn enter ${context.currentMovementState === 'arriving' ? 'active' : ''}`}
            onClick={handleEntry}
          >
            <ArrowDownLeft size={16} />
            <div>
              <div className="btn-main">Simulate Arriving</div>
              <div className="btn-sub">Triggers Entry Alerts</div>
            </div>
          </button>
        </div>
      </div>

      {/* Geofence Active Reminders Summary */}
      <div className="radar-reminders-summary">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Location-Tied Items for {currentPlace?.name} ({placeReminders.length})
          </span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            {context.currentMovementState.toUpperCase()}
          </span>
        </div>

        {placeReminders.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', textAlign: 'center' }}>
            No pending departure or arrival alerts for this location.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {placeReminders.map((r) => (
              <div key={r.id} className="radar-item-row">
                <span className="dot" />
                <span style={{ flex: 1, fontSize: '13px', color: '#e2e8f0' }}>{r.parsed_action}</span>
                <span className="event-tag">
                  {r.trigger_config.geofence_event === 'exit' ? 'Exit' : 'Enter'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Privacy Guard Notice */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(16,185,129,0.06)', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.2)', fontSize: '11px', color: '#6ee7b7' }}>
        <ShieldCheck size={16} style={{ flexShrink: 0 }} />
        <span>Geofences run locally on device. No GPS coordinates are broadcast to third parties.</span>
      </div>
    </div>
  );
};
