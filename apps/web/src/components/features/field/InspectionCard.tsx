'use client';

/**
 * InspectionCard Component
 *
 * Summary card for an inspection with status.
 * Large touch targets for field use.
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import type { Inspection } from '@hooomz/shared-contracts';
import { Card, Badge } from '@/components/ui';

interface InspectionCardProps {
  inspection: Inspection;
  showProject?: boolean;
}

export function InspectionCard({ inspection, showProject = false }: InspectionCardProps) {
  const router = useRouter();

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'info' as const;
      case 'in-progress':
        return 'warning' as const;
      case 'completed':
        return 'success' as const;
      case 'failed':
        return 'error' as const;
      default:
        return 'neutral' as const;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-CA', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const getCompletionPercentage = (): number => {
    if (!inspection.checklistItems || inspection.checklistItems.length === 0) {
      return 0;
    }
    const completed = inspection.checklistItems.filter((item) => item.checked).length;
    return Math.round((completed / inspection.checklistItems.length) * 100);
  };

  const handleClick = () => {
    router.push(`/inspections/${inspection.id}`);
  };

  const completionPercentage = getCompletionPercentage();

  return (
    <Card
      interactive
      onClick={handleClick}
      className="hover:border-primary-300 transition-colors"
    >
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={getStatusVariant(inspection.status)}>
                {inspection.status}
              </Badge>
              <h3 className="text-xl font-bold text-gray-900">{inspection.type}</h3>
            </div>
            {inspection.notes && (
              <p className="text-sm text-gray-600 line-clamp-2">{inspection.notes}</p>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {inspection.scheduledDate && (
            <div>
              <span className="text-gray-500 block mb-1">Scheduled Date</span>
              <span className="font-semibold text-gray-900">
                {formatDate(inspection.scheduledDate)}
              </span>
            </div>
          )}
          {inspection.inspector && (
            <div>
              <span className="text-gray-500 block mb-1">Inspector</span>
              <span className="font-semibold text-gray-900">{inspection.inspector}</span>
            </div>
          )}
        </div>

        {/* Progress */}
        {inspection.checklistItems && inspection.checklistItems.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Checklist Progress</span>
              <span className="text-sm font-semibold text-gray-900">
                {completionPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  completionPercentage === 100
                    ? 'bg-green-500'
                    : completionPercentage > 0
                    ? 'bg-yellow-500'
                    : 'bg-gray-300'
                }`}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Photo Count */}
        {inspection.photos && inspection.photos.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>{inspection.photos.length} photos</span>
          </div>
        )}
      </div>
    </Card>
  );
}
