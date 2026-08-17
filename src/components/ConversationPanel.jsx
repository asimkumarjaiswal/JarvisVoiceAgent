/**
 * ConversationPanel.jsx
 *
 * Compact scrollable conversation history.
 * Auto-scrolls to the newest message.
 * The neural core remains the primary visual focus — this is secondary.
 */

import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble.jsx';

export default function ConversationPanel({ messages, isProcessing }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  if (messages.length === 0 && !isProcessing) {
    return (
      <section className="conversation-panel conversation-panel--empty" aria-label="Conversation history">
        <p className="conversation-empty-hint">
          Press the microphone and speak to begin
        </p>
      </section>
    );
  }

  return (
    <section
      className="conversation-panel"
      aria-label="Conversation history"
      aria-live="polite"
    >
      <div className="conversation-scroll" role="list">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            role={msg.role}
            text={msg.text}
            timestamp={msg.timestamp}
          />
        ))}

        {isProcessing && (
          <div className="ai-thinking-indicator" role="status" aria-label="AI is thinking">
            <span className="thinking-dot" />
            <span className="thinking-dot" />
            <span className="thinking-dot" />
          </div>
        )}

        <div ref={bottomRef} aria-hidden="true" />
      </div>
    </section>
  );
}
