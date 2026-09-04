import React, { useState, useEffect, useRef } from 'react';
import { Mic, Send, MapPin, Clock, AlertCircle, Check } from 'lucide-react';
import type { Place, PriorityLevel, ReminderCategory, TriggerType } from '../types';
import { parserService } from '../services/parserService';
import type { ParsedReminderResult } from '../services/parserService';

interface CaptureBarProps {
  places: Place[];
  onAddReminder: (data: {
    raw_text: string;
    parsed_action: string;
    category: ReminderCategory;
    trigger_type: TriggerType;
    trigger_config: Record<string, any>;
    priority: PriorityLevel;
  }) => void;
}

export const CaptureBar: React.FC<CaptureBarProps> = ({ places, onAddReminder }) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [liveParsed, setLiveParsed] = useState<ParsedReminderResult | null>(null);
  const recognitionRef = useRef<any>(null);

  // Real-time live preview of natural language parsing
  useEffect(() => {
    if (!inputText.trim()) {
      setLiveParsed(null);
      return;
    }
    const result = parserService.parseLocal(inputText, places);
    setLiveParsed(result);
  }, [inputText, places]);

  // Handle Speech Recognition (Web Speech API)
  const toggleVoiceRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice dictation is not supported by this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => (result as any)[0].transcript)
          .join('');
        setInputText(transcript);
      };

      recognition.onerror = (err: any) => {
        console.error('Speech recognition error:', err);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
      setIsRecording(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const parsed = liveParsed || parserService.parseLocal(inputText, places);

    onAddReminder({
      raw_text: inputText.trim(),
      parsed_action: parsed.parsed_action,
      category: parsed.category,
      trigger_type: parsed.trigger_type,
      trigger_config: parsed.trigger_config,
      priority: parsed.priority,
    });

    setInputText('');
    setLiveParsed(null);
  };

  const handleApplyExample = (text: string) => {
    setInputText(text);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="capture-box">
        <form onSubmit={handleSubmit}>
          <div className="capture-input-row">
            <input
              type="text"
              className="capture-input"
              placeholder="What do you need to remember? (text or voice)"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />

            <button
              type="button"
              className={`voice-btn ${isRecording ? 'recording' : ''}`}
              title={isRecording ? 'Listening... click to stop' : 'Tap to speak'}
              onClick={toggleVoiceRecording}
            >
              <Mic size={17} />
            </button>

            <button
              type="submit"
              className="submit-capture-btn"
              disabled={!inputText.trim()}
            >
              <Send size={14} />
              <span>Save</span>
            </button>
          </div>
        </form>

        {/* Live Parsing Preview */}
        {liveParsed && (
          <div className="parser-preview-bar">
            <div className="parser-tags">
              <span className="parser-badge category">
                <Check size={11} /> {liveParsed.parsed_action}
              </span>

              {liveParsed.trigger_type === 'location' && (
                <span className="parser-badge location">
                  <MapPin size={11} /> {liveParsed.trigger_config.time_label || 'Location geofence'}
                </span>
              )}

              {liveParsed.trigger_type === 'time' && (
                <span className="parser-badge time">
                  <Clock size={11} /> {liveParsed.trigger_config.time_label || 'Scheduled time'}
                </span>
              )}

              {liveParsed.priority === 'urgent' && (
                <span className="parser-badge urgent">
                  <AlertCircle size={11} /> Urgent
                </span>
              )}
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
              Auto-detected
            </span>
          </div>
        )}
      </div>

      {/* Quick Example Suggestions */}
      <div className="example-chips-row">
        <button
          type="button"
          className="example-chip"
          onClick={() => handleApplyExample("don't forget my badge tomorrow when leaving home")}
        >
          📍 Badge when leaving home
        </button>
        <button
          type="button"
          className="example-chip"
          onClick={() => handleApplyExample('gym gear monday morning')}
        >
          ⏰ Gym gear Monday
        </button>
        <button
          type="button"
          className="example-chip"
          onClick={() => handleApplyExample('urgent: pick up prescription pills at 6pm')}
        >
          🚨 Urgent prescription pills
        </button>
        <button
          type="button"
          className="example-chip"
          onClick={() => handleApplyExample('grab fresh milk when near market')}
        >
          🛒 Milk when near market
        </button>
      </div>
    </div>
  );
};
