'use client';

/**
 * Estimates List Page — Shows projects with their line item summaries.
 *
 * "Estimate ID" = projectId. Each project's line items ARE the estimate.
 * Reads from IndexedDB via useLocalProjects + useServicesContext.
 *
 * Visual: labor/material split bar, status pill, dense cards.
 */

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import Link from 'next/link';
import { FileText, Plus, ChevronRight } from 'lucide-react';
import { useLocalProjects } from '@/lib/hooks/useLocalData';
import { useServicesContext } from '@/lib/services/ServicesContext';

const STATUS_COLORS: Record<string, string> = {
  lead: 'var(--muted)',
  quoted: 'var(--accent)',
  approved: 'var(--amber)',
  'in-progress': 'var(--blue)',
  complete: 'var(--green)',
  'on-hold': 'var(--red)',
  cancelled: 'var(--muted)',
};

interface ProjectEstimateSummary {
  projectId: string;
  projectName: string;
  projectStatus: string;
  itemCount: number;
  total: number;
  laborTotal: number;
  materialTotal: number;
}

export default function EstimatesPage() {
  const router = useRouter();
  const { data: projectsResult, isLoading: projectsLoading } = useLocalProjects();
  const { services, isLoading: servicesLoading } = useServicesContext();
  const [summaries, setSummaries] = useState<ProjectEstimateSummary[]>([]);
  const [loadingSummaries, setLoadingSummaries] = useState(true);

  const projects = useMemo(() => projectsResult?.projects || [], [projectsResult]);
  const isLoading = projectsLoading || servicesLoading;

  // Totals across all estimates
  const grandTotal = summaries.reduce((s, e) => s + e.total, 0);
  const grandLabor = summaries.reduce((s, e) => s + e.laborTotal, 0);
  const grandMaterial = summaries.reduce((s, e) => s + e.materialTotal, 0);

  // Load line item counts/totals for each project
  useEffect(() => {
    if (isLoading || !services || projects.length === 0) {
      setLoadingSummaries(false);
      return;
    }

    let cancelled = false;
    setLoadingSummaries(true);

    async function loadSummaries() {
      const results: ProjectEstimateSummary[] = [];

      for (const project of projects) {
        try {
          const items = await services!.estimating.lineItems.findByProjectId(project.id);
          if (items.length > 0) {
            const laborTotal = items
              .filter((i) => i.isLabor)
              .reduce((sum, i) => sum + i.totalCost, 0);
            const materialTotal = items
              .filter((i) => !i.isLabor)
              .reduce((sum, i) => sum + i.totalCost, 0);

            results.push({
              projectId: project.id,
              projectName: project.name || project.id,
              projectStatus: project.status || 'unknown',
              itemCount: items.length,
              total: laborTotal + materialTotal,
              laborTotal,
              materialTotal,
            });
          }
        } catch {
          // Skip projects with errors
        }
      }

      if (!cancelled) {
        setSummaries(results);
        setLoadingSummaries(false);
      }
    }

    loadSummaries();
    return () => { cancelled = true; };
  }, [isLoading, services, projects]);

  return (
    <PageErrorBoundary>
    <div className="min-h-screen pb-24" style={{ background: 'var(--surface)' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg md:max-w-4xl mx-auto px-4 md:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg md:text-xl font-bold" style={{ color: 'var(--charcoal)' }}>
                Estimates
              </h1>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
                {summaries.length} estimate{summaries.length !== 1 ? 's' : ''}
                {grandTotal > 0 && ` \u00B7 $${grandTotal.toLocaleString()} total`}
              </p>
            </div>
            {projects.length > 0 && (
              <button
                onClick={() => router.push('/estimates/select-project')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-xl"
                style={{ background: 'var(--accent)', minHeight: '44px' }}
              >
                <Plus size={14} />
                New Estimate
              </button>
            )}
          </div>

          {/* Totals strip */}
          {summaries.length > 0 && (
            <div className="flex gap-3 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: 'var(--charcoal)' }} />
                <span className="text-[11px]" style={{ color: 'var(--mid)' }}>
                  Labor ${grandLabor.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: 'var(--muted)' }} />
                <span className="text-[11px]" style={{ color: 'var(--mid)' }}>
                  Materials ${grandMaterial.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg md:max-w-4xl mx-auto px-4 md:px-8 mt-4 space-y-2">
        {isLoading || loadingSummaries ? (
          <div className="text-center py-10">
            <div
              className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-2"
              style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }}
            />
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Loading estimates...</p>
          </div>
        ) : summaries.length === 0 && projects.length === 0 ? (
          <div className="text-center py-10">
            <FileText size={28} className="mx-auto mb-2" style={{ color: 'var(--faint)' }} />
            <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--charcoal)' }}>No estimates yet</p>
            <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
              Create a project first, then add line items
            </p>
          </div>
        ) : summaries.length === 0 ? (
          <div className="text-center py-10">
            <FileText size={28} className="mx-auto mb-2" style={{ color: 'var(--faint)' }} />
            <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--charcoal)' }}>No estimates yet</p>
            <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
              Select a project and add line items to build an estimate
            </p>
            <button
              onClick={() => router.push('/estimates/select-project')}
              className="min-h-[44px] px-5 text-xs font-medium text-white rounded-xl"
              style={{ background: 'var(--accent)' }}
            >
              Start an Estimate
            </button>
          </div>
        ) : (
          <>
            {summaries.map((summary) => {
              const statusColor = STATUS_COLORS[summary.projectStatus] || 'var(--muted)';
              const laborPct = summary.total > 0 ? (summary.laborTotal / summary.total) * 100 : 0;

              return (
                <Link key={summary.projectId} href={`/estimates/${summary.projectId}`}>
                  <div
                    className="rounded-xl p-3 md:p-4 transition-all duration-150 hover:shadow-md hover:-translate-y-px"
                    style={{
                      background: 'var(--surface)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      borderLeft: `3px solid ${statusColor}`,
                    }}
                  >
                    {/* Name + status + chevron */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[13px] font-semibold truncate" style={{ color: 'var(--charcoal)' }}>
                          {summary.projectName}
                        </span>
                        <span
                          className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0"
                          style={{ background: `${statusColor}15`, color: statusColor }}
                        >
                          {summary.projectStatus.replace(/-/g, ' ')}
                        </span>
                      </div>
                      <ChevronRight size={14} style={{ color: 'var(--faint)' }} />
                    </div>

                    {/* Line item count + total */}
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-[11px]" style={{ color: 'var(--mid)' }}>
                        {summary.itemCount} line item{summary.itemCount !== 1 ? 's' : ''}
                      </span>
                      <span className="text-lg font-bold" style={{ color: 'var(--charcoal)' }}>
                        ${summary.total.toLocaleString()}
                      </span>
                    </div>

                    {/* Labor/Material split bar */}
                    <div className="flex rounded-full overflow-hidden h-1.5 mb-1">
                      {summary.laborTotal > 0 && (
                        <div style={{ width: `${laborPct}%`, background: 'var(--charcoal)', minWidth: '4px' }} />
                      )}
                      {summary.materialTotal > 0 && (
                        <div style={{ width: `${100 - laborPct}%`, background: 'var(--muted)', minWidth: '4px' }} />
                      )}
                    </div>

                    {/* Labor/Material amounts */}
                    <div className="flex justify-between">
                      <span className="text-[10px]" style={{ color: 'var(--charcoal)' }}>
                        Labor ${summary.laborTotal.toLocaleString()}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
                        Materials ${summary.materialTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}

            {/* Projects without estimates */}
            {projects.length > summaries.length && (
              <div className="mt-4">
                <h2 className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--mid)' }}>
                  Projects without estimates
                </h2>
                <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid var(--border)' }}>
                  {projects
                    .filter((p) => !summaries.some((s) => s.projectId === p.id))
                    .map((p, i, arr) => (
                      <Link key={p.id} href={`/estimates/${p.id}`}>
                        <div
                          className="flex items-center justify-between px-3 py-2.5 min-h-[44px] transition-colors"
                          style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--surface)' : 'none' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium" style={{ color: 'var(--charcoal)' }}>
                              {p.name || p.id}
                            </span>
                            <span
                              className="text-[9px] font-medium px-1.5 py-0.5 rounded-full capitalize"
                              style={{ background: 'var(--surface)', color: 'var(--mid)' }}
                            >
                              {(p.status || 'unknown').replace(/-/g, ' ')}
                            </span>
                          </div>
                          <span className="text-[11px] font-medium" style={{ color: 'var(--accent)' }}>
                            Add items
                          </span>
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </PageErrorBoundary>
  );
}
