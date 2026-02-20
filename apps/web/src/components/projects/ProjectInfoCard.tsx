'use client';

/**
 * Project Info Card
 *
 * Shows project metadata: status, type, client, budget, dates.
 * Renders above the health card on the project detail page.
 */

import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  lead: '#8B5CF6',
  quoted: '#3B82F6',
  approved: '#F59E0B',
  'in-progress': '#0F766E',
  complete: '#10B981',
  'on-hold': '#EF4444',
  cancelled: '#9CA3AF',
};

function formatType(type: string): string {
  return type
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface ProjectInfoCardProps {
  projectId: string;
  status: string;
  projectType: string;
  clientName?: string;
  estimatedCost: number;
  actualCost: number;
  startDate?: string;
  estimatedEndDate?: string;
  createdAt: string;
}

export function ProjectInfoCard({
  projectId,
  status,
  projectType,
  clientName,
  estimatedCost,
  actualCost,
  startDate,
  estimatedEndDate,
  createdAt,
}: ProjectInfoCardProps) {
  const statusColor = STATUS_COLORS[status] || '#9CA3AF';

  const rows: { label: string; value: string }[] = [];

  if (clientName) {
    rows.push({ label: 'Client', value: clientName });
  }

  if (estimatedCost > 0) {
    rows.push({ label: 'Estimate', value: formatCurrency(estimatedCost) });
  }

  if (actualCost > 0) {
    rows.push({ label: 'Spent', value: formatCurrency(actualCost) });
  }

  if (startDate) {
    rows.push({ label: 'Start', value: formatDate(startDate) });
  }

  if (estimatedEndDate) {
    rows.push({ label: 'Target', value: formatDate(estimatedEndDate) });
  }

  rows.push({ label: 'Created', value: formatDate(createdAt) });

  return (
    <div
      className="mt-3 rounded-2xl p-3"
      style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
    >
      {/* Status + Type badges */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
          style={{ background: `${statusColor}18`, color: statusColor }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: statusColor }}
          />
          {status.replace(/-/g, ' ')}
        </span>
        <span
          className="text-[11px] font-medium px-2 py-0.5 rounded-full"
          style={{ background: '#F3F4F6', color: '#6B7280' }}
        >
          {formatType(projectType)}
        </span>
      </div>

      {/* Info rows */}
      <div className="space-y-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-[11px] font-medium" style={{ color: '#9CA3AF' }}>
              {row.label}
            </span>
            <span className="text-sm font-medium" style={{ color: '#111827' }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* View Estimate button */}
      {estimatedCost > 0 && (
        <Link
          href={`/estimates/${projectId}`}
          className="mt-2.5 flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-semibold text-white"
          style={{ background: '#0F766E', minHeight: '38px' }}
        >
          View Estimate
          <span className="text-xs">&rarr;</span>
        </Link>
      )}
    </div>
  );
}
