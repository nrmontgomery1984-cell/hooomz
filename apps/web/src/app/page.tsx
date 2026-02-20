'use client';

/**
 * Home Page — Manager Dashboard
 *
 * Horizontal stat strip, dense project rows with status colors,
 * pipeline + task distribution mini-charts, compact attention + activity.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import {
  Plus,
  ChevronRight,
  Briefcase,
  AlertTriangle,
  GraduationCap,
  FileText,
  ArrowRight,
  CheckCircle2,
  Flame,
} from 'lucide-react';
import { SimpleActivityFeed } from '@/components/activity';
import { ToolResearchWidget } from '@/components/labs/tool-research/ToolResearchWidget';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import type { ActiveProjectSummary } from '@/lib/hooks/useDashboardData';

// ============================================================================
// Design token helpers
// ============================================================================

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

function getScoreColor(score: number): string {
  if (score >= 90) return 'var(--green)';
  if (score >= 70) return 'var(--blue)';
  if (score >= 50) return 'var(--amber)';
  if (score >= 30) return 'var(--amber)';
  return 'var(--red)';
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getDateString(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

// ============================================================================
// Page
// ============================================================================

export default function HomePage() {
  const router = useRouter();
  const dashboard = useDashboardData();

  if (dashboard.isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Attention items
  const attentionItems: AttentionItemProps[] = [];
  for (const hl of dashboard.hotLeadsNeedingContact) {
    attentionItems.push({ icon: <Flame size={13} />, color: 'var(--red)', title: `Hot lead — ${hl.name}`, subtitle: `Source: ${hl.source}`, href: '/leads' });
  }
  for (const task of dashboard.overBudgetTasks) {
    const pct = task.actualHours && task.budgetedHours ? Math.round((task.actualHours / task.budgetedHours) * 100) : 0;
    attentionItems.push({ icon: <AlertTriangle size={13} />, color: 'var(--red)', title: `Over budget: ${task.sopCode || 'Task'}`, subtitle: `${pct}% of budgeted hours`, href: task.projectId ? `/projects/${task.projectId}` : undefined });
  }
  for (const record of dashboard.readyForReview) {
    attentionItems.push({ icon: <GraduationCap size={13} />, color: 'var(--blue)', title: 'Ready for certification review', subtitle: record.sopId ? `SOP: ${record.sopId.slice(0, 8)}` : 'Training complete', href: '/labs/sops' });
  }
  for (const co of dashboard.pendingChangeOrders) {
    attentionItems.push({ icon: <FileText size={13} />, color: 'var(--amber)', title: 'Change Order — Pending', subtitle: co.description || 'Pending approval', href: co.projectId ? `/projects/${co.projectId}` : undefined });
  }

  // Pipeline data
  const pipelineStages = [
    { label: 'Lead',   count: dashboard.leadCount,          color: 'var(--text-3)' },
    { label: 'Quoted', count: dashboard.quotedCount,        color: 'var(--blue)'   },
    { label: 'Active', count: dashboard.activeProjectCount, color: 'var(--green)'  },
  ];
  const pipelineMax = Math.max(...pipelineStages.map((s) => s.count), 1);

  // Task distribution
  const totalTasks = dashboard.activeProjects.reduce((s, p) => s + p.taskCount, 0);
  const completedTasks = dashboard.activeProjects.reduce((s, p) => s + p.completedCount, 0);
  const remainingTasks = totalTasks - completedTasks;

  return (
    <PageErrorBoundary>
      <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>

        {/* ── Header ── */}
        <div style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-lg md:max-w-4xl lg:max-w-6xl mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-cond)', letterSpacing: '0.01em' }}>
                {getGreeting()}, Nathan
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{getDateString()}</p>
            </div>
            <button
              onClick={() => router.push('/intake')}
              className="md:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl"
              style={{ background: 'var(--blue)' }}
            >
              <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="max-w-lg md:max-w-4xl lg:max-w-6xl mx-auto px-4 md:px-8">

          {/* ── Stat Strip ── */}
          <div style={{ marginTop: 16, display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginLeft: -16, paddingLeft: 16, marginRight: -16, paddingRight: 16 }}>
            <StatPill label="Active"   value={dashboard.activeProjectCount} color="var(--blue)"  onClick={() => document.getElementById('todays-work')?.scrollIntoView({ behavior: 'smooth' })} />
            <StatPill label="Pipeline" value={dashboard.pipelineCount}      color="var(--text-2)" onClick={() => router.push('/leads')} />
            {dashboard.hotLeadCount > 0 && (
              <StatPill label="Hot"    value={dashboard.hotLeadCount}        color="var(--red)"   onClick={() => router.push('/leads')} />
            )}
            <StatPill label="Health"   value={`${dashboard.healthScore}%`}  color={getScoreColor(dashboard.healthScore)} />
            <StatPill label="Tasks"    value={dashboard.tasksDue}            color={dashboard.blockedCount > 0 ? 'var(--red)' : 'var(--text-2)'} />
            {dashboard.blockedCount > 0 && (
              <StatPill label="Blocked" value={dashboard.blockedCount}       color="var(--red)" />
            )}
            {dashboard.draftCount > 0 && (
              <StatPill label="Drafts" value={dashboard.draftCount}          color="var(--amber)" onClick={() => router.push('/intake')} />
            )}
          </div>

          {/* ── Content Grid ── */}
          <div className="mt-5 lg:grid lg:grid-cols-12 lg:gap-5">

            {/* Today's Work */}
            <div className="mb-5 lg:mb-0 lg:col-span-7 lg:row-span-2" id="todays-work">
              <SectionHeader title="Today's Work" count={dashboard.activeProjects.length} unit="project" />
              {dashboard.activeProjects.length === 0 ? (
                <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
                  <div style={{ width: 44, height: 44, margin: '0 auto 12px', borderRadius: 10, background: 'var(--blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Briefcase size={20} style={{ color: 'var(--blue)' }} strokeWidth={1.5} />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>No active projects</p>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 16 }}>Create a project to get started</p>
                  <button
                    onClick={() => router.push('/intake')}
                    style={{ minHeight: 40, padding: '0 24px', borderRadius: 6, fontSize: 13, fontWeight: 600, background: 'var(--blue)', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}
                  >
                    Create a Project
                  </button>
                </div>
              ) : (
                <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                  {dashboard.activeProjects.map((project, i) => (
                    <ProjectRow
                      key={project.id}
                      project={project}
                      isLast={i === dashboard.activeProjects.length - 1}
                      onClick={() => router.push(`/projects/${project.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Needs Attention */}
            <div className="mb-5 lg:mb-0 lg:col-span-5">
              <SectionHeader title="Needs Attention" />
              <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                {attentionItems.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px' }}>
                    <CheckCircle2 size={14} style={{ color: 'var(--green)' }} strokeWidth={2.5} />
                    <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Everything&apos;s on track</span>
                  </div>
                ) : (
                  <>
                    {attentionItems.map((item, i) => (
                      <AttentionItem key={i} {...item} />
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Labs */}
            <div className="mb-5 lg:mb-0 lg:col-span-5">
              <SectionHeader title="Labs" />
              <ToolResearchWidget />
            </div>

            {/* Mini Charts */}
            {(dashboard.activeProjectCount > 0 || dashboard.pipelineCount > 0) && (
              <div className="mb-5 lg:mb-0 lg:col-span-5 grid grid-cols-2 gap-3">
                {/* Pipeline funnel */}
                <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12, boxShadow: 'var(--shadow-card)' }}>
                  <p style={{ fontFamily: 'var(--font-cond)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>Pipeline</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {pipelineStages.map((s) => (
                      <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-2)', width: 36, textAlign: 'right', flexShrink: 0 }}>{s.label}</span>
                        <div style={{ flex: 1, height: 8, borderRadius: 2, background: 'var(--surface-3)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 2, width: `${Math.max((s.count / pipelineMax) * 100, 4)}%`, background: s.color, transition: 'width 0.4s' }} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--text)', width: 16, flexShrink: 0 }}>{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Task distribution donut */}
                <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12, boxShadow: 'var(--shadow-card)' }}>
                  <p style={{ fontFamily: 'var(--font-cond)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>Tasks</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
                      <svg viewBox="0 0 36 36" style={{ width: 44, height: 44 }}>
                        <circle cx="18" cy="18" r="14" fill="none" style={{ stroke: 'var(--border)' }} strokeWidth="4" />
                        {totalTasks > 0 && (
                          <circle
                            cx="18" cy="18" r="14" fill="none"
                            style={{ stroke: 'var(--green)' }}
                            strokeWidth="4"
                            strokeDasharray={`${(completedTasks / totalTasks) * 88} 88`}
                            strokeDashoffset="22"
                            strokeLinecap="round"
                          />
                        )}
                      </svg>
                      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--text)' }}>
                        {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
                        <span style={{ fontSize: 10, color: 'var(--text-2)' }}>Done {completedTasks}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--border)', flexShrink: 0 }} />
                        <span style={{ fontSize: 10, color: 'var(--text-2)' }}>Left {remainingTasks}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="mb-5 lg:mb-0 lg:col-span-7">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <SectionHeader title="Recent Activity" />
                <Link href="/activity" style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 500, color: 'var(--blue)', textDecoration: 'none', minHeight: 36 }}>
                  View All <ArrowRight size={10} />
                </Link>
              </div>
              <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                {dashboard.recentEvents.length === 0 ? (
                  <p style={{ fontSize: 11, textAlign: 'center', padding: '20px 0', color: 'var(--text-3)' }}>No activity yet</p>
                ) : (
                  <SimpleActivityFeed events={dashboard.recentEvents as any} maxItems={6} showProjectName />
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-6 lg:mb-0 lg:col-span-12">
              <SectionHeader title="Quick Actions" />
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                <QuickActionButton icon={<Plus size={12} />} label="New Lead" onClick={() => router.push('/leads/new')} />
                <QuickActionButton icon={<FileText size={12} />} label="Estimate" onClick={() => router.push('/estimates/select-project')} />
                {process.env.NODE_ENV !== 'production' && (
                  <QuickActionButton icon={<ArrowRight size={12} />} label="Seed Data" onClick={() => router.push('/labs/seed')} />
                )}
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

function SectionHeader({ title, count, unit }: { title: string; count?: number; unit?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <span style={{ fontFamily: 'var(--font-cond)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
        {title}
      </span>
      {count !== undefined && count > 0 && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>
          {count} {unit}{count !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}

function StatPill({ label, value, color, onClick }: {
  label: string;
  value: string | number;
  color: string;
  onClick?: () => void;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        borderRadius: 'var(--radius)',
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontFamily: 'var(--font-cond)', fontSize: 10, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
    </Tag>
  );
}

function ProjectRow({ project, isLast, onClick }: {
  project: ActiveProjectSummary;
  isLast: boolean;
  onClick: () => void;
}) {
  const scoreColor = getScoreColor(project.healthScore);
  const progress = project.taskCount > 0 ? Math.round((project.completedCount / project.taskCount) * 100) : 0;
  const statusStyle = getStatusStyle(project.status);

  return (
    <button
      onClick={onClick}
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
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        cursor: 'pointer',
      }}
    >
      {/* Status color bar */}
      <div style={{ width: 3, height: 32, borderRadius: 2, flexShrink: 0, background: statusStyle.color }} />

      {/* Name + status pill */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {project.name}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-cond)',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '1px 5px',
              borderRadius: 2,
              background: statusStyle.bg,
              color: statusStyle.color,
              flexShrink: 0,
            }}
          >
            {project.status.replace(/-/g, ' ')}
          </span>
        </div>
        {/* Progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 2, width: `${progress}%`, background: scoreColor, transition: 'width 0.4s' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', flexShrink: 0 }}>
            {project.completedCount}/{project.taskCount}
          </span>
        </div>
      </div>

      {/* Health score */}
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: scoreColor, flexShrink: 0 }}>
        {project.healthScore}
      </span>

      <ChevronRight size={12} style={{ color: 'var(--border-strong)', flexShrink: 0 }} />
    </button>
  );
}

interface AttentionItemProps {
  icon: React.ReactNode;
  color: string;
  title: string;
  subtitle: string;
  href?: string;
}

function AttentionItem({ icon, color, title, subtitle, href }: AttentionItemProps) {
  const router = useRouter();
  const content = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderLeft: `3px solid ${color}`, minHeight: 40 }}>
      <div style={{ color, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
        <p style={{ fontSize: 10, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</p>
      </div>
      {href && <ChevronRight size={11} style={{ color: 'var(--border-strong)', flexShrink: 0 }} />}
    </div>
  );
  if (href) {
    return (
      <button
        onClick={() => router.push(href)}
        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
      >
        {content}
      </button>
    );
  }
  return <div style={{ borderBottom: '1px solid var(--border)' }}>{content}</div>;
}

function QuickActionButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '0 12px',
        minHeight: 36,
        borderRadius: 'var(--radius)',
        fontSize: 12,
        fontWeight: 600,
        background: 'var(--surface-1)',
        color: 'var(--text)',
        border: '1px solid var(--border)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        fontFamily: 'var(--font-cond)',
        letterSpacing: '0.04em',
      }}
    >
      <span style={{ color: 'var(--blue)' }}>{icon}</span>
      {label}
    </button>
  );
}
