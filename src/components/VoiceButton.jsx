/**
 * VoiceButton.jsx
 *
 * Large futuristic circular microphone button.
 * States: ready | listening | processing | speaking
 * Disabled while processing or speaking (with a Stop button overlay).
 */

import React from 'react';

const MicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="btn-icon">
    <path
      d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z"
      fill="currentColor"
      opacity="0.9"
    />
    <path
      d="M19 10a7 7 0 0 1-14 0M12 19v4M8 23h8"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const StopIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="btn-icon">
    <rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor" opacity="0.9" />
  </svg>
);

const ThinkingIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="btn-icon">
    <circle cx="12" cy="12" r="3" fill="currentColor" />
    <circle cx="5" cy="12" r="2" fill="currentColor" opacity="0.5" />
    <circle cx="19" cy="12" r="2" fill="currentColor" opacity="0.5" />
  </svg>
);

const SpeakIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="btn-icon">
    <path
      d="M11 5L6 9H2v6h4l5 4V5z"
      fill="currentColor" opacity="0.9"
    />
    <path
      d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    />
  </svg>
);

const STATE_LABELS = {
  ready:      '🎙\u00A0 Talk to AI',
  listening:  '● Listening...',
  processing: 'AI Thinking...',
  speaking:   '🔊\u00A0 Speaking...',
  error:      '🎙\u00A0 Retry',
};

export default function VoiceButton({
  aiState,
  onMicPress,
  onStopSpeaking,
  disabled,
  speechNotSupported,
}) {
  const isListening  = aiState === 'listening';
  const isProcessing = aiState === 'processing';
  const isSpeaking   = aiState === 'speaking';
  const isReady      = aiState === 'ready' || aiState === 'error';
  const isInit       = aiState === 'initializing';

  const btnDisabled = disabled || isProcessing || isInit || speechNotSupported;

  const handleClick = () => {
    if (isSpeaking) {
      onStopSpeaking?.();
    } else if (!btnDisabled) {
      onMicPress?.();
    }
  };

  const getIcon = () => {
    if (isSpeaking)   return <StopIcon />;
    if (isProcessing) return <ThinkingIcon />;
    if (isListening)  return <MicIcon />;
    return <MicIcon />;
  };

  return (
    <div className="voice-button-container">
      <button
        id="voice-btn"
        className={`voice-btn voice-btn--${aiState}`}
        onClick={handleClick}
        disabled={btnDisabled && !isSpeaking}
        aria-label={isSpeaking ? 'Stop speaking' : 'Press to speak to the AI receptionist'}
        aria-pressed={isListening}
        aria-busy={isProcessing}
      >
        <span className="voice-btn-ring voice-btn-ring-outer" aria-hidden="true" />
        <span className="voice-btn-ring voice-btn-ring-inner" aria-hidden="true" />
        <span className="voice-btn-core" aria-hidden="true">
          {getIcon()}
        </span>
      </button>

      <p className="voice-btn-label" aria-hidden="true">
        {isSpeaking
          ? 'Click to stop'
          : isListening
          ? STATE_LABELS.listening
          : isProcessing
          ? STATE_LABELS.processing
          : isInit
          ? 'Initializing...'
          : speechNotSupported
          ? 'Voice unavailable'
          : STATE_LABELS.ready}
      </p>
    </div>
  );
}
