'use client';

/**
 * Labs Tests Page — Kanban pipeline view of all tests
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLabsTestPipeline } from '@/lib/hooks/useLabsData';
import { TestPipelineView } from '@/components/labs';
import { SECTION_COLORS } from '@/lib/viewmode';
import type { LabsTest, LabsTestCategory } from '@hooomz/shared-contracts';

const LABS_COLOR = SECTION_COLORS.labs;

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
      <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--blue)' }} />
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>Loading test pipeline...</p>
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
    <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/labs" className="text-sm hover:underline" style={{ color: LABS_COLOR }}>Labs</Link>
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>/</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Test Pipeline</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{totalTests} test{totalTests !== 1 ? 's' : ''} across PDCA stages</p>
        </div>

        {/* Category filter tabs */}
        <div className="max-w-4xl mx-auto px-4" style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--border)', overflowX: 'auto' }}>
          {CATEGORY_FILTERS.map((f) => {
            const active = categoryFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setCategoryFilter(f.value)}
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
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-4 space-y-4">
        {totalTests === 0 ? (
          <div style={{ background: 'var(--surface-1)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: 32, textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>No tests yet.</p>
            <Link href="/labs/seed" className="text-sm hover:underline mt-2 inline-block" style={{ color: LABS_COLOR }}>
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
