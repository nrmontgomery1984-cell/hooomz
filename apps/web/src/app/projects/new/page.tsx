'use client';

/**
 * New Project Page
 *
 * Create a new project with the project form.
 */

import React from 'react';
import { ProjectForm } from '@/components/features/projects';

export default function NewProjectPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
        <p className="text-gray-600 mt-1">
          Enter project details to get started
        </p>
      </div>

      {/* Project Form */}
      <ProjectForm mode="create" />
    </div>
  );
}
