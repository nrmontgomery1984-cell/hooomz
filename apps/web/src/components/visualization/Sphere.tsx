'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type SphereStatus = 'healthy' | 'progress' | 'attention' | 'blocked';
type SphereSize = 'sm' | 'md' | 'lg';

interface SphereProps {
  score: number;                    // 0-100 health score
  status?: SphereStatus;            // Override auto-calculated status
  size?: SphereSize;
  label?: string;                   // Optional label below sphere
  onClick?: () => void;
  className?: string;
  children?: ReactNode;             // Custom content instead of score
}

function getStatusFromScore(score: number): SphereStatus {
  if (score >= 70) return 'healthy';
  if (score >= 40) return 'progress';
  if (score >= 20) return 'attention';
  return 'blocked';
}

export function Sphere({
  score,
  status,
  size = 'md',
  label,
  onClick,
  className,
  children,
}: SphereProps) {
  const calculatedStatus = status || getStatusFromScore(score);

  const sizeClasses = {
    sm: 'sphere-sm',
    md: 'sphere-md',
    lg: 'sphere-lg',
  };

  const statusClasses = {
    healthy: 'sphere-healthy',
    progress: 'sphere-progress',
    attention: 'sphere-attention',
    blocked: 'sphere-blocked',
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={onClick}
        className={cn(
          'sphere',
          sizeClasses[size],
          statusClasses[calculatedStatus],
          'text-white font-light',
          onClick && 'cursor-pointer',
          !onClick && 'cursor-default',
          className
        )}
        disabled={!onClick}
        aria-label={`${label || 'Item'}: ${score} percent health, status ${calculatedStatus}`}
      >
        {children || score}
      </button>
      {label && (
        <span className="text-sm text-slate-600 font-medium">{label}</span>
      )}
    </div>
  );
}
