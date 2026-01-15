'use client';

/**
 * MarginChart Component
 *
 * Profit margin visualization with comparison.
 */

import React from 'react';
import { Card } from '@/components/ui';

interface MarginDataPoint {
  period: string;
  margin: number;
  revenue?: number;
  cost?: number;
  label?: string;
}

interface MarginChartProps {
  data: MarginDataPoint[];
  title?: string;
  targetMargin?: number;
  height?: number;
}

export function MarginChart({
  data,
  title = 'Profit Margins',
  targetMargin,
  height = 300,
}: MarginChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <div className="text-center py-12 text-gray-500">
          <p>No margin data available</p>
        </div>
      </Card>
    );
  }

  // Calculate chart dimensions
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const width = 800;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Find min and max margins
  const margins = data.map((d) => d.margin);
  const maxMargin = Math.max(...margins, targetMargin || 0);
  const minMargin = Math.min(...margins, 0);

  // Add padding
  const displayMax = Math.ceil((maxMargin + 5) / 5) * 5;
  const displayMin = Math.floor(Math.min(minMargin, 0) / 5) * 5;
  const displayRange = displayMax - displayMin;

  // Bar width
  const barWidth = chartWidth / data.length;
  const barPadding = barWidth * 0.3;
  const actualBarWidth = barWidth - barPadding * 2;

  // Calculate bars
  const bars = data.map((item, index) => {
    const x = padding.left + index * barWidth + barPadding;
    const barHeight = ((item.margin - displayMin) / displayRange) * chartHeight;
    const y = padding.top + chartHeight - barHeight;

    // Color based on margin
    let color = '#10b981'; // green
    if (item.margin < 0) {
      color = '#ef4444'; // red
    } else if (targetMargin && item.margin < targetMargin) {
      color = '#f59e0b'; // yellow
    }

    return { x, y, height: barHeight, color, ...item };
  });

  // Calculate statistics
  const averageMargin = margins.reduce((sum, m) => sum + m, 0) / margins.length;
  const highestMargin = Math.max(...margins);
  const lowestMargin = Math.min(...margins);

  // Target line Y position
  const targetY = targetMargin
    ? padding.top + chartHeight - ((targetMargin - displayMin) / displayRange) * chartHeight
    : null;

  return (
    <Card>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <div className="flex items-center gap-4 mt-2">
              <div>
                <p className="text-xs text-gray-600">Average</p>
                <p className="text-lg font-bold text-gray-900">
                  {averageMargin.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Highest</p>
                <p className="text-lg font-bold text-green-600">
                  {highestMargin.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Lowest</p>
                <p className="text-lg font-bold text-red-600">
                  {lowestMargin.toFixed(1)}%
                </p>
              </div>
              {targetMargin && (
                <div>
                  <p className="text-xs text-gray-600">Target</p>
                  <p className="text-lg font-bold text-blue-600">
                    {targetMargin.toFixed(1)}%
                  </p>
                </div>
              )}
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
            {/* Y-axis grid and labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
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
                    {value.toFixed(0)}%
                  </text>
                </g>
              );
            })}

            {/* Zero line (if applicable) */}
            {displayMin < 0 && displayMax > 0 && (
              <line
                x1={padding.left}
                y1={padding.top + chartHeight - ((-displayMin) / displayRange) * chartHeight}
                x2={padding.left + chartWidth}
                y2={padding.top + chartHeight - ((-displayMin) / displayRange) * chartHeight}
                stroke="#374151"
                strokeWidth="2"
                strokeDasharray="4"
              />
            )}

            {/* Target line */}
            {targetY && (
              <g>
                <line
                  x1={padding.left}
                  y1={targetY}
                  x2={padding.left + chartWidth}
                  y2={targetY}
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray="6 3"
                />
                <text
                  x={padding.left + chartWidth - 5}
                  y={targetY - 5}
                  textAnchor="end"
                  className="text-xs fill-blue-600 font-medium"
                >
                  Target: {targetMargin}%
                </text>
              </g>
            )}

            {/* Bars */}
            {bars.map((bar, index) => (
              <g key={index}>
                <rect
                  x={bar.x}
                  y={bar.y}
                  width={actualBarWidth}
                  height={bar.height}
                  fill={bar.color}
                  rx="2"
                />
                {/* Value label on top of bar */}
                <text
                  x={bar.x + actualBarWidth / 2}
                  y={bar.y - 5}
                  textAnchor="middle"
                  className="text-xs fill-gray-700 font-medium"
                >
                  {bar.margin.toFixed(1)}%
                </text>
                <title>
                  {bar.label || bar.period}: {bar.margin.toFixed(1)}% margin
                  {bar.revenue && bar.cost &&
                    `\nRevenue: $${bar.revenue.toLocaleString()}\nCost: $${bar.cost.toLocaleString()}`}
                </title>
              </g>
            ))}

            {/* X-axis labels */}
            {bars.map((bar, index) => (
              <text
                key={index}
                x={bar.x + actualBarWidth / 2}
                y={padding.top + chartHeight + 20}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {bar.label || bar.period}
              </text>
            ))}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-gray-600">
                Above Target {targetMargin ? `(≥${targetMargin}%)` : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span className="text-gray-600">
                Below Target {targetMargin ? `(<${targetMargin}%)` : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span className="text-gray-600">Negative</span>
            </div>
          </div>
          <span className="text-xs text-gray-600">{data.length} periods</span>
        </div>
      </div>
    </Card>
  );
}
