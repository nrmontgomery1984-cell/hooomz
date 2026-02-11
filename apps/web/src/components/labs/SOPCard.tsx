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

const STATUS_BADGES: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  draft: 'bg-gray-100 text-gray-800',
  archived: 'bg-red-100 text-red-800',
  future_experiment: 'bg-purple-100 text-purple-800',
};

const MODE_BADGES: Record<string, string> = {
  minimal: 'bg-gray-100 text-gray-600',
  standard: 'bg-blue-100 text-blue-700',
  detailed: 'bg-amber-100 text-amber-700',
};

export function SOPCard({ sop, checklistItemCount, onClick }: SOPCardProps) {
  const statusColor = STATUS_BADGES[sop.status] || 'bg-gray-100 text-gray-800';
  const modeColor = MODE_BADGES[sop.defaultObservationMode] || 'bg-gray-100 text-gray-600';

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold text-gray-500">{sop.sopCode}</span>
          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColor}`}>
            {sop.status}
          </span>
        </div>
        <span className="text-xs text-gray-400">v{sop.version}</span>
      </div>

      <h3 className="text-sm font-semibold text-gray-900 mb-1">{sop.title}</h3>

      {sop.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{sop.description}</p>
      )}

      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
          {sop.tradeFamily}
        </span>

        <span className={`inline-flex px-1.5 py-0.5 rounded text-xs ${modeColor}`}>
          {sop.defaultObservationMode}
        </span>

        {checklistItemCount !== undefined && (
          <span>{checklistItemCount} steps</span>
        )}

        <span className="text-gray-300">{sop.certificationLevel}</span>
      </div>
    </div>
  );
}
