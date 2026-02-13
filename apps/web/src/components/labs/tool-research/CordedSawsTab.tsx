'use client';

import { useState } from 'react';
import type { ToolResearchItem } from '@hooomz/shared-contracts';
import { useUpdateResearchItem, useMarkAsPurchased, useAdvanceContentStatus } from '@/lib/hooks/useLabsData';
import { SortableTable } from './SortableTable';
import { ToolResearchCard } from './ToolResearchCard';
import { InlineEditCell } from './InlineEditCell';
import { PurchaseModal } from './PurchaseModal';
import { ContentStatusBadge } from './ContentStatusBadge';

const GOLD = '#E9C46A';
const TEAL = '#2A9D8F';

interface CordedSawsTabProps {
  items: ToolResearchItem[];
}

export function CordedSawsTab({ items }: CordedSawsTabProps) {
  const mitreSaws = items.filter((i) => i.category === 'mitre_saw');
  const tableSaws = items.filter((i) => i.category === 'table_saw');

  const updateItem = useUpdateResearchItem();
  const purchaseMutation = useMarkAsPurchased();
  const advanceContent = useAdvanceContentStatus();
  const [purchaseItem, setPurchaseItem] = useState<ToolResearchItem | null>(null);

  const contentColumn = {
    key: 'contentStatus',
    label: 'Content',
    nowrap: true as const,
    render: (_: unknown, row: ToolResearchItem) => (
      <ContentStatusBadge
        status={row.contentStatus}
        onAdvance={() => advanceContent.mutate({ entityType: 'research', id: row.id })}
      />
    ),
  };

  const purchasedRowStyle = (row: ToolResearchItem) =>
    row.purchased ? { background: '#E8F5E9' } : undefined;

  const actionColumn = {
    key: '_action',
    label: '',
    nowrap: true as const,
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
  };

  return (
    <>
      <ToolResearchCard
        title="EXP-003: MITRE SAW OPTIONS"
        accent="P0 — Buy before first job"
        color={GOLD}
      >
        <p style={{ fontSize: 12, color: '#666', margin: '0 0 12px' }}>
          Corded = no platform lock-in. Budget for a Diablo blade upgrade (~$30–40) on any budget
          saw — the blade matters more than the brand. Budget entry: King Canada or Mastercraft
          sliding. Mid-tier: Makita LS1040 (lightest, smooth direct drive). Aspirational: Makita
          LS1019L dual-bevel sliding or Festool Kapex.
        </p>
        <SortableTable
          columns={[
            { key: 'item', label: 'Model', minW: 200 },
            { key: 'retailer', label: 'Retailer', nowrap: true },
            { key: 'type', label: 'Type', nowrap: true },
            { key: 'specs', label: 'Key Specs', maxW: 250 },
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
            { key: 'priceNum', label: 'Sort $', render: () => null },
            {
              key: 'notes',
              label: 'Notes',
              small: true,
              maxW: 250,
              render: (v, row) => (
                <InlineEditCell
                  value={v as string}
                  onSave={(val) => updateItem.mutate({ id: row.id, changes: { notes: val } })}
                />
              ),
            },
            contentColumn,
            actionColumn,
          ]}
          data={mitreSaws}
          defaultSort={4}
          rowStyle={purchasedRowStyle}
        />
      </ToolResearchCard>

      <ToolResearchCard
        title="TABLE SAW & TRACK SAW OPTIONS"
        accent="P1 — Track saw may replace table saw for finish work"
        color={GOLD}
      >
        <p style={{ fontSize: 12, color: '#666', margin: '0 0 12px' }}>
          <strong>Track saw vs table saw:</strong> For sheet goods, long rips, and finish
          carpentry, a track saw with guide rail can replace a portable table saw entirely — with
          better dust extraction and zero-tearout cuts. The Festool TS 55 is the industry standard;
          the Makita SP6000J is the best value alternative. Consider which workflow you&apos;ll
          actually use more.
        </p>
        <SortableTable
          columns={[
            { key: 'item', label: 'Model', minW: 200 },
            { key: 'retailer', label: 'Retailer', nowrap: true },
            { key: 'specs', label: 'Key Specs', maxW: 300 },
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
            contentColumn,
            actionColumn,
          ]}
          data={tableSaws}
          defaultSort={3}
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
