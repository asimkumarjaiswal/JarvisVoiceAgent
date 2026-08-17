/**
 * SessionInfo.jsx
 *
 * Expandable technical/session information panel.
 * Displays: Agent, Status, Conversation ID.
 * NEVER exposes API keys, tokens or secrets.
 */

import React, { useState } from 'react';

export default function SessionInfo({ conversationId, agentName, connectionStatus }) {
  const [expanded, setExpanded] = useState(false);

  const statusLabel =
    connectionStatus === 'online'
      ? 'Connected'
      : connectionStatus === 'offline'
      ? 'Disconnected'
      : 'Connecting…';

  return (
    <div className="session-info">
      <button
        className="session-info-toggle"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls="session-details"
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="session-icon">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span>Session Info</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={`session-chevron ${expanded ? 'session-chevron--open' : ''}`}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {expanded && (
        <dl id="session-details" className="session-details">
          <div className="session-row">
            <dt>Agent</dt>
            <dd>{agentName || '—'}</dd>
          </div>
          <div className="session-row">
            <dt>Status</dt>
            <dd className={`session-status session-status--${connectionStatus}`}>
              {statusLabel}
            </dd>
          </div>
          <div className="session-row">
            <dt>Conversation</dt>
            <dd className="session-id">
              {conversationId ? (
                <code title={conversationId}>
                  {conversationId.slice(0, 8)}…
                </code>
              ) : (
                '—'
              )}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}
