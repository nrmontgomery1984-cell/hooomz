'use client';

/**
 * Knowledge Base — /standards/knowledge
 *
 * Unified Standards library: Training Guides, SOPs, Checklists, Training Profile.
 * Manager view shows all crew. Operator/Installer view shows own record only.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import {
  GraduationCap,
  FileCheck,
  ClipboardCheck,
  UserCheck,
  ChevronRight,
  Check,
  X,
  BookOpen,
} from 'lucide-react';
import { SECTION_COLORS } from '@/lib/viewmode';
import { useViewMode } from '@/lib/viewmode';
import { useActiveCrew } from '@/lib/crew/ActiveCrewContext';
import { useStandardSOPs, useAllChecklists } from '@/lib/hooks/useStandardSOPs';
import { useTrainingGuides } from '@/lib/hooks/useTrainingGuides';
import { useActiveCrewMembers } from '@/lib/hooks/useCrewData';
import type { StandardSOP, ChecklistSubmission, TrainingGuide } from '@hooomz/shared-contracts';

const COLOR = SECTION_COLORS.standards;

type Tab = 'guides' | 'sops' | 'checklists' | 'profile';

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

export default function KnowledgeBasePage() {
  const router = useRouter();
  const { viewMode } = useViewMode();
  const { crewMemberId } = useActiveCrew();

  const isManager = viewMode === 'manager';

  const [activeTab, setActiveTab] = useState<Tab>('guides');

  const { data: trainingGuides = [], isLoading: tgLoading } = useTrainingGuides();
  const { data: sops = [], isLoading: sopsLoading } = useStandardSOPs();
  const { data: checklists = [], isLoading: clLoading } = useAllChecklists();
  const { data: crewMembers = [], isLoading: crewLoading } = useActiveCrewMembers();

  const isLoading = tgLoading || sopsLoading || clLoading || (isManager && crewLoading);

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

  const TABS: { id: Tab; label: string; icon: typeof GraduationCap; count?: number }[] = [
    { id: 'guides', label: 'Training', icon: GraduationCap, count: trainingGuides.length },
    { id: 'sops', label: 'SOPs', icon: FileCheck, count: sops.length },
    { id: 'checklists', label: 'Checklists', icon: ClipboardCheck, count: checklists.length },
    { id: 'profile', label: 'Profile', icon: UserCheck },
  ];

  return (
    <PageErrorBoundary>
      <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>

        {/* Header */}
        <div style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR }} />
              <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-cond)', letterSpacing: '0.02em' }}>
                Knowledge Base
              </h1>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
              Training guides, SOPs, checklists, and training profiles
            </p>
          </div>

          {/* Tabs */}
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6" style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--border)' }}>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '8px 14px', minHeight: 40,
                    background: 'none', border: 'none', cursor: 'pointer',
                    borderBottom: active ? `2px solid ${COLOR}` : '2px solid transparent',
                    color: active ? COLOR : 'var(--text-3)',
                    fontSize: 12, fontWeight: active ? 700 : 500,
                    transition: 'color 150ms',
                  }}
                >
                  <Icon size={13} />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-mono)',
                      padding: '1px 4px', borderRadius: 3,
                      background: active ? COLOR : 'var(--surface-3)',
                      color: active ? '#fff' : 'var(--text-3)',
                    }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 mt-5">

          {activeTab === 'guides' && (
            <TrainingGuidesTab guides={trainingGuides} onNavigate={(id) => router.push(`/standards/training/${id}`)} />
          )}

          {activeTab === 'sops' && (
            <SOPsTab sops={sops} onNavigate={(id) => router.push(`/standards/sops/${id}`)} />
          )}

          {activeTab === 'checklists' && (
            <ChecklistsTab checklists={checklists} isManager={isManager} crewMemberId={crewMemberId} />
          )}

          {activeTab === 'profile' && (
            <TrainingProfileTab
              isManager={isManager}
              crewMemberId={crewMemberId}
              crewMembers={crewMembers as Array<{ id: string; name: string }>}
              checklists={checklists}
              sops={sops}
            />
          )}

        </div>
      </div>
    </PageErrorBoundary>
  );
}

// ============================================================================
// Tab: Training Guides
// ============================================================================

function TrainingGuidesTab({ guides, onNavigate }: { guides: TrainingGuide[]; onNavigate: (id: string) => void }) {
  if (guides.length === 0) {
    return <EmptyState icon={<GraduationCap size={24} />} message="No training guides loaded" />;
  }

  const byTrade: Record<string, TrainingGuide[]> = {};
  for (const g of guides) {
    if (!byTrade[g.trade]) byTrade[g.trade] = [];
    byTrade[g.trade].push(g);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {Object.entries(byTrade).map(([trade, tradeGuides]) => {
        const style = getTradeStyle(trade);
        return (
          <div key={trade}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: style.bg, color: style.text }}>
                {trade}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{tradeGuides.length} guide{tradeGuides.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tradeGuides.map((g) => {
                const sopCount = g.modules.reduce((acc, m) => acc + (m.sopCodes?.length ?? 0), 0);
                return (
                  <button
                    key={g.id}
                    onClick={() => onNavigate(g.id)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '12px 14px',
                      background: 'var(--surface-1)', border: '1px solid var(--border)',
                      borderRadius: 10, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <GraduationCap size={16} style={{ color: style.text }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: COLOR }}>{g.code}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.title}</span>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                        {g.modules.length} modules · {sopCount} SOPs
                      </span>
                    </div>
                    <ChevronRight size={14} style={{ color: 'var(--border-strong)', flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Tab: SOPs
// ============================================================================

function SOPsTab({ sops, onNavigate }: { sops: StandardSOP[]; onNavigate: (id: string) => void }) {
  const [tradeFilter, setTradeFilter] = useState<string>('all');

  const trades = Array.from(new Set(sops.map((s) => s.trade))).sort();
  const filtered = tradeFilter === 'all' ? sops : sops.filter((s) => s.trade === tradeFilter);

  if (sops.length === 0) {
    return <EmptyState icon={<FileCheck size={24} />} message="No SOPs loaded" />;
  }

  return (
    <div>
      {/* Trade filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {['all', ...trades].map((t) => {
          const active = tradeFilter === t;
          const style = t === 'all' ? { bg: 'var(--surface-3)', text: 'var(--text-2)' } : getTradeStyle(t);
          return (
            <button
              key={t}
              onClick={() => setTradeFilter(t)}
              style={{
                padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: active ? 700 : 500,
                background: active ? style.bg : 'var(--surface-2)',
                color: active ? style.text : 'var(--text-3)',
                outline: active ? `2px solid ${COLOR}` : 'none',
                outlineOffset: 1,
              }}
            >
              {t === 'all' ? 'All Trades' : t}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.map((sop) => {
          const stopCount = sop.criticalStandards.filter((cs) => cs.category === 'stop-condition').length;
          const tradeStyle = getTradeStyle(sop.trade);
          return (
            <button
              key={sop.id}
              onClick={() => onNavigate(sop.id)}
              style={{
                width: '100%', textAlign: 'left', padding: '10px 14px',
                background: 'var(--surface-1)', border: '1px solid var(--border)',
                borderRadius: 10, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: COLOR, flexShrink: 0 }}>{sop.code}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sop.title}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: tradeStyle.text, background: tradeStyle.bg, padding: '1px 5px', borderRadius: 3 }}>{sop.trade}</span>
                  {stopCount > 0 && (
                    <span style={{ fontSize: 10, color: '#EF4444', fontWeight: 600 }}>{stopCount} stop condition{stopCount !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <Link
                  href={`/standards/sops/${sop.id}/checklist`}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '4px 8px', borderRadius: 6,
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    fontSize: 10, fontWeight: 600, color: COLOR, textDecoration: 'none',
                  }}
                >
                  <ClipboardCheck size={11} /> Checklist
                </Link>
                <ChevronRight size={14} style={{ color: 'var(--border-strong)' }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Tab: Checklists
// ============================================================================

function ChecklistsTab({
  checklists,
  isManager,
  crewMemberId,
}: {
  checklists: ChecklistSubmission[];
  isManager: boolean;
  crewMemberId: string | null;
}) {
  const visible = isManager
    ? checklists
    : checklists.filter((c) => c.technicianId === crewMemberId);

  const sorted = [...visible].sort(
    (a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime()
  );

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardCheck size={24} />}
        message={isManager ? 'No checklist submissions yet' : 'You have no submitted checklists yet'}
        hint={isManager ? undefined : 'Go to an SOP and tap Checklist to get started'}
      />
    );
  }

  const submitted = sorted.filter((c) => c.status === 'submitted' || c.status === 'approved').length;
  const passed = sorted.filter((c) => c.allPassed).length;

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <MiniStat label="Total" value={sorted.length} />
        <MiniStat label="Submitted" value={submitted} color="var(--green)" />
        <MiniStat label="All Passed" value={passed} color={COLOR} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sorted.map((cl) => (
          <ChecklistRow key={cl.id} submission={cl} showTechnician={isManager} />
        ))}
      </div>
    </div>
  );
}

function ChecklistRow({ submission: cl, showTechnician }: { submission: ChecklistSubmission; showTechnician: boolean }) {
  const isComplete = cl.status === 'submitted' || cl.status === 'approved';
  const date = cl.submittedAt ? new Date(cl.submittedAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : '—';

  return (
    <div style={{
      padding: '10px 14px', background: 'var(--surface-1)', border: '1px solid var(--border)',
      borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 6, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: cl.allPassed ? 'var(--green-dim)' : 'rgba(239,68,68,0.08)',
      }}>
        {cl.allPassed
          ? <Check size={14} style={{ color: 'var(--green)' }} />
          : <X size={14} style={{ color: '#EF4444' }} />
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: COLOR }}>{cl.sopCode}</span>
          {showTechnician && (
            <span style={{ fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cl.technicianName}</span>
          )}
        </div>
        <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{date}</span>
      </div>
      <span style={{
        fontFamily: 'var(--font-cond)', fontSize: 9, fontWeight: 700,
        letterSpacing: '0.06em', textTransform: 'uppercase',
        padding: '2px 6px', borderRadius: 3,
        background: isComplete ? 'var(--green-dim)' : 'var(--surface-3)',
        color: isComplete ? 'var(--green)' : 'var(--text-3)', flexShrink: 0,
      }}>
        {cl.status}
      </span>
    </div>
  );
}

// ============================================================================
// Tab: Training Profile
// ============================================================================

function TrainingProfileTab({
  isManager,
  crewMemberId,
  crewMembers,
  checklists,
  sops,
}: {
  isManager: boolean;
  crewMemberId: string | null;
  crewMembers: Array<{ id: string; name: string }>;
  checklists: ChecklistSubmission[];
  sops: StandardSOP[];
}) {
  const totalSops = sops.length;

  if (isManager) {
    const crew = crewMembers.length > 0 ? crewMembers : [];

    const crewStats = crew.map((member) => {
      const memberChecks = checklists.filter((c) => c.technicianId === member.id);
      const submitted = memberChecks.filter((c) => c.status === 'submitted' || c.status === 'approved');
      const uniqueSops = new Set(submitted.map((c) => c.sopCode)).size;
      const passed = submitted.filter((c) => c.allPassed).length;
      const pct = totalSops > 0 ? Math.round((uniqueSops / totalSops) * 100) : 0;
      return { ...member, total: memberChecks.length, submitted: submitted.length, uniqueSops, passed, pct };
    });

    return (
      <div>
        <div style={{ marginBottom: 14 }}>
          <span style={{ fontFamily: 'var(--font-cond)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
            Crew Training Coverage — {totalSops} SOPs total
          </span>
        </div>

        {crewStats.length === 0 ? (
          <EmptyState icon={<UserCheck size={24} />} message="No active crew members" hint="Add crew members in Admin → Crew" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {crewStats.map((member) => (
              <div key={member.id} style={{ padding: '14px 16px', background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: member.pct >= 80 ? 'var(--green-dim)' : 'var(--surface-3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700,
                      color: member.pct >= 80 ? 'var(--green)' : 'var(--text-3)',
                    }}>
                      {member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{member.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)' }}>
                        {member.uniqueSops} of {totalSops} SOPs · {member.submitted} submission{member.submitted !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700,
                    color: member.pct >= 80 ? 'var(--green)' : member.pct >= 50 ? 'var(--amber)' : 'var(--text-3)',
                  }}>
                    {member.pct}%
                  </span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: 'var(--surface-3)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3, width: `${member.pct}%`,
                    background: member.pct >= 80 ? COLOR : member.pct >= 50 ? 'var(--amber)' : 'var(--border-strong)',
                    transition: 'width 0.4s ease',
                  }} />
                </div>
                {member.submitted > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                    {Array.from(new Set(
                      checklists
                        .filter((c) => c.technicianId === member.id && (c.status === 'submitted' || c.status === 'approved'))
                        .map((c) => c.sopCode)
                    )).sort().map((code) => (
                      <span key={code} style={{
                        fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600,
                        padding: '2px 5px', borderRadius: 3,
                        background: 'var(--green-dim)', color: 'var(--green)',
                      }}>
                        {code}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Operator / Installer — own record
  const myChecks = checklists.filter((c) => c.technicianId === crewMemberId);
  const mySubmitted = myChecks.filter((c) => c.status === 'submitted' || c.status === 'approved');
  const myUniqueSops = new Set(mySubmitted.map((c) => c.sopCode));
  const myPct = totalSops > 0 ? Math.round((myUniqueSops.size / totalSops) * 100) : 0;
  const outstanding = sops.filter((s) => !myUniqueSops.has(s.code));

  return (
    <div>
      {/* Summary */}
      <div style={{ padding: '16px', background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>My Training</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
              {myUniqueSops.size} of {totalSops} SOPs completed
            </div>
          </div>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700,
            color: myPct >= 80 ? 'var(--green)' : myPct >= 50 ? 'var(--amber)' : 'var(--text-3)',
          }}>
            {myPct}%
          </span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'var(--surface-3)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 4, width: `${myPct}%`,
            background: myPct >= 80 ? COLOR : myPct >= 50 ? 'var(--amber)' : 'var(--border-strong)',
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* Completed */}
      {myUniqueSops.size > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-cond)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
              Completed ({myUniqueSops.size})
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Array.from(myUniqueSops).sort().map((code) => {
              const sop = sops.find((s) => s.code === code);
              return (
                <div key={code} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 6,
                  background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,0.2)',
                }}>
                  <Check size={11} style={{ color: 'var(--green)', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--green)' }}>{code}</span>
                  {sop && <span style={{ fontSize: 10, color: 'var(--green)', opacity: 0.8 }}>{sop.title}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Outstanding */}
      {outstanding.length > 0 && (
        <div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-cond)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
              Outstanding ({outstanding.length})
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {outstanding.map((sop) => {
              const tradeStyle = getTradeStyle(sop.trade);
              return (
                <Link
                  key={sop.id}
                  href={`/standards/sops/${sop.id}/checklist`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', textDecoration: 'none',
                    background: 'var(--surface-1)', border: '1px solid var(--border)',
                    borderRadius: 10,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--text-3)', flexShrink: 0 }}>{sop.code}</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sop.title}</span>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: tradeStyle.text, background: tradeStyle.bg, padding: '1px 5px', borderRadius: 3, marginTop: 2, display: 'inline-block' }}>{sop.trade}</span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: COLOR, flexShrink: 0 }}>Start →</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {myChecks.length === 0 && totalSops === 0 && (
        <EmptyState icon={<BookOpen size={24} />} message="No SOPs loaded yet" />
      )}
    </div>
  );
}

// ============================================================================
// Shared helpers
// ============================================================================

function EmptyState({ icon, message, hint }: { icon: React.ReactNode; message: string; hint?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 24px' }}>
      <div style={{ color: 'var(--text-3)', marginBottom: 8, display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: hint ? 6 : 0 }}>{message}</p>
      {hint && <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{hint}</p>}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ padding: '8px 12px', background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 8, flex: 1 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: color ?? 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{label}</div>
    </div>
  );
}
