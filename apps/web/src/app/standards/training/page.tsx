'use client';

/**
 * Training Guides — /standards/training
 *
 * List all Training Guides stored in IndexedDB.
 * Read-only view for validating TG data infrastructure.
 */

import { useRouter } from 'next/navigation';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import { BookOpen } from 'lucide-react';
import { SECTION_COLORS } from '@/lib/viewmode';
import { useTrainingGuides } from '@/lib/hooks/useTrainingGuides';
import type { TrainingGuide, TrainingGuideStatus } from '@hooomz/shared-contracts';

const COLOR = SECTION_COLORS.standards;

const STATUS_STYLES: Record<TrainingGuideStatus, { bg: string; text: string }> = {
  active: { bg: 'var(--green-dim)', text: 'var(--green)' },
  draft: { bg: 'var(--amber-dim)', text: 'var(--amber)' },
  archived: { bg: 'var(--surface-3)', text: 'var(--muted)' },
};

const TRADE_STYLES: Record<string, { bg: string; text: string }> = {
  default: { bg: 'var(--accent-bg)', text: 'var(--accent)' },
};

function getTradeStyle(trade: string) {
  return TRADE_STYLES[trade] ?? TRADE_STYLES.default;
}

// ============================================================================
// Guide Card
// ============================================================================

function TrainingGuideCard({ guide, onClick }: { guide: TrainingGuide; onClick: () => void }) {
  const status = STATUS_STYLES[guide.status];
  const trade = getTradeStyle(guide.trade);
  const sopCount = guide.modules.filter((m) => m.sopCodes.length > 0).length;

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        background: 'var(--surface)',
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
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--mid)' }}>
          {guide.code}
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
          {guide.trade}
        </span>
      </div>

      {/* Title */}
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--charcoal)', lineHeight: 1.3, marginBottom: 10 }}>
        {guide.title}
      </div>

      {/* Bottom row — Version, Modules, SOPs, Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>v{guide.version}</span>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{guide.modules.length} modules</span>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{sopCount} SOPs</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 9999,
            background: status.bg,
            color: status.text,
            marginLeft: 'auto',
          }}
        >
          {guide.status}
        </span>
      </div>
    </button>
  );
}

// ============================================================================
// Page
// ============================================================================

export default function TrainingGuidesPage() {
  const router = useRouter();
  const { data: guides = [], isLoading } = useTrainingGuides();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: COLOR, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 11, color: 'var(--muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <PageErrorBoundary>
      <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>

        {/* Header */}
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR }} />
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
              }}>
                Standards
              </span>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--charcoal)', marginTop: 4 }}>
              Training Guides
            </h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
              Source-of-truth documents for trade training
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-4">
          {guides.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 24px',
              background: 'var(--surface)',
              borderRadius: 12,
              border: '1px solid var(--border)',
            }}>
              <BookOpen size={32} style={{ margin: '0 auto 12px', color: 'var(--muted)' }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--mid)' }}>No Training Guides</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                Training guides will appear here once imported.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {guides.map((guide) => (
                <TrainingGuideCard
                  key={guide.id}
                  guide={guide}
                  onClick={() => router.push(`/standards/training/${guide.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageErrorBoundary>
  );
}
