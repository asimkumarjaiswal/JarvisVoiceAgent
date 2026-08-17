/**
 * MessageBubble.jsx
 * Single conversation message — styled differently for 'user' vs 'ai'.
 */

import React from 'react';

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ role, text, timestamp }) {
  const isUser = role === 'user';

  return (
    <div className={`message-bubble message-bubble--${role}`} role="listitem">
      <div className="message-meta">
        <span className="message-role">
          {isUser ? '👤 You' : '🤖 AI Receptionist'}
        </span>
        {timestamp && (
          <span className="message-time" aria-label={`Sent at ${formatTime(timestamp)}`}>
            {formatTime(timestamp)}
          </span>
        )}
      </div>
      <p className="message-text">{text}</p>
    </div>
  );
}
