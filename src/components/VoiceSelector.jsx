/**
 * VoiceSelector.jsx
 *
 * Component allowing users to select the speech synthesis voice.
 * Provides quick selection pills for top voices (Samantha, Alex)
 * as well as a full dropdown list of installed system/browser voices.
 */

import React from 'react';

export default function VoiceSelector({
  availableVoiceNames = [],
  selectedVoiceName = 'Samantha',
  onSelectVoice,
  activeVoice = null,
}) {
  const currentDisplayName = activeVoice ? activeVoice.name : selectedVoiceName || 'Default';

  // Check if Samantha and Alex are available in system voices
  const hasSamantha = availableVoiceNames.some((n) => n.toLowerCase().includes('samantha'));
  const hasAlex = availableVoiceNames.some((n) => n.toLowerCase().includes('alex'));

  return (
    <div className="voice-selector" role="region" aria-label="Speech Voice Selection">
      <div className="voice-selector-header">
        <span className="voice-selector-label">
          <svg viewBox="0 0 24 24" fill="none" className="voice-icon" aria-hidden="true">
            <path
              d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Voice:
        </span>

        {/* Quick selection pills for Samantha and Alex */}
        <div className="voice-pills">
          <button
            type="button"
            className={`voice-pill ${
              selectedVoiceName.toLowerCase() === 'samantha' ? 'voice-pill--active' : ''
            }`}
            onClick={() => onSelectVoice('Samantha')}
            title="Set voice to Samantha"
          >
            Samantha {hasSamantha ? '✓' : ''}
          </button>
          <button
            type="button"
            className={`voice-pill ${
              selectedVoiceName.toLowerCase() === 'alex' ? 'voice-pill--active' : ''
            }`}
            onClick={() => onSelectVoice('Alex')}
            title="Set voice to Alex"
          >
            Alex {hasAlex ? '✓' : ''}
          </button>
        </div>
      </div>

      {/* Full voice selection dropdown */}
      <div className="voice-dropdown-wrapper">
        <select
          id="voice-select"
          className="voice-select"
          value={selectedVoiceName}
          onChange={(e) => onSelectVoice(e.target.value)}
          aria-label="Select AI speech voice"
        >
          {availableVoiceNames.length === 0 ? (
            <option value={selectedVoiceName}>
              {selectedVoiceName} (Loading voices…)
            </option>
          ) : (
            availableVoiceNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))
          )}
        </select>
        <span className="voice-active-tag" title={currentDisplayName}>
          Active: {currentDisplayName.length > 20 ? `${currentDisplayName.slice(0, 20)}…` : currentDisplayName}
        </span>
      </div>
    </div>
  );
}
