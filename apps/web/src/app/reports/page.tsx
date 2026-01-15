'use client';

/**
 * Reports Dashboard Page
 *
 * Main reporting dashboard with key metrics and charts.
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useReportingService } from '@/lib/services/ServicesContext';
import { Button, Card, LoadingSpinner } from '@/components/ui';
import {
  DashboardOverview,
  ProjectsChart,
  RevenueChart,
  ExportButtons,
  convertToCSV,
  downloadCSV,
  getExportFilename,
} from '@/components/features/reporting';
import { useToast } from '@/components/ui/Toast';

export default function ReportsPage() {
  const router = useRouter();
  const reportingService = useReportingService();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // State for dashboard data
  const [metrics, setMetrics] = useState<any>(null);
  const [projectsData, setProjectsData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      switch (dateRange) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      // Load dashboard metrics
      const metricsResponse = await reportingService.getDashboardMetrics(
        startDate.toISOString(),
        endDate.toISOString()
      );

      if (metricsResponse.success && metricsResponse.data) {
        setMetrics(metricsResponse.data);
      }

      // Load projects breakdown
      const projectsResponse = await reportingService.getProjectsBreakdown(
        startDate.toISOString(),
        endDate.toISOString()
      );

      if (projectsResponse.success && projectsResponse.data) {
        // Transform data for chart
        const total = Object.values(projectsResponse.data).reduce((sum: number, count: any) => sum + count, 0);
        const chartData = Object.entries(projectsResponse.data).map(([status, count]) => ({
          status,
          count: count as number,
          percentage: total > 0 ? ((count as number) / total) * 100 : 0,
          color: getStatusColor(status),
        }));
        setProjectsData(chartData);
      }

      // Load revenue data
      const revenueResponse = await reportingService.getRevenueOverTime(
        startDate.toISOString(),
        endDate.toISOString()
      );

      if (revenueResponse.success && revenueResponse.data) {
        setRevenueData(revenueResponse.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      showToast('Failed to load dashboard data', 'error');
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

  const getDateRangeLabel = (): string => {
    const labels = {
      '7d': 'Last 7 Days',
      '30d': 'Last 30 Days',
      '90d': 'Last 90 Days',
      '1y': 'Last Year',
    };
    return labels[dateRange];
  };

  const handleExportCSV = () => {
    if (!metrics) return;

    const columns = ['Metric', 'Value'];
    const rows = [
      ['Active Projects', metrics.activeProjects],
      ['Total Revenue', `$${metrics.totalRevenue.toLocaleString()}`],
      ['Average Margin', `${metrics.averageMargin.toFixed(1)}%`],
      ['On-Time Rate', `${metrics.onTimeRate.toFixed(1)}%`],
      ['Completed Projects', metrics.completedProjects],
      ['Pending Estimates', metrics.pendingEstimates],
    ];

    const csv = convertToCSV(columns, rows);
    downloadCSV(getExportFilename('dashboard-report', 'csv'), csv);
    showToast('Report exported as CSV', 'success');
  };

  const handleExportPDF = () => {
    // Trigger print dialog for now (PDF generation would require additional library)
    window.print();
    showToast('Opening print dialog...', 'info');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <LoadingSpinner size="lg" text="Loading reports..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Key metrics and insights across all projects
          </p>
        </div>
        <ExportButtons
          onExportPDF={handleExportPDF}
          onExportCSV={handleExportCSV}
        />
      </div>

      {/* Date Range Selector */}
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Time Period</label>
          <div className="flex gap-2">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <Button
                key={range}
                variant={dateRange === range ? 'primary' : 'ghost'}
                onClick={() => setDateRange(range)}
              >
                {range === '7d' && '7 Days'}
                {range === '30d' && '30 Days'}
                {range === '90d' && '90 Days'}
                {range === '1y' && '1 Year'}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Dashboard Overview */}
      {metrics && (
        <div className="mb-6">
          <DashboardOverview metrics={metrics} dateRange={getDateRangeLabel()} />
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Projects Chart */}
        {projectsData.length > 0 && (
          <ProjectsChart data={projectsData} title="Projects by Status" />
        )}

        {/* Revenue Chart */}
        {revenueData.length > 0 && (
          <RevenueChart data={revenueData} title="Revenue Trend" height={350} />
        )}
      </div>

      {/* Quick Links */}
      <Card>
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Detailed Reports</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/reports/projects')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Project Reports</h4>
                  <p className="text-sm text-gray-600">Detailed project analysis</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push('/reports/financial')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Financial Summary</h4>
                  <p className="text-sm text-gray-600">Revenue and margins</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push('/schedule')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Schedule View</h4>
                  <p className="text-sm text-gray-600">Task timeline</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
