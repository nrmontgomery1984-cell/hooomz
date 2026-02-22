'use client';

/**
 * Work Dashboard — Active projects, lead pipeline, schedule overview
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import { ChevronRight, Briefcase, Users, Calculator, FolderOpen, Calendar } from 'lucide-react';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import { useLeadPipeline } from '@/lib/hooks/useLeadData';
import type { LeadStage } from '@/lib/hooks/useLeadData';
import { SECTION_COLORS } from '@/lib/viewmode';

// ============================================================================
// Helpers
// ============================================================================

const STAGE_LABELS: Record<LeadStage, string> = {
  new: 'New',
  contacted: 'Contacted',
  discovery: 'Discovery',
  site_visit: 'Site Visit',
  quote_sent: 'Quote Sent',
  won: 'Won',
  lost: 'Lost',
};

const STAGE_COLORS: Record<LeadStage, string> = {
  new: 'var(--text-3)',
  contacted: 'var(--blue)',
  discovery: 'var(--amber)',
  site_visit: 'var(--amber)',
  quote_sent: 'var(--blue)',
  won: 'var(--green)',
  lost: 'var(--red)',
};

function getScoreColor(score: number): string {
  if (score >= 90) return 'var(--green)';
  if (score >= 70) return 'var(--blue)';
  if (score >= 50) return 'var(--amber)';
  return 'var(--red)';
}

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  lead:          { color: 'var(--text-3)',  bg: 'var(--surface-3)'  },
  quoted:        { color: 'var(--blue)',    bg: 'var(--blue-dim)'   },
  approved:      { color: 'var(--amber)',   bg: 'var(--amber-dim)'  },
  'in-progress': { color: 'var(--blue)',    bg: 'var(--blue-dim)'   },
  complete:      { color: 'var(--green)',   bg: 'var(--green-dim)'  },
  'on-hold':     { color: 'var(--red)',     bg: 'var(--red-dim)'    },
  cancelled:     { color: 'var(--text-3)',  bg: 'var(--surface-3)'  },
};

function getStatusStyle(status: string) {
  return STATUS_STYLES[status] || { color: 'var(--text-3)', bg: 'var(--surface-3)' };
}

// ============================================================================
// Page
// ============================================================================

export default function WorkDashboard() {
  const router = useRouter();
  const dashboard = useDashboardData();
  const leadPipeline = useLeadPipeline();

  if (dashboard.isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: SECTION_COLORS.work, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Pipeline data for bar chart
  const pipelineStages: LeadStage[] = ['new', 'contacted', 'discovery', 'site_visit', 'quote_sent'];
  const maxStageCount = Math.max(...pipelineStages.map((s) => leadPipeline.counts[s] || 0), 1);

  return (
    <PageErrorBoundary>
      <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>

        {/* Header */}
        <div style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: SECTION_COLORS.work }} />
              <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-cond)', letterSpacing: '0.02em' }}>
                Work Dashboard
              </h1>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Projects, leads, and schedule</p>
          </div>
        </div>

        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6">

          {/* Stat Row */}
          <div
            style={{ marginTop: 16, display: 'grid', gap: 10 }}
            className="grid-cols-2 md:grid-cols-4"
          >
            <StatCard icon={<Users size={14} />} label="New Leads" value={leadPipeline.counts.new} color={SECTION_COLORS.work} />
            <StatCard icon={<Calculator size={14} />} label="Open Estimates" value={dashboard.quotedCount} color={SECTION_COLORS.work} />
            <StatCard icon={<FolderOpen size={14} />} label="Active Projects" value={dashboard.activeProjectCount} color={SECTION_COLORS.work} />
            <StatCard icon={<Calendar size={14} />} label="Scheduled Hours" value="—" color={SECTION_COLORS.work} />
            {/* TODO: wire scheduled hours from useTeamWeekSchedule */}
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
              {/* Active Projects */}
              <div>
                <SectionHeader title="Active Projects" count={dashboard.activeProjects.length} />
                <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                  {dashboard.activeProjects.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center' }}>
                      <Briefcase size={20} style={{ color: 'var(--text-3)', margin: '0 auto 8px' }} />
                      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>No active projects</p>
                    </div>
                  ) : (
                    dashboard.activeProjects.map((project, i) => {
                      const scoreColor = getScoreColor(project.healthScore);
                      const progress = project.taskCount > 0 ? Math.round((project.completedCount / project.taskCount) * 100) : 0;
                      const statusStyle = getStatusStyle(project.status);

                      return (
                        <button
                          key={project.id}
                          onClick={() => router.push(`/projects/${project.id}`)}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '10px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            minHeight: 48,
                            background: 'none',
                            border: 'none',
                            borderBottom: i < dashboard.activeProjects.length - 1 ? '1px solid var(--border)' : 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ width: 3, height: 32, borderRadius: 2, flexShrink: 0, background: statusStyle.color }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {project.name}
                              </span>
                              <span style={{
                                fontFamily: 'var(--font-cond)', fontSize: 9, fontWeight: 700,
                                letterSpacing: '0.06em', textTransform: 'uppercase',
                                padding: '1px 5px', borderRadius: 2,
                                background: statusStyle.bg, color: statusStyle.color, flexShrink: 0,
                              }}>
                                {project.status.replace(/-/g, ' ')}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: 2, width: `${progress}%`, background: scoreColor, transition: 'width 0.4s' }} />
                              </div>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', flexShrink: 0 }}>
                                {project.completedCount}/{project.taskCount}
                              </span>
                            </div>
                          </div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: scoreColor, flexShrink: 0 }}>
                            {project.healthScore}
                          </span>
                          <ChevronRight size={12} style={{ color: 'var(--border-strong)', flexShrink: 0 }} />
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Lead Pipeline */}
              <div>
                <SectionHeader title="Lead Pipeline" count={leadPipeline.leads.length} />
                <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, boxShadow: 'var(--shadow-card)' }}>
                  {leadPipeline.leads.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 16 }}>
                      <Users size={20} style={{ color: 'var(--text-3)', margin: '0 auto 8px' }} />
                      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>No leads in pipeline</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {pipelineStages.map((stage) => {
                        const count = leadPipeline.counts[stage] || 0;
                        return (
                          <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-2)', width: 64, textAlign: 'right', flexShrink: 0 }}>
                              {STAGE_LABELS[stage]}
                            </span>
                            <div style={{ flex: 1, height: 12, borderRadius: 4, background: 'var(--surface-3)', overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', borderRadius: 4,
                                width: `${Math.max((count / maxStageCount) * 100, count > 0 ? 8 : 0)}%`,
                                background: STAGE_COLORS[stage],
                                transition: 'width 0.4s',
                              }} />
                            </div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--text)', width: 24, flexShrink: 0 }}>
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <Link
                    href="/leads"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      marginTop: 12, padding: '8px 0', fontSize: 11, fontWeight: 600,
                      color: SECTION_COLORS.work, textDecoration: 'none',
                    }}
                  >
                    View All Leads <ChevronRight size={10} />
                  </Link>
                </div>
              </div>
            </div>

            {/* This Week Schedule */}
            <div>
              <SectionHeader title="This Week" />
              <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
                <Calendar size={20} style={{ color: 'var(--text-3)', margin: '0 auto 8px' }} />
                <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Schedule overview coming soon</p>
                {/* TODO: wire useTeamWeekSchedule to show this week's scheduled items */}
                <Link
                  href="/schedule"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 11, fontWeight: 600, color: SECTION_COLORS.work, textDecoration: 'none' }}
                >
                  Open Schedule <ChevronRight size={10} />
                </Link>
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

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <span style={{ fontFamily: 'var(--font-cond)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
        {title}
      </span>
      {count !== undefined && count > 0 && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>
          {count}
        </span>
      )}
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
