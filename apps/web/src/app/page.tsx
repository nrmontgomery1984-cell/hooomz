'use client';

/**
 * Home Page — Manager Dashboard
 *
 * 5 sections: Summary Cards, Today's Work, Needs Attention, Recent Activity, Quick Actions.
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

// Score color helper — matches locked spec in CLAUDE.md
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
          <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }} />
          <p style={{ color: '#6B7280' }}>Loading...</p>
        </div>
      </div>
    );
  }

  const attentionItems: AttentionItemProps[] = [];

  // Over-budget tasks
  for (const task of dashboard.overBudgetTasks) {
    const pct = task.actualHours && task.budgetedHours
      ? Math.round((task.actualHours / task.budgetedHours) * 100)
      : 0;
    attentionItems.push({
      icon: <AlertTriangle size={16} />,
      color: '#EF4444',
      title: `Over budget: ${task.sopCode || 'Task'}`,
      subtitle: `${pct}% of budgeted hours`,
      href: task.projectId ? `/projects/${task.projectId}` : undefined,
    });
  }

  // Training records ready for review
  for (const record of dashboard.readyForReview) {
    attentionItems.push({
      icon: <GraduationCap size={16} />,
      color: '#0F766E',
      title: `Ready for certification review`,
      subtitle: record.sopId ? `SOP: ${record.sopId.slice(0, 8)}` : 'Training complete',
      href: '/labs/sops',
    });
  }

  // Pending change orders
  for (const co of dashboard.pendingChangeOrders) {
    attentionItems.push({
      icon: <FileText size={16} />,
      color: '#F59E0B',
      title: `Change Order — Pending Approval`,
      subtitle: co.description || 'Pending approval',
      href: co.projectId ? `/projects/${co.projectId}` : undefined,
    });
  }

  return (
    <PageErrorBoundary>
      <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header — greeting replaces redundant logo (sidebar has logo on desktop) */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg md:max-w-4xl mx-auto px-4 md:px-8 py-4 md:py-6 flex items-center justify-between">
          <div>
            <p className="text-base md:text-lg font-semibold" style={{ color: '#111827' }}>
              {getGreeting()}, Nathan
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
              {getDateString()}
            </p>
          </div>
          <button
            onClick={() => router.push('/intake')}
            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl"
            style={{ background: '#0F766E' }}
          >
            <Plus size={20} color="#FFFFFF" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="max-w-lg md:max-w-4xl mx-auto px-4 md:px-8">
        {/* ================================================================
            Section 1: Summary Cards (2x2 grid)
            ================================================================ */}
        <div className="mt-6 md:mt-8 grid grid-cols-2 gap-3 md:gap-4">
          <button
            onClick={() => document.getElementById('todays-work')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-left"
          >
            <StatCard label="Active Projects" value={dashboard.activeProjectCount} accentColor="#3B82F6" />
          </button>
          <StatCard label="Portfolio Health" value={`${dashboard.healthScore}%`} accentColor={getScoreColor(dashboard.healthScore)} />
          <button onClick={() => router.push('/leads')} className="text-left">
            <StatCard label="Pipeline" value={dashboard.pipelineCount} accentColor="#F59E0B" />
          </button>
          <StatCard
            label="Tasks Due"
            value={dashboard.tasksDue}
            accentColor={dashboard.blockedCount > 0 ? '#EF4444' : '#9CA3AF'}
          />
        </div>

        {/* ================================================================
            Section 2: Today's Work
            ================================================================ */}
        <div className="mt-8" id="todays-work">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>
              Today&apos;s Work
            </h2>
            {dashboard.activeProjects.length > 0 && (
              <span className="text-xs" style={{ color: '#9CA3AF' }}>
                {dashboard.activeProjects.length} project{dashboard.activeProjects.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {dashboard.activeProjects.length === 0 ? (
            <div className="rounded-xl p-8 text-center" style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ background: '#F0FDFA' }}>
                <Briefcase size={28} style={{ color: '#0F766E' }} strokeWidth={1.5} />
              </div>
              <p className="text-base font-medium mb-1" style={{ color: '#111827' }}>No active projects yet</p>
              <p className="text-sm mb-5" style={{ color: '#9CA3AF' }}>Create your first project to see it here</p>
              <button
                onClick={() => router.push('/intake')}
                className="min-h-[48px] px-8 rounded-xl font-medium text-white"
                style={{ background: '#0F766E' }}
              >
                Create a Project
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {dashboard.activeProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => router.push(`/projects/${project.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ================================================================
            Section 3: Needs Attention
            ================================================================ */}
        <div className="mt-8">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider mb-4" style={{ color: '#6B7280' }}>
            Needs Attention
          </h2>

          <div className="rounded-xl overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            {attentionItems.length === 0 ? (
              <div className="flex items-center gap-3 px-4 py-4">
                <CheckCircle2 size={18} style={{ color: '#10B981' }} strokeWidth={2} />
                <span className="text-sm" style={{ color: '#6B7280' }}>Everything&apos;s on track</span>
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
            Section 4: Recent Activity
            ================================================================ */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>
              Recent Activity
            </h2>
            <Link
              href="/activity"
              className="flex items-center gap-1 text-xs font-medium min-h-[44px] px-1"
              style={{ color: '#0F766E' }}
            >
              View All <ArrowRight size={12} />
            </Link>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            {dashboard.recentEvents.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: '#9CA3AF' }}>No activity yet</p>
            ) : (
              <SimpleActivityFeed
                events={dashboard.recentEvents as any}
                maxItems={8}
                showProjectName
              />
            )}
          </div>
        </div>

        {/* ================================================================
            Section 5: Quick Actions
            ================================================================ */}
        <div className="mt-8 mb-6">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider mb-4" style={{ color: '#6B7280' }}>
            Quick Actions
          </h2>
          <div className="flex gap-2 overflow-x-auto">
            <QuickActionButton
              icon={<Plus size={14} />}
              label="New Lead"
              onClick={() => router.push('/leads/new')}
            />
            <QuickActionButton
              icon={<FileText size={14} />}
              label="Estimate"
              onClick={() => router.push('/estimates/select-project')}
            />
            {process.env.NODE_ENV !== 'production' && (
              <QuickActionButton
                icon={<ArrowRight size={14} />}
                label="Seed Data"
                onClick={() => router.push('/labs/seed')}
              />
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

/** Stat card with colored left-border accent */
function StatCard({ label, value, accentColor }: {
  label: string;
  value: string | number;
  accentColor: string;
}) {
  return (
    <div
      className="rounded-xl p-4 md:p-5 transition-all duration-150 hover:shadow-md hover:-translate-y-px"
      style={{
        background: '#FFFFFF',
        borderLeft: `4px solid ${accentColor}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      <span className="text-[13px] font-medium block" style={{ color: '#6B7280' }}>{label}</span>
      <p className="text-3xl font-bold leading-tight mt-1" style={{ color: '#111827' }}>{value}</p>
    </div>
  );
}

/** Project card with health score, progress, and next task */
function ProjectCard({ project, onClick }: {
  project: ActiveProjectSummary;
  onClick: () => void;
}) {
  const scoreColor = getScoreColor(project.healthScore);
  const progress = project.taskCount > 0
    ? Math.round((project.completedCount / project.taskCount) * 100)
    : 0;

  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl p-4 md:p-5 text-left transition-all duration-150 min-h-[48px] hover:shadow-md hover:-translate-y-px"
      style={{
        background: '#FFFFFF',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid #E5E7EB',
      }}
    >
      {/* Top row: name + health score */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold truncate" style={{ color: '#111827' }}>{project.name}</h3>
          <p className="text-sm mt-0.5 capitalize" style={{ color: '#9CA3AF' }}>{project.status.replace(/-/g, ' ')}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          <div className="text-right">
            <span className="text-2xl font-bold" style={{ color: scoreColor }}>{project.healthScore}</span>
            <p className="text-[10px] font-medium" style={{ color: '#9CA3AF' }}>Health</p>
          </div>
          <ChevronRight size={16} style={{ color: '#D1D5DB' }} strokeWidth={1.5} />
        </div>
      </div>

      {/* Progress bar with task count */}
      <div className="mt-3 flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full" style={{ background: '#E5E7EB' }}>
          <div
            className="h-2 rounded-full"
            style={{ width: `${progress}%`, background: scoreColor, transition: 'width 0.4s ease' }}
          />
        </div>
        <span className="text-xs font-medium flex-shrink-0" style={{ color: '#6B7280' }}>
          {project.completedCount}/{project.taskCount}
        </span>
      </div>

      {/* Next task */}
      {project.nextTask && (
        <p className="text-sm mt-3 truncate" style={{ color: '#374151' }}>
          <span className="font-medium" style={{ color: '#0F766E' }}>Next:</span>{' '}
          {project.nextTask}
        </p>
      )}
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
    <div
      className="flex items-center gap-3 px-4 py-3 min-h-[48px]"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div style={{ color }} className="flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: '#111827' }}>{title}</p>
        <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>{subtitle}</p>
      </div>
      {href && <ChevronRight size={14} style={{ color: '#D1D5DB' }} className="flex-shrink-0" />}
    </div>
  );

  if (href) {
    return (
      <button onClick={() => router.push(href)} className="w-full text-left hover:bg-gray-50 transition-colors">
        {content}
      </button>
    );
  }

  return content;
}

/** Quick action pill button */
function QuickActionButton({ icon, label, onClick }: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 min-h-[44px] rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-150 hover:shadow-sm hover:-translate-y-px"
      style={{ background: '#FFFFFF', color: '#111827', border: '1px solid #E5E7EB' }}
    >
      <span style={{ color: '#0F766E' }}>{icon}</span>
      {label}
    </button>
  );
}
