/**
 * StatusIndicator.jsx
 * Small coloured dot + label used in the header.
 * connectionStatus: 'connecting' | 'online' | 'offline'
 */

import React from 'react';

const STATUS_CONFIG = {
  connecting: { label: 'CONNECTING', className: 'status-connecting' },
  online:     { label: 'ONLINE',     className: 'status-online' },
  offline:    { label: 'OFFLINE',    className: 'status-offline' },
};

export default function StatusIndicator({ connectionStatus = 'connecting' }) {
  const cfg = STATUS_CONFIG[connectionStatus] || STATUS_CONFIG.connecting;

  return (
    <div
      className={`status-indicator ${cfg.className}`}
      role="status"
      aria-live="polite"
      aria-label={`Connection status: ${cfg.label}`}
    >
      <span className="status-dot" aria-hidden="true" />
      <span className="status-label">{cfg.label}</span>
    </div>
  );
}
