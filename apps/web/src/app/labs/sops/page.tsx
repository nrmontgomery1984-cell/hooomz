'use client';

/**
 * SOP List Page — browse and filter all SOPs
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSops } from '@/lib/hooks/useLabsData';
import { SOPCard } from '@/components/labs';
import type { SopStatus } from '@hooomz/shared-contracts';

const STATUS_FILTERS: { value: SopStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
  { value: 'future_experiment', label: 'Experiment' },
];

export default function SOPsPage() {
  const { data: sops = [], isLoading } = useSops();
  const [statusFilter, setStatusFilter] = useState<SopStatus | 'all'>('all');
  const [tradeFilter, setTradeFilter] = useState<string>('all');
  const router = useRouter();

  // Derive unique trade families from data
  const tradeFamilies = Array.from(new Set(sops.map((s) => s.tradeFamily))).sort();

  // Filter
  const filtered = sops.filter((sop) => {
    if (statusFilter !== 'all' && sop.status !== statusFilter) return false;
    if (tradeFilter !== 'all' && sop.tradeFamily !== tradeFilter) return false;
    return true;
  });

  // Sort: active first, then by sopCode
  const sorted = [...filtered].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (b.status === 'active' && a.status !== 'active') return 1;
    return a.sopCode.localeCompare(b.sopCode);
  });

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/labs" className="text-sm text-teal-700 hover:underline">Labs</Link>
            <span className="text-xs text-gray-400">/</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: '#111827' }}>SOPs</h1>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>{sops.length} standard operating procedures</p>
            </div>
            <Link
              href="/labs/sops/new"
              className="px-3 py-2 text-sm font-medium text-white rounded-xl"
              style={{ background: '#0F766E', minHeight: '44px', display: 'flex', alignItems: 'center' }}
            >
              + New SOP
            </Link>
          </div>
        </div>

        {/* Status filter pills */}
        <div className="max-w-lg mx-auto px-4 pb-3 overflow-x-auto">
          <div className="flex gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                  statusFilter === f.value
                    ? 'bg-teal-700 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Trade family filter (only if multiple families) */}
        {tradeFamilies.length > 1 && (
          <div className="max-w-lg mx-auto px-4 pb-3 overflow-x-auto">
            <div className="flex gap-2">
              <button
                onClick={() => setTradeFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                  tradeFilter === 'all'
                    ? 'bg-teal-700 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Trades
              </button>
              {tradeFamilies.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTradeFilter(tf)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                    tradeFilter === tf
                      ? 'bg-teal-700 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }} />
            <p className="text-sm text-gray-400">Loading SOPs...</p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">No SOPs found</p>
            <p className="text-xs text-gray-300 mt-1">Create your first SOP to start building procedures</p>
          </div>
        ) : (
          sorted.map((sop) => (
            <SOPCard
              key={sop.id}
              sop={sop}
              onClick={() => router.push(`/labs/sops/${sop.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}
