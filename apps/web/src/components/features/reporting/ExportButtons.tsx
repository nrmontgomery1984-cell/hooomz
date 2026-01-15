'use client';

/**
 * ExportButtons Component
 *
 * PDF and CSV export options for reports.
 */

import React from 'react';
import { Button } from '@/components/ui';

interface ExportButtonsProps {
  onExportPDF?: () => void;
  onExportCSV?: () => void;
  onPrint?: () => void;
  disabled?: boolean;
}

export function ExportButtons({
  onExportPDF,
  onExportCSV,
  onPrint,
  disabled = false,
}: ExportButtonsProps) {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      {onExportPDF && (
        <Button
          variant="secondary"
          onClick={onExportPDF}
          disabled={disabled}
        >
          <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Export PDF
        </Button>
      )}

      {onExportCSV && (
        <Button
          variant="secondary"
          onClick={onExportCSV}
          disabled={disabled}
        >
          <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Export CSV
        </Button>
      )}

      <Button
        variant="ghost"
        onClick={handlePrint}
        disabled={disabled}
      >
        <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
          />
        </svg>
        Print
      </Button>
    </div>
  );
}

// Utility functions for export

/**
 * Convert table data to CSV format
 */
export function convertToCSV(columns: string[], rows: (string | number)[][]): string {
  const escapeCsv = (value: string | number): string => {
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const csvRows = [
    columns.map(escapeCsv).join(','),
    ...rows.map((row) => row.map(escapeCsv).join(',')),
  ];

  return csvRows.join('\n');
}

/**
 * Trigger CSV download
 */
export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Prepare PDF export (placeholder for actual PDF generation)
 * In real implementation, would use a library like jsPDF or html2pdf
 */
export function preparePDFExport(elementId: string, filename: string): void {
  // This is a placeholder. Real implementation would:
  // 1. Use jsPDF or similar library
  // 2. Convert HTML content to PDF
  // 3. Trigger download

  console.log('PDF export prepared for:', elementId, filename);

  // For now, use print dialog as fallback
  window.print();
}

/**
 * Format date for export filename
 */
export function getExportFilename(prefix: string, extension: string): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0];
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
  return `${prefix}_${dateStr}_${timeStr}.${extension}`;
}
