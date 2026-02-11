'use client';

/**
 * VoiceRecordingOverlay
 *
 * Full-screen overlay when recording.
 * Shows live transcript, stop button, cancel button.
 *
 * Touch targets: 48px+ (work gloves friendly)
 *
 * Decision Filter Check:
 * - #6 Mobile/Field: Large buttons, clear feedback
 * - #5 Mental Model: Familiar recording UI pattern
 */

import { useCallback, useEffect, useState } from 'react';

interface VoiceRecordingOverlayProps {
  /** Whether overlay is visible */
  isVisible: boolean;
  /** Live transcript */
  transcript: string;
  /** Interim (partial) transcript */
  interimTranscript: string;
  /** Callback to stop recording */
  onStop: () => void;
  /** Callback to cancel recording */
  onCancel: () => void;
}

export function VoiceRecordingOverlay({
  isVisible,
  transcript,
  interimTranscript,
  onStop,
  onCancel,
}: VoiceRecordingOverlayProps) {
  const [duration, setDuration] = useState(0);

  // Track recording duration
  useEffect(() => {
    if (!isVisible) {
      setDuration(0);
      return;
    }

    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  if (!isVisible) return null;

  // Combine transcript with interim
  const displayText = transcript + (interimTranscript ? ` ${interimTranscript}` : '');

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/95 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-slate-800/50">
        <button
          onClick={onCancel}
          className="min-w-[48px] min-h-[48px] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          aria-label="Cancel recording"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path
              fillRule="evenodd"
              d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Recording indicator */}
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-coral animate-pulse" />
          <span className="text-white font-medium">Recording</span>
          <span className="text-slate-400 font-mono">{formatDuration(duration)}</span>
        </div>

        <div className="w-12" /> {/* Spacer for balance */}
      </div>

      {/* Transcript Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Listening indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-1.5 h-8 bg-teal rounded-full animate-pulse"
                style={{
                  animationDelay: `${i * 100}ms`,
                  animationDuration: '600ms',
                }}
              />
            ))}
          </div>
          <p className="text-slate-400 text-sm mt-4 text-center">Listening...</p>
        </div>

        {/* Transcript display */}
        <div className="max-w-md w-full">
          {displayText ? (
            <p className="text-white text-xl leading-relaxed text-center">
              {transcript}
              {interimTranscript && (
                <span className="text-slate-400">{` ${interimTranscript}`}</span>
              )}
            </p>
          ) : (
            <p className="text-slate-500 text-lg text-center italic">
              Speak now...
            </p>
          )}
        </div>
      </div>

      {/* Stop Button */}
      <div className="px-6 pb-8 pt-4">
        <button
          onClick={onStop}
          className="
            w-full max-w-md mx-auto
            flex items-center justify-center gap-3
            min-h-[56px] px-6
            bg-coral text-white font-medium text-lg
            rounded-full
            hover:bg-coral/90 active:scale-95
            transition-all duration-200
          "
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path
              fillRule="evenodd"
              d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z"
              clipRule="evenodd"
            />
          </svg>
          Stop Recording
        </button>

        {/* Help text */}
        <p className="text-slate-500 text-sm text-center mt-4">
          Tap stop when done, or keep speaking
        </p>
      </div>
    </div>
  );
}

export default VoiceRecordingOverlay;
