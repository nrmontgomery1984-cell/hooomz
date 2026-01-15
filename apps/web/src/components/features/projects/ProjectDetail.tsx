'use client';

/**
 * ProjectDetail Component
 *
 * Full project view with tabs for different sections.
 * Mobile-optimized with swipeable tabs.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Project } from '@hooomz/shared-contracts';
import {
  Card,
  Badge,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui';
import { ProjectStatusSelect } from './ProjectStatusSelect';

interface ProjectDetailProps {
  project: Project;
  onStatusChange?: (projectId: string, newStatus: string) => Promise<void>;
}

export function ProjectDetail({ project, onStatusChange }: ProjectDetailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

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
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {project.name}
            </h1>
            {project.description && (
              <p className="text-gray-600">{project.description}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <ProjectStatusSelect
              projectId={project.id}
              currentStatus={project.status}
              onStatusChange={onStatusChange}
              size="lg"
            />
            <Button
              variant="secondary"
              onClick={() => router.push(`/projects/${project.id}/edit`)}
            >
              Edit Project
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="estimate">Estimate</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Information */}
            <Card>
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Project Information
              </h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Type</dt>
                  <dd className="mt-1 text-base text-gray-900 capitalize">
                    {project.projectType.replace('-', ' ')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <Badge variant="info">{project.status}</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-base text-gray-900">
                    {formatDate(project.metadata.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Last Updated
                  </dt>
                  <dd className="mt-1 text-base text-gray-900">
                    {formatDate(project.metadata.updatedAt)}
                  </dd>
                </div>
              </dl>
            </Card>

            {/* Location */}
            <Card>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Location</h2>
              <address className="not-italic space-y-1 text-gray-700">
                <p>{project.address.street}</p>
                <p>
                  {project.address.city}, {project.address.province}{' '}
                  {project.address.postalCode}
                </p>
                <p>{project.address.country}</p>
              </address>
            </Card>

            {/* Budget */}
            <Card>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Budget</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Estimated Cost
                  </dt>
                  <dd className="mt-1 text-xl font-bold text-gray-900">
                    {formatCurrency(project.budget.estimatedCost)}
                  </dd>
                </div>
                {project.budget.actualCost > 0 && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Actual Cost
                    </dt>
                    <dd className="mt-1 text-xl font-bold text-gray-900">
                      {formatCurrency(project.budget.actualCost)}
                    </dd>
                  </div>
                )}
                {project.budget.actualCost > 0 && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Variance
                    </dt>
                    <dd
                      className={`mt-1 text-xl font-bold ${
                        project.budget.actualCost <= project.budget.estimatedCost
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(
                        project.budget.estimatedCost - project.budget.actualCost
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>

            {/* Schedule */}
            <Card>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Schedule</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Start Date
                  </dt>
                  <dd className="mt-1 text-base text-gray-900">
                    {formatDate(project.dates.startDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Estimated End Date
                  </dt>
                  <dd className="mt-1 text-base text-gray-900">
                    {formatDate(project.dates.estimatedEndDate)}
                  </dd>
                </div>
                {project.dates.actualEndDate && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Actual End Date
                    </dt>
                    <dd className="mt-1 text-base text-gray-900">
                      {formatDate(project.dates.actualEndDate)}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No tasks yet</p>
              <p className="text-gray-400 text-sm mt-2">
                Tasks will be displayed here
              </p>
              <Button variant="primary" className="mt-4">
                Add First Task
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Estimate Tab */}
        <TabsContent value="estimate">
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No estimate yet</p>
              <p className="text-gray-400 text-sm mt-2">
                Create an estimate with line items
              </p>
              <Button variant="primary" className="mt-4">
                Create Estimate
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Inspections Tab */}
        <TabsContent value="inspections">
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No inspections scheduled</p>
              <p className="text-gray-400 text-sm mt-2">
                Schedule inspections as needed
              </p>
              <Button variant="primary" className="mt-4">
                Schedule Inspection
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
