'use client';

/**
 * Submission Card
 * Displays a field submission with status and category
 */

import React from 'react';
import type { FieldSubmission } from '@hooomz/shared-contracts';

interface SubmissionCardProps {
  submission: FieldSubmission;
  onClick?: () => void;
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  submitted: 'bg-blue-100 text-blue-700',
  reviewed: 'bg-[var(--accent-bg)] text-[var(--accent)]',
  logged_as_observation: 'bg-green-100 text-green-700',
  promoted_to_experiment: 'bg-purple-100 text-purple-700',
  triggered_review: 'bg-amber-100 text-amber-700',
  archived: 'bg-[var(--surface)] text-[var(--mid)]',
};

const CATEGORY_LABELS: Record<string, string> = {
  product_issue: 'Product Issue',
  technique_improvement: 'Technique',
  procedure_suggestion: 'Procedure',
  tool_finding: 'Tool Finding',
  timing_discrepancy: 'Timing',
  combination_discovery: 'Combination',
  environmental_observation: 'Environmental',
  safety_concern: 'Safety',
  new_idea: 'New Idea',
  other: 'Other',
};

export function SubmissionCard({ submission, onClick, className = '' }: SubmissionCardProps) {
  const statusLabel = submission.status.replace(/_/g, ' ');
  const categoryLabel = CATEGORY_LABELS[submission.category] || submission.category;
  const timestamp = new Date(submission.metadata.createdAt).toLocaleDateString();
  const isUrgent = submission.urgency === 'needs_attention';

  return (
    <div
      className={`bg-white rounded-xl border ${isUrgent ? 'border-amber-300' : 'border-[var(--border)]'} p-4 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-[var(--muted)]">{categoryLabel}</span>
        <div className="flex items-center gap-2">
          {isUrgent && (
            <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
              Urgent
            </span>
          )}
          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full capitalize ${STATUS_STYLES[submission.status] || STATUS_STYLES.submitted}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      <p className="text-sm text-[var(--mid)] mb-3 line-clamp-2">{submission.description}</p>

      <div className="flex items-center justify-between text-xs text-[var(--muted)]">
        <span>{timestamp}</span>
        {submission.photoIds && submission.photoIds.length > 0 && (
          <span>{submission.photoIds.length} photo{submission.photoIds.length !== 1 ? 's' : ''}</span>
        )}
      </div>
    </div>
  );
}
