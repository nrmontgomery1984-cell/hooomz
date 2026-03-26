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
    <div className="min-h-screen pb-24" style={{ background: 'var(--surface-2)' }}>
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/estimates"
              className="flex items-center gap-1 text-sm hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              <ArrowLeft size={14} />
              Estimates
            </Link>
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--charcoal)' }}>
            Select Project
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            Choose a project to build an estimate for
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-2">
        {isLoading ? (
          <div className="text-center py-8">
            <div
              className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3"
              style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }}
            />
            <p className="text-sm text-[var(--muted)]">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              No projects yet. Create a project first.
            </p>
          </div>
        ) : (
          projects.map((p) => (
            <Link key={p.id} href={`/estimates/${p.id}`}>
              <div
                className="bg-white rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                style={{ border: '1px solid var(--border)', minHeight: '48px' }}
              >
                <div>
                  <span className="text-sm font-medium" style={{ color: 'var(--charcoal)' }}>
                    {p.name || p.id}
                  </span>
                  <span className="text-xs ml-2 capitalize" style={{ color: 'var(--muted)' }}>
                    {p.status}
                  </span>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--muted)' }} />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
