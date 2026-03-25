'use client';

/**
 * StatusProgressBar — Horizontal step indicator for document lifecycle.
 * Matches estimate-detail-v4.html artifact.
 */

interface StatusStep {
  key: string;
  label: string;
}

interface StatusProgressBarProps {
  steps: StatusStep[];
  currentStepKey: string;
}

export function StatusProgressBar({ steps, currentStepKey }: StatusProgressBarProps) {
  const currentIdx = steps.findIndex((s) => s.key === currentStepKey);

  return (
    <div
      className="flex items-center gap-0 px-6 py-2.5"
      style={{ background: '#1a1a1a', borderTop: '1px solid #222' }}
    >
      {steps.map((step, i) => {
        const isComplete = i < currentIdx;
        const isActive = i === currentIdx;

        return (
          <div key={step.key} className="flex items-center">
            {i > 0 && (
              <div
                className="w-8 h-px mx-1.5 flex-shrink-0"
                style={{ background: isComplete ? 'var(--green)' : '#333' }}
              />
            )}
            <div className="flex items-center gap-2">
              <div
                className="w-[7px] h-[7px] rounded-full flex-shrink-0"
                style={{
                  background: isComplete
                    ? 'var(--green)'
                    : isActive
                      ? '#fff'
                      : '#333',
                  boxShadow: isActive ? '0 0 0 2px rgba(255,255,255,0.25)' : 'none',
                }}
              />
              <span
                className="text-[10px] font-medium uppercase tracking-[0.08em]"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: isComplete
                    ? 'var(--green)'
                    : isActive
                      ? '#fff'
                      : '#555',
                }}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
