'use client';

/**
 * Estimates List Page — Shows projects with their line item summaries.
 *
 * "Estimate ID" = projectId. Each project's line items ARE the estimate.
 * Reads from IndexedDB via useLocalProjects + useServicesContext.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import Link from 'next/link';
import { FileText, Plus, ChevronRight } from 'lucide-react';
import { useLocalProjects } from '@/lib/hooks/useLocalData';
import { useServicesContext } from '@/lib/services/ServicesContext';

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
        <div className="max-w-lg md:max-w-4xl mx-auto px-4 md:px-8 py-4 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold" style={{ color: '#111827' }}>
                Estimates
              </h1>
              <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                {summaries.length} project{summaries.length !== 1 ? 's' : ''} with line items
              </p>
            </div>
            {projects.length > 0 && (
              <button
                onClick={() => router.push('/estimates/select-project')}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-xl"
                style={{ background: '#0F766E', minHeight: '44px' }}
              >
                <Plus size={16} />
                New Estimate
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-lg md:max-w-4xl mx-auto px-4 md:px-8 mt-6 space-y-3">
        {isLoading || loadingSummaries ? (
          <div className="text-center py-12">
            <div
              className="w-10 h-10 border-3 rounded-full animate-spin mx-auto mb-3"
              style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }}
            />
            <p className="text-sm" style={{ color: '#9CA3AF' }}>Loading estimates...</p>
          </div>
        ) : summaries.length === 0 && projects.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={32} className="mx-auto mb-3" style={{ color: '#D1D5DB' }} />
            <p className="text-base font-medium mb-1" style={{ color: '#111827' }}>No estimates yet</p>
            <p className="text-sm mb-5" style={{ color: '#9CA3AF' }}>
              Create a project first, then add line items
            </p>
          </div>
        ) : summaries.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={32} className="mx-auto mb-3" style={{ color: '#D1D5DB' }} />
            <p className="text-base font-medium mb-1" style={{ color: '#111827' }}>No estimates yet</p>
            <p className="text-sm mb-5" style={{ color: '#9CA3AF' }}>
              Select a project and add line items to build an estimate
            </p>
            <button
              onClick={() => router.push('/estimates/select-project')}
              className="min-h-[48px] px-6 text-sm font-medium text-white rounded-xl"
              style={{ background: '#0F766E' }}
            >
              Start an Estimate
            </button>
          </div>
        ) : (
          <>
            {summaries.map((summary) => (
              <Link key={summary.projectId} href={`/estimates/${summary.projectId}`}>
                <div
                  className="rounded-xl p-4 md:p-5 transition-all duration-150 hover:shadow-md hover:-translate-y-px"
                  style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-semibold" style={{ color: '#111827' }}>
                      {summary.projectName}
                    </span>
                    <ChevronRight size={16} style={{ color: '#D1D5DB' }} />
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm" style={{ color: '#6B7280' }}>
                      {summary.itemCount} line item{summary.itemCount !== 1 ? 's' : ''}
                    </span>
                    {summary.laborTotal > 0 && (
                      <span
                        className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                        style={{ background: '#DBEAFE', color: '#1E40AF' }}
                      >
                        Labor ${summary.laborTotal.toLocaleString()}
                      </span>
                    )}
                    {summary.materialTotal > 0 && (
                      <span
                        className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                        style={{ background: '#FEF3C7', color: '#92400E' }}
                      >
                        Materials ${summary.materialTotal.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-bold" style={{ color: '#111827' }}>
                      ${summary.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}

            {/* Projects without estimates — card treatment */}
            {projects.length > summaries.length && (
              <div className="mt-6">
                <h2 className="text-[13px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#6B7280' }}>
                  Projects without estimates
                </h2>
                <div className="rounded-xl overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB' }}>
                  {projects
                    .filter((p) => !summaries.some((s) => s.projectId === p.id))
                    .map((p, i, arr) => (
                      <Link key={p.id} href={`/estimates/${p.id}`}>
                        <div
                          className="flex items-center justify-between px-4 py-3 min-h-[48px] hover:bg-gray-50 transition-colors"
                          style={{ borderBottom: i < arr.length - 1 ? '1px solid #F3F4F6' : 'none' }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium" style={{ color: '#111827' }}>
                              {p.name || p.id}
                            </span>
                            <span
                              className="text-[10px] font-medium px-2 py-0.5 rounded-full capitalize"
                              style={{ background: '#F3F4F6', color: '#6B7280' }}
                            >
                              {(p.status || 'unknown').replace(/-/g, ' ')}
                            </span>
                          </div>
                          <span className="text-xs font-medium" style={{ color: '#0F766E' }}>
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
