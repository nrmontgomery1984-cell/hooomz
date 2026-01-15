'use client';

/**
 * Project Inspections Page
 *
 * List and manage inspections for a specific project.
 */

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { Inspection, Project } from '@hooomz/shared-contracts';
import { useFieldDocsService, useProjectService } from '@/lib/services/ServicesContext';
import { Button, Card, LoadingSpinner, Badge } from '@/components/ui';
import { InspectionList, InspectionForm } from '@/components/features/field';
import { useToast } from '@/components/ui/Toast';

export default function ProjectInspectionsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const fieldDocsService = useFieldDocsService();
  const projectService = useProjectService();
  const { showToast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load project
      const projectResponse = await projectService.getById(projectId);
      if (projectResponse.success && projectResponse.data) {
        setProject(projectResponse.data);
      }

      // Load inspections for this project
      const inspResponse = await fieldDocsService.listByProject(projectId);
      if (inspResponse.success && inspResponse.data) {
        setInspections(inspResponse.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      showToast('Failed to load inspections', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInspection = async (data: Partial<Inspection>) => {
    try {
      const response = await fieldDocsService.create(data);
      if (response.success && response.data) {
        showToast('Inspection created', 'success');
        setShowForm(false);
        await loadData();
      }
    } catch (error) {
      console.error('Failed to create inspection:', error);
      showToast('Failed to create inspection', 'error');
    }
  };

  const handleInspectionClick = (inspection: Inspection) => {
    router.push(`/inspections/${inspection.id}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <LoadingSpinner size="lg" text="Loading inspections..." />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg mb-2">Project not found</p>
            <Button variant="primary" onClick={() => router.push('/projects')}>
              Back to Projects
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push(`/projects/${projectId}`)}
            className="mb-2 -ml-2"
          >
            <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Project
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-600 mt-1">Inspections</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => router.push(`/projects/${projectId}/photos`)}
          >
            <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            View Photos
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowForm(true)}
          >
            <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Inspection
          </Button>
        </div>
      </div>

      {/* Inspection Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {inspections.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {inspections.filter((i) => i.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Pending</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {inspections.filter((i) => i.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Completed</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {inspections.filter((i) => i.status === 'failed').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Failed</div>
          </div>
        </Card>
      </div>

      {/* Inspection Form Modal */}
      {showForm && (
        <Card className="mb-6">
          <InspectionForm
            projectId={projectId}
            onSubmit={handleCreateInspection}
            onCancel={() => setShowForm(false)}
          />
        </Card>
      )}

      {/* Inspections List */}
      <InspectionList inspections={inspections} showProject={false} />
    </div>
  );
}
