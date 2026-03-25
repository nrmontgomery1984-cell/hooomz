'use client';

/**
 * Labs Tokens Page — List all material reference tokens with status filters
 */

import { useState } from 'react';
import Link from 'next/link';
import { useLabsTokens } from '@/lib/hooks/useLabsData';
import { TOKEN_STATUS_COLORS } from '@/lib/constants/scriptPhases';
import { SECTION_COLORS } from '@/lib/viewmode';
import type { LabsTokenStatus } from '@hooomz/shared-contracts';

const LABS_COLOR = SECTION_COLORS.labs;

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
      <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--blue)' }} />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading tokens...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/labs" className="text-sm hover:underline" style={{ color: LABS_COLOR }}>Labs</Link>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>/</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--charcoal)' }}>Material Tokens</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{tokens.length} dynamic material references across SOPs</p>
        </div>

        {/* Status filter tabs */}
        <div className="max-w-lg mx-auto px-4" style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--border)', overflowX: 'auto' }}>
          {STATUS_FILTERS.map((f) => {
            const active = statusFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '8px 14px', minHeight: 40,
                  background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: active ? `2px solid ${LABS_COLOR}` : '2px solid transparent',
                  color: active ? LABS_COLOR : 'var(--muted)',
                  fontSize: 12, fontWeight: active ? 700 : 500,
                  whiteSpace: 'nowrap', flexShrink: 0,
                  transition: 'color 150ms',
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        {filtered.length === 0 ? (
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: 32, textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No tokens found.</p>
            <Link href="/labs/seed" className="text-sm hover:underline mt-2 inline-block" style={{ color: LABS_COLOR }}>
              Seed data
            </Link>
          </div>
        ) : (
          categories.map((category) => {
            const categoryTokens = filtered.filter((t) => t.category === category);
            return (
              <div key={category}>
                <h2 className="text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--muted)' }}>
                  {category} ({categoryTokens.length})
                </h2>
                <div className="space-y-2">
                  {categoryTokens.map((token) => (
                    <Link
                      key={token.id}
                      href={`/labs/tokens/${token.id}`}
                      className="block p-4 hover:shadow-md transition-shadow"
                      style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', display: 'block' }}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: TOKEN_STATUS_COLORS[token.status] || '#888' }}
                          />
                          <span className="text-sm font-semibold" style={{ color: 'var(--charcoal)' }}>{token.displayName}</span>
                        </div>
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>{token.status}</span>
                      </div>
                      <p className="text-sm mb-1" style={{ color: 'var(--mid)' }}>{token.currentRecommendation}</p>
                      {token.recommendationDetail && (
                        <p className="text-xs line-clamp-1" style={{ color: 'var(--muted)' }}>{token.recommendationDetail}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--muted)' }}>
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
