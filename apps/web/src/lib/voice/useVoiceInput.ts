'use client';

/**
 * useVoiceInput Hook
 *
 * Provides voice input capabilities using the Web Speech API.
 * Handles recording, transcription, and parsing to activity events.
 *
 * Flow (from spec):
 * 1. User taps mic FAB
 * 2. Request permission (first time)
 * 3. Show recording overlay with live transcript
 * 4. User stops or auto-stop on silence
 * 5. Parse transcript to event type
 * 6. Show confirmation card
 * 7. User edits if needed, then confirms
 * 8. Create event with input_method: 'voice'
 *
 * Decision Filter Check:
 * - #6 Mobile/Field: Tap, speak, confirm - works one-handed
 * - #5 Mental Model: Natural language input
 * - #1 Activity Log: Creates events for the spine
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { parseVoiceInput, type ParsedVoiceEvent } from './voiceParser';

// Web Speech API type declarations
// These are provided by Chrome/Edge but not all browsers, and TypeScript
// doesn't include them by default
interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  readonly isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionInterface extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInterface;

/**
 * Voice input states
 */
export type VoiceInputState =
  | 'idle'
  | 'requesting_permission'
  | 'recording'
  | 'processing'
  | 'confirming'
  | 'error';

/**
 * Voice input error types
 */
export type VoiceErrorType =
  | 'permission_denied'
  | 'not_supported'
  | 'recognition_failed'
  | 'no_speech'
  | 'network_error'
  | 'unknown';

export interface VoiceInputError {
  type: VoiceErrorType;
  message: string;
}

export interface UseVoiceInputReturn {
  /** Current state of voice input */
  state: VoiceInputState;
  /** Live transcript while recording */
  transcript: string;
  /** Interim (partial) transcript */
  interimTranscript: string;
  /** Parsed event from transcript */
  parsedEvent: ParsedVoiceEvent | null;
  /** Error if any */
  error: VoiceInputError | null;
  /** Whether voice input is supported in this browser */
  isSupported: boolean;
  /** Start recording */
  startRecording: () => Promise<void>;
  /** Stop recording and process */
  stopRecording: () => void;
  /** Cancel recording without processing */
  cancelRecording: () => void;
  /** Reset to idle state */
  reset: () => void;
  /** Update the parsed event (for editing) */
  updateParsedEvent: (updates: Partial<ParsedVoiceEvent>) => void;
  /** Confirm the event and return it */
  confirmEvent: () => ParsedVoiceEvent | null;
}

/**
 * Check if Web Speech API is supported
 */
function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;

  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
}

/**
 * Get the SpeechRecognition constructor
 */
function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;

  return (
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    null
  );
}

/**
 * Hook for voice input with Web Speech API
 */
export function useVoiceInput(): UseVoiceInputReturn {
  const [state, setState] = useState<VoiceInputState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [parsedEvent, setParsedEvent] = useState<ParsedVoiceEvent | null>(null);
  const [error, setError] = useState<VoiceInputError | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInterface | null>(null);
  const isSupported = isSpeechRecognitionSupported();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  /**
   * Start voice recording
   */
  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError({
        type: 'not_supported',
        message: 'Voice input is not supported in this browser. Try Chrome or Edge.',
      });
      setState('error');
      return;
    }

    // Reset state
    setTranscript('');
    setInterimTranscript('');
    setParsedEvent(null);
    setError(null);
    setState('requesting_permission');

    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setError({
        type: 'not_supported',
        message: 'Speech recognition not available.',
      });
      setState('error');
      return;
    }

    try {
      // Create recognition instance
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      // Configure recognition
      recognition.continuous = true; // Keep listening until stopped
      recognition.interimResults = true; // Show partial results
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      // Handle results
      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }

        if (finalTranscript) {
          setTranscript((prev) => (prev + ' ' + finalTranscript).trim());
        }
        setInterimTranscript(interim);
      };

      // Handle start
      recognition.onstart = () => {
        setState('recording');
      };

      // Handle end
      recognition.onend = () => {
        // Only process if we were recording (not cancelled)
        if (state === 'recording') {
          processTranscript();
        }
      };

      // Handle errors
      recognition.onerror = (event) => {
        let errorType: VoiceErrorType = 'unknown';
        let message = 'An error occurred during voice recognition.';

        switch (event.error) {
          case 'not-allowed':
          case 'service-not-allowed':
            errorType = 'permission_denied';
            message = 'Microphone access was denied. Please allow microphone access and try again.';
            break;
          case 'no-speech':
            errorType = 'no_speech';
            message = 'No speech was detected. Please try again.';
            break;
          case 'network':
            errorType = 'network_error';
            message = 'Network error. Please check your connection and try again.';
            break;
          case 'aborted':
            // User cancelled, not an error
            return;
          default:
            errorType = 'recognition_failed';
            message = `Speech recognition failed: ${event.error}`;
        }

        setError({ type: errorType, message });
        setState('error');
      };

      // Start recognition
      recognition.start();
    } catch (err) {
      setError({
        type: 'unknown',
        message: 'Failed to start voice recognition. Please try again.',
      });
      setState('error');
    }
  }, [isSupported, state]);

  /**
   * Process the transcript and parse to event
   */
  const processTranscript = useCallback(() => {
    setState('processing');

    const finalTranscript = transcript.trim();

    if (!finalTranscript) {
      setError({
        type: 'no_speech',
        message: 'No speech was detected. Please try again.',
      });
      setState('error');
      return;
    }

    // Parse the transcript
    const parsed = parseVoiceInput(finalTranscript);
    setParsedEvent(parsed);
    setState('confirming');
  }, [transcript]);

  /**
   * Stop recording and process
   */
  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    // Process after a short delay to get final results
    setTimeout(() => {
      processTranscript();
    }, 100);
  }, [processTranscript]);

  /**
   * Cancel recording without processing
   */
  const cancelRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    setTranscript('');
    setInterimTranscript('');
    setParsedEvent(null);
    setError(null);
    setState('idle');
  }, []);

  /**
   * Reset to idle state
   */
  const reset = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    setTranscript('');
    setInterimTranscript('');
    setParsedEvent(null);
    setError(null);
    setState('idle');
  }, []);

  /**
   * Update the parsed event (for editing in confirmation card)
   */
  const updateParsedEvent = useCallback((updates: Partial<ParsedVoiceEvent>) => {
    setParsedEvent((prev) => {
      if (!prev) return null;
      return { ...prev, ...updates };
    });
  }, []);

  /**
   * Confirm the event and return it
   */
  const confirmEvent = useCallback((): ParsedVoiceEvent | null => {
    const event = parsedEvent;
    reset();
    return event;
  }, [parsedEvent, reset]);

  return {
    state,
    transcript,
    interimTranscript,
    parsedEvent,
    error,
    isSupported,
    startRecording,
    stopRecording,
    cancelRecording,
    reset,
    updateParsedEvent,
    confirmEvent,
  };
}

export default useVoiceInput;
