'use client';

/**
 * Knowledge Item Card
 * Displays a knowledge item with confidence score and status
 */

import React from 'react';
import type { KnowledgeItem } from '@hooomz/shared-contracts';
import { ConfidenceScoreBadge } from './ConfidenceScoreBadge';

interface KnowledgeItemCardProps {
  item: KnowledgeItem;
  onClick?: () => void;
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  published: 'bg-green-100 text-green-700',
  under_review: 'bg-amber-100 text-amber-700',
  deprecated: 'bg-red-100 text-red-600',
};

export function KnowledgeItemCard({ item, onClick, className = '' }: KnowledgeItemCardProps) {
  const statusLabel = item.status.replace(/_/g, ' ');

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 flex-1 mr-2">
          {item.title}
        </h3>
        <ConfidenceScoreBadge score={item.confidenceScore} size="sm" />
      </div>

      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.summary}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full capitalize ${STATUS_STYLES[item.status] || STATUS_STYLES.draft}`}>
            {statusLabel}
          </span>
          <span className="text-xs text-gray-400">{item.category}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          {item.observationCount > 0 && (
            <span>{item.observationCount} obs</span>
          )}
          {item.experimentCount > 0 && (
            <span>{item.experimentCount} exp</span>
          )}
        </div>
      </div>
    </div>
  );
}
