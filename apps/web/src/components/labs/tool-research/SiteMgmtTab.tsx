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
const GOLD = '#E9C46A';

interface SiteMgmtTabProps {
  items: ToolResearchItem[];
}

export function SiteMgmtTab({ items }: SiteMgmtTabProps) {
  const updateItem = useUpdateResearchItem();
  const purchaseMutation = useMarkAsPurchased();
  const advanceContent = useAdvanceContentStatus();
  const [purchaseItem, setPurchaseItem] = useState<ToolResearchItem | null>(null);

  const purchasedRowStyle = (row: ToolResearchItem) =>
    row.purchased ? { background: '#E8F5E9' } : undefined;

  return (
    <>
      <ToolResearchCard
        title="EXP-009: SITE MANAGEMENT"
        accent="Shop vac = most used site tool"
        color={GOLD}
      >
        <p style={{ fontSize: 12, color: '#666', margin: '0 0 12px' }}>
          Two tiers of dust management: budget wet/dry vac for rough work, Festool CT extractor for
          finish work paired with track saw and sanders. The Festool is an investment but it&apos;s
          tool-triggered, HEPA, and defines the standard for client-home interior work. Makita&apos;s
          cordless HEPA vac bridges the gap on the 18V platform.
        </p>
        <SortableTable
          columns={[
            { key: 'item', label: 'Item', minW: 200 },
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
            { key: 'retailer', label: 'Where', nowrap: true },
            {
              key: 'notes',
              label: 'Notes',
              small: true,
              maxW: 350,
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
          defaultSort={1}
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
