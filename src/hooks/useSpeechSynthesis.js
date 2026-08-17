/**
 * useSpeechSynthesis.js
 *
 * Custom hook wrapping the Web Speech Synthesis API for text-to-speech.
 * Includes:
 *   1. Text normalization for speech: Formats phone/mobile numbers (6-12 digits) as
 *      space-separated digits so the speech engine reads them as individual digits
 *      ("8 5 3 6...") instead of large cardinal numbers ("85 crores 36 thousand...").
 *   2. Voice Quality Optimization: Dynamically loads browser voices via `onvoiceschanged`
 *      and prioritizes high-quality Neural, Natural, Google, Microsoft, and Apple voices over
 *      robotic legacy synthesizers.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

const SYNTHESIS_LANGUAGE = 'en-IN';

/**
 * Prepares raw text specifically for speech output.
 * Does NOT modify the visual text displayed in the UI bubbles.
 *
 * @param {string} text
 * @returns {string}
 */
export function prepareSpeechText(text) {
  if (!text) return '';
  let speechText = text;

  // 1. Remove markdown bullet symbols that might be read aloud (e.g. *, #, -, `)
  speechText = speechText.replace(/^[\s*-]+/gm, '');

  // 2. Format 6 to 12 digit numbers (phone/mobile numbers) to space-separated single digits
  // Example: "8536729104" → "8 5 3 6 7 2 9 1 0 4"
  // This prevents speech engines from reading numbers as "85 crores 36 lakhs..."
  speechText = speechText.replace(/\b\d{6,12}\b/g, (match) => {
    return match.split('').join(' ');
  });

  return speechText;
}

/**
 * Selects the best available natural/human-like voice from the system voice list.
 *
 * @param {SpeechSynthesisVoice[]} voices
 * @returns {SpeechSynthesisVoice|null}
 */
function selectBestVoice(voices) {
  if (!voices || voices.length === 0) return null;

  const naturalKeywords = ['natural', 'neural', 'online', 'enhanced', 'premium'];
  const providerKeywords = ['google', 'microsoft', 'apple'];

  const scoreVoice = (v) => {
    let score = 0;
    const nameLower = v.name.toLowerCase();
    const langLower = v.lang.toLowerCase();

    // Prefer English
    if (langLower.startsWith('en')) score += 10;
    if (langLower === 'en-in' || langLower === 'en_in') score += 20;
    if (langLower === 'en-us' || langLower === 'en-gb') score += 10;

    // Prioritize Natural / Neural / Enhanced voices
    if (naturalKeywords.some((kw) => nameLower.includes(kw))) score += 40;
    if (providerKeywords.some((kw) => nameLower.includes(kw))) score += 25;

    // Penalize legacy robotic or eSpeak voices
    if (nameLower.includes('espeak') || nameLower.includes('compact')) score -= 50;

    return score;
  };

  const sorted = [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a));
  console.info('[SpeechSynthesis] Selected voice:', sorted[0]?.name, `(${sorted[0]?.lang})`);
  return sorted[0] || null;
}

/**
 * @typedef {Object} SpeechSynthesisHook
 * @property {(text: string) => void} speak
 * @property {() => void}             stopSpeaking
 * @property {boolean}                isSpeaking
 * @property {boolean}                isSupported
 * @property {SpeechSynthesisVoice[]} voices
 */

/**
 * @param {{ onSpeechEnd?: () => void }} options
 * @returns {SpeechSynthesisHook}
 */
export function useSpeechSynthesis({ onSpeechEnd } = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const utteranceRef = useRef(null);
  const onSpeechEndRef = useRef(onSpeechEnd);

  useEffect(() => {
    onSpeechEndRef.current = onSpeechEnd;
  }, [onSpeechEnd]);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Dynamically load available voices (handles asynchronous voice loading in Chrome/Edge)
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };

    loadVoices();

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [isSupported]);

  const stopSpeaking = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [isSupported]);

  const speak = useCallback(
    (rawText) => {
      if (!isSupported) {
        console.warn('[SpeechSynthesis] Not supported in this browser.');
        return;
      }

      if (!rawText || !rawText.trim()) {
        console.warn('[SpeechSynthesis] speak() called with empty text.');
        return;
      }

      // Pre-process text to convert phone numbers (e.g. 8536729104 → 8 5 3 6 7 2 9 1 0 4)
      const speechText = prepareSpeechText(rawText);

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.lang = SYNTHESIS_LANGUAGE;
      utterance.rate = 0.95; // Slightly calmer, more articulate human pace
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Select the best available natural/human voice
      const currentVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
      const bestVoice = selectBestVoice(currentVoices);

      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      utterance.onstart = () => {
        console.info('[SpeechSynthesis] Speaking...');
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        console.info('[SpeechSynthesis] Speech ended.');
        setIsSpeaking(false);
        utteranceRef.current = null;
        onSpeechEndRef.current?.();
      };

      utterance.onerror = (event) => {
        if (event.error !== 'interrupted' && event.error !== 'canceled') {
          console.error('[SpeechSynthesis] Error:', event.error);
        }
        setIsSpeaking(false);
        utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);

      // Workaround: Chrome pauses synthesis after ~15s — keep it alive
      const keepAlive = setInterval(() => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        } else {
          clearInterval(keepAlive);
        }
      }, 10000);
    },
    [isSupported, voices]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  return { speak, stopSpeaking, isSpeaking, isSupported, voices };
}
