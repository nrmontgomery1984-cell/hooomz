'use client';

/**
 * Production Dashboard
 *
 * Shows active jobs by SCRIPT stage: Shield → Clear → Ready → Install → Punch → Turnover
 * Reads from existing projects IndexedDB store. Maps ProjectStatus to SCRIPT display labels.
 */

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import {
  Plus,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
} from 'lucide-react';
import { SECTION_COLORS } from '@/lib/viewmode';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import { useLocalRecentActivity } from '@/lib/hooks/useLocalData';
import { threeDotHex } from '@/lib/constants/threeDot';
import { useAllJobHealth } from '@/lib/hooks/useJobHealth';
import { useServicesContext } from '@/lib/services/ServicesContext';
import {
  SCRIPT_STAGES,
  JOB_STAGE_META,
  ProjectStatus,
} from '@hooomz/shared-contracts';
import type { JobStage } from '@hooomz/shared-contracts';

const COLOR = SECTION_COLORS.production;

// ============================================================================
// Helpers
// ============================================================================

function getDateString(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatRelativeTime(ts: unknown): string {
  if (!ts) return '';
  const d = new Date(String(ts));
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

function formatEventLabel(event: Record<string, unknown>): string {
  const type = String(event.event_type || event.eventType || '');
  const desc = String(event.description || event.metadata || '');
  const readable = type.replace(/[._]/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
  if (desc && desc !== 'undefined' && desc !== '[object Object]') {
    return desc.length > 60 ? desc.slice(0, 57) + '...' : desc;
  }
  return readable;
}

/**
 * Fallback: infer SCRIPT stage from ProjectStatus for projects without jobStage.
 * Will be removed once all project records carry jobStage.
 */
function inferScriptStage(status: string): JobStage | null {
  switch (status) {
    case ProjectStatus.APPROVED:    return 'shield' as JobStage;
    case ProjectStatus.IN_PROGRESS: return 'install' as JobStage;
    case ProjectStatus.COMPLETE:    return 'turnover' as JobStage;
    default:                        return null;
  }
}

/** Resolve a project's SCRIPT stage — prefer jobStage, fallback to inference. */
function resolveScriptStage(project: { jobStage?: JobStage; status: string }): JobStage | null {
  return (project.jobStage as JobStage) ?? inferScriptStage(project.status);
}

// ============================================================================
// Labour Donut Chart
// ============================================================================

const DONUT_TRADES = ['Flooring', 'Trim', 'Paint', 'Tile', 'Other'] as const;
const DONUT_OPACITIES = [1.0, 0.72, 0.50, 0.34, 0.20];

type TradeSlice = { trade: string; budgeted: number; actual: number };

function DonutChart({ slices, size = 120 }: { slices: TradeSlice[]; size?: number }) {
  const total = slices.reduce((s, sl) => s + Math.max(sl.actual, sl.budgeted), 0);
  if (total === 0) return null;

  const r = size / 2;
  const strokeWidth = 18;
  const innerR = r - strokeWidth / 2;
  const circumference = 2 * Math.PI * innerR;

  let offset = 0;
  const arcs = slices.map((sl, i) => {
    const fraction = Math.max(sl.actual, sl.budgeted) / total;
    const dashLen = fraction * circumference;
    const gapLen = circumference - dashLen;
    const arc = (
      <circle
        key={sl.trade}
        cx={r}
        cy={r}
        r={innerR}
        fill="none"
        stroke="var(--charcoal)"
        strokeWidth={strokeWidth}
        strokeDasharray={`${dashLen} ${gapLen}`}
        strokeDashoffset={-offset}
        opacity={DONUT_OPACITIES[i] ?? 0.15}
        style={{ transition: 'stroke-dasharray 0.3s ease' }}
      />
    );
    offset += dashLen;
    return arc;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      {arcs}
    </svg>
  );
}

function LabourDonutCard({
  projectIds,
}: {
  projectIds: string[];
}) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  // Pull material selections across all active projects to get trade breakdown
  const { data: tradeData } = useQuery({
    queryKey: ['production', 'labourDonut', ...projectIds],
    queryFn: async () => {
      const tradeMap = new Map<string, { budgeted: number; actual: number }>();
      for (const trade of DONUT_TRADES) {
        tradeMap.set(trade, { budgeted: 0, actual: 0 });
      }

      for (const pid of projectIds) {
        // Get material selections for budgeted hours by trade
        const sels = await services!.materialSelection.findByProject(pid).catch(() => []);
        for (const sel of sels) {
          const tradeName = sel.trade || 'Other';
          const matchedTrade = DONUT_TRADES.find((t) => tradeName.toLowerCase().includes(t.toLowerCase())) || 'Other';
          const bucket = tradeMap.get(matchedTrade)!;
          bucket.budgeted += sel.quantity || 0;
        }
      }

      return Array.from(tradeMap.entries()).map(([trade, data]) => ({
        trade,
        budgeted: data.budgeted,
        actual: data.actual,
      }));
    },
    enabled: !servicesLoading && !!services && projectIds.length > 0,
    staleTime: 30_000,
  });

  const slices = tradeData ?? [];
  const hasData = slices.some((s) => s.budgeted > 0 || s.actual > 0);

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: 16, boxShadow: 'var(--shadow-card)',
    }}>
      {!hasData ? (
        <div style={{ textAlign: 'center', padding: 16 }}>
          <Clock size={20} style={{ color: 'var(--muted)', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>No time entries yet</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <DonutChart slices={slices} size={120} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {slices.map((sl, i) => (
              <div key={sl.trade} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--charcoal)', opacity: DONUT_OPACITIES[i] ?? 0.15, flexShrink: 0 }} />
                <span style={{ flex: 1, color: 'var(--mid)', fontWeight: 500 }}>{sl.trade}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', width: 48, textAlign: 'right' }}>
                  {sl.budgeted.toFixed(1)}h
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--charcoal)', fontWeight: 600, width: 48, textAlign: 'right' }}>
                  {sl.actual.toFixed(1)}h
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10, width: 48, textAlign: 'right',
                  color: sl.actual > sl.budgeted && sl.budgeted > 0 ? 'var(--red)' : 'var(--muted)',
                }}>
                  {sl.budgeted > 0 ? `${sl.actual > sl.budgeted ? '+' : ''}${(sl.actual - sl.budgeted).toFixed(1)}` : '—'}
                </span>
              </div>
            ))}
            {/* Legend header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', marginTop: 2 }}>
              <span style={{ flex: 1 }} />
              <span style={{ width: 10, flexShrink: 0 }} />
              <span style={{ width: 48, textAlign: 'right' }}>Budget</span>
              <span style={{ width: 48, textAlign: 'right' }}>Actual</span>
              <span style={{ width: 48, textAlign: 'right' }}>Var</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Page
// ============================================================================

export default function ProductionDashboardPage() {
  const router = useRouter();
  const dashboard = useDashboardData();
  const { data: activityData } = useLocalRecentActivity(5);

  // Three-Dot weighted health scores for all active projects
  const projectIds = dashboard.activeProjects.map((p) => p.id);
  const { data: healthMap } = useAllJobHealth(projectIds);

  /** Get weighted health score — falls back to simple task completion % */
  function getHealthScore(projectId: string, fallback: number): number {
    const h = healthMap?.get(projectId);
    return h ? h.score : fallback;
  }

  // Needs attention — must be before early return (hooks can't be conditional)
  const allProjects = dashboard.activeProjects;
  const needsAttention = useMemo(() => {
    const items: Array<{ icon: React.ReactNode; color: string; title: string; subtitle: string; href?: string }> = allProjects
      .filter((p) => {
        const h = healthMap?.get(p.id);
        const score = h ? h.score : p.healthScore;
        return score < 70;
      })
      .map((p) => {
        const h = healthMap?.get(p.id);
        const score = h ? h.score : p.healthScore;
        return {
          icon: <AlertTriangle size={13} />,
          color: threeDotHex(score),
          title: p.name,
          subtitle: `Health: ${score}% — ${p.completedCount}/${p.taskCount} tasks`,
          href: `/projects/${p.id}`,
        };
      });

    for (const task of dashboard.overBudgetTasks) {
      const pct = task.actualHours && task.budgetedHours ? Math.round((task.actualHours / task.budgetedHours) * 100) : 0;
      items.push({
        icon: <AlertTriangle size={13} />,
        color: 'var(--red)',
        title: `Over budget: ${task.sopCode || 'Task'}`,
        subtitle: `${pct}% of budgeted hours`,
        href: task.projectId ? `/projects/${task.projectId}` : undefined,
      });
    }
    return items;
  }, [allProjects, dashboard.overBudgetTasks, healthMap]);

  if (dashboard.isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: COLOR, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 11, color: 'var(--muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Map active projects to SCRIPT stages
  const scriptCounts: Record<string, number> = {};
  for (const stage of SCRIPT_STAGES) {
    scriptCounts[stage] = 0;
  }
  for (const project of allProjects) {
    const mapped = resolveScriptStage(project);
    if (mapped && scriptCounts[mapped] !== undefined) {
      scriptCounts[mapped]++;
    }
  }

  const stageCounters = SCRIPT_STAGES.map((stage) => ({
    stage,
    label: JOB_STAGE_META[stage].label,
    count: scriptCounts[stage] || 0,
  }));

  const recentEvents = (activityData?.events as unknown as Array<Record<string, unknown>>) ?? [];

  // Active jobs (most recent 5)
  const activeJobs = allProjects.slice(0, 5);

  return (
    <PageErrorBoundary>
      <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>

        {/* Header */}
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR }} />
                <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--charcoal)', fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}>
                  Production
                </h1>
              </div>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{getDateString()}</p>
            </div>
          </div>
        </div>

        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6">

          {/* SCRIPT Stage Counter Cards */}
          <div style={{ marginTop: 16, display: 'flex', gap: 8, overflowX: 'auto' }}>
            {stageCounters.map(({ stage, label, count }) => (
              <button
                key={stage}
                onClick={() => router.push(`/production/jobs?stage=${stage}`)}
                style={{
                  flex: '1 0 0',
                  minWidth: 72,
                  padding: '12px 6px',
                  borderRadius: 'var(--radius)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-card)',
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
              >
                <p style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 22,
                  fontWeight: 700,
                  color: count > 0 ? 'var(--charcoal)' : 'var(--muted)',
                  lineHeight: 1,
                }}>
                  {count}
                </p>
                <p style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: count > 0 ? COLOR : 'var(--muted)',
                  marginTop: 6,
                }}>
                  {label}
                </p>
              </button>
            ))}
          </div>

          {/* Content Grid */}
          <div className="mt-5" style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'grid', gap: 16 }} className="md:grid-cols-[1fr_1fr]">

              {/* Active Jobs */}
              <div>
                <SectionHeader title="Active Jobs" />
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                  {activeJobs.length === 0 ? (
                    <div style={{ padding: '16px 12px', textAlign: 'center' }}>
                      <p style={{ fontSize: 12, color: 'var(--muted)' }}>No active jobs</p>
                    </div>
                  ) : (
                    activeJobs.map((job, i) => {
                      const scriptStage = resolveScriptStage(job);
                      const stageLabel = scriptStage ? JOB_STAGE_META[scriptStage]?.label : job.status;
                      return (
                        <button
                          key={job.id}
                          onClick={() => router.push(`/projects/${job.id}`)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 12px',
                            width: '100%',
                            textAlign: 'left',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            borderBottom: i < activeJobs.length - 1 ? '1px solid var(--border)' : 'none',
                            minHeight: 48,
                          }}
                        >
                          {/* Health dot — Three-Dot weighted */}
                          <div style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: threeDotHex(getHealthScore(job.id, job.healthScore)),
                            flexShrink: 0,
                          }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--charcoal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {job.name}
                            </p>
                            <p style={{ fontSize: 10, color: 'var(--muted)' }}>
                              {job.completedCount}/{job.taskCount} tasks
                            </p>
                          </div>
                          {/* SCRIPT stage badge */}
                          <span style={{
                            fontSize: 9,
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: 'var(--blue-bg)',
                            color: COLOR,
                            flexShrink: 0,
                          }}>
                            {stageLabel}
                          </span>
                          <ChevronRight size={11} style={{ color: 'var(--border-strong)', flexShrink: 0 }} />
                        </button>
                      );
                    })
                  )}
                  <Link
                    href="/production/jobs"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      padding: '8px 12px',
                      fontSize: 11,
                      fontWeight: 600,
                      color: COLOR,
                      textDecoration: 'none',
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    View All Jobs <ArrowRight size={10} />
                  </Link>
                </div>
              </div>

              {/* Labour Allocation + Needs Attention */}
              <div>
                <SectionHeader title="Labour Allocation" />
                <LabourDonutCard projectIds={projectIds} />

                <div style={{ marginTop: 16 }}>
                <SectionHeader title="Needs Attention" />
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                  {needsAttention.length === 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 12px' }}>
                      <CheckCircle2 size={14} style={{ color: 'var(--green)' }} strokeWidth={2.5} />
                      <span style={{ fontSize: 12, color: 'var(--mid)' }}>Everything&apos;s on track</span>
                    </div>
                  ) : (
                    needsAttention.map((item, i) => (
                      <AttentionItem key={i} {...item} />
                    ))
                  )}
                </div>

                </div>

                {/* Recent Activity */}
                <div style={{ marginTop: 16 }}>
                  <SectionHeader title="Recent Activity" />
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                    {recentEvents.length === 0 ? (
                      <div style={{ padding: '16px 12px', textAlign: 'center' }}>
                        <p style={{ fontSize: 12, color: 'var(--muted)' }}>No activity yet</p>
                      </div>
                    ) : (
                      recentEvents.slice(0, 5).map((event, i) => (
                        <div
                          key={String(event.id || i)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 12px',
                            borderBottom: i < Math.min(recentEvents.length, 5) - 1 ? '1px solid var(--border)' : 'none',
                            minHeight: 40,
                          }}
                        >
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLOR, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: 'var(--charcoal)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            {formatEventLabel(event)}
                          </span>
                          <span style={{ fontSize: 10, color: 'var(--muted)', flexShrink: 0 }}>
                            {formatRelativeTime(event.created_at || event.createdAt || event.timestamp)}
                          </span>
                        </div>
                      ))
                    )}
                    <Link
                      href="/activity"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        padding: '8px 12px',
                        fontSize: 11,
                        fontWeight: 600,
                        color: COLOR,
                        textDecoration: 'none',
                        borderTop: '1px solid var(--border)',
                      }}
                    >
                      View All <ArrowRight size={10} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-6">
              <SectionHeader title="Quick Actions" />
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                <QuickActionButton icon={<Plus size={12} />} label="New Job" onClick={() => router.push('/production/jobs')} color={COLOR} />
                <QuickActionButton icon={<FileText size={12} />} label="Change Order" onClick={() => router.push('/production/change-orders')} color={COLOR} />
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
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        {title}
      </span>
    </div>
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
        <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--charcoal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
        <p style={{ fontSize: 10, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</p>
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

function QuickActionButton({ icon, label, onClick, color }: { icon: React.ReactNode; label: string; onClick: () => void; color: string }) {
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
        background: 'var(--surface)',
        color: 'var(--charcoal)',
        border: '1px solid var(--border)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.04em',
      }}
    >
      <span style={{ color }}>{icon}</span>
      {label}
    </button>
  );
}
