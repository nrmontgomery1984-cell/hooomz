'use client';

/**
 * Project Estimate Page
 *
 * Estimate builder interface for a specific project.
 */

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Estimate, Project } from '@hooomz/shared-contracts';
import { useEstimateService, useProjectService } from '@/lib/services/ServicesContext';
import { Button, LoadingSpinner, Card, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { EstimateBuilder, EstimateComparison } from '@/components/features/estimating';

export default function ProjectEstimatePage() {
  const params = useParams();
  const router = useRouter();
  const estimateService = useEstimateService();
  const projectService = useProjectService();
  const [project, setProject] = useState<Project | null>(null);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('builder');

  const projectId = params.id as string;

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load project
      const projectResponse = await projectService.getById(projectId);
      if (!projectResponse.success || !projectResponse.data) {
        setError('Project not found');
        setIsLoading(false);
        return;
      }
      setProject(projectResponse.data);

      // Load or create estimate for project
      const estimateResponse = await estimateService.getByProject(projectId);
      if (estimateResponse.success && estimateResponse.data) {
        setEstimate(estimateResponse.data);
      } else {
        // Create new estimate if none exists
        const createResponse = await estimateService.create({
          projectId,
          status: 'draft',
          total: 0,
          markupPercentage: 15, // Default 15% markup
          taxRate: 13, // Default 13% HST for Ontario
        });
        if (createResponse.success && createResponse.data) {
          setEstimate(createResponse.data);
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load estimate');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEstimateUpdate = (updatedEstimate: Estimate) => {
    setEstimate(updatedEstimate);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <LoadingSpinner size="lg" text="Loading estimate..." />
      </div>
    );
  }

  if (error || !project || !estimate) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {error || 'Estimate Not Available'}
            </h2>
            <p className="text-gray-600 mb-6">
              Unable to load the estimate for this project.
            </p>
            <Button variant="primary" onClick={() => router.push('/projects')}>
              Back to Projects
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push(`/projects/${projectId}`)}
        className="mb-4"
      >
        ← Back to Project
      </Button>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
        <p className="text-gray-600 mt-1">Project Estimate</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="builder">
            Estimate Builder
          </TabsTrigger>
          <TabsTrigger value="comparison">
            Estimate vs Actual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder">
          <EstimateBuilder estimate={estimate} onUpdate={handleEstimateUpdate} />
        </TabsContent>

        <TabsContent value="comparison">
          <EstimateComparison
            estimate={estimate}
            lineItems={[]}
            actualCosts={[]}
          />
          <Card className="mt-6">
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">Actual cost tracking coming soon</p>
              <p className="text-sm">
                This feature will compare estimated costs with actual expenses as the project progresses.
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
