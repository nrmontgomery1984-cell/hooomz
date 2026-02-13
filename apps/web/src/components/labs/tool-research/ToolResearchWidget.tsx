'use client';

import Link from 'next/link';
import { useToolResearchItems, useToolInventory } from '@/lib/hooks/useLabsData';

const TEAL = '#2A9D8F';
const NAVY = '#1B2A4A';
const CORAL = '#E76F51';

export function ToolResearchWidget() {
  const { data: items = [] } = useToolResearchItems();
  const { data: inventory = [] } = useToolInventory();

  const total = items.length;
  const purchased = items.filter((i) => i.purchased).length;
  const spent = inventory
    .filter((i) => i.pricePaid != null)
    .reduce((s, i) => s + (i.pricePaid ?? 0), 0);
  const ridgidPending = inventory.filter(
    (i) => i.platform === 'RIDGID 18V' && !i.ridgidRegistered,
  ).length;

  if (total === 0) return null;

  return (
    <Link
      href="/labs/tool-research"
      style={{
        display: 'block',
        padding: '16px 20px',
        background: 'white',
        borderRadius: 12,
        border: '1px solid #E5E7EB',
        textDecoration: 'none',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = TEAL;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: NAVY }}>Tool Research</div>
        <div style={{ fontSize: 12, color: TEAL, fontWeight: 600 }}>
          {purchased} of {total} purchased
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background: '#E5E7EB', borderRadius: 4, height: 6, overflow: 'hidden', marginBottom: 8 }}>
        <div
          style={{
            width: `${total > 0 ? (purchased / total) * 100 : 0}%`,
            height: '100%',
            background: TEAL,
            borderRadius: 4,
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
        <span style={{ color: '#6B7280' }}>
          ${spent.toLocaleString()} spent
        </span>
        <span style={{ color: '#6B7280' }}>
          {inventory.length} in inventory
        </span>
        {ridgidPending > 0 && (
          <span style={{ color: CORAL, fontWeight: 600 }}>
            {ridgidPending} RIDGID registration{ridgidPending > 1 ? 's' : ''} pending
          </span>
        )}
      </div>
    </Link>
  );
}
