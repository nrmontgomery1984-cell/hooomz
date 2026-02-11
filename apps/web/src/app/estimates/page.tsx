'use client';

/**
 * Estimates List Page — Shows projects with their line item summaries.
 *
 * "Estimate ID" = projectId. Each project's line items ARE the estimate.
 * Reads from IndexedDB via useLocalProjects + useServicesContext.
 *
 * Visual: labor/material split bar, status pill, dense cards.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import Link from 'next/link';
import { FileText, Plus, ChevronRight } from 'lucide-react';
import { useLocalProjects } from '@/lib/hooks/useLocalData';
import { useServicesContext } from '@/lib/services/ServicesContext';

const STATUS_COLORS: Record<string, string> = {
  lead: '#8B5CF6',
  quoted: '#3B82F6',
  approved: '#F59E0B',
  'in-progress': '#0F766E',
  complete: '#10B981',
  'on-hold': '#EF4444',
  cancelled: '#9CA3AF',
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

  const projects = projectsResult?.projects || [];
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
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg md:max-w-4xl mx-auto px-4 md:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg md:text-xl font-bold" style={{ color: '#111827' }}>
                Estimates
              </h1>
              <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>
                {summaries.length} estimate{summaries.length !== 1 ? 's' : ''}
                {grandTotal > 0 && ` \u00B7 $${grandTotal.toLocaleString()} total`}
              </p>
            </div>
            {projects.length > 0 && (
              <button
                onClick={() => router.push('/estimates/select-project')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-xl"
                style={{ background: '#0F766E', minHeight: '44px' }}
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
                <div className="w-2 h-2 rounded-full" style={{ background: '#3B82F6' }} />
                <span className="text-[11px]" style={{ color: '#6B7280' }}>
                  Labor ${grandLabor.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: '#F59E0B' }} />
                <span className="text-[11px]" style={{ color: '#6B7280' }}>
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
              style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }}
            />
            <p className="text-xs" style={{ color: '#9CA3AF' }}>Loading estimates...</p>
          </div>
        ) : summaries.length === 0 && projects.length === 0 ? (
          <div className="text-center py-10">
            <FileText size={28} className="mx-auto mb-2" style={{ color: '#D1D5DB' }} />
            <p className="text-sm font-medium mb-0.5" style={{ color: '#111827' }}>No estimates yet</p>
            <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>
              Create a project first, then add line items
            </p>
          </div>
        ) : summaries.length === 0 ? (
          <div className="text-center py-10">
            <FileText size={28} className="mx-auto mb-2" style={{ color: '#D1D5DB' }} />
            <p className="text-sm font-medium mb-0.5" style={{ color: '#111827' }}>No estimates yet</p>
            <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>
              Select a project and add line items to build an estimate
            </p>
            <button
              onClick={() => router.push('/estimates/select-project')}
              className="min-h-[44px] px-5 text-xs font-medium text-white rounded-xl"
              style={{ background: '#0F766E' }}
            >
              Start an Estimate
            </button>
          </div>
        ) : (
          <>
            {summaries.map((summary) => {
              const statusColor = STATUS_COLORS[summary.projectStatus] || '#9CA3AF';
              const laborPct = summary.total > 0 ? (summary.laborTotal / summary.total) * 100 : 0;

              return (
                <Link key={summary.projectId} href={`/estimates/${summary.projectId}`}>
                  <div
                    className="rounded-xl p-3 md:p-4 transition-all duration-150 hover:shadow-md hover:-translate-y-px"
                    style={{
                      background: '#FFFFFF',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      borderLeft: `3px solid ${statusColor}`,
                    }}
                  >
                    {/* Name + status + chevron */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[13px] font-semibold truncate" style={{ color: '#111827' }}>
                          {summary.projectName}
                        </span>
                        <span
                          className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0"
                          style={{ background: `${statusColor}15`, color: statusColor }}
                        >
                          {summary.projectStatus.replace(/-/g, ' ')}
                        </span>
                      </div>
                      <ChevronRight size={14} style={{ color: '#D1D5DB' }} />
                    </div>

                    {/* Line item count + total */}
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-[11px]" style={{ color: '#6B7280' }}>
                        {summary.itemCount} line item{summary.itemCount !== 1 ? 's' : ''}
                      </span>
                      <span className="text-lg font-bold" style={{ color: '#111827' }}>
                        ${summary.total.toLocaleString()}
                      </span>
                    </div>

                    {/* Labor/Material split bar */}
                    <div className="flex rounded-full overflow-hidden h-1.5 mb-1">
                      {summary.laborTotal > 0 && (
                        <div style={{ width: `${laborPct}%`, background: '#3B82F6', minWidth: '4px' }} />
                      )}
                      {summary.materialTotal > 0 && (
                        <div style={{ width: `${100 - laborPct}%`, background: '#F59E0B', minWidth: '4px' }} />
                      )}
                    </div>

                    {/* Labor/Material amounts */}
                    <div className="flex justify-between">
                      <span className="text-[10px]" style={{ color: '#3B82F6' }}>
                        Labor ${summary.laborTotal.toLocaleString()}
                      </span>
                      <span className="text-[10px]" style={{ color: '#F59E0B' }}>
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
                <h2 className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>
                  Projects without estimates
                </h2>
                <div className="rounded-xl overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB' }}>
                  {projects
                    .filter((p) => !summaries.some((s) => s.projectId === p.id))
                    .map((p, i, arr) => (
                      <Link key={p.id} href={`/estimates/${p.id}`}>
                        <div
                          className="flex items-center justify-between px-3 py-2.5 min-h-[44px] hover:bg-gray-50 transition-colors"
                          style={{ borderBottom: i < arr.length - 1 ? '1px solid #F3F4F6' : 'none' }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium" style={{ color: '#111827' }}>
                              {p.name || p.id}
                            </span>
                            <span
                              className="text-[9px] font-medium px-1.5 py-0.5 rounded-full capitalize"
                              style={{ background: '#F3F4F6', color: '#6B7280' }}
                            >
                              {(p.status || 'unknown').replace(/-/g, ' ')}
                            </span>
                          </div>
                          <span className="text-[11px] font-medium" style={{ color: '#0F766E' }}>
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
