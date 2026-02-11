'use client';

/**
 * Observation Confirm Card (Build 2)
 *
 * Confirm-or-Deviate UI for a single observation.
 * Mode-dependent: minimal (confirm/deviate only), standard (+notes/photo), detailed (+required all).
 * Mobile-first: 48px primary button, one-thumb operation.
 */

import React, { useState } from 'react';
import type { ObservationDraft, ConditionAssessment } from '@hooomz/shared-contracts';

interface ObservationConfirmCardProps {
  draft: ObservationDraft;
  onConfirm: (params: {
    deviated: boolean;
    deviationFields?: string[];
    deviationReason?: string;
    notes?: string;
    photoIds?: string[];
    conditionAssessment?: ConditionAssessment;
  }) => void;
  onSkip?: () => void;
  isPending?: boolean;
  stepTitle?: string;
}

const KNOWLEDGE_LABELS: Record<string, string> = {
  product: 'Product', material: 'Material', technique: 'Technique',
  action: 'Action', procedure: 'Procedure', timing: 'Timing',
  combination: 'Combination', tool_method: 'Tool/Method',
  environmental_rule: 'Environmental', specification: 'Specification',
};

const CONDITION_OPTIONS: { value: ConditionAssessment; label: string; color: string }[] = [
  { value: 'good', label: 'Good', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'fair', label: 'Fair', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'poor', label: 'Poor', color: 'bg-red-100 text-red-800 border-red-200' },
];

export function ObservationConfirmCard({
  draft,
  onConfirm,
  onSkip,
  isPending = false,
  stepTitle,
}: ObservationConfirmCardProps) {
  const [isDeviating, setIsDeviating] = useState(false);
  const [notes, setNotes] = useState('');
  const [deviationReason, setDeviationReason] = useState('');
  const [condition, setCondition] = useState<ConditionAssessment | null>(null);

  const typeLabel = KNOWLEDGE_LABELS[draft.knowledgeType] || draft.knowledgeType;

  const handleConfirm = () => {
    onConfirm({
      deviated: false,
      notes: notes || undefined,
      conditionAssessment: condition || undefined,
    });
  };

  const handleDeviate = () => {
    if (!isDeviating) {
      setIsDeviating(true);
      return;
    }
    onConfirm({
      deviated: true,
      deviationReason: deviationReason || undefined,
      notes: notes || undefined,
      conditionAssessment: condition || undefined,
    });
  };

  const canConfirm = !isPending && (
    !draft.requiresNotes || notes.trim().length > 0
  ) && (
    !draft.requiresCondition || condition !== null
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-teal-100 text-teal-800">
          {typeLabel}
        </span>
        {onSkip && (
          <button
            onClick={onSkip}
            disabled={isPending}
            className="text-xs text-gray-400 hover:text-gray-600"
            style={{ minHeight: '36px', minWidth: '36px' }}
          >
            Skip
          </button>
        )}
      </div>

      {stepTitle && (
        <p className="text-sm font-medium text-gray-900 mb-2">{stepTitle}</p>
      )}

      {/* Pre-filled defaults display */}
      {(draft.productId || draft.techniqueId || draft.toolMethodId) && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {draft.productId && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Product: {draft.productId}</span>
          )}
          {draft.techniqueId && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Technique: {draft.techniqueId}</span>
          )}
          {draft.toolMethodId && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Tool: {draft.toolMethodId}</span>
          )}
        </div>
      )}

      {/* Condition Assessment (detailed mode) */}
      {draft.requiresCondition && (
        <div className="mb-3">
          <label className="text-xs font-medium text-gray-700 mb-1.5 block">
            Condition *
          </label>
          <div className="flex gap-2">
            {CONDITION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCondition(opt.value)}
                className={`flex-1 px-2 py-2 text-xs font-medium rounded-lg border transition-colors ${
                  condition === opt.value ? opt.color : 'border-gray-200 text-gray-500'
                }`}
                style={{ minHeight: '44px' }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notes (standard + detailed modes) */}
      {(draft.requiresNotes || !isDeviating) && (
        <div className="mb-3">
          <label className="text-xs font-medium text-gray-700 mb-1 block">
            Notes {draft.requiresNotes ? '*' : '(optional)'}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes..."
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 resize-none"
          />
        </div>
      )}

      {/* Deviation form (shown when deviating) */}
      {isDeviating && (
        <div className="mb-3 p-3 rounded-lg border-2 border-amber-200 bg-amber-50/50">
          <label className="text-xs font-medium text-amber-800 mb-1 block">
            What changed from the SOP?
          </label>
          <textarea
            value={deviationReason}
            onChange={(e) => setDeviationReason(e.target.value)}
            placeholder="Describe deviation..."
            rows={2}
            className="w-full px-3 py-2 text-sm border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            autoFocus
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {!isDeviating ? (
          <>
            <button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="flex-1 py-3 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-50"
              style={{ background: '#0F766E', minHeight: '48px' }}
            >
              {isPending ? 'Saving...' : 'Confirm'}
            </button>
            <button
              onClick={handleDeviate}
              disabled={isPending}
              className="px-4 py-3 text-sm font-medium text-amber-700 border border-amber-300 rounded-xl hover:bg-amber-50 transition-colors"
              style={{ minHeight: '48px' }}
            >
              Deviate
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleDeviate}
              disabled={isPending}
              className="flex-1 py-3 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-50"
              style={{ background: '#D97706', minHeight: '48px' }}
            >
              {isPending ? 'Saving...' : 'Confirm Deviation'}
            </button>
            <button
              onClick={() => setIsDeviating(false)}
              disabled={isPending}
              className="px-4 py-3 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              style={{ minHeight: '48px' }}
            >
              Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
