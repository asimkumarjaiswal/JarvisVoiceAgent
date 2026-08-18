/**
 * useSpeechSynthesis.js
 *
 * Custom hook wrapping the Web Speech Synthesis API for text-to-speech.
 * Includes:
 *   1. Text normalization for speech: Formats phone/mobile numbers (6-12 digits) as
 *      space-separated digits so the speech engine reads them as individual digits
 *      ("8 5 3 6...") instead of large cardinal numbers ("85 crores 36 thousand...").
 *   2. Preferred Voice Selection & Extraction:
 *      Exported voice configurations allow setting target voice (e.g. "Samantha" or "Alex")
 *      both programmatically and via state, with dynamic browser voice extraction.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

const SYNTHESIS_LANGUAGE = 'en-IN';
const STORAGE_KEY = 'jarvis_voice_preference';

/**
 * Extracted default list of preferred voices (ordered by priority).
 * Can be imported and configured across the codebase.
 */
export const PREFERRED_VOICE_NAMES = [
  'Samantha',
  'Alex',
  'Google US English',
  'Microsoft Zira',
  'Microsoft Jenny',
  'Karen',
  'Victoria',
  'Daniel',
  'Fred',
];

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
 * Selects the best available voice based on target voice preference,
 * fallback preference list (Samantha, Alex...), or general natural quality scoring.
 *
 * @param {SpeechSynthesisVoice[]} voices
 * @param {string} [targetVoiceName]
 * @returns {SpeechSynthesisVoice|null}
 */
export function selectBestVoice(voices, targetVoiceName = null) {
  if (!voices || voices.length === 0) return null;

  // 1. Check for explicit target voice selection (e.g. "Samantha" or "Alex")
  if (targetVoiceName) {
    const targetLower = targetVoiceName.toLowerCase();
    const exactMatch = voices.find(
      (v) => v.name.toLowerCase() === targetLower
    );
    if (exactMatch) return exactMatch;

    const partialMatch = voices.find((v) =>
      v.name.toLowerCase().includes(targetLower)
    );
    if (partialMatch) return partialMatch;
  }

  // 2. Try default priority list (Samantha -> Alex -> Google US English ...)
  for (const prefName of PREFERRED_VOICE_NAMES) {
    const prefLower = prefName.toLowerCase();
    const match = voices.find((v) => v.name.toLowerCase().includes(prefLower));
    if (match) return match;
  }

  // 3. General natural/human quality scoring fallback
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
 * @property {(text: string) => void}           speak
 * @property {() => void}                       stopSpeaking
 * @property {boolean}                          isSpeaking
 * @property {boolean}                          isSupported
 * @property {SpeechSynthesisVoice[]}           voices
 * @property {string[]}                         availableVoiceNames
 * @property {string}                           selectedVoiceName
 * @property {(voiceName: string) => void}      setSelectedVoiceName
 * @property {SpeechSynthesisVoice|null}        activeVoice
 */

/**
 * @param {{ onSpeechEnd?: () => void, defaultVoiceName?: string }} options
 * @returns {SpeechSynthesisHook}
 */
export function useSpeechSynthesis({ onSpeechEnd, defaultVoiceName = 'Samantha' } = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceName, setSelectedVoiceNameState] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return saved;
    }
    return defaultVoiceName;
  });

  const utteranceRef = useRef(null);
  const onSpeechEndRef = useRef(onSpeechEnd);

  useEffect(() => {
    onSpeechEndRef.current = onSpeechEnd;
  }, [onSpeechEnd]);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Setter for selected voice that also persists to localStorage
  const setSelectedVoiceName = useCallback((name) => {
    setSelectedVoiceNameState(name);
    if (typeof window !== 'undefined' && window.localStorage) {
      if (name) {
        localStorage.setItem(STORAGE_KEY, name);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

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

  // Determine currently active voice object
  const activeVoice = selectBestVoice(voices, selectedVoiceName);
  const availableVoiceNames = voices.map((v) => v.name);

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

      // Select target voice (e.g. Samantha, Alex, or user-selected voice)
      const currentVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
      const chosenVoice = selectBestVoice(currentVoices, selectedVoiceName);

      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }

      utterance.onstart = () => {
        console.info('[SpeechSynthesis] Speaking with voice:', chosenVoice?.name || 'Default');
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
    [isSupported, voices, selectedVoiceName]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  return {
    speak,
    stopSpeaking,
    isSpeaking,
    isSupported,
    voices,
    availableVoiceNames,
    selectedVoiceName,
    setSelectedVoiceName,
    activeVoice,
  };
}

