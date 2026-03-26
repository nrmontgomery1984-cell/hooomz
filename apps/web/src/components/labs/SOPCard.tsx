'use client';

/**
 * SOP Card — displays an SOP in a card layout for list pages
 */

import React from 'react';
import type { Sop } from '@hooomz/shared-contracts';

interface SOPCardProps {
  sop: Sop;
  checklistItemCount?: number;
  onClick?: () => void;
}

const STATUS_BADGES: Record<string, React.CSSProperties> = {
  active: { background: '#dcfce7', color: '#166534' },
  draft: { background: 'var(--surface-2)', color: 'var(--charcoal)' },
  archived: { background: '#fee2e2', color: '#991b1b' },
  future_experiment: { background: '#f3e8ff', color: '#6b21a8' },
};

const MODE_BADGES: Record<string, React.CSSProperties> = {
  minimal: { background: 'var(--surface-2)', color: 'var(--mid)' },
  standard: { background: '#dbeafe', color: '#1d4ed8' },
  detailed: { background: '#fef3c7', color: '#b45309' },
};

export function SOPCard({ sop, checklistItemCount, onClick }: SOPCardProps) {
  const statusStyle = STATUS_BADGES[sop.status] || { background: 'var(--surface-2)', color: 'var(--charcoal)' };
  const modeStyle = MODE_BADGES[sop.defaultObservationMode] || { background: 'var(--surface-2)', color: 'var(--mid)' };

  return (
    <div
      className={`rounded-xl border p-4 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold" style={{ color: 'var(--muted)' }}>{sop.sopCode}</span>
          <span
            className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full"
            style={statusStyle}
          >
            {sop.status}
          </span>
        </div>
        <span className="text-xs" style={{ color: 'var(--muted)' }}>v{sop.version}</span>
      </div>

      <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--charcoal)' }}>{sop.title}</h3>

      {sop.description && (
        <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--muted)' }}>{sop.description}</p>
      )}

      <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--muted)' }}>
        <span className="inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--muted)' }} />
          {sop.tradeFamily}
        </span>

        <span
          className="inline-flex px-1.5 py-0.5 rounded text-xs"
          style={modeStyle}
        >
          {sop.defaultObservationMode}
        </span>

        {checklistItemCount !== undefined && (
          <span>{checklistItemCount} steps</span>
        )}

        <span style={{ color: 'var(--faint)' }}>{sop.certificationLevel}</span>
      </div>
    </div>
  );
}
