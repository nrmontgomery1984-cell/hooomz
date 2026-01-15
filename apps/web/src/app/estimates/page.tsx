'use client';

/**
 * Estimates List Page
 *
 * View all estimates grouped by project.
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Estimate, Project } from '@hooomz/shared-contracts';
import { useEstimatingService, useProjectService } from '@/lib/services/ServicesContext';
import { Button, Card, Badge, LoadingSpinner, Select } from '@/components/ui';

interface EstimateWithProject extends Estimate {
  project?: Project;
}

export default function EstimatesPage() {
  const router = useRouter();
  const estimatingService = useEstimatingService();
  const projectService = useProjectService();
  const [estimates, setEstimates] = useState<EstimateWithProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadEstimates();
  }, []);

  const loadEstimates = async () => {
    setIsLoading(true);
    try {
      const response = await estimatingService.list();
      if (response.success && response.data) {
        // Load project info for each estimate
        const estimatesWithProjects = await Promise.all(
          response.data.map(async (estimate) => {
            const projectResponse = await projectService.get(estimate.projectId);
            return {
              ...estimate,
              project: projectResponse.success ? projectResponse.data : undefined,
            };
          })
        );
        setEstimates(estimatesWithProjects);
      }
    } catch (error) {
      console.error('Failed to load estimates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'draft':
        return 'neutral' as const;
      case 'pending':
        return 'warning' as const;
      case 'approved':
        return 'success' as const;
      case 'rejected':
        return 'error' as const;
      default:
        return 'neutral' as const;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getFilteredEstimates = (): EstimateWithProject[] => {
    if (statusFilter === 'all') {
      return estimates;
    }
    return estimates.filter((est) => est.status === statusFilter);
  };

  const filteredEstimates = getFilteredEstimates();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <LoadingSpinner size="lg" text="Loading estimates..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Estimates</h1>
          <p className="text-gray-600 mt-1">Manage project estimates and pricing</p>
        </div>
        <Button variant="primary" onClick={() => router.push('/catalog')}>
          Manage Catalog
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-48"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>
          <span className="text-sm text-gray-500 ml-auto">
            {filteredEstimates.length} {filteredEstimates.length === 1 ? 'estimate' : 'estimates'}
          </span>
        </div>
      </Card>

      {/* Estimates List */}
      {filteredEstimates.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No estimates found</div>
            <p className="text-gray-500 mb-6">
              {statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Estimates are created within projects'}
            </p>
            <Button variant="secondary" onClick={() => router.push('/projects')}>
              View Projects
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEstimates.map((estimate) => (
            <Card
              key={estimate.id}
              interactive
              onClick={() => router.push(`/projects/${estimate.projectId}/estimate`)}
              className="hover:border-primary-300"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Estimate Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">
                      {estimate.project?.name || 'Unknown Project'}
                    </h3>
                    <Badge variant={getStatusVariant(estimate.status)}>
                      {estimate.status}
                    </Badge>
                  </div>
                  {estimate.project?.description && (
                    <p className="text-sm text-gray-600 mb-2">
                      {estimate.project.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div>
                      <span className="font-medium">Created:</span>{' '}
                      {formatDate(estimate.createdAt)}
                    </div>
                    <div>
                      <span className="font-medium">Updated:</span>{' '}
                      {formatDate(estimate.updatedAt)}
                    </div>
                    {estimate.version && (
                      <div>
                        <span className="font-medium">Version:</span> {estimate.version}
                      </div>
                    )}
                  </div>
                </div>

                {/* Estimate Total */}
                <div className="text-right">
                  <div className="text-sm text-gray-600 mb-1">Total Estimate</div>
                  <div className="text-2xl font-bold text-primary-700">
                    {formatCurrency(estimate.total)}
                  </div>
                  {estimate.markupPercentage > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      Includes {estimate.markupPercentage}% markup
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
