'use client';

/**
 * Sales Dashboard
 *
 * Three-column layout with SVG charts, KPI sparklines, pipeline funnel,
 * job profitability table, and right panel with targets/insights.
 * All data from IndexedDB. No chart libraries — SVG only.
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import { SECTION_COLORS } from '@/lib/viewmode';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import { useLeadPipeline } from '@/lib/hooks/useLeadData';
import { useAllInvoices } from '@/lib/hooks/useInvoices';
import { useInvoiceAging } from '@/lib/hooks/useInvoiceAging';
import { useQuotes } from '@/lib/hooks/useQuotes';
import { useLocalProjects } from '@/lib/hooks/useLocalData';
import { useCustomers } from '@/lib/hooks/useCustomersV2';
import { SALES_STAGES, JOB_STAGE_META, JobStage } from '@hooomz/shared-contracts';
import type { InvoiceRecord } from '@hooomz/shared-contracts';

const COLOR = SECTION_COLORS.sales;

// ============================================================================
// Period Filter
// ============================================================================

type Period = 'mtd' | '90d' | 'ytd';

function getPeriodStart(period: Period): Date {
  const now = new Date();
  if (period === 'mtd') return new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === '90d') {
    const d = new Date(now);
    d.setDate(d.getDate() - 90);
    return d;
  }
  // ytd
  return new Date(now.getFullYear(), 0, 1);
}

// ============================================================================
// Helpers
// ============================================================================

function formatCurrency(n: number): string {
  if (n >= 1000) return '$' + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k';
  return '$' + n.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatFullCurrency(n: number): string {
  return '$' + n.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatPct(n: number): string {
  return Math.round(n) + '%';
}

function getMonthLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short' });
}

/** Parse date string as local time (avoids UTC midnight bug with date-only strings) */
function parseLocalDate(s: string): Date {
  if (s.includes('T')) return new Date(s);
  return new Date(s + 'T00:00:00');
}

// ============================================================================
// SVG Mini-Charts
// ============================================================================

/** Tiny sparkline for KPI cards — 60×20 SVG */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const w = 60;
  const h = 20;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Bar chart — monthly revenue, 6 bars */
function BarChart({ data, color }: { data: Array<{ label: string; value: number }>; color: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = 32;
  const gap = 8;
  const chartH = 120;
  const totalW = data.length * (barW + gap) - gap;

  return (
    <svg width={totalW} height={chartH + 24} viewBox={`0 0 ${totalW} ${chartH + 24}`} style={{ display: 'block', width: '100%', maxWidth: totalW }}>
      {data.map((d, i) => {
        const barH = max > 0 ? (d.value / max) * (chartH - 8) : 0;
        const x = i * (barW + gap);
        const y = chartH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={3} fill={d.value > 0 ? color : 'var(--border)'} opacity={0.85} />
            <text x={x + barW / 2} y={chartH + 12} textAnchor="middle" fontSize={8} fontFamily="var(--font-mono)" fill="var(--muted)">
              {d.label}
            </text>
            {d.value > 0 && (
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={7} fontFamily="var(--font-mono)" fill="var(--mid)">
                {formatCurrency(d.value)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** Donut chart for revenue by service type */
function DonutChart({ segments, size = 100 }: { segments: Array<{ label: string; value: number; color: string }>; size?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={size / 2 - 4} fill="none" stroke="var(--border)" strokeWidth={12} />
        <text x={size / 2} y={size / 2 + 3} textAnchor="middle" fontSize={10} fontFamily="var(--font-mono)" fill="var(--muted)">
          No data
        </text>
      </svg>
    );
  }

  const r = size / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.filter(s => s.value > 0).map((seg, i) => {
        const pct = seg.value / total;
        const dashLen = pct * circumference;
        const dashGap = circumference - dashLen;
        const currentOffset = offset;
        offset += dashLen;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={14}
            strokeDasharray={`${dashLen} ${dashGap}`}
            strokeDashoffset={-currentOffset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        );
      })}
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize={14} fontFamily="var(--font-mono)" fontWeight={700} fill="var(--charcoal)">
        {formatCurrency(total)}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={7} fontFamily="var(--font-mono)" fill="var(--muted)" style={{ textTransform: 'uppercase' }}>
        TOTAL
      </text>
    </svg>
  );
}

/** Horizontal progress bar */
function HealthBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ width: 60, height: 5, borderRadius: 3, background: 'var(--surface-2, var(--border))' }}>
      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: color, transition: 'width 300ms' }} />
    </div>
  );
}

// ============================================================================
// Page
// ============================================================================

export default function SalesDashboardPage() {
  const [period, setPeriod] = useState<Period>('mtd');
  const periodStart = useMemo(() => getPeriodStart(period), [period]);

  // Data sources
  const dashboard = useDashboardData();
  const leadPipeline = useLeadPipeline();
  const { data: allInvoices = [] } = useAllInvoices();
  const aging = useInvoiceAging(allInvoices);
  const { data: quotes = [] } = useQuotes();
  const { data: projectsData } = useLocalProjects();
  const projects = projectsData?.projects ?? [];
  useCustomers(); // warm cache

  // ---- Derived metrics ----

  const metrics = useMemo(() => {
    const now = new Date();

    // MTD Revenue — amountPaid on invoices paid in period
    const revenue = allInvoices
      .filter((inv: InvoiceRecord) => {
        if (inv.amountPaid <= 0 || inv.status === 'cancelled') return false;
        const dateStr = inv.paidAt ?? inv.metadata?.createdAt ?? inv.dueDate;
        const d = parseLocalDate(dateStr);
        return d >= periodStart && d <= now;
      })
      .reduce((sum: number, inv: InvoiceRecord) => sum + inv.amountPaid, 0);

    // Outstanding
    const outstanding = allInvoices
      .filter((inv: InvoiceRecord) => inv.status !== 'cancelled' && inv.status !== 'draft' && inv.balanceDue > 0)
      .reduce((sum: number, inv: InvoiceRecord) => sum + inv.balanceDue, 0);

    // Pipeline Value (from quotes — active pipeline)
    const pipelineValue = quotes
      .filter(q => ['draft', 'sent', 'viewed'].includes(q.status))
      .reduce((sum, q) => sum + q.totalAmount, 0);

    // Win Rate (accepted / (accepted + declined)) — filtered by period
    const closedQuotes = quotes.filter(q => {
      if (q.status !== 'accepted' && q.status !== 'declined') return false;
      const closedAt = q.respondedAt ?? q.updatedAt;
      if (!closedAt) return false;
      const d = parseLocalDate(closedAt);
      return d >= periodStart && d <= now;
    });
    const accepted = closedQuotes.filter(q => q.status === 'accepted').length;
    const declined = closedQuotes.filter(q => q.status === 'declined').length;
    const winRate = (accepted + declined) > 0 ? (accepted / (accepted + declined)) * 100 : 0;

    // Avg Margin — use default 35% unless we have project budget data
    const projectsWithBudget = projects.filter(p => p.budget.estimatedCost > 0 && p.budget.actualCost > 0);
    const avgMargin = projectsWithBudget.length > 0
      ? projectsWithBudget.reduce((sum, p) => sum + ((p.budget.estimatedCost - p.budget.actualCost) / p.budget.estimatedCost) * 100, 0) / projectsWithBudget.length
      : 35;

    // Closed MTD — accepted quote value in period
    const closedValue = quotes
      .filter(q => q.status === 'accepted' && q.respondedAt && new Date(q.respondedAt) >= periodStart)
      .reduce((sum, q) => sum + q.totalAmount, 0);

    // Status colours
    const revenueColour = revenue >= 15000 ? 'var(--green)' : revenue >= 12000 ? 'var(--amber)' : 'var(--red)';
    const pipelineColour = pipelineValue >= 45000 ? 'var(--green)' : pipelineValue >= 15000 ? 'var(--amber)' : 'var(--red)';
    const winRateTooFew = (accepted + declined) < 3;
    const winRateColour = winRateTooFew ? 'var(--muted)' : winRate >= 70 ? 'var(--green)' : winRate >= 50 ? 'var(--amber)' : 'var(--red)';
    const marginColour = avgMargin >= 38 ? 'var(--green)' : avgMargin >= 30 ? 'var(--amber)' : 'var(--red)';
    const outstandingColour = outstanding === 0 ? 'var(--green)' : outstanding <= 5000 ? 'var(--amber)' : 'var(--red)';

    return { revenue, outstanding, pipelineValue, winRate, avgMargin, closedValue, accepted, declined, revenueColour, pipelineColour, winRateColour, winRateTooFew, marginColour, outstandingColour };
  }, [allInvoices, quotes, projects, periodStart]);

  // Revenue sparkline — last 6 months
  const revenueByMonth = useMemo(() => {
    const now = new Date();
    const months: Array<{ label: string; value: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = getMonthLabel(d);
      const monthNum = d.getMonth();
      const yearNum = d.getFullYear();
      const value = allInvoices
        .filter((inv: InvoiceRecord) => {
          if (inv.amountPaid <= 0 || inv.status === 'cancelled') return false;
          const dateStr = inv.paidAt ?? inv.metadata?.createdAt ?? inv.dueDate;
          const pd = parseLocalDate(dateStr);
          return pd.getMonth() === monthNum && pd.getFullYear() === yearNum;
        })
        .reduce((sum: number, inv: InvoiceRecord) => sum + inv.amountPaid, 0);
      months.push({ label, value });
    }
    return months;
  }, [allInvoices]);

  const sparklineData = useMemo(() => revenueByMonth.map(m => m.value), [revenueByMonth]);

  // Revenue by service type (derive from project types)
  const revenueByType = useMemo(() => {
    const typeMap: Record<string, number> = {};
    for (const inv of allInvoices) {
      if (inv.amountPaid <= 0 || inv.status === 'cancelled') continue;
      const project = projects.find(p => p.id === inv.projectId);
      const type = project?.projectType || 'other';
      const label = type.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
      typeMap[label] = (typeMap[label] ?? 0) + inv.amountPaid;
    }
    const colors = ['var(--accent)', 'var(--blue)', 'var(--green)', 'var(--amber)', 'var(--red)'];
    return Object.entries(typeMap)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], i) => ({ label, value, color: colors[i % colors.length] }));
  }, [allInvoices, projects]);

  // Leads by source
  const leadsBySource = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of leadPipeline.leads) {
      const src = l.source.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
      map[src] = (map[src] ?? 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [leadPipeline.leads]);

  // Pipeline funnel
  const stageCounters = useMemo(() => {
    const leadCount = leadPipeline.leads.filter(l => l.stage !== 'won' && l.stage !== 'lost').length;
    const quoteCount = quotes.filter(q => ['draft', 'sent', 'viewed'].includes(q.status)).length;
    const contractCount = quotes.filter(q => q.status === 'accepted').length;

    return SALES_STAGES.map((stage) => {
      const meta = JOB_STAGE_META[stage];
      let count = 0;
      if (stage === JobStage.LEAD) count = leadCount;
      else if (stage === JobStage.ESTIMATE) count = dashboard.pipelineCount;
      else if (stage === JobStage.CONSULTATION) count = 0; // would need consultation hook
      else if (stage === JobStage.QUOTE) count = quoteCount;
      else if (stage === JobStage.CONTRACT) count = contractCount;
      return { stage, label: meta.label, count };
    });
  }, [leadPipeline.leads, quotes, dashboard.pipelineCount]);

  // Job profitability table — top projects by estimated margin
  const profitableJobs = useMemo(() => {
    return projects
      .filter(p => p.budget.estimatedCost > 0)
      .map(p => {
        const margin = p.budget.actualCost > 0
          ? ((p.budget.estimatedCost - p.budget.actualCost) / p.budget.estimatedCost) * 100
          : 35; // default margin assumption
        return {
          id: p.id,
          name: p.name,
          estimatedCost: p.budget.estimatedCost,
          actualCost: p.budget.actualCost,
          margin,
          status: p.status,
        };
      })
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 6);
  }, [projects]);

  // Monthly target (simple — based on forecast config)
  const monthlyTarget = 15000; // CAD — monthly revenue target

  // Loading
  if (dashboard.isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: COLOR, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 11, color: 'var(--muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <PageErrorBoundary>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--charcoal)', fontFamily: 'var(--font-body)' }}>

        {/* ================================================================ */}
        {/* HEADER                                                           */}
        {/* ================================================================ */}
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--charcoal)', fontFamily: 'var(--font-display)', letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>
              Sales
            </h1>

            {/* Period Tabs */}
            <div style={{ display: 'flex', gap: 0 }}>
              {(['mtd', '90d', 'ytd'] as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={{
                    padding: '6px 14px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    background: 'none',
                    border: 'none',
                    borderBottom: period === p ? '2px solid var(--accent)' : '2px solid transparent',
                    color: period === p ? 'var(--charcoal)' : 'var(--muted)',
                    cursor: 'pointer',
                    transition: 'color 150ms',
                  }}
                >
                  {p === 'mtd' ? 'MTD' : p === '90d' ? '90 Days' : 'YTD'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* THREE-COLUMN LAYOUT                                              */}
        {/* ================================================================ */}
        <div style={{ display: 'flex', gap: 0, minHeight: 'calc(100vh - 60px)' }}>

          {/* ============================================================== */}
          {/* LEFT COLUMN — KPI + Charts                                     */}
          {/* ============================================================== */}
          <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto', minWidth: 0 }}>

            {/* KPI Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 24 }}>
              <KPICard
                label="Revenue"
                value={formatCurrency(metrics.revenue)}
                sub={`${metrics.revenue >= 15000 ? '+' : ''}${formatCurrency(metrics.revenue - 15000)} vs $15k target`}
                color={metrics.revenueColour}
                topBarColor={metrics.revenueColour}
                sparkData={sparklineData}
                href="/finance"
                empty={metrics.revenue === 0}
              />
              <KPICard
                label="Pipeline"
                value={formatCurrency(metrics.pipelineValue)}
                sub={`${quotes.filter(q => ['draft', 'sent', 'viewed'].includes(q.status)).length} active quotes`}
                color={metrics.pipelineColour}
                topBarColor={metrics.pipelineColour}
                href="/sales/quotes"
                empty={metrics.pipelineValue === 0}
              />
              <KPICard
                label="Win Rate"
                value={metrics.winRate > 0 ? formatPct(metrics.winRate) : '—'}
                sub={metrics.winRateTooFew ? 'Too few closed to trend' : `${metrics.accepted}W / ${metrics.declined}L`}
                color={metrics.winRateColour}
                topBarColor={metrics.winRateTooFew ? undefined : metrics.winRateColour}
                empty={metrics.accepted + metrics.declined === 0}
              />
              <KPICard
                label="Avg Margin"
                value={formatPct(metrics.avgMargin)}
                sub={metrics.avgMargin >= 38 ? `+${Math.round(metrics.avgMargin - 38)}% above 38% target` : `${Math.round(38 - metrics.avgMargin)}% below 38% target`}
                color={metrics.marginColour}
                topBarColor={metrics.marginColour}
                empty={false}
              />
              <KPICard
                label="Outstanding"
                value={metrics.outstanding > 0 ? formatCurrency(metrics.outstanding) : '$0'}
                sub={aging.days90plus > 0 ? `${aging.days90plus} overdue 90+` : undefined}
                color={metrics.outstandingColour}
                topBarColor={metrics.outstandingColour}
                href="/finance/invoices"
                empty={metrics.outstanding === 0}
              />
            </div>

            {/* Revenue Bar Chart */}
            <div style={{ marginBottom: 24 }}>
              <SectionHeader title="Monthly Revenue (6 mo)" />
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '16px 20px', boxShadow: 'var(--shadow-card)' }}>
                {revenueByMonth.every(m => m.value === 0) ? (
                  <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>No revenue data yet</p>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <BarChart data={revenueByMonth} color="var(--accent)" />
                  </div>
                )}
              </div>
            </div>

            {/* Charts Row — Donut + Pipeline Funnel */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              {/* Revenue by Type */}
              <div>
                <SectionHeader title="Revenue by Type" />
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '16px', boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <DonutChart segments={revenueByType.length > 0 ? revenueByType : [{ label: 'None', value: 0, color: 'var(--border)' }]} size={100} />
                  <div style={{ flex: 1 }}>
                    {revenueByType.length === 0 ? (
                      <p style={{ fontSize: 11, color: 'var(--muted)' }}>No data yet</p>
                    ) : (
                      revenueByType.slice(0, 4).map((seg, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 10, color: 'var(--mid)', flex: 1 }}>{seg.label}</span>
                          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>{formatCurrency(seg.value)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Pipeline Funnel */}
              <div>
                <SectionHeader title="Pipeline Funnel" />
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '16px', boxShadow: 'var(--shadow-card)' }}>
                  {stageCounters.map((sc, i) => {
                    const maxCount = Math.max(...stageCounters.map(s => s.count), 1);
                    const barPct = (sc.count / maxCount) * 100;
                    const funnelColor =
                      sc.stage === JobStage.LEAD ? 'var(--muted)' :
                      sc.stage === JobStage.ESTIMATE || sc.stage === JobStage.CONSULTATION ? 'var(--blue)' :
                      sc.stage === JobStage.QUOTE ? 'var(--amber)' :
                      sc.stage === JobStage.CONTRACT ? 'var(--accent)' : COLOR;
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < stageCounters.length - 1 ? 8 : 0 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', width: 70, textAlign: 'right', flexShrink: 0 }}>
                          {sc.label}
                        </span>
                        <div style={{ flex: 1, height: 12, background: 'var(--surface-2, var(--border))', borderRadius: 3 }}>
                          <div style={{ width: `${barPct}%`, height: '100%', background: funnelColor, borderRadius: 3, transition: 'width 300ms', opacity: 0.8 }} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: sc.count > 0 ? 'var(--charcoal)' : 'var(--muted)', width: 24, textAlign: 'right', flexShrink: 0 }}>
                          {sc.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Job Profitability Table */}
            <div>
              <SectionHeader title="Job Profitability" />
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                {profitableJobs.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>No project data yet</p>
                ) : (
                  <>
                    {/* Header row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 60px 60px', gap: 8, padding: '8px 14px', borderBottom: '1px solid var(--border)' }}>
                      {['Job', 'Quoted', 'Actual', 'Margin', ''].map((h, i) => (
                        <span key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 7, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>
                          {h}
                        </span>
                      ))}
                    </div>
                    {profitableJobs.map((job, i) => (
                      <Link
                        key={job.id}
                        href={`/projects/${job.id}`}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 80px 80px 60px 60px',
                          gap: 8,
                          padding: '10px 14px',
                          borderBottom: i < profitableJobs.length - 1 ? '1px solid var(--border)' : 'none',
                          textDecoration: 'none',
                          alignItems: 'center',
                          minHeight: 44,
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--charcoal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {job.name}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--mid)' }}>
                          {formatFullCurrency(job.estimatedCost)}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: job.actualCost > 0 ? 'var(--mid)' : 'var(--muted)' }}>
                          {job.actualCost > 0 ? formatFullCurrency(job.actualCost) : '—'}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: job.margin >= 38 ? 'var(--green)' : job.margin >= 30 ? 'var(--amber)' : 'var(--red)' }}>
                          {formatPct(job.margin)}
                        </span>
                        <HealthBar value={job.margin} max={50} color={job.margin >= 38 ? 'var(--green)' : job.margin >= 30 ? 'var(--amber)' : 'var(--red)'} />
                      </Link>
                    ))}
                  </>
                )}
                <Link
                  href="/projects"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 12px', fontSize: 11, fontWeight: 600, color: COLOR, textDecoration: 'none', borderTop: '1px solid var(--border)' }}
                >
                  View All Jobs →
                </Link>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* RIGHT PANEL                                                     */}
          {/* ============================================================== */}
          <div
            className="hidden lg:block"
            style={{
              width: 280,
              minWidth: 280,
              flexShrink: 0,
              borderLeft: '1px solid var(--border)',
              background: 'var(--surface)',
              padding: '24px 20px',
              overflowY: 'auto',
            }}
          >
            {/* Monthly Target */}
            <div style={{ marginBottom: 24 }}>
              <SectionHeader title="March Target" />
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: metrics.revenueColour }}>
                    {formatCurrency(metrics.revenue)}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
                    / {formatCurrency(monthlyTarget)}
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--surface-2, var(--border))' }}>
                  <div
                    style={{
                      height: '100%',
                      borderRadius: 3,
                      background: metrics.revenueColour,
                      width: `${Math.min((metrics.revenue / monthlyTarget) * 100, 100)}%`,
                      transition: 'width 300ms',
                    }}
                  />
                </div>
                <p style={{ fontSize: 10, color: metrics.revenueColour, marginTop: 6, fontFamily: 'var(--font-mono)' }}>
                  {formatPct(monthlyTarget > 0 ? (metrics.revenue / monthlyTarget) * 100 : 0)} of target
                </p>
              </div>
            </div>

            {/* Insights */}
            <div style={{ marginBottom: 24 }}>
              <SectionHeader title="Insights" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dashboard.hotLeadCount > 0 && (
                  <InsightCard
                    text={`${dashboard.hotLeadCount} hot lead${dashboard.hotLeadCount > 1 ? 's' : ''} need contact`}
                    color="var(--red)"
                    href="/leads"
                  />
                )}
                {aging.days90plus > 0 && (
                  <InsightCard
                    text={`${aging.days90plus} invoice${aging.days90plus > 1 ? 's' : ''} overdue 90+ days`}
                    color="var(--amber)"
                    href="/finance/invoices"
                  />
                )}
                {metrics.pipelineValue > 0 && (
                  <InsightCard
                    text={`${formatCurrency(metrics.pipelineValue)} in active pipeline`}
                    color={COLOR}
                    href="/sales/quotes"
                  />
                )}
                {metrics.closedValue > 0 && (() => {
                  const now = new Date();
                  const monthsElapsed = now.getMonth() + (now.getDate() / 30);
                  const ytdTarget = 15000 * monthsElapsed;
                  const closedColour = metrics.closedValue >= ytdTarget ? 'var(--green)' : metrics.closedValue >= ytdTarget * 0.8 ? 'var(--amber)' : 'var(--red)';
                  return (
                    <InsightCard
                      text={`${formatCurrency(metrics.closedValue)} closed ${period === 'mtd' ? 'this month' : period === '90d' ? 'in 90d' : 'YTD'}`}
                      color={closedColour}
                    />
                  );
                })()}
                {dashboard.hotLeadCount === 0 && aging.days90plus === 0 && metrics.pipelineValue === 0 && metrics.closedValue === 0 && (
                  <p style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>No insights yet — data will appear as you add jobs and invoices.</p>
                )}
              </div>
            </div>

            {/* Leads by Source */}
            <div style={{ marginBottom: 24 }}>
              <SectionHeader title="Leads by Source" />
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
                {leadsBySource.length === 0 ? (
                  <p style={{ fontSize: 11, color: 'var(--muted)', padding: '14px', textAlign: 'center' }}>No leads yet</p>
                ) : (
                  leadsBySource.slice(0, 5).map(([source, count], i) => (
                    <div
                      key={source}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderBottom: i < Math.min(leadsBySource.length, 5) - 1 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      <span style={{ fontSize: 11, color: 'var(--mid)' }}>{source}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: COLOR }}>{count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Jobs by Margin */}
            <div style={{ marginBottom: 24 }}>
              <SectionHeader title="Top Jobs by Margin" />
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
                {profitableJobs.length === 0 ? (
                  <p style={{ fontSize: 11, color: 'var(--muted)', padding: '14px', textAlign: 'center' }}>No data yet</p>
                ) : (
                  profitableJobs.slice(0, 3).map((job, i) => (
                    <Link
                      key={job.id}
                      href={`/projects/${job.id}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderBottom: i < Math.min(profitableJobs.length, 3) - 1 ? '1px solid var(--border)' : 'none',
                        textDecoration: 'none',
                        minHeight: 36,
                      }}
                    >
                      <span style={{ fontSize: 11, color: 'var(--charcoal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {job.name}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: job.margin >= 38 ? 'var(--green)' : job.margin >= 30 ? 'var(--amber)' : 'var(--red)', flexShrink: 0, marginLeft: 8 }}>
                        {formatPct(job.margin)}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Invoice Aging */}
            <div>
              <SectionHeader title="Invoice Aging" />
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <AgingBucket label="Current" count={aging.current} color="var(--green)" />
                  <AgingBucket label="1–30 days" count={aging.days30} color="var(--amber)" />
                  <AgingBucket label="31–60 days" count={aging.days60} color="var(--red)" />
                  <AgingBucket label="90+ days" count={aging.days90plus} color="var(--red)" />
                </div>
                {aging.totalOutstanding > 0 && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Outstanding</span>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--amber)' }}>{formatFullCurrency(aging.totalOutstanding)}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </PageErrorBoundary>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        {title}
      </span>
    </div>
  );
}

function KPICard({
  label, value, sub, color, sparkData, href, empty, topBarColor,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
  sparkData?: number[];
  href?: string;
  empty?: boolean;
  topBarColor?: string;
}) {
  const inner = (
    <div
      style={{
        background: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
        borderRight: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        borderTop: topBarColor ? `3px solid ${topBarColor}` : '1px solid var(--border)',
        borderRadius: 6,
        padding: '14px 16px',
        cursor: href ? 'pointer' : 'default',
        transition: 'transform 150ms',
        minWidth: 0,
      }}
      onMouseEnter={e => { if (href) e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 600, color: empty ? 'var(--muted)' : color, lineHeight: 1 }}>
          {value}
        </div>
        {sparkData && sparkData.some(v => v > 0) && (
          <Sparkline data={sparkData} color={color} />
        )}
      </div>
      {sub && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)', marginBottom: 2 }}>{sub}</div>
      )}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </div>
    </div>
  );

  if (href) return <Link href={href} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>{inner}</Link>;
  return inner;
}

function InsightCard({ text, color, href }: { text: string; color: string; href?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => href && router.push(href)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 12px',
        background: `color-mix(in srgb, ${color} 6%, var(--bg))`,
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${color}`,
        borderRadius: 6,
        cursor: href ? 'pointer' : 'default',
        textAlign: 'left',
        width: '100%',
      }}
    >
      <span style={{ fontSize: 11, color: 'var(--charcoal)', lineHeight: 1.3 }}>{text}</span>
    </button>
  );
}

function AgingBucket({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: count > 0 ? color : 'var(--muted)', lineHeight: 1 }}>
        {count}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>
        {label}
      </div>
    </div>
  );
}
