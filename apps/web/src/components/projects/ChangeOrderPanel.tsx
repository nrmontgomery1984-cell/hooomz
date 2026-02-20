'use client';

// ============================================================================
// Change Order Panel — CO list with status + cost/schedule impact
// ============================================================================

import type { ChangeOrder } from '@hooomz/shared-contracts';
import { PanelSection } from '@/components/ui/PanelSection';

const CO_STATUS_COLORS: Record<string, string> = {
  approved:         'var(--green)',
  pending_approval: 'var(--amber)',
  declined:         'var(--red)',
  draft:            'var(--text-3)',
  cancelled:        'var(--text-3)',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function statusLabel(status: string): string {
  switch (status) {
    case 'pending_approval': return 'Pending';
    case 'approved': return 'Approved';
    case 'declined': return 'Declined';
    case 'draft': return 'Draft';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
}

interface ChangeOrderPanelProps {
  changeOrders: ChangeOrder[];
  budgetImpact: {
    approved: number;
    pending: number;
    declined: number;
    total: number;
  } | null;
}

export function ChangeOrderPanel({ changeOrders, budgetImpact }: ChangeOrderPanelProps) {
  if (changeOrders.length === 0) return null;

  const pendingCount = changeOrders.filter((co) => co.status === 'pending_approval').length;

  return (
    <PanelSection
      label="Change Orders"
      count={changeOrders.length}
      countColor={pendingCount > 0 ? 'var(--amber)' : 'var(--text-3)'}
    >
      {changeOrders.map((co) => {
        const color = CO_STATUS_COLORS[co.status] || 'var(--text-3)';
        return (
          <div
            key={co.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '5px 12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-2)', flexShrink: 0 }}>
                {co.coNumber}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {co.title}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
                {statusLabel(co.status)}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--text)' }}>
                +{formatCurrency(co.costImpact)}
              </span>
            </div>
          </div>
        );
      })}

      {/* Impact summary */}
      {budgetImpact && (budgetImpact.approved > 0 || budgetImpact.pending > 0) && (
        <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0 0', padding: '6px 12px 2px' }}>
          <span style={{ fontSize: 11, color: 'var(--text-2)' }}>
            Impact:{' '}
            {budgetImpact.approved > 0 && (
              <span style={{ fontWeight: 600, color: 'var(--green)' }}>
                {formatCurrency(budgetImpact.approved)} approved
              </span>
            )}
            {budgetImpact.approved > 0 && budgetImpact.pending > 0 && ' · '}
            {budgetImpact.pending > 0 && (
              <span style={{ fontWeight: 600, color: 'var(--amber)' }}>
                {formatCurrency(budgetImpact.pending)} pending
              </span>
            )}
          </span>
        </div>
      )}
    </PanelSection>
  );
}
