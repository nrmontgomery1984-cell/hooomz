'use client';

/**
 * Experiment Card
 * Displays an experiment summary with status and progress
 */

import React from 'react';
import type { Experiment } from '@hooomz/shared-contracts';

interface ExperimentCardProps {
  experiment: Experiment;
  onClick?: () => void;
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-[var(--surface)] text-[var(--mid)]',
  active: 'bg-blue-100 text-blue-700',
  paused: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  archived: 'bg-[var(--surface)] text-[var(--muted)]',
};

export function ExperimentCard({ experiment, onClick, className = '' }: ExperimentCardProps) {
  const totalSamples = Object.values(experiment.currentSampleCounts).reduce((a, b) => a + b, 0);
  const progress = experiment.requiredSampleSize > 0
    ? Math.round((totalSamples / experiment.requiredSampleSize) * 100)
    : 0;

  return (
    <div
      className={`bg-white rounded-xl border border-[var(--border)] p-4 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-semibold text-[var(--charcoal)] line-clamp-1 flex-1 mr-2">
          {experiment.title}
        </h3>
        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full capitalize ${STATUS_STYLES[experiment.status] || STATUS_STYLES.draft}`}>
          {experiment.status}
        </span>
      </div>

      {experiment.hypothesis && (
        <p className="text-sm text-[var(--mid)] mb-3 line-clamp-2 italic">
          {experiment.hypothesis}
        </p>
      )}

      {/* Progress bar */}
      {experiment.status === 'active' && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-[var(--muted)] mb-1">
            <span>Progress</span>
            <span>{totalSamples}/{experiment.requiredSampleSize} samples</span>
          </div>
          <div className="w-full h-2 bg-[var(--surface)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
        <span>{experiment.testVariables.length} variable{experiment.testVariables.length !== 1 ? 's' : ''}</span>
        <span>{experiment.checkpoints.length} checkpoint{experiment.checkpoints.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}
