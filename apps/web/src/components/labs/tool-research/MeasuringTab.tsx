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
const LIGHT_TEAL = '#E6F5F3';

interface MeasuringTabProps {
  items: ToolResearchItem[];
}

export function MeasuringTab({ items }: MeasuringTabProps) {
  const updateItem = useUpdateResearchItem();
  const purchaseMutation = useMarkAsPurchased();
  const advanceContent = useAdvanceContentStatus();
  const [purchaseItem, setPurchaseItem] = useState<ToolResearchItem | null>(null);

  const purchasedRowStyle = (row: ToolResearchItem) =>
    row.purchased ? { background: '#E8F5E9' } : undefined;

  return (
    <>
      <ToolResearchCard
        title="EXP-005: MEASURING & LAYOUT"
        accent="Laser level accuracy test = signature Labs content"
        color={TEAL}
      >
        <SortableTable
          columns={[
            { key: 'item', label: 'Item', minW: 200 },
            { key: 'cat', label: 'Category', nowrap: true },
            { key: 'priority', label: 'Priority', nowrap: true },
            {
              key: 'price',
              label: 'Price',
              nowrap: true,
              render: (v, row) => (
                <InlineEditCell
                  value={v as string}
                  onSave={(val) => updateItem.mutate({ id: row.id, changes: { price: val } })}
                />
              ),
            },
            { key: 'retailer', label: 'Retailer', nowrap: true },
            {
              key: 'notes',
              label: 'Notes / Labs Value',
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
          defaultSort={2}
          rowStyle={purchasedRowStyle}
        />
        <div
          style={{
            marginTop: 12,
            padding: 10,
            background: LIGHT_TEAL,
            borderRadius: 6,
            fontSize: 12,
          }}
        >
          <strong>Already Owned (Reference Tools):</strong> Swanson Speed Square (~$12), Stanley
          FatMax Tapes, Mitutoyo Caliper. These don&apos;t need purchasing but DO need documenting —
          photograph, serial numbers, baseline accuracy checks.
        </div>
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
