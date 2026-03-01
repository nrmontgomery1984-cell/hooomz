'use client';

/**
 * Labs Observations Page — list of all field observations
 */

import { useState } from 'react';
import Link from 'next/link';
import { useLabsObservations } from '@/lib/hooks/useLabsData';
import { ObservationCard } from '@/components/labs';
import { SECTION_COLORS } from '@/lib/viewmode';
import type { KnowledgeType } from '@hooomz/shared-contracts';

const LABS_COLOR = SECTION_COLORS.labs;

const KNOWLEDGE_TYPES: { value: KnowledgeType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'product', label: 'Product' },
  { value: 'technique', label: 'Technique' },
  { value: 'tool_method', label: 'Tool/Method' },
  { value: 'combination', label: 'Combination' },
  { value: 'timing', label: 'Timing' },
  { value: 'procedure', label: 'Procedure' },
  { value: 'environmental_rule', label: 'Environmental' },
];

export default function ObservationsPage() {
  const { data: observations = [], isLoading } = useLabsObservations();
  const [filter, setFilter] = useState<KnowledgeType | 'all'>('all');

  const filtered = filter === 'all'
    ? observations
    : observations.filter((o) => o.knowledgeType === filter);

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime()
  );

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/labs" className="text-sm hover:underline" style={{ color: LABS_COLOR }}>Labs</Link>
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>/</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Observations</h1>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>{observations.length} field observations</p>
        </div>

        {/* Filter tabs */}
        <div className="max-w-lg mx-auto px-4" style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--border)', overflowX: 'auto' }}>
          {KNOWLEDGE_TYPES.map((type) => {
            const active = filter === type.value;
            return (
              <button
                key={type.value}
                onClick={() => setFilter(type.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '8px 14px', minHeight: 40,
                  background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: active ? `2px solid ${LABS_COLOR}` : '2px solid transparent',
                  color: active ? LABS_COLOR : 'var(--text-3)',
                  fontSize: 12, fontWeight: active ? 700 : 500,
                  whiteSpace: 'nowrap', flexShrink: 0,
                  transition: 'color 150ms',
                }}
              >
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'var(--border)', borderTopColor: LABS_COLOR }} />
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>Loading observations...</p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>No observations yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Observations are captured as crew members work on projects</p>
          </div>
        ) : (
          sorted.map((obs) => (
            <ObservationCard key={obs.id} observation={obs} />
          ))
        )}
      </div>
    </div>
  );
}
