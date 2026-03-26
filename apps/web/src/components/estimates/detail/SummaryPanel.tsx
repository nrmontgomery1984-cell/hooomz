'use client';

/**
 * SummaryPanel — Right sidebar with homeowner info, job info, cost summary, and history.
 * Matches estimate-detail-v4.html artifact.
 */

// ─── Types ───

interface InfoRow {
  label: string;
  value: string;
}

interface TradeSummary {
  name: string;
  total: number;
}

interface HistoryEntry {
  label: string;
  date: string;
}

interface SummaryPanelProps {
  homeowner?: InfoRow[];
  job?: InfoRow[];
  trades: TradeSummary[];
  subtotal: number;
  taxRate?: number;
  taxLabel?: string;
  total: number;
  history?: HistoryEntry[];
}

function formatCurrency(value: number): string {
  return '$' + value.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Sub-components ───

function InfoCard({ title, rows }: { title: string; rows: InfoRow[] }) {
  return (
    <div
      className="mb-3 px-4 py-3.5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div
        className="text-[9px] font-medium uppercase tracking-[0.12em] mb-2"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
      >
        {title}
      </div>
      {rows.map((row, i) => (
        <div key={i} className="flex justify-between py-1">
          <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
            {row.label}
          </span>
          <span
            className="text-[11px] font-medium"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--charcoal)' }}
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───

export function SummaryPanel({
  homeowner,
  job,
  trades,
  subtotal,
  taxRate = 0.15,
  taxLabel = 'HST (15%)',
  total,
  history,
}: SummaryPanelProps) {
  const taxAmount = subtotal * taxRate;

  return (
    <div className="lg:sticky lg:top-4">
      {/* Homeowner Card */}
      {homeowner && homeowner.length > 0 && (
        <InfoCard title="Homeowner" rows={homeowner} />
      )}

      {/* Job Card */}
      {job && job.length > 0 && (
        <InfoCard title="Job" rows={job} />
      )}

      {/* Cost Summary Card */}
      <div
        className="mb-3"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div
          className="text-[9px] font-medium uppercase tracking-[0.12em] px-4 pt-3"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
        >
          Summary
        </div>
        <div className="px-4 py-2.5">
          {/* Per-trade rows */}
          {trades.map((trade, i) => (
            <div
              key={trade.name}
              className="flex justify-between items-center py-1.5"
              style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}
            >
              <span className="text-xs" style={{ color: 'var(--mid)' }}>
                {trade.name}
              </span>
              <span
                className="text-xs font-medium"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--charcoal)' }}
              >
                {formatCurrency(trade.total)}
              </span>
            </div>
          ))}

          {/* Subtotal */}
          <div
            className="flex justify-between items-center py-1.5 mt-1"
            style={{ borderTop: '1px solid var(--charcoal)' }}
          >
            <span className="text-xs font-semibold" style={{ color: 'var(--charcoal)' }}>
              Subtotal
            </span>
            <span
              className="text-xs font-medium"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--charcoal)' }}
            >
              {formatCurrency(subtotal)}
            </span>
          </div>

          {/* Tax */}
          <div className="flex justify-between items-center py-1.5">
            <span className="text-xs" style={{ color: 'var(--mid)' }}>
              {taxLabel}
            </span>
            <span
              className="text-xs font-medium"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--charcoal)' }}
            >
              {formatCurrency(taxAmount)}
            </span>
          </div>
        </div>

        {/* Total bar */}
        <div
          className="flex justify-between items-center px-4 py-3"
          style={{
            borderTop: '2px solid var(--charcoal)',
            background: 'var(--bg)',
          }}
        >
          <span className="text-[13px] font-bold" style={{ color: 'var(--charcoal)' }}>
            Total
          </span>
          <span
            className="text-base font-medium"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--charcoal)' }}
          >
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {/* History Card */}
      {history && history.length > 0 && (
        <div
          className="mb-3 px-4 py-3.5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div
            className="text-[9px] font-medium uppercase tracking-[0.12em] mb-2"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
          >
            History
          </div>
          <div className="flex flex-col gap-1.5">
            {history.map((entry, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-[11px]" style={{ color: 'var(--mid)' }}>
                  {entry.label}
                </span>
                <span
                  className="text-[10px]"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
                >
                  {entry.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
