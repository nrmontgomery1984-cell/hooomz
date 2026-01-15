'use client';

/**
 * DashboardOverview Component
 *
 * Key metrics cards for reporting dashboard.
 */

import React from 'react';
import { Card } from '@/components/ui';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'purple';
}

function MetricCard({ title, value, change, changeLabel, icon, color = 'blue' }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  const changeColor = change && change >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${changeColor}`}>
                {change >= 0 ? '+' : ''}{change}%
              </span>
              {changeLabel && (
                <span className="text-xs text-gray-500">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

interface DashboardMetrics {
  activeProjects: number;
  activeProjectsChange?: number;
  totalRevenue: number;
  revenueChange?: number;
  averageMargin: number;
  marginChange?: number;
  onTimeRate: number;
  onTimeRateChange?: number;
  completedProjects: number;
  pendingEstimates: number;
  overdueInspections: number;
  totalPhotos: number;
}

interface DashboardOverviewProps {
  metrics: DashboardMetrics;
  dateRange?: string;
}

export function DashboardOverview({ metrics, dateRange }: DashboardOverviewProps) {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Date Range Display */}
      {dateRange && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{dateRange}</span>
        </div>
      )}

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Projects"
          value={metrics.activeProjects}
          change={metrics.activeProjectsChange}
          changeLabel="vs last period"
          color="blue"
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />

        <MetricCard
          title="Total Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          change={metrics.revenueChange}
          changeLabel="vs last period"
          color="green"
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <MetricCard
          title="Average Margin"
          value={`${metrics.averageMargin.toFixed(1)}%`}
          change={metrics.marginChange}
          changeLabel="vs last period"
          color="purple"
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />

        <MetricCard
          title="On-Time Rate"
          value={`${metrics.onTimeRate.toFixed(1)}%`}
          change={metrics.onTimeRateChange}
          changeLabel="vs last period"
          color="yellow"
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.completedProjects}
            </div>
            <div className="text-sm text-gray-600 mt-1">Completed</div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {metrics.pendingEstimates}
            </div>
            <div className="text-sm text-gray-600 mt-1">Pending Estimates</div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {metrics.overdueInspections}
            </div>
            <div className="text-sm text-gray-600 mt-1">Overdue Inspections</div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {metrics.totalPhotos}
            </div>
            <div className="text-sm text-gray-600 mt-1">Photos Captured</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
