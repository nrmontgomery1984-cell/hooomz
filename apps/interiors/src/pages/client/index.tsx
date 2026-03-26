/**
 * Client Portal Page
 * Read-only project view for homeowners
 *
 * Route: /client/:projectId (with optional ?code=XXXX query param)
 *
 * What Clients See:
 * - Project progress sphere
 * - Floor plan with status colors (read-only)
 * - Client-visible activity events only
 * - Ability to submit comments
 *
 * What Clients Don't See:
 * - Internal notes
 * - Labor costs/hours
 * - Crew assignments
 * - Material pricing
 * - Blocked item details (unless shared)
 */

import { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Sphere } from '../../components/sphere';
import { ClientFloorPlan, CommentInput } from '../../components/client';
import { ActivityFeed } from '../../components/activity';
import { LoadingSpinner, Card, statusColors } from '../../components/ui';
import { useClientProject } from '../../hooks/useClientProject';
import type { LoopStatus } from '../../types/database';

// ============================================================================
// ACCESS DENIED COMPONENT
// ============================================================================

function AccessDenied() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-8a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          This project requires an access code. Please check your invitation link or contact your contractor.
        </p>
        <p className="text-sm text-gray-500">
          If you believe this is an error, please contact your contractor directly.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// STATUS SUMMARY COMPONENT
// ============================================================================

interface StatusSummaryProps {
  loops: Map<string, unknown>;
}

function StatusSummary({ loops }: StatusSummaryProps) {
  const summary = useMemo(() => {
    const counts: Record<LoopStatus, number> = {
      not_started: 0,
      in_progress: 0,
      blocked: 0,
      complete: 0,
    };

    loops.forEach((loop) => {
      const l = loop as { status: LoopStatus; type: string };
      // Only count task-level items
      if (l.type === 'task' || l.type === 'phase' || l.type === 'trade') {
        counts[l.status]++;
      }
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    return { counts, total };
  }, [loops]);

  if (summary.total === 0) return null;

  const completionPercent = Math.round((summary.counts.complete / summary.total) * 100);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700">Overall Progress</span>
        <span className="text-sm font-semibold text-gray-900">{completionPercent}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-500"
          style={{ width: `${completionPercent}%` }}
        />
      </div>

      {/* Status counts */}
      <div className="grid grid-cols-4 gap-2">
        {(Object.entries(summary.counts) as [LoopStatus, number][]).map(([status, count]) => (
          <div key={status} className="text-center">
            <div
              className="w-3 h-3 rounded-full mx-auto mb-1"
              style={{ backgroundColor: statusColors[status] }}
            />
            <div className="text-lg font-semibold text-gray-900">{count}</div>
            <div className="text-xs text-gray-500 capitalize">{status.replace('_', ' ')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ClientPortal() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const accessCode = searchParams.get('code') || undefined;

  const {
    project,
    floorPlan,
    elements,
    loops,
    recentUpdates,
    isLoading,
    error,
    isAccessDenied,
    submitComment,
    refetch,
  } = useClientProject(projectId, accessCode);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading your project...</p>
        </div>
      </div>
    );
  }

  // Access denied
  if (isAccessDenied) {
    return <AccessDenied />;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700 max-w-md mx-auto">
          <h2 className="font-semibold text-lg mb-2">Unable to load project</h2>
          <p className="mb-4">{error.message}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 min-h-[44px]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Project not found
  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-amber-700 max-w-md mx-auto text-center">
          <h2 className="font-semibold text-lg mb-2">Project Not Found</h2>
          <p>The project you're looking for doesn't exist or may have been moved.</p>
        </div>
      </div>
    );
  }

  // Get company name from metadata if available
  const companyName = (project.metadata as { contractor_name?: string })?.contractor_name || 'Your Contractor';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-4 py-4">
          <p className="text-sm text-gray-500 mb-1">{companyName}</p>
          <h1 className="text-xl font-semibold text-gray-900 truncate">
            {project.name}
          </h1>
        </div>
      </header>

      {/* Progress Sphere Section */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-8">
        <div className="flex flex-col items-center">
          <p className="text-sm text-gray-500 mb-4">Your Project Progress</p>
          <Sphere
            score={project.health_score}
            size={140}
            showScore={true}
            animate={true}
          />
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {project.health_score}%
          </p>
          <p className="text-sm text-gray-500">Complete</p>
        </div>
      </section>

      {/* Main Content */}
      <main className="px-4 pb-8 space-y-6">
        {/* Status Summary */}
        <StatusSummary loops={loops} />

        {/* Floor Plan (Read-Only) */}
        {floorPlan && elements.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Floor Plan</h2>
            <div className="h-[300px] bg-white rounded-xl shadow-sm overflow-hidden">
              <ClientFloorPlan
                floorPlan={floorPlan}
                elements={elements}
                loops={loops}
              />
            </div>
          </section>
        )}

        {/* Recent Updates (client_visible events only) */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Updates</h2>
          <Card>
            {recentUpdates.length > 0 ? (
              <ActivityFeed
                events={recentUpdates}
                isLoading={false}
                emptyMessage="No updates yet"
              />
            ) : (
              <div className="py-8 text-center text-gray-500">
                <p>No updates yet.</p>
                <p className="text-sm mt-1">Check back soon for project progress updates.</p>
              </div>
            )}
          </Card>
        </section>

        {/* Comment Input */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Questions or Comments?</h2>
          <Card>
            <CommentInput
              onSubmit={submitComment}
              placeholder="Have a question about your project? Let us know..."
            />
          </Card>
        </section>

        {/* Footer */}
        <footer className="pt-6 text-center">
          <p className="text-xs text-gray-400">
            Powered by Hooomz
          </p>
        </footer>
      </main>
    </div>
  );
}
