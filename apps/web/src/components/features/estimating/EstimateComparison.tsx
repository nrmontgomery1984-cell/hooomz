'use client';

/**
 * EstimateComparison Component
 *
 * Compare estimated costs vs actual costs with variance analysis.
 * Useful for project completion and budgeting insights.
 */

import React from 'react';
import type { Estimate, EstimateLineItem } from '@hooomz/shared-contracts';
import { Card, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';

interface ActualCost {
  lineItemId: string;
  actualQuantity: number;
  actualUnitCost: number;
  actualTotal: number;
}

interface EstimateComparisonProps {
  estimate: Estimate;
  lineItems: EstimateLineItem[];
  actualCosts: ActualCost[];
}

interface ComparisonRow {
  lineItem: EstimateLineItem;
  actual?: ActualCost;
  variance: number;
  variancePercentage: number;
}

export function EstimateComparison({
  estimate,
  lineItems,
  actualCosts,
}: EstimateComparisonProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const getComparisonRows = (): ComparisonRow[] => {
    return lineItems.map((lineItem) => {
      const actual = actualCosts.find((a) => a.lineItemId === lineItem.id);
      const estimatedTotal = lineItem.total;
      const actualTotal = actual?.actualTotal || 0;
      const variance = actualTotal - estimatedTotal;
      const variancePercentage = estimatedTotal > 0
        ? (variance / estimatedTotal) * 100
        : 0;

      return {
        lineItem,
        actual,
        variance,
        variancePercentage,
      };
    });
  };

  const calculateTotals = () => {
    const rows = getComparisonRows();
    const estimatedTotal = rows.reduce((sum, row) => sum + row.lineItem.total, 0);
    const actualTotal = rows.reduce((sum, row) => sum + (row.actual?.actualTotal || 0), 0);
    const variance = actualTotal - estimatedTotal;
    const variancePercentage = estimatedTotal > 0 ? (variance / estimatedTotal) * 100 : 0;

    return { estimatedTotal, actualTotal, variance, variancePercentage };
  };

  const getVarianceBadge = (variancePercentage: number) => {
    if (Math.abs(variancePercentage) < 5) {
      return <Badge variant="success" size="sm">On Budget</Badge>;
    } else if (variancePercentage > 0) {
      return <Badge variant="error" size="sm">Over Budget</Badge>;
    } else {
      return <Badge variant="info" size="sm">Under Budget</Badge>;
    }
  };

  const getVarianceColor = (variance: number): string => {
    if (Math.abs(variance) < 0.01) return 'text-gray-600';
    return variance > 0 ? 'text-red-600' : 'text-green-600';
  };

  const getCategoryVariant = (category: string) => {
    switch (category) {
      case 'materials':
        return 'primary' as const;
      case 'labor':
        return 'warning' as const;
      case 'subcontractors':
        return 'info' as const;
      case 'equipment':
        return 'neutral' as const;
      default:
        return 'neutral' as const;
    }
  };

  const comparisonRows = getComparisonRows();
  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-sm text-gray-600 mb-1">Estimated Total</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(totals.estimatedTotal)}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600 mb-1">Actual Total</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(totals.actualTotal)}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600 mb-1">Variance</div>
          <div className={`text-2xl font-bold ${getVarianceColor(totals.variance)}`}>
            {totals.variance >= 0 ? '+' : ''}{formatCurrency(totals.variance)}
          </div>
          <div className="mt-2">
            {getVarianceBadge(totals.variancePercentage)}
            <span className={`ml-2 text-sm font-medium ${getVarianceColor(totals.variance)}`}>
              {totals.variancePercentage >= 0 ? '+' : ''}
              {totals.variancePercentage.toFixed(1)}%
            </span>
          </div>
        </Card>
      </div>

      {/* Detailed Comparison Table */}
      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Line Item Comparison</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Est. Qty</TableHead>
                <TableHead className="text-right">Act. Qty</TableHead>
                <TableHead className="text-right">Est. Cost</TableHead>
                <TableHead className="text-right">Act. Cost</TableHead>
                <TableHead className="text-right">Variance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonRows.map((row) => (
                <TableRow key={row.lineItem.id}>
                  <TableCell>
                    <Badge variant={getCategoryVariant(row.lineItem.category)} size="sm">
                      {row.lineItem.category}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.lineItem.description}</TableCell>
                  <TableCell className="text-right">
                    {row.lineItem.quantity} {row.lineItem.unit}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.actual ? (
                      <span>
                        {row.actual.actualQuantity} {row.lineItem.unit}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.lineItem.total)}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.actual ? (
                      formatCurrency(row.actual.actualTotal)
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${getVarianceColor(row.variance)}`}>
                    {row.actual ? (
                      <>
                        {row.variance >= 0 ? '+' : ''}{formatCurrency(row.variance)}
                        <div className="text-xs">
                          ({row.variancePercentage >= 0 ? '+' : ''}
                          {row.variancePercentage.toFixed(1)}%)
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Insights */}
      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-3">Budget Analysis</h3>
        <div className="space-y-2 text-sm">
          {totals.variance > 0 ? (
            <div className="flex items-start gap-2 text-red-700">
              <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>
                Project is <strong>{Math.abs(totals.variancePercentage).toFixed(1)}%</strong> over budget.
                Consider reviewing scope or adjusting future estimates.
              </span>
            </div>
          ) : totals.variance < 0 ? (
            <div className="flex items-start gap-2 text-green-700">
              <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>
                Project is <strong>{Math.abs(totals.variancePercentage).toFixed(1)}%</strong> under budget.
                Great cost management!
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-green-700">
              <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Project is exactly on budget. Excellent planning!</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
