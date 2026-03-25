'use client';

/**
 * AcceptanceBlock — Signature area with deposit amount.
 * Matches quote-detail-v2.html artifact.
 */

function formatCurrency(value: number): string {
  return '$' + value.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface AcceptanceBlockProps {
  depositAmount: number;
  homeownerName?: string;
}

export function AcceptanceBlock({ depositAmount, homeownerName }: AcceptanceBlockProps) {
  return (
    <div
      className="px-4 py-4 mb-3"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: '3px solid var(--green)',
      }}
    >
      <div
        className="text-[9px] font-medium uppercase tracking-[0.12em] mb-2.5"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
      >
        Acceptance
      </div>
      <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--mid)' }}>
        By signing below, {homeownerName || 'the homeowner'} agrees to the scope, pricing,
        and terms outlined in this quote. A deposit of{' '}
        <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--charcoal)' }}>
          {formatCurrency(depositAmount)}
        </strong>{' '}
        is due upon acceptance to initiate scheduling.
      </p>
      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-1">
          <div className="h-8" style={{ borderBottom: '1px solid var(--charcoal)' }} />
          <span
            className="text-[9px] uppercase tracking-[0.08em]"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
          >
            Homeowner Signature
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <div className="h-8" style={{ borderBottom: '1px solid var(--charcoal)' }} />
          <span
            className="text-[9px] uppercase tracking-[0.08em]"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
          >
            Date
          </span>
        </div>
      </div>
    </div>
  );
}
