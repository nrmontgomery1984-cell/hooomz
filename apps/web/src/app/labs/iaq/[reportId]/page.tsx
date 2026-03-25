'use client';

/**
 * IAQ Report Renderer — 5-tab report view
 *
 * Overview | Air Quality | Maintenance Ledger | Savings & Impact | Labs Recommendations
 */

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import { useToast } from '@/components/ui/Toast';
import { useIAQReport } from '@/lib/hooks/useIAQReports';
import type { IAQReport, IAQMetric, IAQPhase, IAQDailySummary, MetricStatus } from '@/lib/types/iaqReport.types';

// ============================================================================
// Constants
// ============================================================================

type Tab = 'overview' | 'air-quality' | 'maintenance' | 'savings' | 'recommendations';

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'air-quality', label: 'Air Quality' },
  { key: 'maintenance', label: 'Maintenance Ledger' },
  { key: 'savings', label: 'Savings & Impact' },
  { key: 'recommendations', label: 'Labs Recommendations' },
];

const STATUS_COLORS: Record<MetricStatus, string> = {
  good: 'var(--green)',
  warn: 'var(--amber)',
  poor: 'var(--red)',
};

const PHASE_COLORS: Record<string, string> = {
  Baseline: 'var(--muted)',
  Installation: 'var(--amber)',
  Settlement: 'var(--amber)',
  Clearance: 'var(--green)',
};

function scoreBandColor(score: number): string {
  if (score >= 80) return 'var(--green)';
  if (score >= 60) return 'var(--amber)';
  return 'var(--red)';
}

function scoreBandGradient(score: number): string {
  if (score >= 80) return 'linear-gradient(135deg, #2D7A4F, #4A9B6F)';
  if (score >= 60) return 'linear-gradient(135deg, #B87A2A, #C4872A)';
  return 'linear-gradient(135deg, #A03030, #C94F3E)';
}

function formatCurrency(n: number): string {
  return '$' + n.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function daysBetween(a: string, b: string): number {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}

// ============================================================================
// Page
// ============================================================================

export default function IAQReportPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const reportId = params.reportId as string;
  const { data: report, isLoading } = useIAQReport(reportId);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Loading...</div>
      </div>
    );
  }

  if (!report) {
    router.push('/labs/iaq');
    return null;
  }

  const totalReadings = report.dailySummaries.reduce(() => 0, 0) || report.dailySummaries.length;
  const monitoringDays = daysBetween(report.monitoringStart, report.monitoringEnd);

  return (
    <PageErrorBoundary>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

        {/* Topbar */}
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: 4 }}>
                Labs › IAQ Reports › {report.clientName} · {report.projectName}
              </div>
              <h1 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--charcoal)', margin: 0 }}>
                IAQ Report
              </h1>
            </div>
            <div className="topbar-actions" style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => window.print()}
                style={{ padding: '6px 14px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--mid)', fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', minHeight: 32 }}
              >
                Print / Export PDF
              </button>
              <button
                onClick={() => showToast({ message: 'Shareable link — coming soon', variant: 'info' })}
                style={{ padding: '6px 14px', borderRadius: 4, border: 'none', background: 'var(--accent)', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', minHeight: 32 }}
              >
                Send to Client
              </button>
            </div>
          </div>
        </div>

        {/* Completion Band */}
        <div style={{
          background: scoreBandGradient(report.healthScore),
          padding: '20px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, textTransform: 'uppercase', color: '#fff' }}>
              {report.clientName}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
              {report.projectName} · {report.address} · {report.monitoringStart} → {report.monitoringEnd}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
              {report.healthScore}
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 8,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#fff',
              background: 'rgba(255,255,255,0.2)',
              padding: '2px 8px',
              borderRadius: 3,
              marginTop: 4,
              display: 'inline-block',
            }}>
              {report.healthRating}
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="tab-bar" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 32px', display: 'flex', gap: 0 }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: '10px 16px',
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeTab === t.key ? 'var(--accent)' : 'var(--muted)',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content + Right Panel */}
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 200px)' }}>

          {/* Main Content */}
          <div className="tab-content" style={{ flex: 1, padding: '24px 28px', overflowY: 'auto', minWidth: 0 }}>
            {activeTab === 'overview' && <OverviewTab report={report} monitoringDays={monitoringDays} totalReadings={totalReadings} />}
            {activeTab === 'air-quality' && <AirQualityTab report={report} />}
            {activeTab === 'maintenance' && <MaintenanceTab />}
            {activeTab === 'savings' && <SavingsTab report={report} />}
            {activeTab === 'recommendations' && <RecommendationsTab report={report} />}
          </div>

          {/* Right Panel */}
          <div className="hidden lg:block" style={{ width: 280, minWidth: 280, flexShrink: 0, borderLeft: '1px solid var(--border)', background: 'var(--surface)', padding: '24px 20px', overflowY: 'auto' }}>
            {activeTab === 'overview' && <OverviewRightPanel report={report} />}
            {activeTab === 'air-quality' && <AirQualityRightPanel report={report} />}
            {activeTab === 'savings' && <SavingsRightPanel />}
            {activeTab === 'recommendations' && <RecommendationsRightPanel report={report} />}
          </div>
        </div>
      </div>
    </PageErrorBoundary>
  );
}

// ============================================================================
// Shared Components
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

function StatusPill({ status }: { status: MetricStatus }) {
  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 7,
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      padding: '2px 6px',
      borderRadius: 3,
      color: '#fff',
      background: STATUS_COLORS[status],
    }}>
      {status}
    </span>
  );
}

// ============================================================================
// TAB 1 — Overview
// ============================================================================

function OverviewTab({ report, monitoringDays, totalReadings }: { report: IAQReport; monitoringDays: number; totalReadings: number }) {
  return (
    <div>
      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <KPICard topColor={scoreBandColor(report.healthScore)} value={String(report.healthScore)} label="Home Health Score" sub={report.healthRating} />
        <KPICard topColor={scoreBandColor(report.healthScore)} value={report.healthRating} label="IAQ Rating" sub={`Based on 5 metrics monitored`} valueFont="var(--font-display)" valueSize={14} />
        <KPICard topColor="var(--accent)" value={String(monitoringDays)} label="Monitoring Period" sub={`${report.monitoringStart} → ${report.monitoringEnd}`} />
        <KPICard topColor="var(--blue)" value={String(totalReadings)} label="Days Monitored" sub="AirGradient ONE" />
      </div>

      {/* 14-day Line Chart */}
      <div style={{ marginBottom: 24 }}>
        <SectionHeader title="Air Quality Timeline" />
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '16px 20px' }}>
          <TimelineChart
            dailySummaries={report.dailySummaries}
            outdoorSummaries={report.outdoorDailySummaries}
            phases={report.phases}
          />
          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 12, justifyContent: 'center' }}>
            <LegendDot color="var(--accent)" label="VOC Index" />
            <LegendDot color="var(--blue)" label="PM2.5" />
            {report.outdoorDailySummaries && <LegendDot color="var(--muted)" label="Outdoor PM2.5" dashed />}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ topColor, value, label, sub, valueFont, valueSize }: {
  topColor: string; value: string; label: string; sub?: string; valueFont?: string; valueSize?: number;
}) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ height: 3, background: topColor }} />
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontFamily: valueFont || 'var(--font-mono)', fontSize: valueSize || 28, fontWeight: 700, color: topColor, lineHeight: 1, marginBottom: 4, textTransform: valueFont ? 'uppercase' : 'none' }}>
          {value}
        </div>
        {sub && <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--muted)', marginBottom: 2 }}>{sub}</div>}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>{label}</div>
      </div>
    </div>
  );
}

function LegendDot({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 12, height: 2, background: color, borderRadius: 1, ...(dashed ? { backgroundImage: `repeating-linear-gradient(90deg, ${color} 0, ${color} 3px, transparent 3px, transparent 6px)`, background: 'none' } : {}) }} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)' }}>{label}</span>
    </div>
  );
}

// ============================================================================
// SVG Timeline Chart
// ============================================================================

function TimelineChart({ dailySummaries, outdoorSummaries, phases }: {
  dailySummaries: IAQDailySummary[];
  outdoorSummaries?: IAQDailySummary[];
  phases: IAQPhase[];
}) {
  if (dailySummaries.length === 0) {
    return <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '40px 0' }}>No data to chart</p>;
  }

  const w = 600;
  const h = 200;
  const padL = 40;
  const padR = 10;
  const padT = 24;
  const padB = 28;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  const vocData = dailySummaries.map(d => d.vocAvg);
  const pm25Data = dailySummaries.map(d => d.pm25Avg);
  const outdoorPm25 = outdoorSummaries?.map(d => d.pm25Avg);

  const allVals = [...vocData, ...pm25Data, ...(outdoorPm25 || [])];
  const maxVal = Math.max(...allVals, 1);

  function toX(i: number): number {
    return padL + (i / Math.max(dailySummaries.length - 1, 1)) * chartW;
  }
  function toY(v: number): number {
    return padT + chartH - (v / maxVal) * chartH;
  }
  function line(data: number[]): string {
    return data.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(v)}`).join(' ');
  }

  // Phase bands
  const firstDate = new Date(dailySummaries[0].date).getTime();
  const lastDate = new Date(dailySummaries[dailySummaries.length - 1].date).getTime();
  const dateRange = lastDate - firstDate || 1;

  function dateToX(dateStr: string): number {
    const t = new Date(dateStr).getTime();
    return padL + ((t - firstDate) / dateRange) * chartW;
  }

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      {/* Phase bands */}
      {phases.map((phase, i) => {
        const x1 = Math.max(dateToX(phase.startDate), padL);
        const x2 = Math.min(dateToX(phase.endDate), padL + chartW);
        if (x2 <= x1) return null;
        return (
          <g key={i}>
            <rect x={x1} y={padT} width={x2 - x1} height={chartH} fill={PHASE_COLORS[phase.label] || 'var(--muted)'} opacity={0.08} />
            <text x={(x1 + x2) / 2} y={padT - 4} textAnchor="middle" fontSize={7} fontFamily="var(--font-display)" fill="var(--muted)" style={{ textTransform: 'uppercase' }}>
              {phase.label}
            </text>
          </g>
        );
      })}

      {/* Y-axis labels */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
        const val = Math.round(maxVal * pct);
        const y = toY(val);
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="var(--border)" strokeWidth={0.5} />
            <text x={padL - 4} y={y + 3} textAnchor="end" fontSize={7} fontFamily="var(--font-mono)" fill="var(--muted)">{val}</text>
          </g>
        );
      })}

      {/* X-axis date labels */}
      {dailySummaries.map((d, i) => {
        if (dailySummaries.length > 14 && i % 2 !== 0) return null;
        const x = toX(i);
        const label = new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return (
          <text key={i} x={x} y={h - 4} textAnchor="middle" fontSize={7} fontFamily="var(--font-mono)" fill="var(--muted)">
            {label}
          </text>
        );
      })}

      {/* Outdoor PM2.5 (dashed) */}
      {outdoorPm25 && outdoorPm25.length > 0 && (
        <path d={line(outdoorPm25)} fill="none" stroke="var(--muted)" strokeWidth={1} strokeDasharray="4 3" />
      )}

      {/* VOC line */}
      <path d={line(vocData)} fill="none" stroke="var(--accent)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />

      {/* PM2.5 line */}
      <path d={line(pm25Data)} fill="none" stroke="var(--blue)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ============================================================================
// Overview Right Panel
// ============================================================================

function OverviewRightPanel({ report }: { report: IAQReport }) {
  const metricKeys = ['co2', 'pm25', 'voc', 'nox', 'humidity'] as const;
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <SectionHeader title="Metric Clearance" />
        {metricKeys.map(key => {
          const metric = report[key];
          const pct = Math.max(0, Math.min(metric.clearancePct, 100));
          return (
            <div key={key} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--mid)' }}>{key === 'pm25' ? 'PM2.5' : key.toUpperCase()}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: STATUS_COLORS[metric.status] }}>{metric.clearancePct.toFixed(0)}%</span>
                  <StatusPill status={metric.status} />
                </div>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'var(--surface-2, var(--border))' }}>
                <div style={{ height: '100%', borderRadius: 2, background: STATUS_COLORS[metric.status], width: `${pct}%`, transition: 'width 300ms' }} />
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <SectionHeader title="Phase Timeline" />
        {report.phases.map((phase, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderLeft: `3px solid ${PHASE_COLORS[phase.label] || 'var(--muted)'}`, paddingLeft: 10, marginBottom: 4 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 500, color: 'var(--mid)' }}>{phase.label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)' }}>{phase.startDate} → {phase.endDate}</div>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>{daysBetween(phase.startDate, phase.endDate)}d</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// TAB 2 — Air Quality
// ============================================================================

function AirQualityTab({ report }: { report: IAQReport }) {
  const metrics: Array<{ key: string; label: string; target: string; unit: string }> = [
    { key: 'voc', label: 'VOC Index', target: '< 150', unit: '' },
    { key: 'co2', label: 'CO2', target: '< 800 ppm', unit: ' ppm' },
    { key: 'pm25', label: 'PM2.5', target: '< 12 µg/m³', unit: ' µg/m³' },
    { key: 'nox', label: 'NOx Index', target: '< 20', unit: '' },
    { key: 'humidity', label: 'Humidity', target: '40–60%', unit: '%' },
    { key: 'temperature', label: 'Temperature', target: '—', unit: '°C' },
  ];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {metrics.map(({ key, label, target, unit }) => {
          const m = report[key as keyof IAQReport] as IAQMetric;
          const isTemp = key === 'temperature';
          const improved = m.clearancePct > 0;
          return (
            <div key={key} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ height: 3, background: isTemp ? 'var(--muted)' : STATUS_COLORS[m.status] }} />
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--mid)' }}>{label}</span>
                  {!isTemp && <StatusPill status={m.status} />}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color: isTemp ? 'var(--charcoal)' : STATUS_COLORS[m.status], lineHeight: 1, marginBottom: 4 }}>
                  {m.current}{unit}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', marginBottom: 8 }}>Target: {target}</div>

                {!isTemp && (
                  <div style={{ height: 4, borderRadius: 2, background: 'var(--surface-2, var(--border))', marginBottom: 12 }}>
                    <div style={{ height: '100%', borderRadius: 2, background: STATUS_COLORS[m.status], width: `${Math.max(0, Math.min(m.clearancePct, 100))}%` }} />
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Before</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: 'var(--mid)' }}>{m.baseline}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--muted)' }}>baseline</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Peak</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: 'var(--mid)' }}>{m.peak}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--muted)' }}>{m.peakDay}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Now</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: 'var(--mid)' }}>{m.current}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--muted)' }}>current</div>
                  </div>
                </div>

                {!isTemp && (
                  <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 10, color: improved ? 'var(--green)' : 'var(--red)' }}>
                    {improved ? '▲' : '▼'} {Math.abs(m.clearancePct).toFixed(0)}% {improved ? 'clearance vs baseline' : 'above baseline'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AirQualityRightPanel({ report }: { report: IAQReport }) {
  const metricKeys = ['co2', 'pm25', 'voc', 'nox', 'humidity'] as const;
  const warnings = metricKeys.filter(k => report[k].status !== 'good');

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <SectionHeader title="Key Findings" />
        {warnings.length === 0 ? (
          <div style={{ borderLeft: '3px solid var(--green)', padding: '10px 12px', background: 'var(--bg)', borderRadius: 4 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--mid)' }}>All metrics within Health Canada guidelines.</span>
          </div>
        ) : (
          warnings.map(key => {
            const m = report[key];
            return (
              <div key={key} style={{ borderLeft: `3px solid ${STATUS_COLORS[m.status]}`, padding: '10px 12px', background: 'var(--bg)', borderRadius: 4, marginBottom: 8 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', marginBottom: 4 }}>{key === 'pm25' ? 'PM2.5' : key.toUpperCase()}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--mid)', lineHeight: 1.5 }}>
                  Peak {m.peak} on {m.peakDay}. Current {m.current} — {Math.abs(m.clearancePct).toFixed(0)}% {m.clearancePct > 0 ? 'below' : 'above'} baseline.
                </div>
              </div>
            );
          })
        )}
      </div>

      <div>
        <SectionHeader title="Monitoring Equipment" />
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: 12 }}>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Indoor unit</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--charcoal)' }}>AirGradient ONE · {report.indoorSerial || '—'}</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Outdoor unit</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--charcoal)' }}>{report.outdoorSerial ? `AirGradient Open Air · ${report.outdoorSerial}` : '—'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TAB 3 — Maintenance Ledger
// ============================================================================

function MaintenanceTab() {
  const { showToast } = useToast();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <SectionHeader title="Maintenance Ledger" />
        <button
          onClick={() => showToast({ message: 'Job linking — coming in next build', variant: 'info' })}
          style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--mid)', fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', minHeight: 32 }}
        >
          Link Job
        </button>
      </div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px 120px 1fr', gap: 8, padding: '8px 14px', background: 'var(--surface-2, var(--border))' }}>
          {['Date', 'Task', 'Area', 'Outcome', 'Notes'].map(h => (
            <span key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>{h}</span>
          ))}
        </div>
        {/* Empty state */}
        <div style={{ padding: '32px 16px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
            No maintenance records linked to this report yet.<br />
            Records will be populated from the linked job in<br />
            Hooomz OS once job-to-report linking is built.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TAB 4 — Savings & Impact
// ============================================================================

function SavingsTab({ report }: { report: IAQReport }) {
  const savingsItems = [
    { label: 'IAQ Monitoring & Audit', desc: 'Continuous indoor air quality monitoring during renovation with professional-grade sensors and analysis.', value: 450 },
    { label: 'Moisture Intrusion Prevention', desc: 'Humidity tracking prevents moisture damage that would cost significantly more to remediate after the fact.', value: 800 },
    { label: 'Ventilation Protocol Value', desc: 'Data-driven ventilation sequencing reduces VOC exposure and speeds clearance.', value: 350 },
  ];
  const healthItems = [
    { label: `VOC Reduction ${report.voc.clearancePct.toFixed(0)}%`, desc: `VOC dropped from ${report.voc.baseline} to ${report.voc.current} — ${report.voc.clearancePct.toFixed(0)}% reduction`, value: 0 },
    { label: 'Baseline IAQ Record Established', desc: 'Pre-renovation air quality documented for future reference and Home Profile.', value: 0 },
    { label: 'Exposure Window Documentation', desc: 'Peak exposure events logged with timestamps for health records.', value: 0 },
  ];
  const total = savingsItems.reduce((s, i) => s + i.value, 0);

  return (
    <div>
      {/* Hero */}
      <div style={{ background: 'var(--accent)', borderRadius: 6, padding: '24px 28px', marginBottom: 24, color: '#fff' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Estimated value delivered this project</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 700, lineHeight: 1 }}>{formatCurrency(total)}</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, opacity: 0.65, marginTop: 6 }}>Cost avoidance + health outcome value · Hooomz Labs estimate</div>
      </div>

      {/* Two-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <SectionHeader title="Cost Avoidance" />
          {savingsItems.map((item, i) => (
            <div key={i} style={{ borderLeft: '3px solid var(--green)', padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--charcoal)', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>{item.desc}</div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--green)', flexShrink: 0, marginLeft: 12 }}>{formatCurrency(item.value)}</span>
              </div>
            </div>
          ))}
        </div>
        <div>
          <SectionHeader title="Health Improvements" />
          {healthItems.map((item, i) => (
            <div key={i} style={{ borderLeft: '3px solid var(--blue)', padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, marginBottom: 8 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--charcoal)', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SavingsRightPanel() {
  const savingsItems = [
    { label: 'IAQ monitoring & audit', value: 450 },
    { label: 'Moisture intrusion prevention', value: 800 },
    { label: 'Ventilation protocol value', value: 350 },
  ];
  const total = savingsItems.reduce((s, i) => s + i.value, 0);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <SectionHeader title="Savings Breakdown" />
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: 12 }}>
          {savingsItems.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: i < savingsItems.length - 1 ? '1px solid var(--border)' : 'none', marginBottom: i < savingsItems.length - 1 ? 4 : 0 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--mid)' }}>{item.label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--mid)' }}>{formatCurrency(item.value)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--charcoal)' }}>Total</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      <div>
        <SectionHeader title="Labs Citation" />
        <div style={{ border: '1px solid var(--accent)', borderRadius: 6, padding: 12 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>
            Cost avoidance estimates based on Hooomz Labs reference data and regional contractor remediation averages for Greater Moncton, NB. Individual results may vary.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TAB 5 — Labs Recommendations
// ============================================================================

interface Recommendation {
  title: string;
  why: string;
  tag: string;
  colour: string;
}

function buildRecommendations(report: IAQReport): Recommendation[] {
  const recs: Recommendation[] = [];

  if (report.voc.status !== 'good') {
    recs.push({
      title: 'Low-VOC Paint & Finish Selection',
      why: `Peak VOC index of ${report.voc.peak} detected. Switching to verified low-VOC products can reduce post-renovation off-gassing by 60–80%.`,
      tag: 'LABS TEST · PAINTS & FINISHES',
      colour: 'clay',
    });
  }

  if (report.pm25.status !== 'good') {
    recs.push({
      title: 'HEPA Vacuum & Dust Containment Protocol',
      why: `PM2.5 peaked at ${report.pm25.peak} µg/m³ on ${report.pm25.peakDay}. Proper containment and HEPA vacuuming can reduce construction particulate by up to 90% at the source.`,
      tag: 'LABS TEST · DUST & CONTAINMENT',
      colour: 'blue',
    });
  }

  if (report.humidity.status !== 'good') {
    recs.push({
      title: 'Moisture Management During Renovation',
      why: 'Humidity averaged outside the 40–60% target zone during this project. Proper ventilation sequencing and dehumidification protocols are covered in this Labs guide.',
      tag: 'LABS TEST · MOISTURE & VENTILATION',
      colour: 'amber',
    });
  }

  if (report.co2.status !== 'good') {
    recs.push({
      title: 'Ventilation Protocols for Occupied Renovations',
      why: 'CO2 readings above 800 ppm indicate insufficient ventilation during occupied periods. This test covers window sequencing and temporary ventilation setups.',
      tag: 'LABS TEST · CO2 & VENTILATION',
      colour: 'blue',
    });
  }

  recs.push({
    title: 'AirGradient Monitoring Setup & Calibration',
    why: `Your report was generated from ${report.dailySummaries.length} days of AirGradient ONE sensor data. This guide covers placement, calibration, and reading interpretation.`,
    tag: 'LABS GUIDE · MONITORING',
    colour: 'clay',
  });

  return recs;
}

const COLOUR_MAP: Record<string, string> = {
  clay: 'var(--accent)',
  blue: 'var(--blue)',
  amber: 'var(--amber)',
};

function RecommendationsTab({ report }: { report: IAQReport }) {
  const recs = buildRecommendations(report);

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {recs.map((rec, i) => (
          <div key={i} style={{ borderLeft: `3px solid ${COLOUR_MAP[rec.colour] || 'var(--accent)'}`, padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', marginBottom: 6 }}>{rec.tag}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--charcoal)', marginBottom: 6 }}>{rec.title}</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--mid)', lineHeight: 1.5, marginBottom: 8 }}>{rec.why}</div>
            <a href="#" style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--accent)', textDecoration: 'none' }}>View in Labs →</a>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecommendationsRightPanel({ report }: { report: IAQReport }) {
  const recs = buildRecommendations(report);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <SectionHeader title="Hooomz Labs" />
        <div style={{ border: '1px solid var(--accent)', borderRadius: 6, padding: 12 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>
            Labs tests and validates materials, techniques, and protocols in real renovation conditions. Every recommendation in this report is backed by documented test data.
          </p>
        </div>
      </div>

      <div>
        <SectionHeader title="Active Tests Linked" />
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: 12, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{recs.length}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', marginTop: 4 }}>test protocols relevant to this project</div>
          <div style={{ marginTop: 8 }}>
            {recs.map((r, i) => (
              <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--muted)', marginTop: 2 }}>{r.tag}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
