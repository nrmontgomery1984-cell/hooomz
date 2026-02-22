'use client';

/**
 * Standards Dashboard — SOPs, Training, Knowledge
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import { BookOpen, GraduationCap, Lightbulb, ChevronRight } from 'lucide-react';
import { useCurrentSops } from '@/lib/hooks/useLabsData';
import { useLabsKnowledgeItems } from '@/lib/hooks/useLabsData';
import { useTrainingRecords, useActiveCrewMembers } from '@/lib/hooks/useCrewData';
import { SECTION_COLORS } from '@/lib/viewmode';

// ============================================================================
// Page
// ============================================================================

export default function StandardsDashboard() {
  const router = useRouter();
  const { data: sops = [], isLoading: sopsLoading } = useCurrentSops();
  const { data: knowledgeItems = [], isLoading: knLoading } = useLabsKnowledgeItems();
  const { data: trainingRecords = [], isLoading: trLoading } = useTrainingRecords();
  const { data: crewMembers = [], isLoading: crewLoading } = useActiveCrewMembers();

  const isLoading = sopsLoading || knLoading || trLoading || crewLoading;

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: SECTION_COLORS.standards, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Stats
  const activeSops = sops.filter((s) => s.status === 'active').length;
  const totalSops = sops.length;

  // Training per crew member
  const crewTraining = crewMembers.map((crew) => {
    const records = trainingRecords.filter((t) => t.crewMemberId === crew.id);
    const certified = records.filter((t) => t.status === 'certified').length;
    return {
      id: crew.id,
      name: crew.name,
      total: records.length,
      certified,
      pct: records.length > 0 ? Math.round((certified / records.length) * 100) : 0,
    };
  });

  // Recent SOPs — sorted by updated date
  const recentSops = [...sops]
    .sort((a, b) => {
      const aDate = a.metadata?.updatedAt || a.metadata?.createdAt || '';
      const bDate = b.metadata?.updatedAt || b.metadata?.createdAt || '';
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    })
    .slice(0, 5);

  const SOP_STATUS_STYLES: Record<string, { color: string; bg: string }> = {
    draft: { color: 'var(--text-3)', bg: 'var(--surface-3)' },
    active: { color: 'var(--green)', bg: 'var(--green-dim)' },
    archived: { color: 'var(--text-3)', bg: 'var(--surface-3)' },
    future_experiment: { color: 'var(--amber)', bg: 'var(--amber-dim)' },
  };

  return (
    <PageErrorBoundary>
      <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>

        {/* Header */}
        <div style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: SECTION_COLORS.standards }} />
              <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-cond)', letterSpacing: '0.02em' }}>
                Standards Dashboard
              </h1>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>SOPs, training, and knowledge base</p>
          </div>
        </div>

        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6">

          {/* Stat Row */}
          <div
            style={{ marginTop: 16, display: 'grid', gap: 10 }}
            className="grid-cols-3"
          >
            <StatCard icon={<BookOpen size={14} />} label="SOPs Active" value={`${activeSops}/${totalSops}`} color={SECTION_COLORS.standards} />
            <StatCard icon={<GraduationCap size={14} />} label="Training Records" value={trainingRecords.length} color={SECTION_COLORS.standards} />
            <StatCard icon={<Lightbulb size={14} />} label="Knowledge Items" value={knowledgeItems.length} color={SECTION_COLORS.standards} />
          </div>

          {/* Content Grid */}
          <div
            className="mt-5"
            style={{ display: 'grid', gap: 16 }}
          >
            <div
              style={{ display: 'grid', gap: 16 }}
              className="md:grid-cols-[1fr_1fr]"
            >
              {/* Recent SOPs */}
              <div>
                <SectionHeader title="Recent SOPs" />
                <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                  {recentSops.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center' }}>
                      <BookOpen size={20} style={{ color: 'var(--text-3)', margin: '0 auto 8px' }} />
                      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>No SOPs yet</p>
                    </div>
                  ) : (
                    recentSops.map((sop, i) => {
                      const statusStyle = SOP_STATUS_STYLES[sop.status] || SOP_STATUS_STYLES.draft;
                      return (
                        <button
                          key={sop.id}
                          onClick={() => router.push(`/labs/sops/${sop.id}`)}
                          style={{
                            width: '100%', textAlign: 'left', padding: '10px 12px',
                            display: 'flex', alignItems: 'center', gap: 10, minHeight: 44,
                            background: 'none', border: 'none',
                            borderBottom: i < recentSops.length - 1 ? '1px solid var(--border)' : 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: SECTION_COLORS.standards, flexShrink: 0 }}>
                                {sop.sopCode}
                              </span>
                              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {sop.title}
                              </span>
                            </div>
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
                    href="/labs/sops"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      padding: '8px 12px', fontSize: 11, fontWeight: 600,
                      color: SECTION_COLORS.standards, textDecoration: 'none',
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    View All SOPs <ChevronRight size={10} />
                  </Link>
                </div>
              </div>

              {/* Training Completion */}
              <div>
                <SectionHeader title="Training Completion" />
                <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, boxShadow: 'var(--shadow-card)' }}>
                  {crewTraining.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 16 }}>
                      <GraduationCap size={20} style={{ color: 'var(--text-3)', margin: '0 auto 8px' }} />
                      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>No crew training records</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {crewTraining.map((crew) => (
                        <div key={crew.id}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{crew.name}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: crew.pct >= 80 ? 'var(--green)' : 'var(--text-2)' }}>
                              {crew.certified}/{crew.total} ({crew.pct}%)
                            </span>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: 'var(--surface-3)', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', borderRadius: 3,
                              width: `${crew.pct}%`,
                              background: crew.pct >= 80 ? SECTION_COLORS.standards : 'var(--amber)',
                              transition: 'width 0.4s',
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <Link
                    href="/labs/training"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      marginTop: 12, padding: '8px 0', fontSize: 11, fontWeight: 600,
                      color: SECTION_COLORS.standards, textDecoration: 'none',
                    }}
                  >
                    View Training <ChevronRight size={10} />
                  </Link>
                </div>
              </div>
            </div>
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

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div style={{
      padding: '12px 14px',
      borderRadius: 'var(--radius)',
      background: 'var(--surface-1)',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-card)',
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
  );
}
