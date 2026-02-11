'use client';

/**
 * VoiceInputFAB
 *
 * Floating action button (microphone icon) for voice input.
 * Position: bottom-right, above bottom nav
 * States: idle, recording, processing
 * Pulsing animation when recording
 *
 * Touch target: 56px (>44px minimum for work gloves)
 *
 * Decision Filter Check:
 * - #6 Mobile/Field: Large touch target, one-hand operation
 * - #5 Mental Model: Universal mic icon, intuitive
 */

import { useCallback } from 'react';
import type { VoiceInputState } from '@/lib/voice';

interface VoiceInputFABProps {
  /** Current voice input state */
  state: VoiceInputState;
  /** Whether voice is supported */
  isSupported: boolean;
  /** Callback when FAB is pressed */
  onPress: () => void;
  /** Optional class name */
  className?: string;
}

export function VoiceInputFAB({
  state,
  isSupported,
  onPress,
  className = '',
}: VoiceInputFABProps) {
  const handlePress = useCallback(() => {
    if (!isSupported) return;
    onPress();
  }, [isSupported, onPress]);

  // Determine visual state
  const isRecording = state === 'recording';
  const isProcessing = state === 'processing';
  const isDisabled = !isSupported || isProcessing;

  return (
    <button
      onClick={handlePress}
      disabled={isDisabled}
      aria-label={
        isRecording
          ? 'Recording... tap to stop'
          : isProcessing
            ? 'Processing...'
            : 'Start voice input'
      }
      className={`
        fixed bottom-24 right-4 z-40
        w-14 h-14 rounded-full
        flex items-center justify-center
        shadow-lg
        transition-all duration-200 ease-out
        ${
          isRecording
            ? 'bg-coral text-white scale-110 animate-pulse'
            : isProcessing
              ? 'bg-slate-400 text-white cursor-wait'
              : isDisabled
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-teal text-white hover:bg-teal/90 active:scale-95'
        }
        ${className}
      `}
    >
      {/* Mic Icon */}
      {!isRecording && !isProcessing && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-7 h-7"
        >
          <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
          <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
        </svg>
      )}

      {/* Recording Icon (animated) */}
      {isRecording && (
        <div className="relative">
          {/* Pulsing rings */}
          <div className="absolute inset-0 -m-2">
            <div className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
          </div>
          {/* Stop icon */}
          <div className="w-6 h-6 rounded bg-white" />
        </div>
      )}

      {/* Processing Spinner */}
      {isProcessing && (
        <svg
          className="w-7 h-7 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
    </button>
  );
}

export default VoiceInputFAB;
