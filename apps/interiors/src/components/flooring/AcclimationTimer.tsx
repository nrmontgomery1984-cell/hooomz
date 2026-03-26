import { useState, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface AcclimationTimerProps {
  startTime: string;          // ISO timestamp when acclimation started
  requiredHours: number;      // Hours required for acclimation
  compact?: boolean;          // Smaller display mode
  onComplete?: () => void;    // Callback when acclimation completes
}

interface TimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  percentComplete: number;
  isComplete: boolean;
}

// ============================================================================
// HELPER
// ============================================================================

function calculateTimeRemaining(startTime: string, requiredHours: number): TimeRemaining {
  const start = new Date(startTime).getTime();
  const end = start + requiredHours * 60 * 60 * 1000;
  const now = Date.now();

  const remainingMs = Math.max(0, end - now);
  const elapsedMs = now - start;
  const totalMs = requiredHours * 60 * 60 * 1000;

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const percentComplete = Math.min(100, (elapsedMs / totalMs) * 100);

  return {
    hours,
    minutes,
    seconds,
    totalSeconds,
    percentComplete,
    isComplete: remainingMs <= 0,
  };
}

function formatDuration(hours: number, minutes: number, seconds: number): string {
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AcclimationTimer({
  startTime,
  requiredHours,
  compact = false,
  onComplete,
}: AcclimationTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() =>
    calculateTimeRemaining(startTime, requiredHours)
  );

  useEffect(() => {
    // Update every second
    const interval = setInterval(() => {
      const newTime = calculateTimeRemaining(startTime, requiredHours);
      setTimeRemaining(newTime);

      if (newTime.isComplete) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, requiredHours, onComplete]);

  const { hours, minutes, seconds, percentComplete, isComplete } = timeRemaining;

  // Compact mode for inline display
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {isComplete ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">Acclimation Complete</span>
          </div>
        ) : (
          <>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-1000"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
            <span className="text-sm text-gray-600 whitespace-nowrap">
              {formatDuration(hours, minutes, seconds)} left
            </span>
          </>
        )}
      </div>
    );
  }

  // Full display mode
  return (
    <div className={`p-4 rounded-lg ${isComplete ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
      {isComplete ? (
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h4 className="font-medium text-green-800">Acclimation Complete</h4>
          <p className="text-sm text-green-600 mt-1">Material is ready for installation</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-amber-800">Acclimating</span>
            </div>
            <span className="text-sm text-amber-600">{Math.round(percentComplete)}%</span>
          </div>

          {/* Progress bar */}
          <div className="h-3 bg-amber-200 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-amber-500 transition-all duration-1000"
              style={{ width: `${percentComplete}%` }}
            />
          </div>

          {/* Time display */}
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-amber-800">
              {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <p className="text-sm text-amber-600 mt-1">
              remaining of {requiredHours} hours required
            </p>
          </div>

          {/* Start time info */}
          <p className="text-xs text-amber-500 text-center mt-3">
            Started: {new Date(startTime).toLocaleString()}
          </p>
        </>
      )}
    </div>
  );
}

export default AcclimationTimer;
