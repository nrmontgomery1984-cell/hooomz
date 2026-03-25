'use client';

/**
 * Observation Card
 * Displays a field observation in a card layout
 */

import React from 'react';
import type { FieldObservation } from '@hooomz/shared-contracts';

interface ObservationCardProps {
  observation: FieldObservation;
  onClick?: () => void;
  className?: string;
}

const KNOWLEDGE_TYPE_LABELS: Record<string, string> = {
  product: 'Product',
  material: 'Material',
  technique: 'Technique',
  action: 'Action',
  procedure: 'Procedure',
  timing: 'Timing',
  combination: 'Combination',
  tool_method: 'Tool/Method',
  environmental_rule: 'Environmental',
  specification: 'Specification',
};

const KNOWLEDGE_TYPE_COLORS: Record<string, string> = {
  product: 'bg-blue-100 text-blue-800',
  material: 'bg-purple-100 text-purple-800',
  technique: 'bg-green-100 text-green-800',
  action: 'bg-amber-100 text-amber-800',
  procedure: 'bg-[var(--accent-bg)] text-[var(--accent)]',
  timing: 'bg-orange-100 text-orange-800',
  combination: 'bg-indigo-100 text-indigo-800',
  tool_method: 'bg-[var(--surface)] text-[var(--charcoal)]',
  environmental_rule: 'bg-emerald-100 text-emerald-800',
  specification: 'bg-rose-100 text-rose-800',
};

export function ObservationCard({ observation, onClick, className = '' }: ObservationCardProps) {
  const typeLabel = KNOWLEDGE_TYPE_LABELS[observation.knowledgeType] || observation.knowledgeType;
  const typeColor = KNOWLEDGE_TYPE_COLORS[observation.knowledgeType] || 'bg-[var(--surface)] text-[var(--charcoal)]';
  const timestamp = new Date(observation.metadata.createdAt).toLocaleDateString();
  const captureLabel = observation.captureMethod === 'automatic' ? 'Auto' : observation.captureMethod === 'callback' ? 'Callback' : 'Manual';

  return (
    <div
      className={`bg-white rounded-xl border border-[var(--border)] p-4 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-start justify-between mb-2">
        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${typeColor}`}>
          {typeLabel}
        </span>
        <span className="text-xs text-[var(--muted)]">{timestamp}</span>
      </div>

      {observation.notes && (
        <p className="text-sm text-[var(--mid)] mb-3 line-clamp-2">{observation.notes}</p>
      )}

      <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
        <span className="inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)]" />
          {captureLabel}
        </span>

        {observation.difficulty && (
          <span>Difficulty: {observation.difficulty}/5</span>
        )}

        {observation.quality && (
          <span>Quality: {observation.quality}/5</span>
        )}

        {observation.durationMinutes && (
          <span>{observation.durationMinutes}min</span>
        )}

        {observation.photoIds && observation.photoIds.length > 0 && (
          <span>{observation.photoIds.length} photo{observation.photoIds.length !== 1 ? 's' : ''}</span>
        )}
      </div>
    </div>
  );
}
