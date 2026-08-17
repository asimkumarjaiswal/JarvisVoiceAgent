/**
 * useSpeechRecognition.js
 *
 * Custom hook wrapping the Web Speech API for speech-to-text.
 * Only fires final transcripts — NEVER sends partial results to the backend.
 * Uses refs to guarantee onFinalTranscript is invoked EXACTLY ONCE per microphone session.
 *
 * Language is configurable here in one place.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

const RECOGNITION_LANGUAGE = 'en-IN';

const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition || null
    : null;

/**
 * @typedef {Object} SpeechRecognitionHook
 * @property {() => void}   startListening
 * @property {() => void}   stopListening
 * @property {boolean}      isListening
 * @property {string}       transcript     - Live interim text
 * @property {string}       finalTranscript - Committed final result
 * @property {boolean}      isSupported
 * @property {string|null}  error
 */

/**
 * @param {{ onFinalTranscript?: (text: string) => void }} options
 * @returns {SpeechRecognitionHook}
 */
export function useSpeechRecognition({ onFinalTranscript } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  const hasFiredRef = useRef(false);
  const accumulatedTextRef = useRef('');

  // Keep callback ref fresh without re-creating recognition
  useEffect(() => {
    onFinalTranscriptRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  const isSupported = SpeechRecognitionAPI !== null;

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    // Clean up previous instance
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    setError(null);
    setTranscript('');
    setFinalTranscript('');
    hasFiredRef.current = false;
    accumulatedTextRef.current = '';

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = RECOGNITION_LANGUAGE;
    recognition.continuous = false;       // Single utterance mode
    recognition.interimResults = true;    // Show live text while speaking
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.info('[SpeechRecognition] Started listening');
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      const currentLive = finalText || interimText;
      if (currentLive) {
        accumulatedTextRef.current = currentLive;
        setTranscript(currentLive);
      }

      if (finalText) {
        setFinalTranscript(finalText);
      }
    };

    recognition.onend = () => {
      console.info('[SpeechRecognition] Recognition ended');
      setIsListening(false);
      recognitionRef.current = null;

      const utterance = accumulatedTextRef.current.trim();
      if (utterance && !hasFiredRef.current) {
        hasFiredRef.current = true;
        console.info('[SpeechRecognition] Firing final transcript once:', utterance);
        onFinalTranscriptRef.current?.(utterance);
      }
    };

    recognition.onerror = (event) => {
      console.error('[SpeechRecognition] Error:', event.error);

      const friendlyErrors = {
        'not-allowed': 'Microphone permission was denied. Please allow microphone access.',
        'no-speech': 'No speech was detected. Please try again.',
        'audio-capture': 'No microphone was found. Please check your microphone.',
        'network': 'A network error occurred during speech recognition.',
        'aborted': null, // Intentional abort, not an error to surface
      };

      const msg = friendlyErrors[event.error];
      if (msg !== undefined && msg !== null) {
        setError(msg);
      } else if (msg !== null) {
        setError(`Speech recognition error: ${event.error}`);
      }

      setIsListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      console.error('[SpeechRecognition] Could not start:', err);
      setError('Could not start microphone. Please try again.');
      setIsListening(false);
    }
  }, [isSupported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  return {
    startListening,
    stopListening,
    isListening,
    transcript,
    finalTranscript,
    isSupported,
    error,
  };
}
