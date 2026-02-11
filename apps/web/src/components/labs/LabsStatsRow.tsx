'use client';

/**
 * Labs Stats Row
 * Summary stats for the Labs dashboard
 */

import React from 'react';

interface LabsStat {
  label: string;
  value: number | string;
  change?: number;
}

interface LabsStatsRowProps {
  stats: LabsStat[];
  className?: string;
}

export function LabsStatsRow({ stats, className = '' }: LabsStatsRowProps) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 ${className}`}>
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm"
        >
          <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
          <div className="flex items-end gap-2">
            <span className="text-xl font-bold text-gray-900">{stat.value}</span>
            {stat.change !== undefined && stat.change !== 0 && (
              <span className={`text-xs font-medium ${stat.change > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {stat.change > 0 ? '+' : ''}{stat.change}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
