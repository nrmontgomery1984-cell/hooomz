'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { useLeadPipeline } from '@/lib/hooks/useLeadData';
import type { LeadStage, LeadRecord } from '@/lib/hooks/useLeadData';
// LeadStage used in PIPELINE_STAGES.leadStages type

const MONO = "'DM Mono', monospace";
const FIG = "'Figtree', sans-serif";

// ============================================================================
// CONSTANTS
// ============================================================================

type PipelineStage = 'new' | 'contacted' | 'site_visit' | 'estimated' | 'contracted';

const PIPELINE_STAGES: { key: PipelineStage; label: string; color: string; leadStages: LeadStage[] }[] = [
  { key: 'new',        label: 'New',        color: '#2C5F8A', leadStages: ['new'] },
  { key: 'contacted',  label: 'Contacted',  color: '#D4830A', leadStages: ['contacted'] },
  { key: 'site_visit', label: 'Site Visit', color: '#7C3AED', leadStages: ['site_visit'] },
  { key: 'estimated',  label: 'Estimated',  color: '#2D7A4F', leadStages: ['quote_sent'] },
  { key: 'contracted', label: 'Contracted', color: '#1A1714', leadStages: ['won'] },
];

function formatBudget(range: string): string {
  if (!range) return '—';
  const labels: Record<string, string> = {
    'under-5k': '<$5K', '5k-10k': '$5–10K', '10k-20k': '$10–20K', '20k+': '$20K+', 'unknown': '—',
  };
  return labels[range] ?? range;
}

function daysSince(dateStr: string | undefined): number {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function freshness(days: number): { color: string; label: string } {
  if (days <= 1) return { color: '#2D7A4F', label: 'Today' };
  if (days <= 3) return { color: '#2D7A4F', label: `${days}d` };
  if (days <= 7) return { color: '#D4830A', label: `${days}d` };
  return { color: '#C0392B', label: `${days}d` };
}

// ============================================================================
// DERIVED DATA
// ============================================================================

interface UrgentItem {
  name: string;
  reason: string;
  severity: 'red' | 'amber';
}

function computeUrgent(leads: LeadRecord[]): UrgentItem[] {
  const items: UrgentItem[] = [];
  for (const lead of leads) {
    if (lead.stage === 'won' || lead.stage === 'lost') continue;
    const name = `${lead.customer.firstName} ${lead.customer.lastName}`.trim() || 'Unknown';
    const days = daysSince(lead.customer.metadata?.updatedAt ?? lead.customer.metadata?.createdAt);

    if (lead.isOverdueFollowUp) {
      items.push({ name, reason: 'Follow-up overdue', severity: 'red' });
      continue;
    }
    if (days >= 5) {
      items.push({ name, reason: `No contact in ${days}d`, severity: 'red' });
      continue;
    }
    if (days >= 3) {
      items.push({ name, reason: `No contact in ${days}d`, severity: 'amber' });
    }
  }
  items.sort((a, b) => (a.severity === 'red' ? -1 : 1) - (b.severity === 'red' ? -1 : 1));
  return items;
}

// ============================================================================
// PAGE
// ============================================================================

export default function DesignDashboardPage() {
  const { leads, isLoading } = useLeadPipeline();

  const totalActive = leads.filter((l) => l.stage !== 'lost').length;
  const won = leads.filter((l) => l.stage === 'won').length;
  const convRate = leads.length > 0 ? Math.round((won / leads.length) * 100) : 0;

  const urgent = useMemo(() => computeUrgent(leads), [leads]);

  // Source breakdown
  const sources = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of leads) {
      const s = l.source || 'Unknown';
      map[s] = (map[s] || 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [leads]);

  // Leads sorted by urgency
  const sortedLeads = useMemo(() => {
    return [...leads]
      .filter((l) => l.stage !== 'won' && l.stage !== 'lost')
      .sort((a, b) => {
        const aDays = daysSince(a.customer.metadata?.updatedAt ?? a.customer.metadata?.createdAt);
        const bDays = daysSince(b.customer.metadata?.updatedAt ?? b.customer.metadata?.createdAt);
        return bDays - aDays;
      });
  }, [leads]);

  // Stage velocity (avg days per pipeline stage)
  const velocity = useMemo(() => {
    return PIPELINE_STAGES.map((ps) => {
      const inStage = leads.filter((l) => ps.leadStages.includes(l.stage));
      if (inStage.length === 0) return { ...ps, avgDays: 0 };
      const total = inStage.reduce((s, l) => s + daysSince(l.customer.metadata?.updatedAt ?? l.customer.metadata?.createdAt), 0);
      return { ...ps, avgDays: Math.round(total / inStage.length) };
    });
  }, [leads]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9C9690' }}>
          Loading pipeline...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0EDE8', padding: '0 32px 32px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>

        {/* ── LAYER 1: URGENT STRIP ── */}
        {urgent.length > 0 ? (
          <div style={{ padding: '12px 0 16px', borderBottom: '1px solid #E0DCD7', marginBottom: 24 }}>
            <div style={{ fontFamily: MONO, fontSize: 8, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: urgent.some((u) => u.severity === 'red') ? '#C0392B' : '#D4830A', marginBottom: 8 }}>
              Action Required — {urgent.length} lead{urgent.length !== 1 ? 's' : ''}
            </div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
              {urgent.map((item, i) => {
                const bc = item.severity === 'red' ? '#C0392B' : '#D4830A';
                return (
                  <div key={i} style={{ flexShrink: 0, padding: '8px 12px', background: '#FAF8F5', border: `1px solid ${bc}30`, borderLeft: `3px solid ${bc}`, borderRadius: 6, minWidth: 180 }}>
                    <div style={{ fontFamily: FIG, fontSize: 13, fontWeight: 600, color: '#1A1714' }}>{item.name}</div>
                    <div style={{ fontFamily: MONO, fontSize: 9, color: bc, marginTop: 2 }}>{item.reason}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ padding: '12px 0 16px', borderBottom: '1px solid #E0DCD7', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2D7A4F' }} />
            <span style={{ fontFamily: MONO, fontSize: 9, color: '#2D7A4F', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Pipeline clear — no overdue actions</span>
          </div>
        )}

        {/* ── LAYER 2: STAT TILES ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
          <StatTile label="Pipeline Value" value="—" sub="Estimate data pending" accent="#D4830A" />
          <StatTile label="Active Leads" value={String(totalActive)} accent="#1A1714" />
          <StatTile label="Avg Deal" value="—" sub="Estimate data pending" accent="#2C5F8A" />
          <StatTile label="Conversion" value={`${convRate}%`} sub={`${won} won / ${leads.length} total`} accent="#2D7A4F" />
        </div>

        {/* ── LAYER 3: DETAIL ── */}
        <div style={{ display: 'flex', gap: 20 }}>

          {/* Left: Leads urgency view */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6B6660', marginBottom: 10 }}>
              Active Leads — by urgency
            </div>

            {sortedLeads.length === 0 ? (
              <div style={{ background: '#FAF8F5', border: '1px solid #E0DCD7', borderRadius: 8, padding: 32, textAlign: 'center' }}>
                <div style={{ fontFamily: FIG, fontSize: 14, color: '#6B6660', marginBottom: 12 }}>No leads in pipeline</div>
                <Link href="/leads/new" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#2D7A4F', textDecoration: 'none', padding: '8px 16px', border: '1px solid #2D7A4F', borderRadius: 5 }}>
                  Add first lead
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {sortedLeads.map((lead) => {
                  const name = `${lead.customer.firstName} ${lead.customer.lastName}`.trim() || 'Unknown';
                  const days = daysSince(lead.customer.metadata?.updatedAt ?? lead.customer.metadata?.createdAt);
                  const fresh = freshness(days);
                  const stageInfo = PIPELINE_STAGES.find((ps) => ps.leadStages.includes(lead.stage));
                  const stageColor = stageInfo?.color ?? '#9C9690';
                  const stageLabel = stageInfo?.label ?? lead.stage.replace('_', ' ');

                  return (
                    <div key={lead.customer.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#FAF8F5', border: '1px solid #E0DCD7', borderRadius: 6 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: FIG, fontSize: 13, fontWeight: 600, color: '#1A1714', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                        <div style={{ fontFamily: MONO, fontSize: 8, color: '#9C9690', marginTop: 2 }}>{lead.source || '—'}</div>
                      </div>
                      <span style={{ fontFamily: MONO, fontSize: 8, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: stageColor, background: `${stageColor}12`, border: `1px solid ${stageColor}25`, borderRadius: 3, padding: '2px 7px', whiteSpace: 'nowrap' }}>
                        {stageLabel}
                      </span>
                      <span style={{ fontFamily: MONO, fontSize: 10, color: '#6B6660', minWidth: 52, textAlign: 'right' }}>
                        {formatBudget(lead.budgetRange)}
                      </span>
                      <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, color: fresh.color, minWidth: 32, textAlign: 'right' }}>
                        {fresh.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Velocity + Sources */}
          <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Stage velocity */}
            <div style={{ background: '#FAF8F5', border: '1px solid #E0DCD7', borderRadius: 8, padding: 16 }}>
              <div style={{ fontFamily: MONO, fontSize: 8, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6B6660', marginBottom: 14 }}>
                Stage Velocity
              </div>
              {velocity.map((v) => {
                const maxDays = Math.max(...velocity.map((x) => x.avgDays), 1);
                return (
                  <div key={v.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 8, color: '#9C9690', width: 52, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{v.label}</span>
                    <div style={{ flex: 1, height: 5, background: '#E8E4DE', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${maxDays > 0 ? (v.avgDays / maxDays) * 100 : 0}%`, background: v.color, borderRadius: 2, minWidth: v.avgDays > 0 ? 3 : 0 }} />
                    </div>
                    <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 500, color: '#1A1714', width: 24, textAlign: 'right' }}>{v.avgDays > 0 ? `${v.avgDays}d` : '—'}</span>
                  </div>
                );
              })}
            </div>

            {/* Lead sources */}
            <div style={{ background: '#FAF8F5', border: '1px solid #E0DCD7', borderRadius: 8, padding: 16 }}>
              <div style={{ fontFamily: MONO, fontSize: 8, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6B6660', marginBottom: 14 }}>
                Lead Sources
              </div>
              {sources.length === 0 ? (
                <div style={{ fontFamily: MONO, fontSize: 9, color: '#9C9690', textAlign: 'center', padding: 16 }}>No source data</div>
              ) : (
                sources.map(([source, count]) => (
                  <div key={source} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontFamily: FIG, fontSize: 12, color: '#1A1714' }}>{source}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontFamily: MONO, fontSize: 9, color: '#6B6660' }}>{count}</span>
                      <span style={{ fontFamily: MONO, fontSize: 8, color: '#9C9690', width: 28, textAlign: 'right' }}>{leads.length > 0 ? `${Math.round((count / leads.length) * 100)}%` : '—'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STAT TILE
// ============================================================================

function StatTile({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div style={{ background: '#FAF8F5', border: '1px solid #E0DCD7', borderTop: `3px solid ${accent}`, borderRadius: 8, padding: '14px 16px' }}>
      <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 500, color: '#1A1714', lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: MONO, fontSize: 8, color: '#6B6660', marginTop: 5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
      {sub && <div style={{ fontFamily: MONO, fontSize: 8, color: '#9C9690', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}
