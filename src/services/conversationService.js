/**
 * conversationService.js
 *
 * Thin service layer for the ASP.NET Core dental receptionist API.
 * Contains ZERO business logic — only HTTP communication.
 *
 * Endpoints:
 *   POST /api/conversations                           → createConversation()
 *   POST /api/conversations/{id}/messages             → sendMessage()
 */

import { apiFetch } from './api.js';

/**
 * Creates a new conversation session with the backend.
 *
 * @returns {Promise<{ conversationId: string }>}
 */
export async function createConversation() {
  const response = await apiFetch('/api/conversations', {
    method: 'POST',
  });

  const data = await response.json();

  if (!data.conversationId) {
    throw new Error('Backend did not return a conversationId');
  }

  console.info('[ConversationService] Conversation created:', data.conversationId);
  return data;
}

/**
 * Sends a user message to an existing conversation.
 *
 * @param {string} conversationId - Active conversation ID
 * @param {string} message        - Final user utterance (never a partial transcript)
 *
 * @returns {Promise<{
 *   conversationId: string,
 *   agent: string,
 *   responseText: string,
 *   [key: string]: any
 * }>}
 */
export async function sendMessage(conversationId, message) {
  if (!conversationId) throw new Error('conversationId is required');
  if (!message || !message.trim()) throw new Error('message must not be empty');

  const response = await apiFetch(
    `/api/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({ message: message.trim() }),
    }
  );

  const data = await response.json();
  const replyText = data.message || data.responseText || data.response || data.text;

  if (!replyText) {
    console.warn('[ConversationService] Unexpected response shape (no message/responseText field):', data);
  } else {
    console.info('[ConversationService] Agent responded:', replyText.slice(0, 80));
  }

  return {
    ...data,
    responseText: replyText,
  };
}
