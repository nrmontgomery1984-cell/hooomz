'use client';

/**
 * Labs Tokens Page — List all material reference tokens with status filters
 */

import { useState } from 'react';
import Link from 'next/link';
import { useLabsTokens } from '@/lib/hooks/useLabsData';
import { TOKEN_STATUS_COLORS } from '@/lib/constants/scriptPhases';
import type { LabsTokenStatus } from '@hooomz/shared-contracts';

const STATUS_FILTERS: { value: LabsTokenStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'validated', label: 'Validated' },
  { value: 'planned', label: 'Planned' },
  { value: 'standard', label: 'Standard' },
];

export default function LabsTokensPage() {
  const { data: tokens = [], isLoading } = useLabsTokens();
  const [statusFilter, setStatusFilter] = useState<LabsTokenStatus | 'all'>('all');

  const filtered = statusFilter === 'all'
    ? tokens
    : tokens.filter((t) => t.status === statusFilter);

  // Group by category
  const categories = Array.from(new Set(filtered.map((t) => t.category))).sort();

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }} />
          <p className="text-sm text-gray-400">Loading tokens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/labs" className="text-sm text-teal-700 hover:underline">Labs</Link>
            <span className="text-xs text-gray-400">/</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Material Tokens</h1>
          <p className="text-xs text-gray-500 mt-0.5">{tokens.length} dynamic material references across SOPs</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        {/* Status filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors flex-shrink-0 ${
                statusFilter === f.value
                  ? 'border-teal-600 bg-teal-50 text-teal-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              style={{ minHeight: '36px' }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center shadow-sm">
            <p className="text-sm text-gray-500">No tokens found.</p>
            <Link href="/labs/seed" className="text-sm text-teal-700 hover:underline mt-2 inline-block">
              Seed data
            </Link>
          </div>
        ) : (
          categories.map((category) => {
            const categoryTokens = filtered.filter((t) => t.category === category);
            return (
              <div key={category}>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
                  {category} ({categoryTokens.length})
                </h2>
                <div className="space-y-2">
                  {categoryTokens.map((token) => (
                    <Link
                      key={token.id}
                      href={`/labs/tokens/${token.id}`}
                      className="block bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: TOKEN_STATUS_COLORS[token.status] || '#888' }}
                          />
                          <span className="text-sm font-semibold text-gray-900">{token.displayName}</span>
                        </div>
                        <span className="text-xs text-gray-400">{token.status}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">{token.currentRecommendation}</p>
                      {token.recommendationDetail && (
                        <p className="text-xs text-gray-500 line-clamp-1">{token.recommendationDetail}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>{token.sopReferences.length} SOP{token.sopReferences.length !== 1 ? 's' : ''}</span>
                        <span className="font-mono">{'{{LAB:' + token.id + '}}'}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
