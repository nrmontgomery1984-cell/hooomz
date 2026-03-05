'use client';

/**
 * Production Jobs — /production/jobs
 *
 * Full job list with search, stage, trade, health, and progress filters.
 * Stage is preserved in the URL (search params) for shareable links.
 * Search / trade / health / progress are local state (transient).
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import { ArrowLeft, ChevronRight, FolderOpen, Search, X } from 'lucide-react';
import { SECTION_COLORS } from '@/lib/viewmode';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import { useServicesContext } from '@/lib/services/ServicesContext';
import { JOB_STAGE_META, JobStage, ProjectStatus, SCRIPT_STAGES } from '@hooomz/shared-contracts';
import type { ActiveProjectSummary } from '@/lib/hooks/useDashboardData';

const COLOR = SECTION_COLORS.production;

const STAGE_COLORS: Partial<Record<JobStage, string>> = {
  [JobStage.LEAD]: '#9CA3AF', [JobStage.ESTIMATE]: '#9CA3AF',
  [JobStage.CONSULTATION]: '#3B82F6', [JobStage.QUOTE]: '#3B82F6',
  [JobStage.CONTRACT]: '#3B82F6', [JobStage.SHIELD]: '#F59E0B',
  [JobStage.CLEAR]: '#F59E0B', [JobStage.READY]: '#F59E0B',
  [JobStage.INSTALL]: '#0F766E', [JobStage.PUNCH]: '#F59E0B',
  [JobStage.TURNOVER]: '#3B82F6',
};

type HealthFilter   = 'all' | 'green' | 'amber' | 'red';
type ProgressFilter = 'all' | 'not-started' | 'in-progress' | 'near-done';
type TradeFilter    = 'all' | 'flooring' | 'paint' | 'trim' | 'tile' | 'drywall';

const TRADE_LABELS: Record<TradeFilter, string> = {
  all:      'All',
  flooring: 'Flooring',
  paint:    'Paint',
  trim:     'Trim',
  tile:     'Tile',
  drywall:  'Drywall',
};

function inferScriptStage(status: string): JobStage | null {
  switch (status) {
    case ProjectStatus.APPROVED:    return JobStage.SHIELD;
    case ProjectStatus.IN_PROGRESS: return JobStage.INSTALL;
    case ProjectStatus.COMPLETE:    return JobStage.TURNOVER;
    default:                        return null;
  }
}

function resolveScriptStage(project: ActiveProjectSummary): JobStage | null {
  return (project.jobStage as JobStage) ?? inferScriptStage(project.status);
}

function healthBucket(score: number): HealthFilter {
  if (score >= 70) return 'green';
  if (score >= 40) return 'amber';
  return 'red';
}

function progressBucket(p: ActiveProjectSummary): ProgressFilter {
  if (p.taskCount === 0) return 'not-started';
  const pct = p.completedCount / p.taskCount;
  if (pct >= 0.75) return 'near-done';
  if (pct > 0)     return 'in-progress';
  return 'not-started';
}

function Pill({ label, active, color, onClick }: {
  label: string; active: boolean; color?: string; onClick: () => void;
}) {
  const c = color ?? COLOR;
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 12px', borderRadius: 99, flexShrink: 0,
        border: `1.5px solid ${active ? c : 'var(--border)'}`,
        background: active ? `${c}18` : 'var(--surface-1)',
        color: active ? c : 'var(--text-3)',
        fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

export default function ProductionJobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dashboard = useDashboardData();
  const { services } = useServicesContext();

  const stageFilter = searchParams.get('stage') as JobStage | null;
  const [query, setQuery]                   = useState('');
  const [healthFilter, setHealthFilter]     = useState<HealthFilter>('all');
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>('all');
  const [tradeFilter, setTradeFilter]       = useState<TradeFilter>('all');

  // Load trades for each active project from material selections
  const projectIds = dashboard.activeProjects.map((p) => p.id);
  const { data: projectTradesMap = new Map<string, string[]>() } = useQuery({
    queryKey: ['production', 'jobs', 'trades', ...projectIds],
    queryFn: async () => {
      const map = new Map<string, string[]>();
      await Promise.all(
        projectIds.map(async (pid) => {
          const sels = await services!.materialSelection.findByProject(pid);
          const trades = [...new Set(sels.map((s) => s.trade))] as string[];
          if (trades.length > 0) map.set(pid, trades);
        }),
      );
      return map;
    },
    enabled: !!services && projectIds.length > 0,
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    let list = dashboard.activeProjects;
    if (stageFilter)              list = list.filter((p) => resolveScriptStage(p) === stageFilter);
    if (query.trim())             list = list.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
    if (healthFilter !== 'all')   list = list.filter((p) => healthBucket(p.healthScore) === healthFilter);
    if (progressFilter !== 'all') list = list.filter((p) => progressBucket(p) === progressFilter);
    if (tradeFilter !== 'all')    list = list.filter((p) => projectTradesMap.get(p.id)?.includes(tradeFilter) ?? false);
    return list;
  }, [dashboard.activeProjects, stageFilter, query, healthFilter, progressFilter, tradeFilter, projectTradesMap]);

  const hasFilters = !!(stageFilter || query.trim() || healthFilter !== 'all' || progressFilter !== 'all' || tradeFilter !== 'all');

  function clearAll() {
    setQuery(''); setHealthFilter('all'); setProgressFilter('all'); setTradeFilter('all');
    router.replace('/production/jobs');
  }

  function setStage(s: JobStage | null) {
    router.push(s ? `/production/jobs?stage=${s}` : '/production/jobs');
  }

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
                  <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-cond)' }}>Jobs</h1>
                  {hasFilters && (
                    <button
                      onClick={clearAll}
                      style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: `${COLOR}18`, color: COLOR, border: 'none', cursor: 'pointer' }}
                    >
                      Clear filters <X size={10} />
                    </button>
                  )}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                  {filtered.length} of {dashboard.activeProjects.length} active job{dashboard.activeProjects.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6" style={{ marginTop: 14 }}>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search jobs…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: '100%', padding: '9px 32px 9px 30px', background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 2, display: 'flex' }}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Stage filter */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>Stage</div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
              <Pill label="All" active={!stageFilter} onClick={() => setStage(null)} />
              {SCRIPT_STAGES.map((s) => (
                <Pill
                  key={s}
                  label={JOB_STAGE_META[s]?.label ?? s}
                  active={stageFilter === s}
                  color={STAGE_COLORS[s]}
                  onClick={() => setStage(stageFilter === s ? null : s)}
                />
              ))}
            </div>
          </div>

          {/* Trade filter */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>Trade</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['all', 'flooring', 'paint', 'trim', 'tile', 'drywall'] as TradeFilter[]).map((key) => (
                <Pill
                  key={key}
                  label={TRADE_LABELS[key]}
                  active={tradeFilter === key}
                  onClick={() => setTradeFilter(tradeFilter === key && key !== 'all' ? 'all' : key)}
                />
              ))}
            </div>
          </div>

          {/* Health filter */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>Health</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {([
                { key: 'all'   as HealthFilter, label: 'All',      color: COLOR },
                { key: 'green' as HealthFilter, label: 'On Track',  color: '#10B981' },
                { key: 'amber' as HealthFilter, label: 'At Risk',   color: '#F59E0B' },
                { key: 'red'   as HealthFilter, label: 'Blocked',   color: '#EF4444' },
              ]).map(({ key, label, color }) => (
                <Pill key={key} label={label} active={healthFilter === key} color={color}
                  onClick={() => setHealthFilter(healthFilter === key && key !== 'all' ? 'all' : key)} />
              ))}
            </div>
          </div>

          {/* Progress filter */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>Progress</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {([
                { key: 'all'          as ProgressFilter, label: 'All' },
                { key: 'not-started'  as ProgressFilter, label: 'Not Started' },
                { key: 'in-progress'  as ProgressFilter, label: 'In Progress' },
                { key: 'near-done'    as ProgressFilter, label: 'Near Done 75%+' },
              ]).map(({ key, label }) => (
                <Pill key={key} label={label} active={progressFilter === key}
                  onClick={() => setProgressFilter(progressFilter === key && key !== 'all' ? 'all' : key)} />
              ))}
            </div>
          </div>

          {/* Results */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px' }}>
              <FolderOpen size={24} style={{ color: 'var(--text-3)', margin: '0 auto 8px' }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>
                {hasFilters ? 'No jobs match these filters' : 'No active jobs'}
              </p>
              {hasFilters && (
                <button onClick={clearAll} style={{ marginTop: 8, background: 'none', border: 'none', color: COLOR, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map((project) => {
                const stage = resolveScriptStage(project);
                const stageMeta = stage ? JOB_STAGE_META[stage] : null;
                const stageColor = (stage && STAGE_COLORS[stage]) || '#9CA3AF';
                const health = healthBucket(project.healthScore);
                const healthColor = health === 'green' ? '#10B981' : health === 'amber' ? '#F59E0B' : '#EF4444';
                const pct = project.taskCount > 0 ? Math.round((project.completedCount / project.taskCount) * 100) : 0;
                const trades = projectTradesMap.get(project.id) ?? [];

                return (
                  <button
                    key={project.id}
                    onClick={() => router.push(`/projects/${project.id}`)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 'var(--radius)', background: 'var(--surface-1)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: healthColor }} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {project.name}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                          <div style={{ flex: 1, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', maxWidth: 80 }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: healthColor, borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 9, color: 'var(--text-3)', flexShrink: 0 }}>
                            {project.completedCount}/{project.taskCount}
                          </span>
                          {trades.map((t) => (
                            <span
                              key={t}
                              style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-3)', background: 'var(--border)', borderRadius: 3, padding: '1px 4px', textTransform: 'capitalize' }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8 }}>
                      {stageMeta && (
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 6px', borderRadius: 4, background: `${stageColor}18`, color: stageColor }}>
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
