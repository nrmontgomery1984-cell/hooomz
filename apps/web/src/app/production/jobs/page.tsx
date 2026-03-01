'use client';

/**
 * Production Jobs — /production/jobs
 *
 * Full job list view. Shows all projects grouped by SCRIPT stage.
 * Uses dashboard data hook for project summaries.
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import {
  ArrowLeft,
  ChevronRight,
  FolderOpen,
  X,
} from 'lucide-react';
import { SECTION_COLORS } from '@/lib/viewmode';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import {
  JOB_STAGE_META,
  ProjectStatus,
} from '@hooomz/shared-contracts';
import type { JobStage } from '@hooomz/shared-contracts';

const COLOR = SECTION_COLORS.production;

const STAGE_COLORS: Record<string, string> = {
  lead: '#9CA3AF', estimate: '#9CA3AF', consultation: '#3B82F6', quote: '#3B82F6',
  contract: '#3B82F6', shield: '#F59E0B', clear: '#F59E0B', ready: '#F59E0B',
  install: '#0F766E', punch: '#F59E0B', turnover: '#3B82F6', complete: '#10B981',
};

function inferScriptStage(status: string): JobStage | null {
  switch (status) {
    case ProjectStatus.APPROVED:    return 'shield' as JobStage;
    case ProjectStatus.IN_PROGRESS: return 'install' as JobStage;
    case ProjectStatus.COMPLETE:    return 'turnover' as JobStage;
    default:                        return null;
  }
}

function resolveScriptStage(project: { jobStage?: JobStage; status: string }): JobStage | null {
  return (project.jobStage as JobStage) ?? inferScriptStage(project.status);
}

export default function ProductionJobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dashboard = useDashboardData();
  const stageFilter = searchParams.get('stage') as JobStage | null;

  if (dashboard.isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: COLOR, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  const allProjects = stageFilter
    ? dashboard.activeProjects.filter((p) => resolveScriptStage(p) === stageFilter)
    : dashboard.activeProjects;
  const stageLabel = stageFilter && JOB_STAGE_META[stageFilter] ? JOB_STAGE_META[stageFilter].label : null;

  return (
    <PageErrorBoundary>
      <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>

        {/* Header */}
        <div style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => router.push('/production')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0, minWidth: 28, minHeight: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ArrowLeft size={18} />
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-cond)' }}>
                    {stageLabel ? stageLabel : 'Jobs'}
                  </h1>
                  {stageFilter && (
                    <button
                      onClick={() => router.replace('/production/jobs')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 3,
                        padding: '2px 8px', borderRadius: 99,
                        fontSize: 10, fontWeight: 600,
                        background: `${COLOR}18`, color: COLOR,
                        border: 'none', cursor: 'pointer',
                      }}
                    >
                      {stageLabel} <X size={10} />
                    </button>
                  )}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                  {allProjects.length} {stageLabel ? `in ${stageLabel}` : 'active'} project{allProjects.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6" style={{ marginTop: 16 }}>
          {allProjects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px' }}>
              <FolderOpen size={24} style={{ color: 'var(--text-3)', margin: '0 auto 8px' }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>No active jobs</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                Jobs will appear here when projects are in progress
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {allProjects.map((project) => {
                const stage = resolveScriptStage(project);
                const stageMeta = stage ? JOB_STAGE_META[stage] : null;
                const stageColor = stage ? STAGE_COLORS[stage] || '#9CA3AF' : '#9CA3AF';

                return (
                  <button
                    key={project.id}
                    onClick={() => router.push(`/projects/${project.id}`)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 14px', borderRadius: 'var(--radius)',
                      background: 'var(--surface-1)', border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-card)', cursor: 'pointer',
                      width: '100%', textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      {/* Health dot */}
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        background: project.healthScore >= 70 ? '#10B981' : project.healthScore >= 40 ? '#F59E0B' : '#EF4444',
                      }} />
                      <div style={{ minWidth: 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {project.name}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
                          {project.completedCount}/{project.taskCount} tasks
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {stageMeta && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                          padding: '2px 6px', borderRadius: 4,
                          background: `${stageColor}18`, color: stageColor,
                        }}>
                          {stageMeta.label}
                        </span>
                      )}
                      <ChevronRight size={14} style={{ color: 'var(--border-strong, #d1d5db)' }} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageErrorBoundary>
  );
}
