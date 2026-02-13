'use client';

import { useState } from 'react';
import type { ToolResearchItem } from '@hooomz/shared-contracts';
import { useUpdateResearchItem, useMarkAsPurchased, useAdvanceContentStatus } from '@/lib/hooks/useLabsData';
import { SortableTable } from './SortableTable';
import { ToolResearchCard } from './ToolResearchCard';
import { InlineEditCell } from './InlineEditCell';
import { PurchaseModal } from './PurchaseModal';
import { ContentStatusBadge } from './ContentStatusBadge';

const TEAL = '#2A9D8F';
const CORAL = '#E76F51';
const LIGHT_BG = '#F5F7FA';
const LIGHT_TEAL = '#E6F5F3';
const LIGHT_GOLD = '#FDF6E3';

interface FasteningTabProps {
  items: ToolResearchItem[];
}

export function FasteningTab({ items }: FasteningTabProps) {
  const updateItem = useUpdateResearchItem();
  const purchaseMutation = useMarkAsPurchased();
  const advanceContent = useAdvanceContentStatus();
  const [purchaseItem, setPurchaseItem] = useState<ToolResearchItem | null>(null);

  const purchasedRowStyle = (row: ToolResearchItem) =>
    row.purchased ? { background: '#E8F5E9' } : undefined;

  return (
    <>
      <ToolResearchCard
        title="EXP-004: CORDLESS vs PNEUMATIC"
        accent="Decide this first"
        color={CORAL}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ padding: 14, background: LIGHT_TEAL, borderRadius: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: TEAL, marginBottom: 8 }}>
              CORDLESS
            </div>
            {[
              'No hose, no compressor \u2192 professional appearance',
              'Quiet — client is home on interior jobs',
              'Heavier in hand (battery) — fatigue on overhead crown',
              'Platform-dependent — matches EXP-002 decision',
              'Total 2-nailer system: $460–750',
            ].map((t, i) => (
              <div key={i} style={{ fontSize: 12, padding: '3px 0', color: '#444' }}>
                {'\u2022'} {t}
              </div>
            ))}
          </div>
          <div style={{ padding: 14, background: LIGHT_GOLD, borderRadius: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#B8860B', marginBottom: 8 }}>
              PNEUMATIC
            </div>
            {[
              'Cheaper per tool — compressor shared across all nailers',
              'Consistent depth at set PSI — no battery fade',
              'Lighter tool in hand (no battery)',
              'Air hose = trip hazard. Compressor = loud in client home',
              'Total 2-nailer system: $360–550',
            ].map((t, i) => (
              <div key={i} style={{ fontSize: 12, padding: '3px 0', color: '#444' }}>
                {'\u2022'} {t}
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            marginTop: 12,
            padding: 10,
            background: LIGHT_BG,
            borderRadius: 6,
            fontSize: 12,
          }}
        >
          <strong>Recommendation for Makita platform:</strong> Makita 18V LXT 18ga brad nailer
          (~$275 bare) runs on your existing batteries — no additional platform cost. For interior
          residential work, cordless wins on noise and professionalism. If budget is tight, a
          pneumatic Hitachi/Metabo HPT 18ga + compressor is ~$280 total and dead reliable.
        </div>
      </ToolResearchCard>

      <ToolResearchCard title="NAILER OPTIONS" color={CORAL}>
        <SortableTable
          columns={[
            { key: 'item', label: 'Model', minW: 200 },
            { key: 'type', label: 'Type', nowrap: true },
            { key: 'retailer', label: 'Retailer' },
            {
              key: 'price',
              label: 'Price',
              render: (v, row) => (
                <InlineEditCell
                  value={v as string}
                  onSave={(val) => updateItem.mutate({ id: row.id, changes: { price: val } })}
                />
              ),
            },
            { key: 'priceNum', label: 'Sort $', render: () => null },
            {
              key: 'notes',
              label: 'Notes',
              small: true,
              maxW: 300,
              render: (v, row) => (
                <InlineEditCell
                  value={v as string}
                  onSave={(val) => updateItem.mutate({ id: row.id, changes: { notes: val } })}
                />
              ),
            },
            {
              key: 'contentStatus',
              label: 'Content',
              nowrap: true,
              render: (_: unknown, row: ToolResearchItem) => (
                <ContentStatusBadge
                  status={row.contentStatus}
                  onAdvance={() => advanceContent.mutate({ entityType: 'research', id: row.id })}
                />
              ),
            },
            {
              key: '_action',
              label: '',
              nowrap: true,
              render: (_: unknown, row: ToolResearchItem) =>
                row.purchased ? (
                  <span style={{ color: '#2E7D32', fontSize: 11, fontWeight: 600 }}>Purchased</span>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setPurchaseItem(row); }}
                    style={{
                      padding: '4px 10px',
                      border: `1px solid ${TEAL}`,
                      borderRadius: 6,
                      background: 'white',
                      color: TEAL,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      minHeight: 32,
                    }}
                  >
                    Buy
                  </button>
                ),
            },
          ]}
          data={items}
          rowStyle={purchasedRowStyle}
        />
      </ToolResearchCard>

      {purchaseItem && (
        <PurchaseModal
          isOpen
          onClose={() => setPurchaseItem(null)}
          item={purchaseItem}
          isPending={purchaseMutation.isPending}
          onConfirm={(date, price, retailer) =>
            purchaseMutation.mutate(
              { researchItemId: purchaseItem.id, date, price, retailer },
              { onSuccess: () => setPurchaseItem(null) },
            )
          }
        />
      )}
    </>
  );
}
