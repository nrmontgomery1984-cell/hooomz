'use client';

/**
 * Test Card — Displays a Labs test with status badge, PDCA phase, category
 */

import React from 'react';
import type { LabsTest } from '@hooomz/shared-contracts';

interface TestCardProps {
  test: LabsTest;
  onClick?: () => void;
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  proposed: 'bg-[var(--surface)] text-[var(--mid)]',
  voting: 'bg-purple-100 text-purple-700',
  planned: 'bg-blue-100 text-blue-700',
  'in-progress': 'bg-amber-100 text-amber-700',
  complete: 'bg-green-100 text-green-700',
  published: 'bg-[var(--accent-bg)] text-[var(--accent)]',
};

const CATEGORY_STYLES: Record<string, string> = {
  product: 'bg-blue-50 text-blue-600',
  technique: 'bg-orange-50 text-orange-600',
  tool: 'bg-[var(--surface)] text-[var(--mid)]',
  system: 'bg-purple-50 text-purple-600',
  durability: 'bg-green-50 text-green-600',
};

function getPDCAPhase(test: LabsTest): string {
  if (test.actChanges) return 'Act';
  if (test.checkResults) return 'Check';
  if (test.doData) return 'Do';
  if (test.plan) return 'Plan';
  return 'Proposed';
}

export function TestCard({ test, onClick, className = '' }: TestCardProps) {
  const statusStyle = STATUS_STYLES[test.status] || 'bg-[var(--surface)] text-[var(--mid)]';
  const categoryStyle = CATEGORY_STYLES[test.category] || 'bg-[var(--surface)] text-[var(--mid)]';
  const pdcaPhase = getPDCAPhase(test);

  return (
    <div
      className={`bg-white rounded-xl border border-[var(--border)] p-4 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-mono text-[var(--muted)]">{test.id}</span>
        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusStyle}`}>
          {test.status}
        </span>
      </div>

      <h3 className="text-sm font-semibold text-[var(--charcoal)] mb-1 line-clamp-2">{test.title}</h3>
      <p className="text-xs text-[var(--muted)] mb-3 line-clamp-2">{test.description}</p>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`inline-flex px-1.5 py-0.5 text-xs rounded ${categoryStyle}`}>
          {test.category}
        </span>
        <span className="text-xs text-[var(--muted)]">
          PDCA: {pdcaPhase}
        </span>
        {test.voteCount > 0 && (
          <span className="text-xs text-[var(--muted)]">
            {test.voteCount} vote{test.voteCount !== 1 ? 's' : ''}
          </span>
        )}
        {test.tokenIds.length > 0 && (
          <span className="text-xs text-[var(--muted)]">
            {test.tokenIds.length} token{test.tokenIds.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}
