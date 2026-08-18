/**
 * AIHeader.jsx
 * Top navigation bar: branding left, voice selector & connection status right.
 * Includes a tooth SVG icon, voice selector, and "New Conversation" / reset button.
 */

import React from 'react';
import StatusIndicator from './StatusIndicator.jsx';
import VoiceSelector from './VoiceSelector.jsx';

function ToothIcon() {
  return (
    <svg
      className="tooth-icon"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 2C9.5 2 7.5 3.5 6 5C4.5 6.5 3 8 3 10C3 12 4 13.5 4.5 15C5 16.5 5 18 5.5 20C6 21.5 7 22 8 22C9 22 9.5 21 10 19.5L11 16.5C11.3 15.5 12.7 15.5 13 16.5L14 19.5C14.5 21 15 22 16 22C17 22 18 21.5 18.5 20C19 18 19 16.5 19.5 15C20 13.5 21 12 21 10C21 8 19.5 6.5 18 5C16.5 3.5 14.5 2 12 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AIHeader({
  connectionStatus,
  onNewConversation,
  isResetting,
  availableVoiceNames,
  selectedVoiceName,
  onSelectVoice,
  activeVoice,
}) {
  return (
    <header className="ai-header" role="banner">
      <div className="header-brand">
        <ToothIcon />
        <div className="header-text">
          <h1 className="header-title">AI DENTAL RECEPTIONIST</h1>
          <p className="header-subtitle">Microsoft Foundry • Voice Assistant</p>
        </div>
      </div>

      <div className="header-right">
        {onSelectVoice && (
          <VoiceSelector
            availableVoiceNames={availableVoiceNames}
            selectedVoiceName={selectedVoiceName}
            onSelectVoice={onSelectVoice}
            activeVoice={activeVoice}
          />
        )}

        <button
          className="new-conversation-btn"
          onClick={onNewConversation}
          disabled={isResetting}
          aria-label="Start a new conversation"
          title="New Conversation"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span>New Session</span>
        </button>

        <StatusIndicator connectionStatus={connectionStatus} />
      </div>
    </header>
  );
}
