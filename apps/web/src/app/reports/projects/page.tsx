'use client';

/**
 * Project Reports Page
 *
 * Detailed project analysis and reporting.
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Project } from '@hooomz/shared-contracts';
import { useReportingService, useProjectService } from '@/lib/services/ServicesContext';
import { Button, Card, LoadingSpinner, Badge } from '@/components/ui';
import {
  ReportViewer,
  ReportTable,
  ReportSummary,
  ProjectsChart,
  ProjectsPieChart,
  ExportButtons,
  convertToCSV,
  downloadCSV,
  getExportFilename,
} from '@/components/features/reporting';
import { useToast } from '@/components/ui/Toast';

export default function ProjectReportsPage() {
  const router = useRouter();
  const reportingService = useReportingService();
  const projectService = useProjectService();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [dateRange, setDateRange] = useState<'30d' | '90d' | '1y' | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [dateRange, statusFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await projectService.listAll();
      if (response.success && response.data) {
        let filtered = response.data;

        // Apply date range filter
        if (dateRange !== 'all') {
          const cutoffDate = new Date();
          switch (dateRange) {
            case '30d':
              cutoffDate.setDate(cutoffDate.getDate() - 30);
              break;
            case '90d':
              cutoffDate.setDate(cutoffDate.getDate() - 90);
              break;
            case '1y':
              cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
              break;
          }
          filtered = filtered.filter((p) => new Date(p.createdAt) >= cutoffDate);
        }

        // Apply status filter
        if (statusFilter !== 'all') {
          filtered = filtered.filter((p) => p.status === statusFilter);
        }

        setProjects(filtered);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      showToast('Failed to load project data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      planning: '#3b82f6',
      'in-progress': '#f59e0b',
      completed: '#10b981',
      'on-hold': '#6b7280',
      cancelled: '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  const getStatusCounts = () => {
    const counts: Record<string, number> = {};
    projects.forEach((project) => {
      counts[project.status] = (counts[project.status] || 0) + 1;
    });

    return Object.entries(counts).map(([status, count]) => ({
      status,
      count,
      percentage: (count / projects.length) * 100,
      color: getStatusColor(status),
    }));
  };

  const getMetrics = () => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === 'in-progress').length;
    const completed = projects.filter((p) => p.status === 'completed').length;
    const planning = projects.filter((p) => p.status === 'planning').length;

    return [
      { label: 'Total Projects', value: total },
      { label: 'In Progress', value: active },
      { label: 'Completed', value: completed },
      { label: 'Planning', value: planning },
    ];
  };

  const handleExportCSV = () => {
    const columns = ['Project Name', 'Status', 'Start Date', 'Target End Date', 'Customer'];
    const rows = projects.map((project) => [
      project.name,
      project.status,
      project.startDate || 'N/A',
      project.targetEndDate || 'N/A',
      project.customerId || 'N/A',
    ]);

    const csv = convertToCSV(columns, rows);
    downloadCSV(getExportFilename('project-report', 'csv'), csv);
    showToast('Report exported as CSV', 'success');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <LoadingSpinner size="lg" text="Loading project reports..." />
      </div>
    );
  }

  const statusCounts = getStatusCounts();
  const metrics = getMetrics();

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push('/reports')}
            className="mb-2 -ml-2"
          >
            <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Reports
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Project Reports</h1>
          <p className="text-gray-600 mt-1">Detailed analysis of all projects</p>
        </div>
        <ExportButtons onExportCSV={handleExportCSV} />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Time Period
            </label>
            <div className="flex gap-2">
              {(['30d', '90d', '1y', 'all'] as const).map((range) => (
                <Button
                  key={range}
                  variant={dateRange === range ? 'primary' : 'ghost'}
                  onClick={() => setDateRange(range)}
                >
                  {range === '30d' && '30 Days'}
                  {range === '90d' && '90 Days'}
                  {range === '1y' && '1 Year'}
                  {range === 'all' && 'All Time'}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Status Filter
            </label>
            <div className="flex flex-wrap gap-2">
              {['all', 'planning', 'in-progress', 'completed', 'on-hold'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'primary' : 'ghost'}
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'all' ? 'All' : status.replace('-', ' ')}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Metrics */}
      <div className="mb-6">
        <ReportSummary metrics={metrics} />
      </div>

      {/* Charts */}
      {statusCounts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ProjectsChart data={statusCounts} title="Project Distribution" />
          <ProjectsPieChart data={statusCounts} title="Status Breakdown" />
        </div>
      )}

      {/* Projects Table */}
      <Card>
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            All Projects ({projects.length})
          </h3>
        </div>

        {projects.length > 0 ? (
          <ReportTable
            columns={['Project Name', 'Status', 'Start Date', 'Target End', 'Customer']}
            rows={projects.map((project) => [
              <button
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                className="text-left font-medium text-primary-600 hover:text-primary-700"
              >
                {project.name}
              </button>,
              <Badge
                key={`${project.id}-status`}
                variant={
                  project.status === 'completed'
                    ? 'success'
                    : project.status === 'in-progress'
                    ? 'info'
                    : 'default'
                }
              >
                {project.status}
              </Badge>,
              project.startDate
                ? new Date(project.startDate).toLocaleDateString()
                : 'Not set',
              project.targetEndDate
                ? new Date(project.targetEndDate).toLocaleDateString()
                : 'Not set',
              project.customerId || 'N/A',
            ])}
          />
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No projects found</p>
            <p className="text-sm">Adjust your filters or create a new project</p>
          </div>
        )}
      </Card>
    </div>
  );
}
