'use client';

/**
 * PaymentTerms — Structured payment terms with deposit %, validity days,
 * schedule type selector (Simple/Progress/Custom), and milestone list.
 * Matches quote-detail-v2.html artifact.
 */

import { useMemo, useCallback } from 'react';

// ─── Types ───

export interface TradeGroupInfo {
  name: string;
  total: number;
}

export interface Milestone {
  label: string;
  sublabel?: string;
  pct: number;
  amount: number;
  invNumber: string;
  dotType: 'deposit' | 'progress' | 'final' | 'custom';
}

type ScheduleType = 'simple' | 'progress' | 'custom';

interface PaymentTermsProps {
  total: number;
  depositPct: number;
  validityDays: number;
  scheduleType: ScheduleType;
  customMilestones: Array<{ label: string; pct: number }>;
  tradeGroups: TradeGroupInfo[];
  isEditable: boolean;
  quoteNumber?: string;
  onDepositChange?: (pct: number) => void;
  onValidityChange?: (days: number) => void;
  onScheduleTypeChange?: (type: ScheduleType) => void;
  onCustomMilestonesChange?: (milestones: Array<{ label: string; pct: number }>) => void;
}

function fmt(n: number): string {
  return '$' + n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Component ───

export function PaymentTerms({
  total,
  depositPct,
  validityDays,
  scheduleType,
  customMilestones,
  tradeGroups,
  isEditable,
  quoteNumber = 'Q-2026-001',
  onDepositChange,
  onValidityChange,
  onScheduleTypeChange,
  onCustomMilestonesChange,
}: PaymentTermsProps) {
  const depositAmount = total * (depositPct / 100);
  const remainingPct = 100 - depositPct;

  // Compute milestones based on schedule type
  const milestones = useMemo((): Milestone[] => {
    const invPrefix = quoteNumber.replace('Q-', 'INV-');
    let invIdx = 1;
    const ms: Milestone[] = [];

    // Always starts with deposit
    ms.push({
      label: 'Deposit',
      sublabel: 'Due upon acceptance',
      pct: depositPct,
      amount: depositAmount,
      invNumber: `${invPrefix}-${String(invIdx++).padStart(3, '0')}`,
      dotType: 'deposit',
    });

    if (scheduleType === 'simple') {
      ms.push({
        label: 'Final Payment',
        sublabel: 'Due on completion',
        pct: remainingPct,
        amount: total - depositAmount,
        invNumber: `${invPrefix}-${String(invIdx++).padStart(3, '0')}`,
        dotType: 'final',
      });
    } else if (scheduleType === 'progress') {
      // One milestone per trade, proportional
      const subtotal = tradeGroups.reduce((s, t) => s + t.total, 0) || 1;
      for (const trade of tradeGroups) {
        const tradePct = (trade.total / subtotal) * remainingPct;
        ms.push({
          label: trade.name,
          sublabel: `On ${trade.name.toLowerCase()} completion`,
          pct: Math.round(tradePct * 10) / 10,
          amount: total * (tradePct / 100),
          invNumber: `${invPrefix}-${String(invIdx++).padStart(3, '0')}`,
          dotType: 'progress',
        });
      }
    } else {
      // Custom milestones
      for (const cm of customMilestones) {
        ms.push({
          label: cm.label,
          pct: cm.pct,
          amount: total * (cm.pct / 100),
          invNumber: `${invPrefix}-${String(invIdx++).padStart(3, '0')}`,
          dotType: 'custom',
        });
      }
      // Final = remainder
      const usedPct = depositPct + customMilestones.reduce((s, m) => s + m.pct, 0);
      const finalPct = Math.max(0, 100 - usedPct);
      ms.push({
        label: 'Final Payment',
        sublabel: 'Balance due on completion',
        pct: Math.round(finalPct * 10) / 10,
        amount: total * (finalPct / 100),
        invNumber: `${invPrefix}-${String(invIdx++).padStart(3, '0')}`,
        dotType: 'final',
      });
    }

    return ms;
  }, [total, depositPct, depositAmount, remainingPct, scheduleType, tradeGroups, customMilestones, quoteNumber]);

  const handleAddCustom = useCallback(() => {
    const next = [...customMilestones, { label: `Milestone ${customMilestones.length + 1}`, pct: 10 }];
    onCustomMilestonesChange?.(next);
  }, [customMilestones, onCustomMilestonesChange]);

  const handleRemoveCustom = useCallback((idx: number) => {
    onCustomMilestonesChange?.(customMilestones.filter((_, i) => i !== idx));
  }, [customMilestones, onCustomMilestonesChange]);

  const handleUpdateCustom = useCallback((idx: number, field: 'label' | 'pct', value: string | number) => {
    const next = [...customMilestones];
    if (field === 'label') next[idx] = { ...next[idx], label: value as string };
    else next[idx] = { ...next[idx], pct: Number(value) || 0 };
    onCustomMilestonesChange?.(next);
  }, [customMilestones, onCustomMilestonesChange]);

  const DOT_COLORS: Record<Milestone['dotType'], string> = {
    deposit: 'var(--charcoal)',
    progress: 'var(--blue)',
    final: 'var(--green)',
    custom: 'var(--accent)',
  };

  return (
    <div
      className="px-4 py-4 mb-3"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: '3px solid var(--accent)',
      }}
    >
      <div
        className="text-[9px] font-medium uppercase tracking-[0.12em] mb-3.5"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
      >
        Payment Terms
      </div>

      {/* Deposit % */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs w-[120px] flex-shrink-0" style={{ color: 'var(--mid)' }}>
          Deposit
        </span>
        <input
          type="number"
          min={0}
          max={100}
          value={depositPct}
          onChange={(e) => onDepositChange?.(Number(e.target.value) || 0)}
          disabled={!isEditable}
          className="text-xs text-right w-[80px] px-2.5 py-1.5"
          style={{
            fontFamily: 'var(--font-mono)',
            border: '1px solid var(--border)',
            background: isEditable ? 'var(--surface)' : 'var(--bg)',
            color: 'var(--charcoal)',
          }}
        />
        <span className="text-[11px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>%</span>
        <span
          className="text-xs font-medium ml-2"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--charcoal)' }}
        >
          {fmt(depositAmount)}
        </span>
      </div>

      {/* Validity days */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs w-[120px] flex-shrink-0" style={{ color: 'var(--mid)' }}>
          Valid for
        </span>
        <input
          type="number"
          min={1}
          max={365}
          value={validityDays}
          onChange={(e) => onValidityChange?.(Number(e.target.value) || 30)}
          disabled={!isEditable}
          className="text-xs text-right w-[80px] px-2.5 py-1.5"
          style={{
            fontFamily: 'var(--font-mono)',
            border: '1px solid var(--border)',
            background: isEditable ? 'var(--surface)' : 'var(--bg)',
            color: 'var(--charcoal)',
          }}
        />
        <span className="text-[11px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>days</span>
      </div>

      {/* Schedule type selector */}
      <div className="flex mb-3.5" style={{ border: '1px solid var(--border)' }}>
        {(['simple', 'progress', 'custom'] as ScheduleType[]).map((type) => {
          const labels: Record<ScheduleType, string> = {
            simple: 'Deposit + Final',
            progress: 'Progress',
            custom: 'Custom',
          };
          const isActive = scheduleType === type;
          return (
            <button
              key={type}
              onClick={() => onScheduleTypeChange?.(type)}
              disabled={!isEditable}
              className="flex-1 py-2 px-3 text-[10px] font-medium tracking-[0.04em] text-center"
              style={{
                fontFamily: 'var(--font-mono)',
                background: isActive ? 'var(--charcoal)' : 'var(--bg)',
                color: isActive ? 'var(--surface)' : 'var(--mid)',
                border: 'none',
                borderRight: type !== 'custom' ? '1px solid var(--border)' : 'none',
              }}
            >
              {labels[type]}
            </button>
          );
        })}
      </div>

      {/* Milestone list */}
      <div className="flex flex-col">
        {milestones.map((ms, i) => {
          const isCustomEditable = isEditable && scheduleType === 'custom' && ms.dotType === 'custom';
          return (
            <div
              key={i}
              className="flex items-center gap-3 py-2.5"
              style={{ borderBottom: i < milestones.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: DOT_COLORS[ms.dotType] }}
              />
              <div className="flex-1 min-w-0">
                {isCustomEditable ? (
                  <input
                    type="text"
                    value={ms.label}
                    onChange={(e) => {
                      const cmIdx = i - 1; // offset for deposit row
                      handleUpdateCustom(cmIdx, 'label', e.target.value);
                    }}
                    className="text-xs font-medium w-[160px] px-2 py-1"
                    style={{
                      fontFamily: 'var(--font-body)',
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--charcoal)',
                    }}
                  />
                ) : (
                  <span className="text-xs font-medium" style={{ color: 'var(--charcoal)' }}>
                    {ms.label}
                    {ms.sublabel && (
                      <span className="text-[10px] font-normal block mt-0.5" style={{ color: 'var(--muted)' }}>
                        {ms.sublabel}
                      </span>
                    )}
                  </span>
                )}
              </div>
              {isCustomEditable ? (
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={customMilestones[i - 1]?.pct ?? 0}
                  onChange={(e) => {
                    const cmIdx = i - 1;
                    handleUpdateCustom(cmIdx, 'pct', e.target.value);
                  }}
                  className="text-[11px] text-right w-[48px] px-1.5 py-1"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--charcoal)',
                  }}
                />
              ) : (
                <span
                  className="text-[11px] text-right w-[40px]"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--mid)' }}
                >
                  {ms.pct.toFixed(0)}%
                </span>
              )}
              <span
                className="text-xs font-medium text-right w-[90px]"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--charcoal)' }}
              >
                {fmt(ms.amount)}
              </span>
              <span
                className="text-[9px] tracking-[0.04em] px-1.5 py-0.5"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--muted)',
                  background: 'var(--bg)',
                }}
              >
                {ms.invNumber}
              </span>
              {isCustomEditable && (
                <button
                  onClick={() => handleRemoveCustom(i - 1)}
                  className="w-5 h-5 flex items-center justify-center text-xs flex-shrink-0"
                  style={{
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--muted)',
                  }}
                  title="Remove"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add milestone button (custom only) */}
      {isEditable && scheduleType === 'custom' && (
        <button
          onClick={handleAddCustom}
          className="text-[10px] font-medium tracking-[0.04em] px-3 py-1.5 mt-2"
          style={{
            fontFamily: 'var(--font-mono)',
            border: '1px dashed var(--border)',
            background: 'none',
            color: 'var(--blue)',
          }}
        >
          + Add Milestone
        </button>
      )}
    </div>
  );
}
