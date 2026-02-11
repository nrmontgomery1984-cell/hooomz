'use client';

/**
 * Labs Knowledge Base Page — published knowledge items
 */

import { useState } from 'react';
import Link from 'next/link';
import { useLabsKnowledgeItems } from '@/lib/hooks/useLabsData';
import { KnowledgeItemCard } from '@/components/labs';
import type { KnowledgeType } from '@hooomz/shared-contracts';

type TabFilter = 'all' | 'published' | 'under_review' | 'draft';

export default function KnowledgePage() {
  const { data: items = [], isLoading } = useLabsKnowledgeItems();
  const [statusFilter, setStatusFilter] = useState<TabFilter>('all');
  const [typeFilter, setTypeFilter] = useState<KnowledgeType | 'all'>('all');

  let filtered = statusFilter === 'all'
    ? items
    : items.filter((i) => i.status === statusFilter);

  if (typeFilter !== 'all') {
    filtered = filtered.filter((i) => i.knowledgeType === typeFilter);
  }

  const sorted = [...filtered].sort((a, b) => b.confidenceScore - a.confidenceScore);

  const statusFilters: { key: TabFilter; label: string }[] = [
    { key: 'all', label: `All (${items.length})` },
    { key: 'published', label: `Published (${items.filter((i) => i.status === 'published').length})` },
    { key: 'under_review', label: 'Review' },
    { key: 'draft', label: 'Draft' },
  ];

  const typeFilters: { value: KnowledgeType | 'all'; label: string }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'product', label: 'Product' },
    { value: 'technique', label: 'Technique' },
    { value: 'tool_method', label: 'Tool' },
    { value: 'combination', label: 'Combo' },
    { value: 'procedure', label: 'Procedure' },
    { value: 'specification', label: 'Specification' },
    { value: 'material', label: 'Material' },
  ];

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/labs" className="text-sm text-teal-700 hover:underline">Labs</Link>
            <span className="text-xs text-gray-400">/</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Knowledge Base</h1>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>Verified knowledge from field data</p>
        </div>

        {/* Status filter pills */}
        <div className="max-w-lg mx-auto px-4 pb-2 overflow-x-auto">
          <div className="flex gap-2">
            {statusFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                  statusFilter === f.key
                    ? 'bg-teal-700 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Type filter pills */}
        <div className="max-w-lg mx-auto px-4 pb-3 overflow-x-auto">
          <div className="flex gap-2">
            {typeFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setTypeFilter(f.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                  typeFilter === f.value
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }} />
            <p className="text-sm text-gray-400">Loading knowledge base...</p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">No knowledge items yet</p>
            <p className="text-xs text-gray-300 mt-1">Knowledge items are created from observations and experiments</p>
          </div>
        ) : (
          sorted.map((item) => (
            <Link key={item.id} href={`/labs/knowledge/${item.id}`}>
              <KnowledgeItemCard item={item} className="hover:shadow-md transition-shadow cursor-pointer" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
