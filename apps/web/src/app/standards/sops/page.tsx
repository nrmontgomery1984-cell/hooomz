'use client';

/**
 * Standard Operating Procedures — /standards/sops
 *
 * Card grid of all SOPs with trade filter tabs.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import { FileCheck, Search } from 'lucide-react';
import { SECTION_COLORS } from '@/lib/viewmode';
import { useStandardSOPs } from '@/lib/hooks/useStandardSOPs';
import type { StandardSOP } from '@hooomz/shared-contracts';

const COLOR = SECTION_COLORS.standards;

const TRADE_STYLES: Record<string, { bg: string; text: string }> = {
  Flooring: { bg: '#FEF3C7', text: '#92400E' },
  Painting: { bg: '#DBEAFE', text: '#1E40AF' },
  'Finish Carpentry': { bg: '#FFEDD5', text: '#9A3412' },
  Doors: { bg: '#E0E7FF', text: '#3730A3' },
  Drywall: { bg: '#F3F4F6', text: '#374151' },
  Tile: { bg: '#CCFBF1', text: '#115E59' },
};

function getTradeStyle(trade: string) {
  return TRADE_STYLES[trade] ?? { bg: '#F3F4F6', text: '#374151' };
}

// ============================================================================
// SOP Card
// ============================================================================

function SOPCardNew({ sop, onClick }: { sop: StandardSOP; onClick: () => void }) {
  const trade = getTradeStyle(sop.trade);
  const stopConditions = sop.criticalStandards.filter((cs) => cs.category === 'stop-condition');

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'box-shadow 150ms ease',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
    >
      {/* Top row — Code + Trade badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>
          {sop.code}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 9999,
            background: trade.bg,
            color: trade.text,
          }}
        >
          {sop.trade}
        </span>
      </div>

      {/* Title */}
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3, marginBottom: 10 }}>
        {sop.title}
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
          {sop.procedures.length} procedures
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
          {sop.criticalStandards.length} standards
        </span>
        {stopConditions.length > 0 && (
          <span style={{ fontSize: 11, fontWeight: 600, color: '#EF4444' }}>
            {stopConditions.length} stop
          </span>
        )}
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
          {sop.labsReferences.length} Labs
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 9999,
            background: 'var(--green-dim)',
            color: 'var(--green)',
            marginLeft: 'auto',
          }}
        >
          {sop.status}
        </span>
      </div>
    </button>
  );
}

// ============================================================================
// Page
// ============================================================================

export default function StandardSOPsPage() {
  const router = useRouter();
  const { data: sops = [], isLoading } = useStandardSOPs();
  const [tradeFilter, setTradeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Derive unique trades from data
  const trades = Array.from(new Set(sops.map((s) => s.trade))).sort();

  // Filter
  const filtered = sops
    .filter((sop) => tradeFilter === 'all' || sop.trade === tradeFilter)
    .filter((sop) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return sop.code.toLowerCase().includes(q) || sop.title.toLowerCase().includes(q);
    })
    .sort((a, b) => a.code.localeCompare(b.code));

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: COLOR, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <PageErrorBoundary>
      <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>

        {/* Header */}
        <div style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR }} />
              <span style={{
                fontFamily: 'var(--font-cond)',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--text-3)',
              }}>
                Standards
              </span>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>
              Standard Operating Procedures
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>
              {sops.length} SOPs across {trades.length} trade{trades.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Trade filter + search */}
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 pb-3">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Trade pills */}
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
                <button
                  onClick={() => setTradeFilter('all')}
                  style={{
                    padding: '4px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 9999,
                    border: 'none',
                    cursor: 'pointer',
                    background: tradeFilter === 'all' ? COLOR : 'var(--surface-2)',
                    color: tradeFilter === 'all' ? '#fff' : 'var(--text-2)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  All ({sops.length})
                </button>
                {trades.map((t) => {
                  const count = sops.filter((s) => s.trade === t).length;
                  return (
                    <button
                      key={t}
                      onClick={() => setTradeFilter(t)}
                      style={{
                        padding: '4px 12px',
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: 9999,
                        border: 'none',
                        cursor: 'pointer',
                        background: tradeFilter === t ? COLOR : 'var(--surface-2)',
                        color: tradeFilter === t ? '#fff' : 'var(--text-2)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Search */}
              <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                <input
                  type="text"
                  placeholder="Search SOPs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px 6px 30px',
                    fontSize: 13,
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    color: 'var(--text)',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-4">
          {filtered.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 24px',
              background: 'var(--surface-1)',
              borderRadius: 12,
              border: '1px solid var(--border)',
            }}>
              <FileCheck size={32} style={{ margin: '0 auto 12px', color: 'var(--text-3)' }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)' }}>No SOPs Found</p>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>
                {search ? 'Try adjusting your search.' : 'SOPs will appear here once generated from Training Guides.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map((sop) => (
                <SOPCardNew
                  key={sop.id}
                  sop={sop}
                  onClick={() => router.push(`/standards/sops/${sop.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageErrorBoundary>
  );
}
