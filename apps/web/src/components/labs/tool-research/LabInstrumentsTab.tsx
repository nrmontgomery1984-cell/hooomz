'use client';

import { useState } from 'react';
import type { ToolResearchItem } from '@hooomz/shared-contracts';
import { useUpdateResearchItem, useMarkAsPurchased, useAdvanceContentStatus } from '@/lib/hooks/useLabsData';
import { SortableTable } from './SortableTable';
import { ToolResearchCard } from './ToolResearchCard';
import { InlineEditCell } from './InlineEditCell';
import { PurchaseModal } from './PurchaseModal';
import { ContentStatusBadge } from './ContentStatusBadge';

const NAVY = '#1B2A4A';
const TEAL = '#2A9D8F';
const GOLD = '#E9C46A';
const CORAL = '#E76F51';

function Badge({ text, color = TEAL }: { text: string; color?: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 12,
        background: color + '22',
        color,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {text}
    </span>
  );
}

interface LabInstrumentsTabProps {
  items: ToolResearchItem[];
}

export function LabInstrumentsTab({ items }: LabInstrumentsTabProps) {
  const updateItem = useUpdateResearchItem();
  const purchaseMutation = useMarkAsPurchased();
  const advanceContent = useAdvanceContentStatus();
  const [purchaseItem, setPurchaseItem] = useState<ToolResearchItem | null>(null);

  const purchasedRowStyle = (row: ToolResearchItem) =>
    row.purchased ? { background: '#E8F5E9' } : undefined;

  return (
    <>
      <ToolResearchCard
        title="EXP-008: LAB INSTRUMENTS"
        accent="Reference instruments already owned"
        color={NAVY}
      >
        <p style={{ fontSize: 12, color: '#666', margin: '0 0 12px' }}>
          Split purchase: in-store items at CT/HD and online for specialty instruments. Owned
          instruments (Wagner Orion 950, Mitutoyo caliper, BAFX 3370) are reference standards —
          document them first.
        </p>
        <SortableTable
          columns={[
            { key: 'item', label: 'Instrument', minW: 200 },
            {
              key: 'source',
              label: 'Source',
              nowrap: true,
              render: (v) => (
                <Badge
                  text={v as string}
                  color={
                    v === 'Owned' ? TEAL : v === 'In-Store' ? GOLD : CORAL
                  }
                />
              ),
            },
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
              label: 'Notes / Protocol',
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
