'use client';

/**
 * Labs Experiments Page — active experiments list
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLabsExperiments } from '@/lib/hooks/useLabsData';
import { ExperimentCard } from '@/components/labs';
import { SECTION_COLORS } from '@/lib/viewmode';

const LABS_COLOR = SECTION_COLORS.labs;

type StatusFilter = 'all' | 'active' | 'completed' | 'draft';

export default function ExperimentsPage() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const actionParam = searchParams.get('action');

  const { data: experiments = [], isLoading } = useLabsExperiments();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [categorySearch, setCategorySearch] = useState<string>(categoryParam || '');
  const [showCategoryBanner, setShowCategoryBanner] = useState(!!categoryParam);

  useEffect(() => {
    if (categoryParam) {
      setCategorySearch(categoryParam);
      setShowCategoryBanner(true);
    }
  }, [categoryParam]);

  let filtered = filter === 'all'
    ? experiments
    : experiments.filter((e) => e.status === filter);

  // Category filter (from URL deep link)
  if (categorySearch) {
    const search = categorySearch.replace(/[-_]/g, ' ').toLowerCase();
    filtered = filtered.filter((e) => {
      const wcs = e.matchCriteria?.workCategories || [];
      const title = e.title.toLowerCase();
      return wcs.some((wc: string) => {
        const w = wc.replace(/[-_]/g, ' ').toLowerCase();
        return w.includes(search) || search.includes(w);
      }) || title.includes(search);
    });
  }

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime()
  );

  const catLabel = categorySearch ? categorySearch.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';
  const activeCount = experiments.filter((e) => e.status === 'active').length;

  const filters: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: `All (${experiments.length})` },
    { key: 'active', label: `Active (${activeCount})` },
    { key: 'draft', label: 'Draft' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--surface-2)' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/labs" className="text-sm hover:underline" style={{ color: LABS_COLOR }}>Labs</Link>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>/</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--charcoal)' }}>Experiments</h1>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Structured testing of products, techniques, and methods</p>
        </div>

        {/* Filter pills */}
        <div className="max-w-lg mx-auto px-4 pb-3 overflow-x-auto">
          <div className="flex gap-2">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors"
                style={
                  filter === f.key
                    ? { background: LABS_COLOR, color: '#fff' }
                    : { background: 'var(--surface-2)', color: 'var(--mid)' }
                }
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-3">
        {/* Category filter banner (from estimate page deep link) */}
        {showCategoryBanner && categorySearch && (
          <div
            className="flex items-center justify-between px-3 py-2.5 rounded-xl"
            style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-bg)' }}
          >
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                Filtered: {catLabel}
              </p>
              {actionParam === 'new' && sorted.length === 0 && (
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--accent)' }}>
                  No experiments yet — design one to test {catLabel.toLowerCase()} products or techniques
                </p>
              )}
              {actionParam === 'plan' && sorted.length === 0 && (
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--accent)' }}>
                  Plan a future experiment for {catLabel.toLowerCase()} to build confidence data
                </p>
              )}
            </div>
            <button
              onClick={() => { setCategorySearch(''); setShowCategoryBanner(false); }}
              className="text-[11px] font-medium px-2 py-1 rounded-lg"
              style={{ background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }}
            >
              Clear
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading experiments...</p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {categorySearch ? `No experiments for ${catLabel}` : 'No experiments yet'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              {categorySearch
                ? 'Design an experiment to test hypotheses about this work category'
                : 'Experiments are designed by Labs admins to test specific hypotheses'}
            </p>
          </div>
        ) : (
          sorted.map((exp) => (
            <ExperimentCard key={exp.id} experiment={exp} />
          ))
        )}
      </div>
    </div>
  );
}
