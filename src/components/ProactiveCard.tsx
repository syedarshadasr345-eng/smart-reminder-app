import React from 'react';
import { Sparkles, Check, X } from 'lucide-react';
import type { UserSummaryPattern } from '../types';

interface ProactiveCardProps {
  pattern: UserSummaryPattern;
  onAccept: (pattern: UserSummaryPattern) => void;
  onDismiss: (pattern: UserSummaryPattern) => void;
}

export const ProactiveCard: React.FC<ProactiveCardProps> = ({ pattern, onAccept, onDismiss }) => {
  const confidencePercent = Math.round(pattern.confidence * 100);

  return (
    <div className="proactive-card">
      <div className="proactive-header">
        <div className="proactive-pill">
          <Sparkles size={12} />
          <span>Proactive Suggestion</span>
        </div>

        <div className="confidence-indicator" title="Pattern confidence score based on your recurring logs">
          <span>{confidencePercent}% match</span>
        </div>
      </div>

      <div className="proactive-body">
        <h3 className="proactive-title">{pattern.proposed_action}</h3>
        <p className="proactive-explain">
          <strong style={{ color: '#e2e8f0' }}>Why suggested:</strong> {pattern.description}
        </p>
      </div>

      <div className="proactive-actions">
        <button
          type="button"
          className="accept-suggestion-btn"
          onClick={() => onAccept(pattern)}
        >
          <Check size={14} />
          <span>+ Add to Reminders</span>
        </button>

        <button
          type="button"
          className="dismiss-suggestion-btn"
          onClick={() => onDismiss(pattern)}
          title="Dismiss this suggestion (lowers future confidence)"
        >
          <X size={14} />
          <span>Not Today</span>
        </button>
      </div>
    </div>
  );
};
