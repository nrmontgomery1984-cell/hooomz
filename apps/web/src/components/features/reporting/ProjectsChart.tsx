'use client';

/**
 * ProjectsChart Component
 *
 * Project status breakdown visualization.
 * Simple bar/pie chart without external dependencies.
 */

import React from 'react';
import { Card, Badge } from '@/components/ui';

interface ProjectStatusData {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

interface ProjectsChartProps {
  data: ProjectStatusData[];
  title?: string;
  showLegend?: boolean;
}

export function ProjectsChart({ data, title = 'Projects by Status', showLegend = true }: ProjectsChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  // Calculate bar chart max for scaling
  const maxCount = Math.max(...data.map((item) => item.count));

  return (
    <Card>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <div className="text-sm text-gray-600">Total: {total}</div>
        </div>

        {/* Bar Chart */}
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {item.status.replace('-', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">{item.count}</span>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">
                    {item.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all"
                  style={{
                    backgroundColor: item.color,
                    width: `${item.percentage}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Legend/Summary */}
        {showLegend && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-4">
              {data.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-gray-600 capitalize">
                    {item.status.replace('-', ' ')} ({item.count})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// Pie Chart variant
interface PieChartProps {
  data: ProjectStatusData[];
  title?: string;
  size?: number;
}

export function ProjectsPieChart({ data, title = 'Projects Distribution', size = 200 }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const radius = size / 2;
  const centerX = radius;
  const centerY = radius;

  // Calculate pie slices
  let currentAngle = -90; // Start at top
  const slices = data.map((item) => {
    const angle = (item.percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    // Calculate path for pie slice
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    const path = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      'Z',
    ].join(' ');

    return { ...item, path, startAngle, endAngle };
  });

  return (
    <Card>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">Total: {total} projects</p>
        </div>

        {/* Pie Chart */}
        <div className="flex flex-col items-center">
          <svg width={size} height={size} className="mb-4">
            {slices.map((slice, index) => (
              <g key={index}>
                <path d={slice.path} fill={slice.color} stroke="white" strokeWidth="2" />
              </g>
            ))}
          </svg>

          {/* Legend */}
          <div className="space-y-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {item.status.replace('-', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900">{item.count}</span>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {item.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
