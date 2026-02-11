'use client';

/**
 * KnowledgeSheetContent — Lab evidence detail view for BottomSheet
 *
 * Shows a single knowledge item inline without navigating away.
 * Looks up by source code (e.g. L-2026-FL-001) via search, or by IndexedDB ID.
 */

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { useLabsKnowledgeItem, useSearchLabsKnowledge } from '@/lib/hooks/useLabsData';

interface KnowledgeSheetContentProps {
  knowledgeId: string;
}

function getConfidenceColor(score: number): string {
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#F59E0B';
  return '#EF4444';
}

function getStatusLabel(status: string): { label: string; color: string } {
  switch (status) {
    case 'published': return { label: 'Active', color: '#10B981' };
    case 'under_review': return { label: 'Under Review', color: '#3B82F6' };
    case 'draft': return { label: 'Draft', color: '#9CA3AF' };
    case 'challenged': return { label: 'Challenged', color: '#F59E0B' };
    case 'archived': return { label: 'Archived', color: '#9CA3AF' };
    default: return { label: status, color: '#9CA3AF' };
  }
}

export function KnowledgeSheetContent({ knowledgeId }: KnowledgeSheetContentProps) {
  // Try direct lookup by ID first
  const { data: directItem, isLoading: directLoading } = useLabsKnowledgeItem(knowledgeId);

  // If ID looks like a source code (L-2026-xxx), search by tag
  const isSourceCode = knowledgeId.startsWith('L-');
  const { data: searchResults = [], isLoading: searchLoading } = useSearchLabsKnowledge(
    isSourceCode ? knowledgeId : ''
  );

  const item = directItem ?? searchResults[0] ?? null;
  const isLoading = directLoading || (isSourceCode && searchLoading);

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div
          className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3"
          style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }}
        />
        <p className="text-xs" style={{ color: '#9CA3AF' }}>Loading...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm" style={{ color: '#9CA3AF' }}>Knowledge item not found</p>
        <p className="text-xs mt-1" style={{ color: '#D1D5DB' }}>{knowledgeId}</p>
      </div>
    );
  }

  const confidenceColor = getConfidenceColor(item.confidenceScore);
  const status = getStatusLabel(item.status);
  const sourceTag = item.tags?.find(t => t.startsWith('L-'));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        {sourceTag && (
          <span
            className="text-[9px] font-semibold px-2 py-0.5 rounded-full inline-block mb-1.5"
            style={{ background: '#7C3AED', color: '#FFFFFF' }}
          >
            {sourceTag}
          </span>
        )}
        <h3 className="text-base font-semibold" style={{ color: '#111827' }}>
          {item.title}
        </h3>
        {item.category && (
          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{item.category}</p>
        )}
      </div>

      {/* Confidence bar */}
      <div
        className="rounded-lg p-3"
        style={{ background: '#F9FAFB', border: '1px solid #F3F4F6' }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium" style={{ color: '#6B7280' }}>Confidence</span>
          <span className="text-sm font-semibold" style={{ color: confidenceColor }}>
            {item.confidenceScore}%
          </span>
        </div>
        <div className="w-full h-2 rounded-full" style={{ background: '#E5E7EB' }}>
          <div
            className="h-2 rounded-full transition-all"
            style={{
              width: `${item.confidenceScore}%`,
              background: confidenceColor,
            }}
          />
        </div>
      </div>

      {/* Summary */}
      {item.summary && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: '#6B7280' }}>
            Summary
          </p>
          <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>
            {item.summary}
          </p>
        </div>
      )}

      {/* Stats row */}
      <div className="flex gap-4">
        <div
          className="flex-1 rounded-lg p-3 text-center"
          style={{ background: '#F9FAFB', border: '1px solid #F3F4F6' }}
        >
          <p className="text-lg font-semibold" style={{ color: '#111827' }}>
            {item.observationCount}
          </p>
          <p className="text-[10px]" style={{ color: '#9CA3AF' }}>Observations</p>
        </div>
        <div
          className="flex-1 rounded-lg p-3 text-center"
          style={{ background: '#F9FAFB', border: '1px solid #F3F4F6' }}
        >
          <p className="text-lg font-semibold" style={{ color: '#111827' }}>
            {item.experimentCount}
          </p>
          <p className="text-[10px]" style={{ color: '#9CA3AF' }}>Experiments</p>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ background: status.color }} />
        <span className="text-xs font-medium" style={{ color: status.color }}>
          {status.label}
        </span>
      </div>

      {/* Link to full page */}
      <Link
        href={`/labs/knowledge/${item.id}`}
        className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
        style={{ color: '#0F766E' }}
      >
        Open full knowledge page <ExternalLink size={12} />
      </Link>
    </div>
  );
}
