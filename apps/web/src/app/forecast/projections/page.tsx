'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  useActiveForecastConfig,
  useCreateForecastConfig,
  useSaveForecastConfig,
  useForecastProjection,
} from '@/lib/hooks/useForecast';
import { useServicesContext } from '@/lib/services/ServicesContext';
import type { ForecastConfig } from '@/lib/types/forecast.types';
import { DEFAULT_FORECAST_VALUES } from '@/lib/types/forecast.types';
import type { YearForecast } from '@/lib/types/forecast.types';

function fmt(n: number): string {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);
}

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

export default function ProjectionsPage() {
  const { services, isLoading: servicesLoading } = useServicesContext();
  const { data: activeConfig, isLoading: configLoading } = useActiveForecastConfig();
  const createConfig = useCreateForecastConfig();
  const saveConfig = useSaveForecastConfig();
  const [draft, setDraft] = useState<ForecastConfig | null>(null);
  const [activeYear, setActiveYear] = useState(1);

  // Initialize draft from active config or create default
  useEffect(() => {
    if (configLoading || servicesLoading) return;
    if (activeConfig) {
      setDraft(activeConfig);
    }
  }, [activeConfig, configLoading, servicesLoading]);

  // Create default config on first load if none exists
  useEffect(() => {
    if (configLoading || servicesLoading || !services) return;
    if (activeConfig === null && !draft) {
      // Try to pull crew rates from IndexedDB
      services.crew.findAll().then((members) => {
        const nathan = members.find((m) => m.name.toLowerCase().includes('nathan'));
        const nishant = members.find((m) => m.name.toLowerCase().includes('nishant'));
        createConfig.mutate({
          name: 'Base Case 2026',
          isActive: true,
          scenario: 'base',
          nathanWageRate: nathan?.wageRate ?? DEFAULT_FORECAST_VALUES.nathanWageRate,
          nathanChargedRate: nathan?.chargedRate ?? DEFAULT_FORECAST_VALUES.nathanChargedRate,
          nishantWageRate: nishant?.wageRate ?? DEFAULT_FORECAST_VALUES.nishantWageRate,
          nishantChargedRate: nishant?.chargedRate ?? DEFAULT_FORECAST_VALUES.nishantChargedRate,
          operatingWeeks: { ...DEFAULT_FORECAST_VALUES.operatingWeeks },
          jobsPerWeek: { ...DEFAULT_FORECAST_VALUES.jobsPerWeek },
          avgJobValue: { ...DEFAULT_FORECAST_VALUES.avgJobValue },
          nishantHoursPct: { ...DEFAULT_FORECAST_VALUES.nishantHoursPct },
          nishantProfitSharePct: { ...DEFAULT_FORECAST_VALUES.nishantProfitSharePct },
          overhead: { ...DEFAULT_FORECAST_VALUES.overhead },
          manualRevenueOverrides: {},
        });
      });
    }
  }, [activeConfig, configLoading, servicesLoading, services, draft, createConfig]);

  // Sync created config into draft
  useEffect(() => {
    if (createConfig.data) {
      setDraft(createConfig.data);
    }
  }, [createConfig.data]);

  const { data: projection } = useForecastProjection(draft);

  const updateField = useCallback(<K extends keyof ForecastConfig>(key: K, value: ForecastConfig[K]) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: value };
    });
  }, []);

  // Auto-save on draft changes (debounced)
  useEffect(() => {
    if (!draft || !draft.id) return;
    const timer = setTimeout(() => {
      saveConfig.mutate(draft);
    }, 800);
    return () => clearTimeout(timer);
  }, [draft]); // eslint-disable-line react-hooks/exhaustive-deps

  if (configLoading || servicesLoading || !draft) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3, #9CA3AF)' }}>Loading forecast config...</div>;
  }

  const yearData = projection?.years.find((y) => y.year === activeYear);

  return (
    <div style={{ display: 'flex', gap: 20, flexDirection: 'column' }}>
      {/* Scenario selector */}
      <div style={{ display: 'flex', gap: 8 }}>
        {(['conservative', 'base', 'aggressive'] as const).map((s) => (
          <button
            key={s}
            onClick={() => updateField('scenario', s)}
            style={{
              padding: '6px 14px', fontSize: 12, fontWeight: draft.scenario === s ? 600 : 500,
              borderRadius: 6, border: '1px solid var(--border, #E5E7EB)',
              background: draft.scenario === s ? 'var(--blue, #3B82F6)' : 'var(--surface-1, #FFFFFF)',
              color: draft.scenario === s ? 'white' : 'var(--text-2, #6B7280)',
              cursor: 'pointer', fontFamily: 'var(--font-sans)', textTransform: 'capitalize',
            }}
          >
            {s}
          </button>
        ))}
        {saveConfig.isPending && (
          <span style={{ fontSize: 11, color: 'var(--text-3, #9CA3AF)', alignSelf: 'center', marginLeft: 8 }}>Saving...</span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* LEFT: Config inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          {/* Crew Rates */}
          <ConfigSection title="Crew Rates">
            <InputRow label="Nathan wage" value={draft.nathanWageRate} prefix="$" suffix="/hr"
              onChange={(v) => updateField('nathanWageRate', v)} />
            <InputRow label="Nathan charged" value={draft.nathanChargedRate} prefix="$" suffix="/hr"
              onChange={(v) => updateField('nathanChargedRate', v)} />
            <InputRow label="Nishant wage" value={draft.nishantWageRate} prefix="$" suffix="/hr"
              onChange={(v) => updateField('nishantWageRate', v)} />
            <InputRow label="Nishant charged" value={draft.nishantChargedRate} prefix="$" suffix="/hr"
              onChange={(v) => updateField('nishantChargedRate', v)} />
          </ConfigSection>

          {/* Volume */}
          <ConfigSection title="Volume">
            <YearInputRow label="Operating wk" values={draft.operatingWeeks}
              onChange={(v) => updateField('operatingWeeks', v)} />
            <YearInputRow label="Jobs/week" values={draft.jobsPerWeek} step={0.5}
              onChange={(v) => updateField('jobsPerWeek', v)} />
            <YearInputRow label="Avg job value" values={draft.avgJobValue} prefix="$"
              onChange={(v) => updateField('avgJobValue', v)} />
            <YearInputRow label="Nishant %" values={draft.nishantHoursPct} step={0.05} suffix="%"
              displayMultiplier={100}
              onChange={(v) => updateField('nishantHoursPct', v)} />
          </ConfigSection>

          {/* Profit Share */}
          <ConfigSection title="Profit Share">
            <YearInputRow label="Nishant share" values={draft.nishantProfitSharePct} step={0.05} suffix="%"
              displayMultiplier={100}
              onChange={(v) => updateField('nishantProfitSharePct', v)} />
          </ConfigSection>

          {/* Overhead */}
          <ConfigSection title="Overhead (annual)">
            <InputRow label="Marketing" value={draft.overhead.marketing} prefix="$"
              onChange={(v) => updateField('overhead', { ...draft.overhead, marketing: v })} />
            <InputRow label="Vehicle" value={draft.overhead.vehicle} prefix="$"
              onChange={(v) => updateField('overhead', { ...draft.overhead, vehicle: v })} />
            <InputRow label="Insurance" value={draft.overhead.insurance} prefix="$"
              onChange={(v) => updateField('overhead', { ...draft.overhead, insurance: v })} />
            <InputRow label="Software" value={draft.overhead.software} prefix="$"
              onChange={(v) => updateField('overhead', { ...draft.overhead, software: v })} />
            <InputRow label="Other" value={draft.overhead.other} prefix="$"
              onChange={(v) => updateField('overhead', { ...draft.overhead, other: v })} />
          </ConfigSection>
        </div>

        {/* RIGHT: Projection output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          {/* Year tabs */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3].map((yr) => (
              <button
                key={yr}
                onClick={() => setActiveYear(yr)}
                style={{
                  padding: '6px 16px', fontSize: 12, fontWeight: activeYear === yr ? 600 : 500,
                  borderRadius: 6, border: '1px solid var(--border, #E5E7EB)',
                  background: activeYear === yr ? 'var(--blue, #3B82F6)' : 'var(--surface-1, #FFFFFF)',
                  color: activeYear === yr ? 'white' : 'var(--text-2, #6B7280)',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}
              >
                Year {yr}
              </button>
            ))}
          </div>

          {yearData && <ProjectionOutput year={yearData} />}

          {/* 3-year summary */}
          {projection && (
            <div style={{
              background: 'var(--surface-1, #FFFFFF)', borderRadius: 12, border: '1px solid var(--border, #E5E7EB)',
              padding: 16,
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3, #9CA3AF)', marginBottom: 12 }}>
                3-Year Cumulative
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <MiniStat label="Total Revenue" value={fmt(projection.threeYearTotals.totalRevenue)} />
                <MiniStat label="Net Profit" value={fmt(projection.threeYearTotals.totalNetProfit)} />
                <MiniStat label="Nathan Total" value={fmt(projection.threeYearTotals.nathanCumulative)} />
                <MiniStat label="Nishant Total" value={fmt(projection.threeYearTotals.nishantCumulative)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function ConfigSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--surface-1, #FFFFFF)', borderRadius: 12, border: '1px solid var(--border, #E5E7EB)',
      padding: 16, display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3, #9CA3AF)', marginBottom: 4 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function InputRow({ label, value, prefix, suffix, onChange }: {
  label: string; value: number; prefix?: string; suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ fontSize: 13, color: 'var(--text, #111827)', fontWeight: 500 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {prefix && <span style={{ fontSize: 12, color: 'var(--text-3, #9CA3AF)' }}>{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          style={{
            width: 80, padding: '4px 6px', fontSize: 13, textAlign: 'right',
            border: '1px solid var(--border, #E5E7EB)', borderRadius: 4,
            background: 'var(--bg, #F9FAFB)', color: 'var(--text, #111827)',
            fontFamily: 'var(--font-mono, monospace)', fontVariantNumeric: 'tabular-nums',
          }}
        />
        {suffix && <span style={{ fontSize: 12, color: 'var(--text-3, #9CA3AF)' }}>{suffix}</span>}
      </div>
    </div>
  );
}

function YearInputRow({ label, values, prefix, suffix, step, displayMultiplier, onChange }: {
  label: string;
  values: { y1: number; y2: number; y3: number };
  prefix?: string; suffix?: string; step?: number;
  displayMultiplier?: number;
  onChange: (v: { y1: number; y2: number; y3: number }) => void;
}) {
  const mult = displayMultiplier || 1;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 13, color: 'var(--text, #111827)', fontWeight: 500, minWidth: 90 }}>{label}</span>
      {(['y1', 'y2', 'y3'] as const).map((key) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          {prefix && <span style={{ fontSize: 11, color: 'var(--text-3, #9CA3AF)' }}>{prefix}</span>}
          <input
            type="number"
            step={step ? step * mult : undefined}
            value={Math.round(values[key] * mult * 100) / 100}
            onChange={(e) => {
              const raw = Number(e.target.value) || 0;
              onChange({ ...values, [key]: raw / mult });
            }}
            style={{
              width: '100%', padding: '4px 4px', fontSize: 12, textAlign: 'right',
              border: '1px solid var(--border, #E5E7EB)', borderRadius: 4,
              background: 'var(--bg, #F9FAFB)', color: 'var(--text, #111827)',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          />
          {suffix && <span style={{ fontSize: 11, color: 'var(--text-3, #9CA3AF)' }}>{suffix}</span>}
        </div>
      ))}
    </div>
  );
}

function ProjectionOutput({ year }: { year: YearForecast }) {
  return (
    <div style={{
      background: 'var(--surface-1, #FFFFFF)', borderRadius: 12, border: '1px solid var(--border, #E5E7EB)',
      padding: 16, display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3, #9CA3AF)', marginBottom: 6 }}>
        {year.label}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-3, #9CA3AF)', marginBottom: 8 }}>
        {year.totalJobs.toFixed(0)} jobs @ {fmt(year.avgJobValue)} avg
      </div>

      <ProfitLine label="Revenue" value={year.grossRevenue} bold />
      <ProfitLine label="Labor Cost" value={-year.totalLaborCost} indent />
      <ProfitLine label="Material Cost" value={-year.estimatedMaterialCost} indent />
      <ProfitLine label="Gross Profit" value={year.grossProfit} bold sub={fmtPct(year.grossMarginPct)} />
      <ProfitLine label="Overhead" value={-year.totalOverhead} indent />
      <ProfitLine label="Net Profit" value={year.netProfitBeforeShare} bold sub={fmtPct(year.netMarginPct)} />
      <ProfitLine label="Nishant Share" value={-year.nishantProfitShare} indent />
      <ProfitLine label="Nathan Net Profit" value={year.nathanNetProfit} bold accent />

      <div style={{ height: 1, background: 'var(--border, #E5E7EB)', margin: '8px 0' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <TakeHomeBox
          name="Nathan"
          wage={year.nathanWageDraw}
          profit={year.nathanProfitDraw}
          total={year.nathanTotal}
          hours={year.nathanHours}
        />
        <TakeHomeBox
          name="Nishant"
          wage={year.nishantWageDraw}
          profit={year.nishantProfitDraw}
          total={year.nishantTotal}
          hours={year.nishantHours}
        />
      </div>
    </div>
  );
}

function ProfitLine({ label, value, bold, indent, sub, accent }: {
  label: string; value: number; bold?: boolean; indent?: boolean; sub?: string; accent?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      paddingLeft: indent ? 16 : 0,
    }}>
      <span style={{
        fontSize: 13, fontWeight: bold ? 600 : 400,
        color: indent ? 'var(--text-2, #6B7280)' : 'var(--text, #111827)',
      }}>
        {label}
      </span>
      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{
          fontSize: 14, fontWeight: bold ? 700 : 500, fontVariantNumeric: 'tabular-nums',
          color: accent ? 'var(--blue, #3B82F6)' : value < 0 ? 'var(--text-2, #6B7280)' : 'var(--text, #111827)',
        }}>
          {value < 0 ? `(${fmt(Math.abs(value))})` : fmt(value)}
        </span>
        {sub && <span style={{ fontSize: 11, color: 'var(--text-3, #9CA3AF)' }}>{sub}</span>}
      </div>
    </div>
  );
}

function TakeHomeBox({ name, wage, profit, total, hours }: {
  name: string; wage: number; profit: number; total: number; hours: number;
}) {
  const effectiveRate = hours > 0 ? total / hours : 0;
  return (
    <div style={{ background: 'var(--bg, #F9FAFB)', borderRadius: 8, padding: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text, #111827)', marginBottom: 6 }}>{name}</div>
      <div style={{ fontSize: 11, color: 'var(--text-2, #6B7280)' }}>Wage draw: {fmt(wage)}</div>
      <div style={{ fontSize: 11, color: 'var(--text-2, #6B7280)' }}>Profit draw: {fmt(profit)}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--blue, #3B82F6)', marginTop: 4 }}>{fmt(total)}/yr</div>
      <div style={{ fontSize: 10, color: 'var(--text-3, #9CA3AF)' }}>~{fmt(effectiveRate)}/hr effective</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-3, #9CA3AF)' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text, #111827)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}
