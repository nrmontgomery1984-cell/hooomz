'use client';

/**
 * Finance Dashboard — Revenue, forecast, cost tracking
 */

import Link from 'next/link';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import { TrendingUp, DollarSign, ChevronRight, BarChart3, Users } from 'lucide-react';
import { useActiveForecastConfig, useForecastProjection } from '@/lib/hooks/useForecast';
import { useProjectVarianceSummary } from '@/lib/hooks/useLabourEstimation';
import { useActiveCrew } from '@/lib/crew/ActiveCrewContext';
import { SECTION_COLORS } from '@/lib/viewmode';

const FINANCE_COLOR = SECTION_COLORS.finance;

// Division data for breakdown panel
const DIVISIONS = [
  { name: 'Interiors (Nishant)', key: 'interiors' },
  { name: 'Brisso Exteriors', key: 'exteriors' },
  { name: 'Labs / Affiliate', key: 'labs' },
  { name: 'Maintenance', key: 'maintenance' },
];

export default function FinanceDashboard() {
  const { data: forecastConfig, isLoading: configLoading } = useActiveForecastConfig();
  const { data: projection } = useForecastProjection(forecastConfig ?? null);
  const { projectId: crewProjectId } = useActiveCrew();
  const { data: labourVariance } = useProjectVarianceSummary(crewProjectId);

  const isLoading = configLoading;

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: FINANCE_COLOR, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Extract yearly forecasts from projection
  const years = projection?.years || [];
  const maxYearlyRevenue = Math.max(...years.map((y) => y.grossRevenue || 0), 1);
  const y1Revenue = years[0]?.grossRevenue ?? 0;

  return (
    <PageErrorBoundary>
      <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>

        {/* Header */}
        <div style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: FINANCE_COLOR }} />
              <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-cond)', letterSpacing: '0.02em' }}>
                Finance Dashboard
              </h1>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Revenue, forecasting, and cost tracking</p>
          </div>
        </div>

        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6">

          {/* Stat Row */}
          <div
            style={{ marginTop: 16, display: 'grid', gap: 10 }}
            className="grid-cols-2 md:grid-cols-4"
          >
            <StatCard icon={<DollarSign size={14} />} label="Revenue MTD" value="—" color={FINANCE_COLOR} />
            {/* TODO: wire to useFinancialActuals for current month */}
            <StatCard icon={<TrendingUp size={14} />} label="Y1 Forecast" value={y1Revenue > 0 ? `$${Math.round(y1Revenue).toLocaleString()}` : '—'} color={FINANCE_COLOR} />
            <StatCard icon={<DollarSign size={14} />} label="Outstanding AR" value="—" color={FINANCE_COLOR} />
            {/* TODO: wire to invoice data when available */}
            <StatCard icon={<BarChart3 size={14} />} label="Gross Margin" value="—" color={FINANCE_COLOR} />
            {/* TODO: compute from actuals vs cost data */}
          </div>

          {/* Content Grid */}
          <div className="mt-5" style={{ display: 'grid', gap: 16 }}>
            <div
              style={{ display: 'grid', gap: 16 }}
              className="md:grid-cols-[1fr_1fr]"
            >
              {/* Revenue Forecast */}
              <div>
                <SectionHeader title="Revenue Forecast (3-Year)" />
                <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, boxShadow: 'var(--shadow-card)' }}>
                  {years.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 16 }}>
                      <BarChart3 size={20} style={{ color: 'var(--text-3)', margin: '0 auto 8px' }} />
                      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>No forecast data configured</p>
                      <Link
                        href="/forecast"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 11, fontWeight: 600, color: FINANCE_COLOR, textDecoration: 'none' }}
                      >
                        Configure Forecast <ChevronRight size={10} />
                      </Link>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {years.map((yr, i) => (
                        <div key={i}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-2)' }}>{yr.label}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>
                              ${(yr.grossRevenue / 1000).toFixed(0)}k rev · {yr.grossMarginPct.toFixed(0)}% margin
                            </span>
                          </div>
                          <div style={{ height: 8, borderRadius: 4, background: 'var(--surface-3)', overflow: 'hidden', position: 'relative' }}>
                            {/* Revenue bar */}
                            <div style={{
                              position: 'absolute', height: '100%', borderRadius: 4,
                              width: `${Math.max((yr.grossRevenue / maxYearlyRevenue) * 100, 4)}%`,
                              background: `${FINANCE_COLOR}30`,
                            }} />
                            {/* Profit bar */}
                            <div style={{
                              position: 'relative', height: '100%', borderRadius: 4,
                              width: `${Math.max((yr.grossProfit / maxYearlyRevenue) * 100, 0)}%`,
                              background: FINANCE_COLOR,
                              transition: 'width 0.4s',
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <Link
                    href="/forecast"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      marginTop: 12, padding: '8px 0', fontSize: 11, fontWeight: 600,
                      color: FINANCE_COLOR, textDecoration: 'none',
                    }}
                  >
                    Full Forecast <ChevronRight size={10} />
                  </Link>
                </div>
              </div>

              {/* Revenue by Division */}
              <div>
                <SectionHeader title="Revenue by Division" />
                <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, boxShadow: 'var(--shadow-card)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {DIVISIONS.map((div) => (
                      <div key={div.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{div.name}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--text-3)' }}>
                          —
                        </span>
                        {/* TODO: wire to actual division revenue data */}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Labour Performance */}
            <div>
              <SectionHeader title="Labour Performance" />
              <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, boxShadow: 'var(--shadow-card)' }}>
                {!labourVariance || (labourVariance.totalSellBudget === 0 && labourVariance.tasksWithoutEstimate.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: 16 }}>
                    <Users size={20} style={{ color: 'var(--text-3)', margin: '0 auto 8px' }} />
                    <p style={{ fontSize: 12, color: 'var(--text-3)' }}>No labour estimates applied yet</p>
                    <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>
                      Apply estimates to deployed tasks to see performance data
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Budget summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <span style={{ fontSize: 10, color: 'var(--text-3)', display: 'block' }}>Total Sell Budget</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                          ${labourVariance.totalSellBudget.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: 10, color: 'var(--text-3)', display: 'block' }}>Total Cost Budget</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                          ${labourVariance.totalCostBudget.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>

                    {/* Efficiency + actuals */}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-2)' }}>
                          Budgeted: {labourVariance.totalBudgetedHours.toFixed(1)}h
                        </span>
                        {labourVariance.overallEfficiency !== null && (
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
                              color: labourVariance.overallEfficiency > 1.15 ? 'var(--red)'
                                : labourVariance.overallEfficiency > 1.0 ? 'var(--amber)'
                                : 'var(--green)',
                            }}
                          >
                            {Math.round(labourVariance.overallEfficiency * 100)}% efficiency
                          </span>
                        )}
                      </div>
                      {labourVariance.totalActualCost !== null && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)' }}>
                          <span>Actual cost: ${labourVariance.totalActualCost.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                          {labourVariance.totalActualHours !== null && (
                            <span>Actual hours: {labourVariance.totalActualHours.toFixed(1)}h</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Crew breakdown */}
                    {labourVariance.varianceByCrewMember.length > 0 && (
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>By Crew Member</span>
                        {labourVariance.varianceByCrewMember.map((cv) => (
                          <div key={cv.crewMemberId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontSize: 11, color: 'var(--text-2)' }}>
                              {cv.crewMemberName} ({cv.taskCount} task{cv.taskCount !== 1 ? 's' : ''})
                            </span>
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                                color: cv.totalVariance > 0.15 ? 'var(--red)'
                                  : cv.totalVariance > 0 ? 'var(--amber)'
                                  : 'var(--green)',
                              }}
                            >
                              {cv.totalVariance > 0 ? '+' : ''}{Math.round(cv.totalVariance * 100)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Missing estimates warning */}
                    {labourVariance.tasksWithoutEstimate.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 6, background: 'var(--amber-dim)' }}>
                        <span style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 500 }}>
                          {labourVariance.tasksWithoutEstimate.length} task{labourVariance.tasksWithoutEstimate.length !== 1 ? 's' : ''} missing estimates
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Overdue Invoices */}
            <div>
              <SectionHeader title="Overdue Invoices" />
              <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
                <DollarSign size={20} style={{ color: 'var(--text-3)', margin: '0 auto 8px' }} />
                <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Invoice tracking coming soon</p>
                {/* TODO: wire to invoice/payment data when available */}
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
      <span style={{ fontFamily: 'var(--font-cond)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
        {title}
      </span>
    </div>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div style={{
      padding: '12px 14px',
      borderRadius: 'var(--radius)',
      background: 'var(--surface-1)',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <div style={{ color }}>{icon}</div>
        <span style={{ fontFamily: 'var(--font-cond)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
          {label}
        </span>
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
        {value}
      </span>
    </div>
  );
}
