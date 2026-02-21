'use client';

import { useState, useMemo } from 'react';
import { AlertTriangle, ArrowUpDown } from 'lucide-react';
import { useFinancialActuals } from '@/lib/hooks/useForecast';
import type { ProjectFinancialSummary } from '@/lib/types/forecast.types';

type DatePreset = 'mtd' | 'qtd' | 'ytd' | 'l12' | 'custom';
type SortKey = keyof ProjectFinancialSummary;
type SortDir = 'asc' | 'desc';

function getPresetRange(preset: DatePreset): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const today = now.toISOString().substring(0, 10);

  switch (preset) {
    case 'mtd':
      return { from: `${y}-${String(m + 1).padStart(2, '0')}-01`, to: today };
    case 'qtd': {
      const qStart = Math.floor(m / 3) * 3;
      return { from: `${y}-${String(qStart + 1).padStart(2, '0')}-01`, to: today };
    }
    case 'ytd':
      return { from: `${y}-01-01`, to: today };
    case 'l12': {
      const past = new Date(now);
      past.setFullYear(past.getFullYear() - 1);
      return { from: past.toISOString().substring(0, 10), to: today };
    }
    default:
      return { from: `${y}-01-01`, to: today };
  }
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);
}

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

function fmtHrs(n: number): string {
  return `${n.toFixed(1)} hrs`;
}

export default function ActualsPage() {
  const [preset, setPreset] = useState<DatePreset>('ytd');
  const [sortKey, setSortKey] = useState<SortKey>('revenue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const range = useMemo(() => getPresetRange(preset), [preset]);
  const { data: actuals, isLoading } = useFinancialActuals(range.from, range.to);

  const sortedProjects = useMemo(() => {
    if (!actuals?.projectBreakdown) return [];
    return [...actuals.projectBreakdown].sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [actuals?.projectBreakdown, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  if (isLoading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3, #9CA3AF)' }}>Loading actuals...</div>;
  }

  if (!actuals) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3, #9CA3AF)' }}>No data available</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Date range selector */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {([
          ['mtd', 'MTD'],
          ['qtd', 'QTD'],
          ['ytd', 'YTD'],
          ['l12', 'Last 12mo'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setPreset(key)}
            style={{
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: preset === key ? 600 : 500,
              borderRadius: 6,
              border: '1px solid var(--border, #E5E7EB)',
              background: preset === key ? 'var(--blue, #3B82F6)' : 'var(--surface-1, #FFFFFF)',
              color: preset === key ? 'white' : 'var(--text-2, #6B7280)',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {label}
          </button>
        ))}
        <span style={{ fontSize: 12, color: 'var(--text-3, #9CA3AF)', alignSelf: 'center', marginLeft: 8 }}>
          {range.from} — {range.to}
        </span>
      </div>

      {/* Data gap warning */}
      {actuals.unresolvedProjectCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
          background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 8,
        }}>
          <AlertTriangle size={16} style={{ color: '#D97706', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#92400E' }}>
            Revenue data for {actuals.unresolvedProjectCount} project{actuals.unresolvedProjectCount > 1 ? 's' : ''} could not be attributed. Manual review required.
          </span>
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <SummaryCard label="Total Revenue" value={fmt(actuals.totalRevenue)} />
        <SummaryCard label="Gross Profit" value={fmt(actuals.grossProfit)} />
        <SummaryCard label="Gross Margin" value={fmtPct(actuals.grossMarginPct)} />
        <SummaryCard label="Jobs Completed" value={String(actuals.completedProjectCount)} />
        <SummaryCard label="Pipeline Value" value={fmt(actuals.pipelineValue)} badge={String(actuals.pipelineCount)} />
      </div>

      {/* Labor split */}
      <div style={{
        background: 'var(--surface-1, #FFFFFF)', borderRadius: 12, border: '1px solid var(--border, #E5E7EB)',
        padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3, #9CA3AF)' }}>
          Labor Breakdown
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <LaborRow name="Nathan" hours={actuals.nathanHours} cost={actuals.nathanLaborCost} />
          <LaborRow name="Nishant" hours={actuals.nishantHours} cost={actuals.nishantLaborCost} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg, #F9FAFB)', borderRadius: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text, #111827)' }}>Total</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text, #111827)' }}>{fmt(actuals.totalLaborCost)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3, #9CA3AF)' }}>{fmtHrs(actuals.totalHours)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Project breakdown table */}
      <div style={{
        background: 'var(--surface-1, #FFFFFF)', borderRadius: 12, border: '1px solid var(--border, #E5E7EB)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border, #E5E7EB)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3, #9CA3AF)' }}>
            Project Breakdown
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'var(--font-sans)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border, #E5E7EB)' }}>
                {([
                  ['projectName', 'Project'],
                  ['status', 'Status'],
                  ['revenue', 'Revenue'],
                  ['laborCost', 'Labor'],
                  ['materialCost', 'Material'],
                  ['grossProfit', 'Profit'],
                  ['marginPct', 'Margin'],
                  ['nathanHours', 'Nathan'],
                  ['nishantHours', 'Nishant'],
                ] as [SortKey, string][]).map(([key, label]) => (
                  <th
                    key={key}
                    onClick={() => toggleSort(key)}
                    style={{
                      padding: '8px 12px', textAlign: key === 'projectName' || key === 'status' ? 'left' : 'right',
                      fontWeight: 600, color: 'var(--text-2, #6B7280)', cursor: 'pointer',
                      whiteSpace: 'nowrap', userSelect: 'none', fontSize: 11,
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {label}
                      {sortKey === key && <ArrowUpDown size={12} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedProjects.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 24, textAlign: 'center', color: 'var(--text-3, #9CA3AF)' }}>
                    No projects in selected period
                  </td>
                </tr>
              ) : (
                sortedProjects.map((p) => (
                  <tr key={p.projectId} style={{ borderBottom: '1px solid var(--border, #E5E7EB)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 500, color: 'var(--text, #111827)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.projectName}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <StatusBadge status={p.status} />
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(p.revenue)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(p.laborCost)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(p.materialCost)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: p.grossProfit >= 0 ? 'var(--green, #10B981)' : 'var(--red, #EF4444)' }}>
                      {fmt(p.grossProfit)}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtPct(p.marginPct)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtHrs(p.nathanHours)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtHrs(p.nishantHours)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, badge }: { label: string; value: string; badge?: string }) {
  return (
    <div style={{
      background: 'var(--surface-1, #FFFFFF)', borderRadius: 12, border: '1px solid var(--border, #E5E7EB)',
      padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3, #9CA3AF)' }}>
          {label}
        </span>
        {badge && (
          <span style={{
            fontSize: 10, fontWeight: 700, background: 'var(--blue-dim, #EFF6FF)', color: 'var(--blue, #3B82F6)',
            borderRadius: 10, padding: '1px 6px',
          }}>
            {badge}
          </span>
        )}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text, #111827)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
    </div>
  );
}

function LaborRow({ name, hours, cost }: { name: string; hours: number; cost: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg, #F9FAFB)', borderRadius: 8 }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text, #111827)' }}>{name}</span>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text, #111827)' }}>{fmt(cost)}</div>
        <div style={{ fontSize: 11, color: 'var(--text-3, #9CA3AF)' }}>{fmtHrs(hours)}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    complete: { bg: '#D1FAE5', text: '#065F46' },
    in_progress: { bg: '#DBEAFE', text: '#1E40AF' },
    approved: { bg: '#E0E7FF', text: '#3730A3' },
    quoted: { bg: '#FEF3C7', text: '#92400E' },
  };
  const c = colors[status] || { bg: '#F3F4F6', text: '#6B7280' };
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
      background: c.bg, color: c.text, textTransform: 'capitalize',
    }}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
