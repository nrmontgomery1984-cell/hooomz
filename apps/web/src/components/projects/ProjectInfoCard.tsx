'use client';

/**
 * Project Info Card
 *
 * Shows project metadata: status, type, client, budget, dates.
 * Renders above the health card on the project detail page.
 */

import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  lead: 'var(--violet)',
  quoted: 'var(--blue)',
  approved: 'var(--yellow)',
  'in-progress': 'var(--accent)',
  complete: 'var(--green)',
  'on-hold': 'var(--red)',
  cancelled: 'var(--muted)',
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
  const statusColor = STATUS_COLORS[status] || 'var(--muted)';

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
      style={{ background: 'var(--surface)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
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
          style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
        >
          {formatType(projectType)}
        </span>
      </div>

      {/* Info rows */}
      <div className="space-y-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-[11px] font-medium" style={{ color: 'var(--muted)' }}>
              {row.label}
            </span>
            <span className="text-sm font-medium" style={{ color: 'var(--charcoal)' }}>
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
          style={{ background: 'var(--accent)', minHeight: '38px' }}
        >
          View Estimate
          <span className="text-xs">&rarr;</span>
        </Link>
      )}
    </div>
  );
}
