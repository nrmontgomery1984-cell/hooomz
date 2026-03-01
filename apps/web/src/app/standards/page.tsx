'use client';

/**
 * Standards Dashboard — /standards
 *
 * Overview of SOPs, Training Guides, and checklist activity.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import { GraduationCap, ClipboardCheck, ChevronRight, FileCheck } from 'lucide-react';
import { useStandardSOPs, useAllChecklists } from '@/lib/hooks/useStandardSOPs';
import { useTrainingGuides } from '@/lib/hooks/useTrainingGuides';
import { SECTION_COLORS } from '@/lib/viewmode';
import type { StandardSOP } from '@hooomz/shared-contracts';
import type { TrainingGuide } from '@hooomz/shared-contracts';

const COLOR = SECTION_COLORS.standards;

const SOP_STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  draft: { color: 'var(--text-3)', bg: 'var(--surface-3)' },
  active: { color: 'var(--green)', bg: 'var(--green-dim)' },
  archived: { color: 'var(--text-3)', bg: 'var(--surface-3)' },
  future_experiment: { color: 'var(--amber)', bg: 'var(--amber-dim)' },
};

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
// Page
// ============================================================================

export default function StandardsDashboard() {
  const router = useRouter();
  const { data: sops = [], isLoading: sopsLoading } = useStandardSOPs();
  const { data: trainingGuides = [], isLoading: tgLoading } = useTrainingGuides();
  const { data: checklists = [], isLoading: clLoading } = useAllChecklists();

  const isLoading = sopsLoading || tgLoading || clLoading;

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

  const activeSops = sops.filter((s) => s.status === 'active').length;
  const submittedChecklists = checklists.filter((c) => c.status === 'submitted' || c.status === 'approved').length;

  // Recent SOPs — first 5
  const recentSops = [...sops]
    .sort((a, b) => {
      const aDate = (a as StandardSOP & { metadata?: { updatedAt?: string; createdAt?: string } }).metadata?.updatedAt ||
                    (a as StandardSOP & { metadata?: { updatedAt?: string; createdAt?: string } }).metadata?.createdAt || '';
      const bDate = (b as StandardSOP & { metadata?: { updatedAt?: string; createdAt?: string } }).metadata?.updatedAt ||
                    (b as StandardSOP & { metadata?: { updatedAt?: string; createdAt?: string } }).metadata?.createdAt || '';
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    })
    .slice(0, 5);

  return (
    <PageErrorBoundary>
      <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>

        {/* Header */}
        <div style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR }} />
              <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-cond)', letterSpacing: '0.02em' }}>
                Standards Dashboard
              </h1>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>SOPs, training guides, and checklist activity</p>
          </div>
        </div>

        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6">

          {/* Stat Row */}
          <div style={{ marginTop: 16, display: 'grid', gap: 10 }} className="grid-cols-3">
            <StatCard
              icon={<FileCheck size={14} />}
              label="SOPs Active"
              value={`${activeSops}/${sops.length}`}
              color={COLOR}
              href="/standards/sops"
            />
            <StatCard
              icon={<GraduationCap size={14} />}
              label="Training Guides"
              value={trainingGuides.length}
              color={COLOR}
              href="/standards/training"
            />
            <StatCard
              icon={<ClipboardCheck size={14} />}
              label="Checklists Done"
              value={submittedChecklists}
              color={COLOR}
              href="/standards/knowledge"
            />
          </div>

          {/* Content Grid */}
          <div className="mt-5" style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'grid', gap: 16 }} className="md:grid-cols-[1fr_1fr]">

              {/* Recent SOPs */}
              <div>
                <SectionHeader title="SOPs" />
                <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                  {recentSops.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center' }}>
                      <FileCheck size={20} style={{ color: 'var(--text-3)', margin: '0 auto 8px' }} />
                      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>No SOPs loaded</p>
                    </div>
                  ) : (
                    recentSops.map((sop, i) => {
                      const statusStyle = SOP_STATUS_STYLES[sop.status] ?? SOP_STATUS_STYLES.draft;
                      const tradeStyle = getTradeStyle(sop.trade);
                      return (
                        <button
                          key={sop.id}
                          onClick={() => router.push(`/standards/sops/${sop.id}`)}
                          style={{
                            width: '100%', textAlign: 'left', padding: '10px 12px',
                            display: 'flex', alignItems: 'center', gap: 10, minHeight: 44,
                            background: 'none', border: 'none',
                            borderBottom: i < recentSops.length - 1 ? '1px solid var(--border)' : 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: COLOR, flexShrink: 0 }}>
                                {sop.code}
                              </span>
                              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {sop.title}
                              </span>
                            </div>
                            <span style={{ marginTop: 2, fontSize: 10, fontWeight: 600, color: tradeStyle.text, background: tradeStyle.bg, padding: '1px 5px', borderRadius: 3 }}>
                              {sop.trade}
                            </span>
                          </div>
                          <span style={{
                            fontFamily: 'var(--font-cond)', fontSize: 9, fontWeight: 700,
                            letterSpacing: '0.06em', textTransform: 'uppercase',
                            padding: '1px 5px', borderRadius: 2,
                            background: statusStyle.bg, color: statusStyle.color, flexShrink: 0,
                          }}>
                            {sop.status.replace(/_/g, ' ')}
                          </span>
                          <ChevronRight size={11} style={{ color: 'var(--border-strong)', flexShrink: 0 }} />
                        </button>
                      );
                    })
                  )}
                  <Link
                    href="/standards/sops"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      padding: '8px 12px', fontSize: 11, fontWeight: 600,
                      color: COLOR, textDecoration: 'none',
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    View All SOPs <ChevronRight size={10} />
                  </Link>
                </div>
              </div>

              {/* Training Guides */}
              <div>
                <SectionHeader title="Training Guides" />
                <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                  {trainingGuides.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center' }}>
                      <GraduationCap size={20} style={{ color: 'var(--text-3)', margin: '0 auto 8px' }} />
                      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>No training guides loaded</p>
                    </div>
                  ) : (
                    trainingGuides.map((tg, i) => (
                      <TrainingGuideRow
                        key={tg.id}
                        guide={tg}
                        isLast={i === trainingGuides.length - 1}
                        onClick={() => router.push(`/standards/training/${tg.id}`)}
                      />
                    ))
                  )}
                  <Link
                    href="/standards/training"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      padding: '8px 12px', fontSize: 11, fontWeight: 600,
                      color: COLOR, textDecoration: 'none',
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    View All Training <ChevronRight size={10} />
                  </Link>
                </div>
              </div>

            </div>

            {/* Recent Checklist Activity */}
            {checklists.length > 0 && (
              <div>
                <SectionHeader title="Recent Checklist Activity" />
                <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                  {[...checklists]
                    .sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime())
                    .slice(0, 5)
                    .map((cl, i, arr) => (
                      <div
                        key={cl.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 12px', minHeight: 44,
                          borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                        }}
                      >
                        <ClipboardCheck size={14} style={{ color: cl.allPassed ? 'var(--green)' : 'var(--amber)', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: COLOR }}>
                            {cl.sopCode}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--text-2)', marginLeft: 8 }}>
                            {cl.technicianName}
                          </span>
                        </div>
                        <span style={{
                          fontFamily: 'var(--font-cond)', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                          textTransform: 'uppercase', padding: '1px 5px', borderRadius: 2,
                          background: cl.status === 'submitted' || cl.status === 'approved' ? 'var(--green-dim)' : 'var(--surface-3)',
                          color: cl.status === 'submitted' || cl.status === 'approved' ? 'var(--green)' : 'var(--text-3)',
                        }}>
                          {cl.status}
                        </span>
                      </div>
                    ))}
                  <Link
                    href="/standards/knowledge"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      padding: '8px 12px', fontSize: 11, fontWeight: 600,
                      color: COLOR, textDecoration: 'none',
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    View Knowledge Base <ChevronRight size={10} />
                  </Link>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </PageErrorBoundary>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <span style={{ fontFamily: 'var(--font-cond)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
        {title}
      </span>
    </div>
  );
}

function StatCard({ icon, label, value, color, href }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  href: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        padding: '12px 14px',
        borderRadius: 'var(--radius)',
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
        cursor: 'pointer',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <div style={{ color }}>{icon}</div>
          <span style={{ fontFamily: 'var(--font-cond)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
            {label}
          </span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
          {value}
        </span>
      </div>
    </Link>
  );
}

function TrainingGuideRow({ guide, isLast, onClick }: { guide: TrainingGuide; isLast: boolean; onClick: () => void }) {
  const trade = TRADE_STYLES[guide.trade] ?? { bg: '#F3F4F6', text: '#374151' };
  const activeModules = guide.modules.length;
  const sopCount = guide.modules.reduce((acc, m) => acc + (m.sopCodes?.length ?? 0), 0);

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', padding: '10px 12px',
        display: 'flex', alignItems: 'center', gap: 10, minHeight: 44,
        background: 'none', border: 'none',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        cursor: 'pointer',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: COLOR, flexShrink: 0 }}>
            {guide.code}
          </span>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {guide.title}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: trade.text, background: trade.bg, padding: '1px 5px', borderRadius: 3 }}>
            {guide.trade}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
            {activeModules} modules · {sopCount} SOPs
          </span>
        </div>
      </div>
      <ChevronRight size={11} style={{ color: 'var(--border-strong)', flexShrink: 0 }} />
    </button>
  );
}
