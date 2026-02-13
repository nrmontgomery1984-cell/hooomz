'use client';

/**
 * ObservationDetailContent — BottomSheet content for viewing a single observation
 */

import type { FieldObservation } from '@hooomz/shared-contracts';
import { StarRating } from './StarRating';

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

const CAPTURE_METHOD_LABELS: Record<string, string> = {
  automatic: 'Auto-captured',
  manual: 'Manual entry',
  callback: 'Callback',
};

export function ObservationDetailContent({ observation }: { observation: FieldObservation }) {
  const typeLabel = KNOWLEDGE_TYPE_LABELS[observation.knowledgeType] || observation.knowledgeType;
  const captureLabel = CAPTURE_METHOD_LABELS[observation.captureMethod] || observation.captureMethod;

  return (
    <div className="px-1 pb-4 space-y-4">
      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="px-2 py-0.5 rounded text-xs font-medium"
          style={{ background: '#F0FDFA', color: '#0F766E' }}
        >
          {typeLabel}
        </span>
        <span
          className="px-2 py-0.5 rounded text-xs font-medium"
          style={{ background: '#F3F4F6', color: '#6B7280' }}
        >
          {captureLabel}
        </span>
        {observation.trade && (
          <span
            className="px-2 py-0.5 rounded text-xs font-medium"
            style={{ background: '#F3F4F6', color: '#374151' }}
          >
            {observation.trade}
          </span>
        )}
      </div>

      {/* Notes */}
      {observation.notes && (
        <div>
          <p className="text-[11px] font-medium mb-1" style={{ color: '#9CA3AF' }}>Notes</p>
          <p className="text-sm" style={{ color: '#111827' }}>{observation.notes}</p>
        </div>
      )}

      {/* Ratings */}
      <div className="flex items-center gap-6">
        {observation.quality && (
          <div>
            <p className="text-[11px] font-medium mb-1" style={{ color: '#9CA3AF' }}>Quality</p>
            <StarRating value={observation.quality} onChange={() => {}} size={16} />
          </div>
        )}
        {observation.difficulty && (
          <div>
            <p className="text-[11px] font-medium mb-1" style={{ color: '#9CA3AF' }}>Difficulty</p>
            <p className="text-sm font-medium" style={{ color: '#374151' }}>{observation.difficulty}/5</p>
          </div>
        )}
      </div>

      {/* Context */}
      <div
        className="rounded-lg p-3"
        style={{ background: '#F9FAFB', border: '1px solid #F3F4F6' }}
      >
        <div className="grid grid-cols-2 gap-2 text-xs">
          {observation.locationId && (
            <div>
              <span style={{ color: '#9CA3AF' }}>Location: </span>
              <span style={{ color: '#374151' }}>{observation.locationId}</span>
            </div>
          )}
          {observation.durationMinutes && (
            <div>
              <span style={{ color: '#9CA3AF' }}>Duration: </span>
              <span style={{ color: '#374151' }}>{observation.durationMinutes}min</span>
            </div>
          )}
          <div>
            <span style={{ color: '#9CA3AF' }}>Captured: </span>
            <span style={{ color: '#374151' }}>
              {new Date(observation.metadata.createdAt).toLocaleString()}
            </span>
          </div>
          {observation.deviated && (
            <div className="col-span-2">
              <span style={{ color: '#F59E0B' }}>Deviated: </span>
              <span style={{ color: '#374151' }}>{observation.deviationReason || 'Yes'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
