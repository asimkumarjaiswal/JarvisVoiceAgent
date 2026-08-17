/**
 * App.jsx — Voice Dental Receptionist AI Console
 *
 * Orchestrates the full conversation lifecycle:
 *   INITIALIZING → READY → LISTENING → PROCESSING → SPEAKING → READY
 *
 * This is a THIN CLIENT — all business and agent logic lives in the
 * ASP.NET Core backend. The app only:
 *   - Creates a conversation session
 *   - Sends voice/text messages
 *   - Displays and speaks responseText
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import AIHeader from './components/AIHeader.jsx';
import NeuralCore from './components/NeuralCore.jsx';
import VoiceButton from './components/VoiceButton.jsx';
import ConversationPanel from './components/ConversationPanel.jsx';
import SessionInfo from './components/SessionInfo.jsx';
import { useSpeechRecognition } from './hooks/useSpeechRecognition.js';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis.js';
import { createConversation, sendMessage } from './services/conversationService.js';

/* ─── AI state machine ────────────────────────────────────────────── */
// initializing | ready | listening | processing | speaking | error
const AI_STATE = {
  INITIALIZING: 'initializing',
  READY:        'ready',
  LISTENING:    'listening',
  PROCESSING:   'processing',
  SPEAKING:     'speaking',
  ERROR:        'error',
};

let messageIdCounter = 0;
function makeMessage(role, text) {
  return { id: ++messageIdCounter, role, text, timestamp: new Date() };
}

export default function App() {
  /* ── Core state ─────────────────────────────────────────────────── */
  const [aiState, setAiState]               = useState(AI_STATE.INITIALIZING);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages]             = useState([]);
  const [agentName, setAgentName]           = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [initError, setInitError]           = useState(null);
  const [apiError, setApiError]             = useState(null);
  const [isResetting, setIsResetting]       = useState(false);
  const [textInput, setTextInput]           = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');

  /* ── Ref to prevent stale closure & duplicate requests ───────── */
  const conversationIdRef = useRef(null);
  useEffect(() => { conversationIdRef.current = conversationId; }, [conversationId]);
  const isSendingRef = useRef(false);

  /* ── Speech synthesis ─────────────────────────────────────────── */
  const { speak, stopSpeaking, isSpeaking } = useSpeechSynthesis({
    onSpeechEnd: useCallback(() => {
      setAiState(AI_STATE.READY);
    }, []),
  });

  /* ── Speech recognition ───────────────────────────────────────── */
  const handleFinalTranscript = useCallback(async (text) => {
    if (!text || !text.trim()) return;
    if (isSendingRef.current) {
      console.warn('[App] Message send already in progress, skipping duplicate call.');
      return;
    }
    isSendingRef.current = true;

    setLiveTranscript('');
    setAiState(AI_STATE.PROCESSING);

    const currentConversationId = conversationIdRef.current;
    if (!currentConversationId) {
      console.error('[App] No conversation ID available — cannot send message.');
      setApiError('Session not initialised. Please retry.');
      setAiState(AI_STATE.ERROR);
      isSendingRef.current = false;
      return;
    }

    // Add user message to history
    setMessages((prev) => [...prev, makeMessage('user', text)]);
    setApiError(null);

    try {
      const data = await sendMessage(currentConversationId, text);
      const responseText = data.message || data.responseText || data.response || data.text || 'I received your message.';

      // Capture agent name if present in the response
      if (data.agent) setAgentName(data.agent);

      // Add AI message to history
      setMessages((prev) => [...prev, makeMessage('ai', responseText)]);

      // Speak the response
      setAiState(AI_STATE.SPEAKING);
      speak(responseText);
    } catch (err) {
      console.error('[App] sendMessage failed:', err);
      setApiError(
        "I'm having trouble connecting to the dental receptionist. Please try again."
      );
      setAiState(AI_STATE.READY);
    } finally {
      isSendingRef.current = false;
    }
  }, [speak]);

  const {
    startListening,
    stopListening,
    isListening,
    transcript: liveRecognitionText,
    isSupported: speechRecognitionSupported,
    error: recognitionError,
  } = useSpeechRecognition({ onFinalTranscript: handleFinalTranscript });

  // Mirror live transcript for NeuralCore display
  useEffect(() => {
    setLiveTranscript(liveRecognitionText);
  }, [liveRecognitionText]);

  // Sync listening state → AI state
  useEffect(() => {
    if (isListening && aiState !== AI_STATE.LISTENING) {
      setAiState(AI_STATE.LISTENING);
    }
  }, [isListening, aiState]);

  /* ── Initialise conversation on mount ────────────────────────── */
  const initConversation = useCallback(async () => {
    setAiState(AI_STATE.INITIALIZING);
    setConnectionStatus('connecting');
    setInitError(null);
    setMessages([]);
    setConversationId(null);
    setAgentName(null);
    setApiError(null);

    try {
      const data = await createConversation();
      setConversationId(data.conversationId);
      setConnectionStatus('online');
      setAiState(AI_STATE.READY);
      console.info('[App] Conversation ready:', data.conversationId);
    } catch (err) {
      console.error('[App] createConversation failed:', err);
      setInitError('Unable to connect to AI Receptionist');
      setConnectionStatus('offline');
      setAiState(AI_STATE.ERROR);
    }
  }, []);

  useEffect(() => {
    initConversation();
  }, [initConversation]);

  /* ── New Conversation / Reset ─────────────────────────────────── */
  const handleNewConversation = useCallback(async () => {
    if (isResetting) return;
    setIsResetting(true);
    stopSpeaking();
    stopListening();
    await initConversation();
    setIsResetting(false);
  }, [isResetting, stopSpeaking, stopListening, initConversation]);

  /* ── Microphone press handler ─────────────────────────────────── */
  const handleMicPress = useCallback(() => {
    if (aiState === AI_STATE.LISTENING) {
      stopListening();
      setAiState(AI_STATE.READY);
    } else if (aiState === AI_STATE.READY || aiState === AI_STATE.ERROR) {
      startListening();
    }
  }, [aiState, startListening, stopListening]);

  /* ── Stop speaking handler ────────────────────────────────────── */
  const handleStopSpeaking = useCallback(() => {
    stopSpeaking();
    setAiState(AI_STATE.READY);
  }, [stopSpeaking]);

  /* ── Text input fallback ──────────────────────────────────────── */
  const handleTextSend = useCallback(() => {
    const text = textInput.trim();
    if (!text || aiState === AI_STATE.PROCESSING || aiState === AI_STATE.INITIALIZING) return;
    setTextInput('');
    handleFinalTranscript(text);
  }, [textInput, aiState, handleFinalTranscript]);

  const handleTextKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSend();
    }
  };

  /* ── Derived: is interaction locked ─────────────────────────────*/
  const isLocked =
    aiState === AI_STATE.PROCESSING ||
    aiState === AI_STATE.INITIALIZING ||
    !conversationId;

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <div className="app" id="app-root">
      {/* ── Header ─────────────────────────────────────────────── */}
      <AIHeader
        connectionStatus={connectionStatus}
        onNewConversation={handleNewConversation}
        isResetting={isResetting}
      />

      {/* ── Main content ───────────────────────────────────────── */}
      <main className="app-main" role="main">
        {/* ── Neural core ──────────────────────────────────────── */}
        <NeuralCore
          state={aiState}
          transcript={liveTranscript}
        />

        {/* ── Init error banner ────────────────────────────────── */}
        {initError && (
          <div className="error-banner" role="alert">
            <p>{initError}</p>
            <button
              className="retry-btn"
              onClick={initConversation}
              aria-label="Retry connecting to AI Receptionist"
            >
              ↺ Retry Connection
            </button>
          </div>
        )}

        {/* ── API / speech error ───────────────────────────────── */}
        {(apiError || recognitionError) && !initError && (
          <div className="api-error-banner" role="alert">
            {apiError || recognitionError}
          </div>
        )}

        {/* ── Voice button ─────────────────────────────────────── */}
        <VoiceButton
          aiState={aiState}
          onMicPress={handleMicPress}
          onStopSpeaking={handleStopSpeaking}
          disabled={isLocked}
          speechNotSupported={!speechRecognitionSupported}
        />

        {/* ── Speech not supported hint ────────────────────────── */}
        {!speechRecognitionSupported && (
          <p className="speech-unavailable-hint" role="note">
            Voice input isn&apos;t supported in this browser. You can type your
            message below.
          </p>
        )}

        {/* ── Text input fallback ──────────────────────────────── */}
        <div className="text-input-area" role="group" aria-label="Text message input">
          <input
            id="text-input"
            type="text"
            className="text-input"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={handleTextKeyDown}
            placeholder="Type a message…"
            disabled={isLocked}
            aria-label="Type a message to the AI receptionist"
            maxLength={1000}
          />
          <button
            id="text-send-btn"
            className="text-send-btn"
            onClick={handleTextSend}
            disabled={isLocked || !textInput.trim()}
            aria-label="Send typed message"
          >
            Send
          </button>
        </div>

        {/* ── Conversation history ──────────────────────────────── */}
        <ConversationPanel
          messages={messages}
          isProcessing={aiState === AI_STATE.PROCESSING}
        />

        {/* ── Session info ─────────────────────────────────────── */}
        <SessionInfo
          conversationId={conversationId}
          agentName={agentName}
          connectionStatus={connectionStatus}
        />
      </main>
    </div>
  );
}
