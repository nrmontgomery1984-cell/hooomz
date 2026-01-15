'use client';

/**
 * Edit Project Page
 *
 * Edit an existing project.
 */

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Project } from '@hooomz/shared-contracts';
import { useProjectService } from '@/lib/services/ServicesContext';
import { Button, LoadingSpinner, Card } from '@/components/ui';
import { ProjectForm } from '@/components/features/projects';

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectService = useProjectService();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectId = params.id as string;

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await projectService.get(projectId);
      if (response.success && response.data) {
        setProject(response.data);
      } else {
        setError('Project not found');
      }
    } catch (err) {
      console.error('Failed to load project:', err);
      setError('Failed to load project');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <LoadingSpinner size="lg" text="Loading project..." />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {error || 'Project Not Found'}
            </h2>
            <p className="text-gray-600 mb-6">
              The project you're trying to edit doesn't exist.
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
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push(`/projects/${projectId}`)}
        className="mb-4"
      >
        ← Back to Project
      </Button>

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Project</h1>
        <p className="text-gray-600 mt-1">Update project details</p>
      </div>

      {/* Project Form */}
      <ProjectForm mode="edit" project={project} />
    </div>
  );
}
