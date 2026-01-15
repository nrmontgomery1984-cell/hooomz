'use client';

/**
 * ReportViewer Component
 *
 * Formatted report display with print-friendly layout.
 */

import React from 'react';
import { Card } from '@/components/ui';

interface ReportSection {
  title: string;
  content: React.ReactNode;
}

interface ReportViewerProps {
  title: string;
  subtitle?: string;
  dateRange?: string;
  generatedAt?: string;
  sections: ReportSection[];
  footer?: React.ReactNode;
}

export function ReportViewer({
  title,
  subtitle,
  dateRange,
  generatedAt,
  sections,
  footer,
}: ReportViewerProps) {
  return (
    <Card className="print:shadow-none">
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          {subtitle && <p className="text-lg text-gray-600 mb-3">{subtitle}</p>}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            {dateRange && (
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>{dateRange}</span>
              </div>
            )}
            {generatedAt && (
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Generated: {generatedAt}</span>
              </div>
            )}
          </div>
        </div>

        {/* Sections */}
        {sections.map((section, index) => (
          <div key={index} className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">
              {section.title}
            </h2>
            <div>{section.content}</div>
          </div>
        ))}

        {/* Footer */}
        {footer && (
          <div className="border-t border-gray-200 pt-6 text-sm text-gray-600">
            {footer}
          </div>
        )}
      </div>
    </Card>
  );
}

// Table component for reports
interface ReportTableProps {
  columns: string[];
  rows: (string | number | React.ReactNode)[][];
  className?: string;
}

export function ReportTable({ columns, rows, className = '' }: ReportTableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            {columns.map((column, index) => (
              <th
                key={index}
                className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Summary grid for key metrics
interface MetricItem {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
}

interface ReportSummaryProps {
  metrics: MetricItem[];
}

export function ReportSummary({ metrics }: ReportSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <div key={index} className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</p>
          {metric.change !== undefined && (
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium ${
                  metric.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {metric.change >= 0 ? '+' : ''}
                {metric.change}%
              </span>
              {metric.changeLabel && (
                <span className="text-xs text-gray-500">{metric.changeLabel}</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
