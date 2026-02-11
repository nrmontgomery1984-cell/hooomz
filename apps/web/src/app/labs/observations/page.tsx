'use client';

/**
 * Labs Observations Page — list of all field observations
 */

import { useState } from 'react';
import Link from 'next/link';
import { useLabsObservations } from '@/lib/hooks/useLabsData';
import { ObservationCard } from '@/components/labs';
import type { KnowledgeType } from '@hooomz/shared-contracts';

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
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/labs" className="text-sm text-teal-700 hover:underline">Labs</Link>
            <span className="text-xs text-gray-400">/</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Observations</h1>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>{observations.length} field observations</p>
        </div>

        {/* Filter pills */}
        <div className="max-w-lg mx-auto px-4 pb-3 overflow-x-auto">
          <div className="flex gap-2">
            {KNOWLEDGE_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setFilter(type.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                  filter === type.value
                    ? 'bg-teal-700 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }} />
            <p className="text-sm text-gray-400">Loading observations...</p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">No observations yet</p>
            <p className="text-xs text-gray-300 mt-1">Observations are captured as crew members work on projects</p>
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
