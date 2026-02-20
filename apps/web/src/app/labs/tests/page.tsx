'use client';

/**
 * Labs Tests Page — Kanban pipeline view of all tests
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLabsTestPipeline } from '@/lib/hooks/useLabsData';
import { TestPipelineView } from '@/components/labs';
import type { LabsTest, LabsTestCategory } from '@hooomz/shared-contracts';

const CATEGORY_FILTERS: { value: LabsTestCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'product', label: 'Product' },
  { value: 'technique', label: 'Technique' },
  { value: 'tool', label: 'Tool' },
  { value: 'system', label: 'System' },
  { value: 'durability', label: 'Durability' },
];

export default function LabsTestsPage() {
  const router = useRouter();
  const { data: pipeline, isLoading } = useLabsTestPipeline();
  const [categoryFilter, setCategoryFilter] = useState<LabsTestCategory | 'all'>('all');

  if (isLoading || !pipeline) {
    return (
      <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }} />
          <p className="text-sm text-gray-400">Loading test pipeline...</p>
        </div>
      </div>
    );
  }

  // Apply category filter
  const filteredPipeline = categoryFilter === 'all'
    ? pipeline
    : Object.fromEntries(
        Object.entries(pipeline).map(([status, tests]) => [
          status,
          (tests as LabsTest[]).filter((t) => t.category === categoryFilter),
        ])
      ) as typeof pipeline;

  const totalTests = Object.values(pipeline).flat().length;

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/labs" className="text-sm text-teal-700 hover:underline">Labs</Link>
            <span className="text-xs text-gray-400">/</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Test Pipeline</h1>
          <p className="text-xs text-gray-500 mt-0.5">{totalTests} test{totalTests !== 1 ? 's' : ''} across PDCA stages</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-4 space-y-4">
        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setCategoryFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors flex-shrink-0 ${
                categoryFilter === f.value
                  ? 'border-teal-600 bg-teal-50 text-teal-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              style={{ minHeight: '36px' }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {totalTests === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center shadow-sm">
            <p className="text-sm text-gray-500">No tests yet.</p>
            <Link href="/labs/seed" className="text-sm text-teal-700 hover:underline mt-2 inline-block">
              Seed data
            </Link>
          </div>
        ) : (
          <TestPipelineView
            pipeline={filteredPipeline}
            onTestClick={(test) => router.push(`/labs/tests/${test.id}`)}
          />
        )}
      </div>
    </div>
  );
}
