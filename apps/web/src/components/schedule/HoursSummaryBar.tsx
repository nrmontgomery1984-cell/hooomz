'use client';

/**
 * HoursSummaryBar — Horizontal bar: scheduled (gray) vs actual (teal)
 */

interface HoursSummaryBarProps {
  scheduled: number;
  actual: number;
  budgeted?: number;
}

export function HoursSummaryBar({ scheduled, actual, budgeted }: HoursSummaryBarProps) {
  const maxHours = Math.max(scheduled, actual, budgeted ?? 0, 8);
  const scheduledPct = (scheduled / maxHours) * 100;
  const actualPct = (actual / maxHours) * 100;

  return (
    <div className="px-1">
      <div className="flex items-center gap-3 text-[10px] text-gray-500 mb-1">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-gray-300" />
          {scheduled}h scheduled
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#0F766E' }} />
          {actual}h actual
        </span>
        {budgeted !== undefined && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm border border-gray-400" />
            {budgeted}h budget
          </span>
        )}
      </div>
      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
        {/* Scheduled bar */}
        <div
          className="absolute inset-y-0 left-0 bg-gray-300 rounded-full"
          style={{ width: `${scheduledPct}%` }}
        />
        {/* Actual bar (overlays scheduled) */}
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${actualPct}%`, backgroundColor: '#0F766E' }}
        />
        {/* Budget marker */}
        {budgeted !== undefined && budgeted > 0 && (
          <div
            className="absolute inset-y-0 w-0.5 bg-gray-500"
            style={{ left: `${(budgeted / maxHours) * 100}%` }}
          />
        )}
      </div>
    </div>
  );
}
