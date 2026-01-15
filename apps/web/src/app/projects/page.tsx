'use client';

/**
 * Projects List Page
 *
 * Displays all projects with search, filtering, and sorting.
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { ProjectList } from '@/components/features/projects';

export default function ProjectsPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">
            Manage your construction projects
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => router.push('/projects/new')}
          size="lg"
        >
          + New Project
        </Button>
      </div>

      {/* Project List */}
      <ProjectList />
    </div>
  );
}
