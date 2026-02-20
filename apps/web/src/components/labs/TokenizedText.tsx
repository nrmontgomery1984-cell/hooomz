'use client';

/**
 * Tokenized Text — Renders text with {{LAB:xxx}} replaced by LabsTokenBadge
 * Pass a pre-built token map for performance (from useLabsTokenMap hook)
 */

import React from 'react';
import type { LabsToken } from '@hooomz/shared-contracts';
import { resolveLabsTokens } from '../../lib/utils/labsTokenResolver';
import { LabsTokenBadge } from './LabsTokenBadge';

interface TokenizedTextProps {
  text: string;
  tokenMap: Map<string, LabsToken>;
  onTokenClick?: (tokenId: string) => void;
  className?: string;
}

export function TokenizedText({ text, tokenMap, onTokenClick, className = '' }: TokenizedTextProps) {
  const segments = resolveLabsTokens(text, tokenMap);

  // If no tokens found, render plain text
  if (segments.length === 1 && segments[0].type === 'text') {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {segments.map((segment, i) => {
        if (segment.type === 'text') {
          return <span key={i}>{segment.content}</span>;
        }
        if (segment.type === 'token') {
          return (
            <LabsTokenBadge
              key={i}
              token={segment.token}
              size="sm"
              onClick={onTokenClick ? () => onTokenClick(segment.token.id) : undefined}
            />
          );
        }
        // missing_token
        return (
          <span
            key={i}
            className="inline-flex items-center px-1.5 py-0.5 text-xs font-mono rounded border border-red-200 bg-red-50 text-red-600"
            title={`Unknown token: ${segment.tokenId}`}
          >
            ?{segment.tokenId}
          </span>
        );
      })}
    </span>
  );
}
