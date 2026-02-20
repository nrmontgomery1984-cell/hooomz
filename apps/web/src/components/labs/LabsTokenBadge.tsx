'use client';

/**
 * Labs Token Badge — Inline pill showing token name + status dot
 * Used inline in text where {{LAB:token-id}} references appear
 */

import React from 'react';
import type { LabsToken } from '@hooomz/shared-contracts';
import { TOKEN_STATUS_COLORS } from '../../lib/constants/scriptPhases';

interface LabsTokenBadgeProps {
  token: LabsToken;
  size?: 'sm' | 'md';
  onClick?: () => void;
  className?: string;
}

export function LabsTokenBadge({ token, size = 'md', onClick, className = '' }: LabsTokenBadgeProps) {
  const statusColor = TOKEN_STATUS_COLORS[token.status] || '#888888';

  const sizeStyles = {
    sm: 'px-1.5 py-0.5 text-xs gap-1',
    md: 'px-2 py-0.5 text-sm gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border border-gray-200 bg-gray-50 text-gray-800 ${sizeStyles[size]} ${onClick ? 'cursor-pointer hover:bg-gray-100' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={`${token.displayName}: ${token.currentRecommendation} (${token.status})`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: statusColor }}
      />
      <span className="truncate max-w-[160px]">{token.currentRecommendation}</span>
    </span>
  );
}
