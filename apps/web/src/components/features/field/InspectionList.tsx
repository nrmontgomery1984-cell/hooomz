'use client';

/**
 * InspectionList Component
 *
 * Categorized list of inspections (upcoming and past).
 */

import React from 'react';
import type { Inspection } from '@hooomz/shared-contracts';
import { InspectionCard } from './InspectionCard';
import { Card } from '@/components/ui';

interface InspectionListProps {
  inspections: Inspection[];
  showProject?: boolean;
}

export function InspectionList({ inspections, showProject }: InspectionListProps) {
  const categorizeInspections = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = inspections.filter((insp) => {
      if (!insp.scheduledDate || insp.status === 'completed') return false;
      return new Date(insp.scheduledDate) >= today;
    });

    const completed = inspections.filter((insp) => insp.status === 'completed');

    const failed = inspections.filter((insp) => insp.status === 'failed');

    return { upcoming, completed, failed };
  };

  const { upcoming, completed, failed } = categorizeInspections();

  if (inspections.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <svg
            className="h-16 w-16 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-gray-500 text-lg mb-2">No inspections yet</p>
          <p className="text-gray-400 text-sm">
            Schedule inspections to track project compliance
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Upcoming Inspections */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Upcoming Inspections ({upcoming.length})
          </h2>
          <div className="space-y-4">
            {upcoming.map((inspection) => (
              <InspectionCard
                key={inspection.id}
                inspection={inspection}
                showProject={showProject}
              />
            ))}
          </div>
        </div>
      )}

      {/* Failed Inspections */}
      {failed.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Failed Inspections ({failed.length})
          </h2>
          <div className="space-y-4">
            {failed.map((inspection) => (
              <InspectionCard
                key={inspection.id}
                inspection={inspection}
                showProject={showProject}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Inspections */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Completed Inspections ({completed.length})
          </h2>
          <div className="space-y-4">
            {completed.map((inspection) => (
              <InspectionCard
                key={inspection.id}
                inspection={inspection}
                showProject={showProject}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
