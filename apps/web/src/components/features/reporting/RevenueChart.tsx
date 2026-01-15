'use client';

/**
 * RevenueChart Component
 *
 * Revenue over time line chart.
 * Simple SVG-based chart without external dependencies.
 */

import React from 'react';
import { Card } from '@/components/ui';

interface RevenueDataPoint {
  period: string;
  revenue: number;
  label?: string;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
  title?: string;
  height?: number;
  showGrid?: boolean;
}

export function RevenueChart({
  data,
  title = 'Revenue Over Time',
  height = 300,
  showGrid = true,
}: RevenueChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <div className="text-center py-12 text-gray-500">
          <p>No revenue data available</p>
        </div>
      </Card>
    );
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate chart dimensions
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const width = 800;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Find min and max values
  const values = data.map((d) => d.revenue);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values, 0);
  const valueRange = maxValue - minValue;

  // Add some padding to the top
  const displayMax = maxValue * 1.1;
  const displayMin = Math.min(minValue, 0);
  const displayRange = displayMax - displayMin;

  // Calculate points
  const points = data.map((item, index) => {
    const x = padding.left + (index / (data.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - ((item.revenue - displayMin) / displayRange) * chartHeight;
    return { x, y, ...item };
  });

  // Create path for line
  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  // Create path for area fill
  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x} ${padding.top + chartHeight}` +
    ` L ${points[0].x} ${padding.top + chartHeight} Z`;

  // Grid lines
  const gridLines = showGrid ? [0, 0.25, 0.5, 0.75, 1] : [];

  // Calculate totals
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const averageRevenue = totalRevenue / data.length;
  const trend =
    data.length > 1
      ? ((data[data.length - 1].revenue - data[0].revenue) / data[0].revenue) * 100
      : 0;

  return (
    <Card>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <div className="flex items-center gap-4 mt-2">
              <div>
                <p className="text-xs text-gray-600">Total</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Average</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(averageRevenue)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Trend</p>
                <p
                  className={`text-lg font-bold ${
                    trend >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {trend >= 0 ? '+' : ''}
                  {trend.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="overflow-x-auto">
          <svg
            width={width}
            height={height}
            className="w-full"
            viewBox={`0 0 ${width} ${height}`}
          >
            {/* Grid lines */}
            {gridLines.map((ratio, index) => {
              const y = padding.top + chartHeight * ratio;
              const value = displayMax - displayRange * ratio;
              return (
                <g key={index}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={padding.left + chartWidth}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="text-xs fill-gray-600"
                  >
                    {formatCurrency(value)}
                  </text>
                </g>
              );
            })}

            {/* Area fill */}
            <path d={areaPath} fill="url(#revenueGradient)" opacity="0.2" />

            {/* Gradient definition */}
            <defs>
              <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Line */}
            <path d={linePath} stroke="#10b981" strokeWidth="3" fill="none" />

            {/* Data points */}
            {points.map((point, index) => (
              <g key={index}>
                <circle cx={point.x} cy={point.y} r="4" fill="#10b981" stroke="white" strokeWidth="2" />
                <title>
                  {point.label || point.period}: {formatCurrency(point.revenue)}
                </title>
              </g>
            ))}

            {/* X-axis labels */}
            {points.map((point, index) => (
              <text
                key={index}
                x={point.x}
                y={padding.top + chartHeight + 20}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {point.label || point.period}
              </text>
            ))}
          </svg>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-600">Revenue</span>
          </div>
          <span className="text-gray-600">
            {data.length} periods • {formatCurrency(totalRevenue)} total
          </span>
        </div>
      </div>
    </Card>
  );
}
