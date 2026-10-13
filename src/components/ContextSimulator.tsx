import React, { useState } from 'react';
import { MapPin, Navigation, Clock, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import type { Place, SimulatedContext } from '../types';

interface ContextSimulatorProps {
  context: SimulatedContext;
  places: Place[];
  onUpdateContext: (updates: Partial<SimulatedContext>) => void;
  onSimulateGeofenceExit: () => void;
  onSimulateGeofenceEntry: () => void;
}

export const ContextSimulator: React.FC<ContextSimulatorProps> = ({
  context,
  places,
  onUpdateContext,
  onSimulateGeofenceExit,
  onSimulateGeofenceEntry,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const currentPlace = places.find((p) => p.id === context.currentPlaceId) || places[0];

  const handleSetCalendarEvent = (title: string | null) => {
    if (!title) {
      onUpdateContext({ upcomingCalendarEvent: null });
    } else {
      onUpdateContext({
        upcomingCalendarEvent: {
          id: `evt-${Date.now()}`,
          title,
          start_time: new Date(Date.now() + 1800000).toISOString(), // 30 min from now
        },
      });
    }
  };

  return (
    <div className="context-sim-card">
      <div className="context-sim-header">
        <div className="context-sim-title">
          <span className="pulse-dot" />
          <span>Active Context Simulator</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {context.currentMovementState.toUpperCase()}
          </span>
          <button
            type="button"
            className="icon-btn"
            style={{ width: '22px', height: '22px' }}
            onClick={() => setShowAdvanced(!showAdvanced)}
            title="Toggle time & calendar simulation"
          >
            {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Place Selector */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px' }}>
          Simulated Location:
        </div>
        <div className="context-pill-group">
          {places.map((place) => (
            <button
              key={place.id}
              className={`context-pill ${context.currentPlaceId === place.id ? 'active' : ''}`}
              onClick={() => onUpdateContext({ currentPlaceId: place.id, currentMovementState: 'stationary' })}
            >
              <MapPin size={12} />
              <span>{place.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Movement / Geofence Event Trigger */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
        <button
          className="context-pill"
          style={{ background: 'rgba(244, 63, 94, 0.12)', borderColor: 'rgba(244, 63, 94, 0.3)', color: '#fda4af' }}
          onClick={onSimulateGeofenceExit}
          title="Simulates stepping out of current geofence radius"
        >
          <Navigation size={12} />
          <span>Leave {currentPlace.name} (Exit Geofence)</span>
        </button>

        <button
          className="context-pill"
          style={{ background: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#6ee7b7' }}
          onClick={onSimulateGeofenceEntry}
          title="Simulates arriving into place geofence"
        >
          <MapPin size={12} />
          <span>Arrive at {currentPlace.name}</span>
        </button>
      </div>

      {/* Advanced Simulator: Calendar & Time Simulation */}
      {showAdvanced && (
        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Simulated Time Checkpoints */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <Clock size={11} />
              <span>Simulated Clock Mode:</span>
            </div>
            <div className="context-pill-group">
              <button
                className={`context-pill ${context.useRealTime ? 'active' : ''}`}
                onClick={() => onUpdateContext({ useRealTime: true })}
              >
                <span>Live Device Time</span>
              </button>
              <button
                className={`context-pill ${!context.useRealTime && context.simulatedTime.includes('T08:00') ? 'active' : ''}`}
                onClick={() =>
                  onUpdateContext({
                    useRealTime: false,
                    simulatedTime: `${new Date().toISOString().slice(0, 10)}T08:00:00.000Z`,
                  })
                }
              >
                <span>8:00 AM (Morning Brief)</span>
              </button>
              <button
                className={`context-pill ${!context.useRealTime && context.simulatedTime.includes('T23:00') ? 'active' : ''}`}
                onClick={() =>
                  onUpdateContext({
                    useRealTime: false,
                    simulatedTime: `${new Date().toISOString().slice(0, 10)}T23:00:00.000Z`,
                  })
                }
              >
                <span>11:00 PM (Quiet Hours)</span>
              </button>
            </div>
          </div>

          {/* Calendar simulation */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <Calendar size={11} />
              <span>Upcoming Calendar Event Context:</span>
            </div>
            <div className="context-pill-group">
              <button
                className={`context-pill ${context.upcomingCalendarEvent?.title === 'Product Review Sync' ? 'active' : ''}`}
                onClick={() => handleSetCalendarEvent('Product Review Sync')}
              >
                <span>Product Review Sync</span>
              </button>
              <button
                className={`context-pill ${context.upcomingCalendarEvent?.title === 'Dentist Appointment' ? 'active' : ''}`}
                onClick={() => handleSetCalendarEvent('Dentist Appointment')}
              >
                <span>Dentist Appointment</span>
              </button>
              <button
                className={`context-pill ${context.upcomingCalendarEvent?.title === 'Flight to New York' ? 'active' : ''}`}
                onClick={() => handleSetCalendarEvent('Flight to New York')}
              >
                <span>Flight to New York</span>
              </button>
              {context.upcomingCalendarEvent && (
                <button
                  className="context-pill"
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => handleSetCalendarEvent(null)}
                >
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
