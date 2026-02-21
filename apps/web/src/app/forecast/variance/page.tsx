'use client';

import { useState, useMemo } from 'react';
import { Camera } from 'lucide-react';
import {
  useActiveForecastConfig,
  useForecastProjection,
  useFinancialActuals,
  useForecastSnapshots,
  useCreateSnapshot,
} from '@/lib/hooks/useForecast';

function fmt(n: number): string {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);
}

function fmtPct(n: number): string {
  if (!isFinite(n)) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

function fmtVar(n: number): string {
  const sign = n > 0 ? '+' : '';
  return `${sign}${fmt(n)}`;
}

interface QuarterDef {
  label: string;
  from: string;
  to: string;
  year: number;
  quarter: number;
}

function getQuarters(): QuarterDef[] {
  const now = new Date();
  const y = now.getFullYear();
  const quarters: QuarterDef[] = [];
  for (let q = 1; q <= 4; q++) {
    const startMonth = (q - 1) * 3 + 1;
    const endMonth = q * 3;
    const lastDay = new Date(y, endMonth, 0).getDate();
    quarters.push({
      label: `Q${q} ${y}`,
      from: `${y}-${String(startMonth).padStart(2, '0')}-01`,
      to: `${y}-${String(endMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
      year: 1,
      quarter: q,
    });
  }
  return quarters;
}

export default function VariancePage() {
  const quarters = useMemo(() => getQuarters(), []);
  const [selectedQ, setSelectedQ] = useState(0);
  const q = quarters[selectedQ];

  const { data: config } = useActiveForecastConfig();
  const { data: projection } = useForecastProjection(config ?? null);
  const { data: actuals, isLoading: actualsLoading } = useFinancialActuals(q.from, q.to);
  const { data: snapshots } = useForecastSnapshots();
  const createSnapshot = useCreateSnapshot();

  // Forecast for this quarter: Year 1 / 4
  const yearForecast = projection?.years.find((y) => y.year === q.year);
  const quarterForecastRevenue = yearForecast ? yearForecast.grossRevenue / 4 : 0;
  const quarterForecastGross = yearForecast ? yearForecast.grossProfit / 4 : 0;
  const quarterForecastNet = yearForecast ? yearForecast.netProfitBeforeShare / 4 : 0;

  const now = new Date().toISOString().substring(0, 10);
  const isPast = q.to < now;

  const handleSnapshot = () => {
    if (!config || !actuals) return;
    createSnapshot.mutate({
      configId: config.id,
      snapshotDate: new Date().toISOString(),
      periodType: 'quarterly',
      periodLabel: q.label,
      forecastRevenue: quarterForecastRevenue,
      forecastLaborCost: yearForecast ? yearForecast.totalLaborCost / 4 : 0,
      forecastMaterialCost: yearForecast ? yearForecast.estimatedMaterialCost / 4 : 0,
      forecastOverhead: yearForecast ? yearForecast.totalOverhead / 4 : 0,
      forecastGrossProfit: quarterForecastGross,
      forecastNetProfit: quarterForecastNet,
      forecastNathanTakeHome: yearForecast ? yearForecast.nathanTotal / 4 : 0,
      forecastNishantTakeHome: yearForecast ? yearForecast.nishantTotal / 4 : 0,
      actualRevenue: actuals.totalRevenue,
      actualLaborCost: actuals.totalLaborCost,
      actualMaterialCost: actuals.materialCost,
      actualGrossProfit: actuals.grossProfit,
      actualNetProfit: actuals.grossProfit - (yearForecast ? yearForecast.totalOverhead / 4 : 0),
      revenueVariance: actuals.totalRevenue - quarterForecastRevenue,
      revenueVariancePct: quarterForecastRevenue > 0
        ? ((actuals.totalRevenue - quarterForecastRevenue) / quarterForecastRevenue) * 100
        : 0,
      profitVariance: actuals.grossProfit - quarterForecastGross,
      profitVariancePct: quarterForecastGross > 0
        ? ((actuals.grossProfit - quarterForecastGross) / quarterForecastGross) * 100
        : 0,
    });
  };

  const periodSnapshots = snapshots?.filter((s) => s.periodLabel === q.label) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Quarter selector */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {quarters.map((qDef, i) => (
          <button
            key={qDef.label}
            onClick={() => setSelectedQ(i)}
            style={{
              padding: '6px 14px', fontSize: 12, fontWeight: selectedQ === i ? 600 : 500,
              borderRadius: 6, border: '1px solid var(--border, #E5E7EB)',
              background: selectedQ === i ? 'var(--blue, #3B82F6)' : 'var(--surface-1, #FFFFFF)',
              color: selectedQ === i ? 'white' : 'var(--text-2, #6B7280)',
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
            }}
          >
            {qDef.label}
          </button>
        ))}
      </div>

      {/* Variance table */}
      <div style={{
        background: 'var(--surface-1, #FFFFFF)', borderRadius: 12, border: '1px solid var(--border, #E5E7EB)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border, #E5E7EB)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3, #9CA3AF)' }}>
            Forecast vs Actual — {q.label}
          </div>
          <button
            onClick={handleSnapshot}
            disabled={!config || !actuals || createSnapshot.isPending}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6,
              border: 'none', background: 'var(--blue, #3B82F6)', color: 'white',
              cursor: !config || !actuals ? 'not-allowed' : 'pointer',
              opacity: !config || !actuals ? 0.5 : 1, fontFamily: 'var(--font-sans)',
            }}
          >
            <Camera size={14} />
            {createSnapshot.isPending ? 'Saving...' : 'Take Snapshot'}
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'var(--font-sans)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border, #E5E7EB)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-2, #6B7280)', fontSize: 11 }}>Metric</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-2, #6B7280)', fontSize: 11 }}>Forecast</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-2, #6B7280)', fontSize: 11 }}>Actual</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-2, #6B7280)', fontSize: 11 }}>Variance</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-2, #6B7280)', fontSize: 11 }}>%</th>
              </tr>
            </thead>
            <tbody>
              <VarianceRow
                label="Revenue"
                forecast={quarterForecastRevenue}
                actual={isPast || actuals ? actuals?.totalRevenue : null}
                loading={actualsLoading}
              />
              <VarianceRow
                label="Gross Profit"
                forecast={quarterForecastGross}
                actual={isPast || actuals ? actuals?.grossProfit : null}
                loading={actualsLoading}
              />
              <VarianceRow
                label="Net Profit"
                forecast={quarterForecastNet}
                actual={isPast || actuals
                  ? (actuals?.grossProfit ?? 0) - (yearForecast ? yearForecast.totalOverhead / 4 : 0)
                  : null}
                loading={actualsLoading}
              />
            </tbody>
          </table>
        </div>
      </div>

      {/* Snapshot history */}
      {periodSnapshots.length > 0 && (
        <div style={{
          background: 'var(--surface-1, #FFFFFF)', borderRadius: 12, border: '1px solid var(--border, #E5E7EB)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border, #E5E7EB)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3, #9CA3AF)' }}>
              Snapshot History — {q.label}
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'var(--font-sans)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border, #E5E7EB)' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-2, #6B7280)', fontSize: 11 }}>Date</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-2, #6B7280)', fontSize: 11 }}>Forecast Rev</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-2, #6B7280)', fontSize: 11 }}>Actual Rev</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-2, #6B7280)', fontSize: 11 }}>Rev Var %</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-2, #6B7280)', fontSize: 11 }}>Profit Var %</th>
                </tr>
              </thead>
              <tbody>
                {periodSnapshots.sort((a, b) => b.snapshotDate.localeCompare(a.snapshotDate)).map((snap) => (
                  <tr key={snap.id} style={{ borderBottom: '1px solid var(--border, #E5E7EB)' }}>
                    <td style={{ padding: '8px 12px', color: 'var(--text, #111827)' }}>
                      {new Date(snap.snapshotDate).toLocaleDateString('en-CA')}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(snap.forecastRevenue)}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(snap.actualRevenue)}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: varianceColor(snap.revenueVariancePct) }}>
                      {fmtPct(snap.revenueVariancePct)}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: varianceColor(snap.profitVariancePct) }}>
                      {fmtPct(snap.profitVariancePct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function VarianceRow({ label, forecast, actual, loading }: {
  label: string; forecast: number; actual: number | null | undefined; loading: boolean;
}) {
  const hasActual = actual !== null && actual !== undefined;
  const variance = hasActual ? actual - forecast : 0;
  const variancePct = hasActual && forecast > 0 ? (variance / forecast) * 100 : 0;

  return (
    <tr style={{ borderBottom: '1px solid var(--border, #E5E7EB)' }}>
      <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text, #111827)' }}>{label}</td>
      <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(forecast)}</td>
      <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {loading ? '...' : hasActual ? fmt(actual) : '—'}
      </td>
      <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: hasActual ? varianceColor(variancePct) : 'var(--text-3, #9CA3AF)' }}>
        {hasActual ? fmtVar(variance) : '—'}
      </td>
      <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: hasActual ? varianceColor(variancePct) : 'var(--text-3, #9CA3AF)' }}>
        {hasActual ? fmtPct(variancePct) : '—'}
      </td>
    </tr>
  );
}

function varianceColor(pct: number): string {
  if (pct > 5) return '#10B981';
  if (pct < -5) return '#EF4444';
  return '#6B7280';
}
