'use client';

/**
 * ProjectCard Component
 *
 * Summary card for a project with status badge and key information.
 * Optimized for touch interaction and quick status updates.
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import type { Project } from '@hooomz/shared-contracts';
import { Card, Badge } from '@/components/ui';
import { ProjectStatusSelect } from './ProjectStatusSelect';

interface ProjectCardProps {
  project: Project;
  onStatusChange?: (projectId: string, newStatus: string) => Promise<void>;
}

export function ProjectCard({ project, onStatusChange }: ProjectCardProps) {
  const router = useRouter();

  const statusVariants: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'neutral'> = {
    planning: 'info',
    'in-progress': 'warning',
    'on-hold': 'neutral',
    completed: 'success',
    cancelled: 'neutral',
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card
      interactive
      onClick={() => router.push(`/projects/${project.id}`)}
      className="hover:border-primary-300 transition-colors"
    >
      <div className="flex flex-col gap-3">
        {/* Header with name and status */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold text-gray-900 flex-1">
            {project.name}
          </h3>
          <div onClick={(e) => e.stopPropagation()}>
            <ProjectStatusSelect
              projectId={project.id}
              currentStatus={project.status}
              onStatusChange={onStatusChange}
            />
          </div>
        </div>

        {/* Project type and location */}
        <div className="flex flex-col gap-1 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="font-medium">Type:</span>
            <span className="capitalize">{project.projectType.replace('-', ' ')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Location:</span>
            <span>{project.address.city}, {project.address.province}</span>
          </div>
        </div>

        {/* Budget and dates */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">Estimated Cost</span>
            <span className="text-base font-semibold text-gray-900">
              {formatCurrency(project.budget.estimatedCost)}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">Start Date</span>
            <span className="text-base font-semibold text-gray-900">
              {formatDate(project.dates.startDate)}
            </span>
          </div>
        </div>

        {/* Description if available */}
        {project.description && (
          <p className="text-sm text-gray-600 line-clamp-2 pt-2">
            {project.description}
          </p>
        )}
      </div>
    </Card>
  );
}
