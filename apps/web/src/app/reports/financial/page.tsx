'use client';

/**
 * Financial Summary Page
 *
 * Revenue and profit margin analysis.
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useReportingService } from '@/lib/services/ServicesContext';
import { Button, Card, LoadingSpinner } from '@/components/ui';
import {
  RevenueChart,
  MarginChart,
  ReportSummary,
  ReportTable,
  ExportButtons,
  convertToCSV,
  downloadCSV,
  getExportFilename,
} from '@/components/features/reporting';
import { useToast } from '@/components/ui/Toast';

export default function FinancialReportsPage() {
  const router = useRouter();
  const reportingService = useReportingService();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'30d' | '90d' | '1y'>('90d');
  const [groupBy, setGroupBy] = useState<'month' | 'quarter'>('month');

  // State for financial data
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [marginData, setMarginData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    loadFinancialData();
  }, [dateRange, groupBy]);

  const loadFinancialData = async () => {
    setIsLoading(true);
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      switch (dateRange) {
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

      // Load revenue over time
      const revenueResponse = await reportingService.getRevenueOverTime(
        startDate.toISOString(),
        endDate.toISOString(),
        groupBy
      );

      if (revenueResponse.success && revenueResponse.data) {
        setRevenueData(revenueResponse.data);
      }

      // Load margin data
      const marginResponse = await reportingService.getMarginAnalysis(
        startDate.toISOString(),
        endDate.toISOString(),
        groupBy
      );

      if (marginResponse.success && marginResponse.data) {
        setMarginData(marginResponse.data);
      }

      // Load summary metrics
      const summaryResponse = await reportingService.getFinancialSummary(
        startDate.toISOString(),
        endDate.toISOString()
      );

      if (summaryResponse.success && summaryResponse.data) {
        setSummary(summaryResponse.data);
      }
    } catch (error) {
      console.error('Failed to load financial data:', error);
      showToast('Failed to load financial data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSummaryMetrics = () => {
    if (!summary) return [];

    return [
      {
        label: 'Total Revenue',
        value: formatCurrency(summary.totalRevenue),
        change: summary.revenueChange,
        changeLabel: 'vs previous period',
      },
      {
        label: 'Total Costs',
        value: formatCurrency(summary.totalCosts),
        change: summary.costsChange,
        changeLabel: 'vs previous period',
      },
      {
        label: 'Gross Profit',
        value: formatCurrency(summary.grossProfit),
        change: summary.profitChange,
        changeLabel: 'vs previous period',
      },
      {
        label: 'Average Margin',
        value: `${summary.averageMargin.toFixed(1)}%`,
        change: summary.marginChange,
        changeLabel: 'vs previous period',
      },
    ];
  };

  const handleExportCSV = () => {
    if (revenueData.length === 0) return;

    const columns = ['Period', 'Revenue', 'Margin %'];
    const rows = revenueData.map((item, index) => {
      const marginItem = marginData[index];
      return [
        item.period,
        formatCurrency(item.revenue),
        marginItem ? `${marginItem.margin.toFixed(1)}%` : 'N/A',
      ];
    });

    const csv = convertToCSV(columns, rows);
    downloadCSV(getExportFilename('financial-report', 'csv'), csv);
    showToast('Report exported as CSV', 'success');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <LoadingSpinner size="lg" text="Loading financial reports..." />
      </div>
    );
  }

  const summaryMetrics = getSummaryMetrics();

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
          <h1 className="text-3xl font-bold text-gray-900">Financial Summary</h1>
          <p className="text-gray-600 mt-1">Revenue and profit margin analysis</p>
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
              {(['30d', '90d', '1y'] as const).map((range) => (
                <Button
                  key={range}
                  variant={dateRange === range ? 'primary' : 'ghost'}
                  onClick={() => setDateRange(range)}
                >
                  {range === '30d' && '30 Days'}
                  {range === '90d' && '90 Days'}
                  {range === '1y' && '1 Year'}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Group By
            </label>
            <div className="flex gap-2">
              <Button
                variant={groupBy === 'month' ? 'primary' : 'ghost'}
                onClick={() => setGroupBy('month')}
              >
                Month
              </Button>
              <Button
                variant={groupBy === 'quarter' ? 'primary' : 'ghost'}
                onClick={() => setGroupBy('quarter')}
              >
                Quarter
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Metrics */}
      {summaryMetrics.length > 0 && (
        <div className="mb-6">
          <ReportSummary metrics={summaryMetrics} />
        </div>
      )}

      {/* Charts */}
      <div className="space-y-6 mb-6">
        {revenueData.length > 0 && (
          <RevenueChart data={revenueData} title="Revenue Over Time" height={350} />
        )}

        {marginData.length > 0 && (
          <MarginChart
            data={marginData}
            title="Profit Margins"
            targetMargin={15}
            height={350}
          />
        )}
      </div>

      {/* Detailed Table */}
      {revenueData.length > 0 && (
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900">Period Detail</h3>
          </div>

          <ReportTable
            columns={['Period', 'Revenue', 'Costs', 'Profit', 'Margin %']}
            rows={revenueData.map((item, index) => {
              const marginItem = marginData[index];
              const profit = marginItem
                ? (marginItem.revenue || item.revenue) - (marginItem.cost || 0)
                : 0;

              return [
                item.label || item.period,
                formatCurrency(item.revenue),
                marginItem ? formatCurrency(marginItem.cost || 0) : 'N/A',
                formatCurrency(profit),
                marginItem ? (
                  <span
                    key={`margin-${index}`}
                    className={
                      marginItem.margin >= 15
                        ? 'text-green-600 font-medium'
                        : marginItem.margin >= 10
                        ? 'text-yellow-600 font-medium'
                        : 'text-red-600 font-medium'
                    }
                  >
                    {marginItem.margin.toFixed(1)}%
                  </span>
                ) : (
                  'N/A'
                ),
              ];
            })}
          />
        </Card>
      )}

      {/* Empty State */}
      {revenueData.length === 0 && marginData.length === 0 && (
        <Card>
          <div className="text-center py-12 text-gray-500">
            <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-lg mb-2">No financial data available</p>
            <p className="text-sm">
              Financial data will appear once you have projects with estimates
            </p>
          </div>
        </Card>
      )}

      {/* Target Margin Info */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <svg className="h-6 w-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold text-blue-800 mb-1">Target Margin: 15%</p>
            <p className="text-sm text-blue-700">
              Projects with margins below the target threshold are highlighted in yellow or red
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
