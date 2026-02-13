'use client';

/**
 * Home Page — Manager Dashboard
 *
 * Horizontal stat strip, dense project rows with status colors,
 * pipeline + task distribution mini-charts, compact attention + activity.
 * Aggregates data via useDashboardData hook. No new stores or services.
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
} from 'lucide-react';
import { SimpleActivityFeed } from '@/components/activity';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import type { ActiveProjectSummary } from '@/lib/hooks/useDashboardData';

// ============================================================================
// Design tokens — per overhaul spec
// ============================================================================

const STATUS_COLORS: Record<string, string> = {
  lead: '#8B5CF6',
  quoted: '#3B82F6',
  approved: '#F59E0B',
  'in-progress': '#0F766E',
  complete: '#10B981',
  'on-hold': '#EF4444',
  cancelled: '#9CA3AF',
};

function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || '#9CA3AF';
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#10B981';
  if (score >= 70) return '#14B8A6';
  if (score >= 50) return '#F59E0B';
  if (score >= 30) return '#F97316';
  return '#EF4444';
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

export default function HomePage() {
  const router = useRouter();
  const dashboard = useDashboardData();

  if (dashboard.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F3F4F6' }}>
        <div className="text-center">
          <div className="w-10 h-10 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }} />
          <p className="text-xs" style={{ color: '#9CA3AF' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Attention items
  const attentionItems: AttentionItemProps[] = [];
  for (const task of dashboard.overBudgetTasks) {
    const pct = task.actualHours && task.budgetedHours ? Math.round((task.actualHours / task.budgetedHours) * 100) : 0;
    attentionItems.push({ icon: <AlertTriangle size={14} />, color: '#EF4444', title: `Over budget: ${task.sopCode || 'Task'}`, subtitle: `${pct}% of budgeted hours`, href: task.projectId ? `/projects/${task.projectId}` : undefined });
  }
  for (const record of dashboard.readyForReview) {
    attentionItems.push({ icon: <GraduationCap size={14} />, color: '#0F766E', title: 'Ready for certification review', subtitle: record.sopId ? `SOP: ${record.sopId.slice(0, 8)}` : 'Training complete', href: '/labs/sops' });
  }
  for (const co of dashboard.pendingChangeOrders) {
    attentionItems.push({ icon: <FileText size={14} />, color: '#F59E0B', title: 'Change Order — Pending', subtitle: co.description || 'Pending approval', href: co.projectId ? `/projects/${co.projectId}` : undefined });
  }

  // Pipeline data for mini-chart
  const pipelineStages = [
    { label: 'Lead', count: dashboard.leadCount, color: '#8B5CF6' },
    { label: 'Quoted', count: dashboard.quotedCount, color: '#3B82F6' },
    { label: 'Active', count: dashboard.activeProjectCount, color: '#0F766E' },
  ];
  const pipelineMax = Math.max(...pipelineStages.map((s) => s.count), 1);

  // Task distribution
  const totalTasks = dashboard.activeProjects.reduce((s, p) => s + p.taskCount, 0);
  const completedTasks = dashboard.activeProjects.reduce((s, p) => s + p.completedCount, 0);
  const remainingTasks = totalTasks - completedTasks;

  return (
    <PageErrorBoundary>
      <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg md:max-w-4xl mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
          <div>
            <p className="text-[15px] font-semibold" style={{ color: '#111827' }}>
              {getGreeting()}, Nathan
            </p>
            <p className="text-[11px]" style={{ color: '#9CA3AF' }}>{getDateString()}</p>
          </div>
          <button
            onClick={() => router.push('/intake')}
            className="md:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl"
            style={{ background: '#0F766E' }}
          >
            <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="max-w-lg md:max-w-4xl mx-auto px-4 md:px-8">
        {/* ================================================================
            Stat Strip — horizontal scrollable bar
            ================================================================ */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
          <StatPill label="Active" value={dashboard.activeProjectCount} color="#0F766E" onClick={() => document.getElementById('todays-work')?.scrollIntoView({ behavior: 'smooth' })} />
          <StatPill label="Pipeline" value={dashboard.pipelineCount} color="#8B5CF6" onClick={() => router.push('/leads')} />
          <StatPill label="Health" value={`${dashboard.healthScore}%`} color={getScoreColor(dashboard.healthScore)} />
          <StatPill label="Tasks" value={dashboard.tasksDue} color={dashboard.blockedCount > 0 ? '#EF4444' : '#6B7280'} />
          {dashboard.blockedCount > 0 && (
            <StatPill label="Blocked" value={dashboard.blockedCount} color="#EF4444" />
          )}
          {dashboard.draftCount > 0 && (
            <StatPill label="Drafts" value={dashboard.draftCount} color="#F59E0B" onClick={() => router.push('/intake')} />
          )}
        </div>

        {/* ================================================================
            Today's Work — dense project rows
            ================================================================ */}
        <div className="mt-5" id="todays-work">
          <SectionHeader title="Today's Work" count={dashboard.activeProjects.length} unit="project" />

          {dashboard.activeProjects.length === 0 ? (
            <div className="rounded-xl p-6 text-center" style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center" style={{ background: '#F0FDFA' }}>
                <Briefcase size={22} style={{ color: '#0F766E' }} strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: '#111827' }}>No active projects</p>
              <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>Create a project to get started</p>
              <button
                onClick={() => router.push('/intake')}
                className="min-h-[40px] px-6 rounded-xl text-sm font-medium text-white"
                style={{ background: '#0F766E' }}
              >
                Create a Project
              </button>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
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

        {/* ================================================================
            Mini Charts — pipeline + task distribution side by side
            ================================================================ */}
        {(dashboard.activeProjectCount > 0 || dashboard.pipelineCount > 0) && (
          <div className="mt-5 grid grid-cols-2 gap-3">
            {/* Pipeline funnel */}
            <div className="rounded-xl p-3" style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>Pipeline</p>
              <div className="space-y-1.5">
                {pipelineStages.map((s) => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span className="text-[10px] font-medium w-10 text-right" style={{ color: '#6B7280' }}>{s.label}</span>
                    <div className="flex-1 h-3 rounded-sm" style={{ background: '#F3F4F6' }}>
                      <div className="h-3 rounded-sm" style={{ width: `${Math.max((s.count / pipelineMax) * 100, 4)}%`, background: s.color, transition: 'width 0.4s' }} />
                    </div>
                    <span className="text-[11px] font-bold w-5" style={{ color: '#111827' }}>{s.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Task distribution donut */}
            <div className="rounded-xl p-3" style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>Tasks</p>
              <div className="flex items-center gap-3">
                {/* CSS donut */}
                <div className="relative w-12 h-12 flex-shrink-0">
                  <svg viewBox="0 0 36 36" className="w-12 h-12">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#E5E7EB" strokeWidth="4" />
                    {totalTasks > 0 && (
                      <circle
                        cx="18" cy="18" r="14" fill="none"
                        stroke="#10B981" strokeWidth="4"
                        strokeDasharray={`${(completedTasks / totalTasks) * 88} 88`}
                        strokeDashoffset="22"
                        strokeLinecap="round"
                      />
                    )}
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold" style={{ color: '#111827' }}>
                    {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                  </span>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
                    <span className="text-[11px]" style={{ color: '#6B7280' }}>Done {completedTasks}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: '#E5E7EB' }} />
                    <span className="text-[11px]" style={{ color: '#6B7280' }}>Left {remainingTasks}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            Needs Attention
            ================================================================ */}
        <div className="mt-5">
          <SectionHeader title="Needs Attention" />
          <div className="rounded-xl overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            {attentionItems.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-3">
                <CheckCircle2 size={14} style={{ color: '#10B981' }} strokeWidth={2.5} />
                <span className="text-xs" style={{ color: '#6B7280' }}>Everything&apos;s on track</span>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: '#F3F4F6' }}>
                {attentionItems.map((item, i) => (
                  <AttentionItem key={i} {...item} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ================================================================
            Recent Activity
            ================================================================ */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <SectionHeader title="Recent Activity" />
            <Link href="/activity" className="flex items-center gap-1 text-[11px] font-medium min-h-[36px] px-1" style={{ color: '#0F766E' }}>
              View All <ArrowRight size={10} />
            </Link>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            {dashboard.recentEvents.length === 0 ? (
              <p className="text-xs text-center py-5" style={{ color: '#9CA3AF' }}>No activity yet</p>
            ) : (
              <SimpleActivityFeed events={dashboard.recentEvents as any} maxItems={6} showProjectName />
            )}
          </div>
        </div>

        {/* ================================================================
            Quick Actions
            ================================================================ */}
        <div className="mt-5 mb-6">
          <SectionHeader title="Quick Actions" />
          <div className="flex gap-2 overflow-x-auto">
            <QuickActionButton icon={<Plus size={12} />} label="New Lead" onClick={() => router.push('/leads/new')} />
            <QuickActionButton icon={<FileText size={12} />} label="Estimate" onClick={() => router.push('/estimates/select-project')} />
            {process.env.NODE_ENV !== 'production' && (
              <QuickActionButton icon={<ArrowRight size={12} />} label="Seed Data" onClick={() => router.push('/labs/seed')} />
            )}
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
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>
        {title}
      </h2>
      {count !== undefined && count > 0 && (
        <span className="text-[11px]" style={{ color: '#9CA3AF' }}>
          {count} {unit}{count !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}

/** Horizontal stat pill */
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
      className="flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap flex-shrink-0"
      style={{ background: '#FFFFFF', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}
    >
      <span className="text-[28px] font-bold leading-none" style={{ color }}>{value}</span>
      <span className="text-[11px] font-medium" style={{ color: '#6B7280' }}>{label}</span>
    </Tag>
  );
}

/** Dense project row inside a list card */
function ProjectRow({ project, isLast, onClick }: {
  project: ActiveProjectSummary;
  isLast: boolean;
  onClick: () => void;
}) {
  const scoreColor = getScoreColor(project.healthScore);
  const progress = project.taskCount > 0 ? Math.round((project.completedCount / project.taskCount) * 100) : 0;
  const statusColor = getStatusColor(project.status);

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2.5 flex items-center gap-3 min-h-[48px] hover:bg-gray-50 transition-colors"
      style={{ borderBottom: isLast ? 'none' : '1px solid #F3F4F6' }}
    >
      {/* Status color bar */}
      <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: statusColor }} />

      {/* Name + status pill */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold truncate" style={{ color: '#111827' }}>{project.name}</h3>
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize flex-shrink-0"
            style={{ background: `${statusColor}18`, color: statusColor }}
          >
            {project.status.replace(/-/g, ' ')}
          </span>
        </div>
        {/* Progress bar */}
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 rounded-full" style={{ background: '#E5E7EB' }}>
            <div className="h-1.5 rounded-full" style={{ width: `${progress}%`, background: scoreColor, transition: 'width 0.4s' }} />
          </div>
          <span className="text-[10px] font-medium flex-shrink-0" style={{ color: '#9CA3AF' }}>
            {project.completedCount}/{project.taskCount}
          </span>
        </div>
      </div>

      {/* Health score */}
      <div className="text-right flex-shrink-0">
        <span className="text-lg font-bold" style={{ color: scoreColor }}>{project.healthScore}</span>
      </div>

      <ChevronRight size={14} style={{ color: '#D1D5DB' }} className="flex-shrink-0" />
    </button>
  );
}

/** Attention item with colored left border */
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
    <div className="flex items-center gap-2.5 px-3 py-2.5 min-h-[40px]" style={{ borderLeft: `3px solid ${color}` }}>
      <div style={{ color }} className="flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate" style={{ color: '#111827' }}>{title}</p>
        <p className="text-[11px] truncate" style={{ color: '#9CA3AF' }}>{subtitle}</p>
      </div>
      {href && <ChevronRight size={12} style={{ color: '#D1D5DB' }} className="flex-shrink-0" />}
    </div>
  );
  if (href) {
    return <button onClick={() => router.push(href)} className="w-full text-left hover:bg-gray-50 transition-colors">{content}</button>;
  }
  return content;
}

/** Quick action pill */
function QuickActionButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 min-h-[36px] rounded-lg text-xs font-medium whitespace-nowrap"
      style={{ background: '#FFFFFF', color: '#111827', border: '1px solid #E5E7EB' }}
    >
      <span style={{ color: '#0F766E' }}>{icon}</span>
      {label}
    </button>
  );
}
