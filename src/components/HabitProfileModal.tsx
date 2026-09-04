import React from 'react';
import { X, Sparkles, RefreshCw, ShieldCheck } from 'lucide-react';
import type { UserSummaryPattern } from '../types';

interface HabitProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  patterns: UserSummaryPattern[];
  onTriggerAnalysis: () => void;
}

export const HabitProfileModal: React.FC<HabitProfileModalProps> = ({
  isOpen,
  onClose,
  patterns,
  onTriggerAnalysis,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--accent-ai)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="modal-title">Personal Habit Profile</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Ongoing AI summary of your routines & forgetfulness patterns
              </p>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              background: 'rgba(168, 85, 247, 0.08)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              fontSize: '12px',
              color: '#e2e8f0',
              lineHeight: 1.4,
              display: 'flex',
              gap: '10px',
            }}
          >
            <ShieldCheck size={20} color="#c084fc" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Privacy-Preserving Learning:</strong> The app detects your recurring routines from what you log and complete over time. No raw data is shared with third parties without consent.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Discovered Habit Patterns ({patterns.length})
          </span>
          <button
            type="button"
            className="context-pill"
            style={{ fontSize: '11px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.4)' }}
            onClick={onTriggerAnalysis}
          >
            <RefreshCw size={11} />
            <span>Re-analyze History</span>
          </button>
        </div>

        <div>
          {patterns.map((pattern) => {
            const confidencePercent = Math.round(pattern.confidence * 100);

            return (
              <div
                key={pattern.id}
                className={`habit-pattern-card ${pattern.status}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                    {pattern.pattern_title}
                  </h4>
                  <span style={{ fontSize: '11px', color: '#c084fc', fontWeight: 600 }}>
                    {confidencePercent}% confidence
                  </span>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  {pattern.description}
                </p>

                {/* Confidence Bar */}
                <div className="confidence-bar-wrapper">
                  <div className="confidence-track">
                    <div
                      className="confidence-fill"
                      style={{ width: `${confidencePercent}%` }}
                    />
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    Accepted: {pattern.times_accepted} / {pattern.times_suggested}
                  </span>
                </div>

                {pattern.based_on_items.length > 0 && (
                  <div style={{ marginTop: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>
                    Traceability: Supported by {pattern.based_on_items.length} historical logs
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
