'use client';

/**
 * Select Project Page — Pick a project to build an estimate for.
 * Navigates to /estimates/[projectId] on selection.
 */

import Link from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useLocalProjects } from '@/lib/hooks/useLocalData';

export default function SelectProjectPage() {
  const { data: projectsResult, isLoading } = useLocalProjects();
  const projects = projectsResult?.projects || [];

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/estimates"
              className="flex items-center gap-1 text-sm hover:underline"
              style={{ color: '#0F766E' }}
            >
              <ArrowLeft size={14} />
              Estimates
            </Link>
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#111827' }}>
            Select Project
          </h1>
          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
            Choose a project to build an estimate for
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-2">
        {isLoading ? (
          <div className="text-center py-8">
            <div
              className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3"
              style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }}
            />
            <p className="text-sm text-gray-400">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: '#6B7280' }}>
              No projects yet. Create a project first.
            </p>
          </div>
        ) : (
          projects.map((p) => (
            <Link key={p.id} href={`/estimates/${p.id}`}>
              <div
                className="bg-white rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                style={{ border: '1px solid #E5E7EB', minHeight: '48px' }}
              >
                <div>
                  <span className="text-sm font-medium" style={{ color: '#111827' }}>
                    {p.name || p.id}
                  </span>
                  <span className="text-xs ml-2 capitalize" style={{ color: '#9CA3AF' }}>
                    {p.status}
                  </span>
                </div>
                <ChevronRight size={16} style={{ color: '#9CA3AF' }} />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
