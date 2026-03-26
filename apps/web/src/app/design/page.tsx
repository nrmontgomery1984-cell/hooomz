'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { useLeadPipeline } from '@/lib/hooks/useLeadData';
import type { LeadStage } from '@/lib/hooks/useLeadData';

const MONO = "'DM Mono', monospace";
const FIG = "'Figtree', sans-serif";

const DESIGN_PHASES = [
  { letter: 'D', name: 'Discover', href: '/design/discover', stages: ['new', 'contacted'] as LeadStage[] },
  { letter: 'E', name: 'Estimate', href: '/design/estimate', stages: ['discovery'] as LeadStage[] },
  { letter: 'S', name: 'Survey', href: '/design/survey', stages: ['site_visit'] as LeadStage[] },
  { letter: 'I', name: 'Iterations', href: '/design/iterations', stages: ['quote_sent'] as LeadStage[] },
  { letter: 'G', name: 'Go-Ahead', href: '/design/go-ahead', stages: ['won'] as LeadStage[] },
  { letter: 'N', name: 'Notify', href: '/design/notify', stages: [] as LeadStage[] },
];

const TEMP_COLORS: Record<string, { color: string; bg: string }> = {
  hot:  { color: '#2D7A4F', bg: '#EEF5F1' },
  warm: { color: '#D4830A', bg: '#FDF7EE' },
  cool: { color: '#9C9690', bg: '#E8E4DE' },
};

function formatBudget(range: string): string {
  if (!range) return '—';
  const labels: Record<string, string> = {
    'under-5k': 'Under $5K',
    '5k-10k': '$5K–$10K',
    '10k-20k': '$10K–$20K',
    '20k+': '$20K+',
    'unknown': '—',
  };
  return labels[range] ?? range;
}

export default function DesignDashboardPage() {
  const { leads, counts, isLoading } = useLeadPipeline();

  const phaseCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const phase of DESIGN_PHASES) {
      map[phase.letter] = phase.stages.reduce((sum, s) => sum + (counts[s] || 0), 0);
    }
    return map;
  }, [counts]);

  const recentLeads = useMemo(() => {
    return [...leads]
      .sort((a, b) => {
        const aDate = a.customer.metadata?.createdAt ?? '';
        const bDate = b.customer.metadata?.createdAt ?? '';
        return bDate.localeCompare(aDate);
      })
      .slice(0, 5);
  }, [leads]);

  const totalActive = leads.filter((l) => l.stage !== 'lost').length;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9C9690' }}>
          Loading pipeline...
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#F0EDE8', padding: 32 }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 500, color: '#2C2926', letterSpacing: '-0.02em' }}>
            DESIGN
          </div>
          <div style={{ fontFamily: FIG, fontSize: 14, color: '#6B6660', marginTop: 4, marginBottom: 48 }}>
            Sales pipeline — Discover through Notify
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: 16 }}>
            <div style={{ fontFamily: FIG, fontSize: 16, color: '#6B6660' }}>
              No leads in pipeline
            </div>
            <Link
              href="/leads/new"
              style={{
                fontFamily: MONO,
                fontSize: 12,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#2D7A4F',
                textDecoration: 'none',
                padding: '10px 20px',
                border: '1px solid #2D7A4F',
                borderRadius: 6,
              }}
            >
              Add first lead
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0EDE8', padding: 32 }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 500, color: '#2C2926', letterSpacing: '-0.02em' }}>
            DESIGN
          </div>
          <div style={{ fontFamily: FIG, fontSize: 14, color: '#6B6660', marginTop: 4 }}>
            Sales pipeline — Discover through Notify
          </div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: '#9C9690', marginTop: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {totalActive} active lead{totalActive !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Phase Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 40 }}>
          {DESIGN_PHASES.map((phase) => (
            <Link
              key={phase.letter}
              href={phase.href}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div
                style={{
                  background: '#FAF8F5',
                  border: '1px solid #E0DCD7',
                  borderRadius: 10,
                  padding: 20,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#C4BFB8'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#E0DCD7'; }}
              >
                <div style={{ fontFamily: MONO, fontSize: 32, fontWeight: 600, color: '#2C2926', lineHeight: 1 }}>
                  {phase.letter}
                </div>
                <div style={{ fontFamily: FIG, fontSize: 12, color: '#6B6660', marginTop: 6, marginBottom: 12 }}>
                  {phase.name}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 500, color: '#2C2926' }}>
                  {phaseCounts[phase.letter] ?? 0}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 9, color: '#9C9690', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>
                  lead{(phaseCounts[phase.letter] ?? 0) !== 1 ? 's' : ''}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Leads */}
        <div>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6B6660', marginBottom: 12 }}>
            Recent Leads
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentLeads.map((lead) => {
              const temp = TEMP_COLORS[lead.temperature] ?? TEMP_COLORS.cool;
              return (
                <div
                  key={lead.customer.id}
                  style={{
                    background: '#FAF8F5',
                    border: '1px solid #E0DCD7',
                    borderRadius: 8,
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: FIG, fontSize: 14, fontWeight: 500, color: '#2C2926', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {`${lead.customer.firstName} ${lead.customer.lastName}`.trim() || 'Unknown'}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: '#9C9690', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>
                      {lead.stage.replace('_', ' ')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 10,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: temp.color,
                        background: temp.bg,
                        padding: '3px 10px',
                        borderRadius: 99,
                      }}
                    >
                      {lead.temperature}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 12, color: '#6B6660', minWidth: 64, textAlign: 'right' }}>
                      {formatBudget(lead.budgetRange)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
