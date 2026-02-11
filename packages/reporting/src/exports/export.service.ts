/**
 * Export Service - Report output formats
 * Handles exporting reports to various formats (PDF, CSV, Email)
 */

import type { ApiResponse } from '@hooomz/shared-contracts';
import {
  createSuccessResponse,
  createErrorResponse,
} from '@hooomz/shared-contracts';

/**
 * PDF export data structure
 * Actual PDF generation happens in app layer (browser/server)
 */
export interface PDFExportData {
  format: 'pdf';
  title: string;
  content: {
    sections: Array<{
      heading: string;
      content: string | Record<string, unknown>;
      type: 'text' | 'table' | 'chart';
    }>;
  };
  metadata: {
    generatedAt: string;
    author?: string;
    subject?: string;
  };
  styling: {
    orientation: 'portrait' | 'landscape';
    pageSize: 'letter' | 'legal' | 'a4';
    includeHeader: boolean;
    includeFooter: boolean;
  };
}

/**
 * CSV export data structure
 */
export interface CSVExportData {
  format: 'csv';
  filename: string;
  headers: string[];
  rows: Array<Array<string | number>>;
  metadata: {
    generatedAt: string;
    totalRows: number;
  };
}

/**
 * Email export data structure
 */
export interface EmailExportData {
  format: 'email';
  subject: string;
  body: {
    text: string; // Plain text version
    html: string; // HTML version
  };
  attachments?: Array<{
    filename: string;
    content: string; // Base64 or path
    contentType: string;
  }>;
  metadata: {
    generatedAt: string;
    reportType: string;
  };
}

/**
 * Email recipient information
 */
export interface EmailRecipient {
  email: string;
  name?: string;
  cc?: string[];
  bcc?: string[];
}

/**
 * Export service
 */
export class ExportService {
  /**
   * Export report to PDF format
   * Returns data structure for PDF generation
   */
  async exportToPDF(
    report: Record<string, unknown>,
    options?: {
      title?: string;
      orientation?: 'portrait' | 'landscape';
      pageSize?: 'letter' | 'legal' | 'a4';
    }
  ): Promise<ApiResponse<PDFExportData>> {
    try {
      // Determine report type and structure content accordingly
      const reportType = this.detectReportType(report);
      const sections = this.formatReportSections(report, reportType);

      const pdfData: PDFExportData = {
        format: 'pdf',
        title: options?.title || `${reportType} Report`,
        content: {
          sections,
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          subject: `${reportType} Report`,
        },
        styling: {
          orientation: options?.orientation || 'portrait',
          pageSize: options?.pageSize || 'letter',
          includeHeader: true,
          includeFooter: true,
        },
      };

      return createSuccessResponse(pdfData);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to prepare PDF export',
        { error }
      );
    }
  }

  /**
   * Export data to CSV format
   * Converts tabular data to CSV structure
   */
  async exportToCSV(
    data: Record<string, unknown>[],
    options?: {
      filename?: string;
      headers?: string[];
    }
  ): Promise<ApiResponse<CSVExportData>> {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        return createErrorResponse(
          'INVALID_INPUT',
          'Data must be a non-empty array'
        );
      }

      // Extract headers from first object if not provided
      const headers =
        options?.headers || Object.keys(data[0]).map(this.formatHeader);

      // Convert data to rows
      const rows = data.map((item) => {
        return headers.map((header) => {
          const key = this.headerToKey(header, data[0]);
          const value = item[key];
          return this.formatCellValue(value);
        });
      });

      const csvData: CSVExportData = {
        format: 'csv',
        filename: options?.filename || `export_${Date.now()}.csv`,
        headers,
        rows,
        metadata: {
          generatedAt: new Date().toISOString(),
          totalRows: rows.length,
        },
      };

      return createSuccessResponse(csvData);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to prepare CSV export',
        { error }
      );
    }
  }

  /**
   * Export report for email delivery
   * Formats report as email-friendly HTML and plain text
   */
  async exportToEmail(
    report: Record<string, unknown>,
    _recipient: EmailRecipient,
    options?: {
      includeAttachments?: boolean;
      subject?: string;
    }
  ): Promise<ApiResponse<EmailExportData>> {
    try {
      const reportType = this.detectReportType(report);
      const subject =
        options?.subject || `${reportType} Report - ${new Date().toLocaleDateString()}`;

      // Generate plain text version
      const textBody = this.formatReportAsText(report, reportType);

      // Generate HTML version
      const htmlBody = this.formatReportAsHTML(report, reportType);

      const emailData: EmailExportData = {
        format: 'email',
        subject,
        body: {
          text: textBody,
          html: htmlBody,
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          reportType,
        },
      };

      // Add attachments if requested
      if (options?.includeAttachments) {
        emailData.attachments = [
          {
            filename: `${reportType.toLowerCase()}_report.pdf`,
            content: 'PDF_CONTENT_PLACEHOLDER',
            contentType: 'application/pdf',
          },
        ];
      }

      return createSuccessResponse(emailData);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to prepare email export',
        { error }
      );
    }
  }

  /**
   * Helper: Detect report type from structure
   */
  private detectReportType(report: Record<string, unknown>): string {
    if ('project' in report && 'financial' in report && 'schedule' in report) {
      return 'Project';
    }
    if ('summary' in report && 'lineItems' in report && 'breakdown' in report) {
      return 'Estimate';
    }
    if ('inspections' in report && 'timeline' in report) {
      return 'Inspection';
    }
    if ('overview' in report && 'byCategory' in report && 'topOverruns' in report) {
      return 'Variance';
    }
    return 'General';
  }

  /**
   * Helper: Format report sections for PDF
   */
  private formatReportSections(
    report: Record<string, unknown>,
    _reportType: string
  ): Array<{
    heading: string;
    content: string | Record<string, unknown>;
    type: 'text' | 'table' | 'chart';
  }> {
    const sections: Array<{
      heading: string;
      content: string | Record<string, unknown>;
      type: 'text' | 'table' | 'chart';
    }> = [];

    // Add sections based on report structure
    Object.entries(report).forEach(([key, value]) => {
      if (key === 'generatedAt') return;

      sections.push({
        heading: this.formatHeader(key),
        content: value as string | Record<string, unknown>,
        type: this.determineSectionType(value),
      });
    });

    return sections;
  }

  /**
   * Helper: Determine section type for rendering
   */
  private determineSectionType(
    value: unknown
  ): 'text' | 'table' | 'chart' {
    if (Array.isArray(value)) {
      return 'table';
    }
    if (typeof value === 'object' && value !== null) {
      return 'table';
    }
    return 'text';
  }

  /**
   * Helper: Format report as plain text
   */
  private formatReportAsText(
    report: Record<string, unknown>,
    reportType: string
  ): string {
    let text = `${reportType} Report\n`;
    text += `Generated: ${new Date().toLocaleString()}\n`;
    text += '='.repeat(60) + '\n\n';

    Object.entries(report).forEach(([key, value]) => {
      if (key === 'generatedAt') return;

      text += `${this.formatHeader(key)}:\n`;
      text += this.formatValueAsText(value, 2) + '\n\n';
    });

    return text;
  }

  /**
   * Helper: Format report as HTML
   */
  private formatReportAsHTML(
    report: Record<string, unknown>,
    reportType: string
  ): string {
    let html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    h2 { color: #666; margin-top: 20px; }
    table { border-collapse: collapse; width: 100%; margin: 10px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .metadata { color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <h1>${reportType} Report</h1>
  <p class="metadata">Generated: ${new Date().toLocaleString()}</p>
`;

    Object.entries(report).forEach(([key, value]) => {
      if (key === 'generatedAt') return;

      html += `<h2>${this.formatHeader(key)}</h2>`;
      html += this.formatValueAsHTML(value);
    });

    html += '</body></html>';
    return html;
  }

  /**
   * Helper: Format value as plain text with indentation
   */
  private formatValueAsText(value: unknown, indent: number): string {
    const spaces = ' '.repeat(indent);

    if (Array.isArray(value)) {
      return value
        .map((item, index) => {
          if (typeof item === 'object') {
            return `${spaces}[${index + 1}]\n${this.formatValueAsText(item, indent + 2)}`;
          }
          return `${spaces}- ${item}`;
        })
        .join('\n');
    }

    if (typeof value === 'object' && value !== null) {
      return Object.entries(value)
        .map(([k, v]) => {
          return `${spaces}${this.formatHeader(k)}: ${this.formatValueAsText(v, 0)}`;
        })
        .join('\n');
    }

    return String(value);
  }

  /**
   * Helper: Format value as HTML
   */
  private formatValueAsHTML(value: unknown): string {
    if (Array.isArray(value)) {
      if (value.length === 0) return '<p>No items</p>';

      if (typeof value[0] === 'object') {
        // Render as table
        const keys = Object.keys(value[0]);
        let html = '<table><thead><tr>';
        keys.forEach((key) => {
          html += `<th>${this.formatHeader(key)}</th>`;
        });
        html += '</tr></thead><tbody>';

        value.forEach((item) => {
          html += '<tr>';
          keys.forEach((key) => {
            html += `<td>${this.formatCellValue(item[key])}</td>`;
          });
          html += '</tr>';
        });

        html += '</tbody></table>';
        return html;
      }

      // Simple list
      return '<ul>' + value.map((item) => `<li>${item}</li>`).join('') + '</ul>';
    }

    if (typeof value === 'object' && value !== null) {
      let html = '<table><tbody>';
      Object.entries(value).forEach(([k, v]) => {
        html += `<tr><th>${this.formatHeader(k)}</th><td>${this.formatCellValue(v)}</td></tr>`;
      });
      html += '</tbody></table>';
      return html;
    }

    return `<p>${value}</p>`;
  }

  /**
   * Helper: Format header text
   */
  private formatHeader(text: string): string {
    return text
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  /**
   * Helper: Convert header back to object key
   */
  private headerToKey(header: string, sample: Record<string, unknown>): string {
    // Find matching key in sample object
    const keys = Object.keys(sample);
    const formattedKeys = keys.map((k) => this.formatHeader(k));
    const index = formattedKeys.indexOf(header);
    return index >= 0 ? keys[index] : header;
  }

  /**
   * Helper: Format cell value for export
   */
  private formatCellValue(value: unknown): string | number {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }
}
