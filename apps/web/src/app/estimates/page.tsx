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
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={20} style={{ color: '#0F766E' }} />
              <h1 className="text-xl font-bold" style={{ color: '#111827' }}>
                Estimates
              </h1>
            </div>
            {projects.length > 0 && (
              <button
                onClick={() => router.push('/estimates/select-project')}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white rounded-xl"
                style={{ background: '#0F766E', minHeight: '44px' }}
              >
                <Plus size={16} />
                New
              </button>
            )}
          </div>
          <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
            {summaries.length} project{summaries.length !== 1 ? 's' : ''} with line items
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-3">
        {isLoading || loadingSummaries ? (
          <div className="text-center py-8">
            <div
              className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3"
              style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }}
            />
            <p className="text-sm text-gray-400">Loading estimates...</p>
          </div>
        ) : summaries.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={40} className="mx-auto mb-3" style={{ color: '#D1D5DB' }} />
            <p className="text-sm font-medium" style={{ color: '#6B7280' }}>
              No estimates yet
            </p>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
              {projects.length === 0
                ? 'Create a project first, then add line items'
                : 'Select a project and add line items to build an estimate'}
            </p>
            {projects.length > 0 && (
              <button
                onClick={() => router.push('/estimates/select-project')}
                className="mt-4 px-4 py-2 text-sm font-medium text-white rounded-xl"
                style={{ background: '#0F766E', minHeight: '44px' }}
              >
                Start an Estimate
              </button>
            )}
          </div>
        ) : (
          summaries.map((summary) => (
            <Link key={summary.projectId} href={`/estimates/${summary.projectId}`}>
              <div
                className="bg-white rounded-xl p-4 hover:shadow-md transition-shadow"
                style={{ border: '1px solid #E5E7EB' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold" style={{ color: '#111827' }}>
                    {summary.projectName}
                  </span>
                  <ChevronRight size={16} style={{ color: '#9CA3AF' }} />
                </div>

                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs" style={{ color: '#6B7280' }}>
                    {summary.itemCount} line item{summary.itemCount !== 1 ? 's' : ''}
                  </span>
                  {summary.laborTotal > 0 && (
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                      style={{ background: '#DBEAFE', color: '#1E40AF' }}
                    >
                      Labor ${summary.laborTotal.toLocaleString()}
                    </span>
                  )}
                  {summary.materialTotal > 0 && (
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                      style={{ background: '#FEF3C7', color: '#92400E' }}
                    >
                      Materials ${summary.materialTotal.toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-base font-bold" style={{ color: '#111827' }}>
                    ${summary.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}

        {/* Quick links to projects without estimates */}
        {!isLoading && !loadingSummaries && projects.length > summaries.length && summaries.length > 0 && (
          <div className="pt-4">
            <p className="text-xs font-medium mb-2" style={{ color: '#6B7280' }}>
              Projects without estimates
            </p>
            {projects
              .filter((p) => !summaries.some((s) => s.projectId === p.id))
              .map((p) => (
                <Link key={p.id} href={`/estimates/${p.id}`}>
                  <div
                    className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-white transition-colors"
                  >
                    <span className="text-sm" style={{ color: '#6B7280' }}>
                      {p.name || p.id}
                    </span>
                    <span className="text-xs" style={{ color: '#0F766E' }}>
                      Add items →
                    </span>
                  </div>
                </Link>
              ))}
          </div>
        )}
      </div>
    </div>
    </PageErrorBoundary>
  );
}
