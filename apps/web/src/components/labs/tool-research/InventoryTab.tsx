'use client';

import { useState, useMemo } from 'react';
import type { ToolInventoryItem } from '@hooomz/shared-contracts';
import {
  useRetireInventoryItem,
  useRegisterRidgid,
  useLogToolUse,
  useAdvanceContentStatus,
} from '@/lib/hooks/useLabsData';
import { SortableTable } from './SortableTable';
import { ToolResearchCard } from './ToolResearchCard';
import { RetireModal } from './RetireModal';
import { RidgidRegistrationModal } from './RidgidRegistrationModal';
import { ContentStatusBadge } from './ContentStatusBadge';
import { MaintenanceLog } from './MaintenanceLog';
import { ToolDetailSheet } from './ToolDetailSheet';

const NAVY = '#1B2A4A';
const TEAL = '#2A9D8F';
const CORAL = '#E76F51';
const LIGHT_BG = '#F5F7FA';
const LIGHT_TEAL = '#E6F5F3';
const LIGHT_CORAL = '#FDEEEA';

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  Owned: { bg: '#E8F5E9', color: '#2E7D32' },
  Purchasing: { bg: '#E3F2FD', color: '#1565C0' },
  Wishlist: { bg: '#FFF8E1', color: '#F57F17' },
  Retired: { bg: '#FFEBEE', color: '#C62828' },
};

function ridgidBadge(item: ToolInventoryItem) {
  if (item.platform !== 'RIDGID 18V') return null;
  if (item.ridgidRegistered) {
    return (
      <span style={{ padding: '2px 6px', borderRadius: 10, background: '#E8F5E9', color: '#2E7D32', fontSize: 10, fontWeight: 600 }}>
        LSA Registered
      </span>
    );
  }
  if (!item.purchasedDate) {
    return (
      <span style={{ padding: '2px 6px', borderRadius: 10, background: '#FFF3E0', color: '#E65100', fontSize: 10, fontWeight: 600 }}>
        Register
      </span>
    );
  }
  const daysSince = Math.floor((Date.now() - new Date(item.purchasedDate).getTime()) / 86400000);
  if (daysSince > 90) {
    return (
      <span style={{ padding: '2px 6px', borderRadius: 10, background: '#FFEBEE', color: '#C62828', fontSize: 10, fontWeight: 700 }}>
        OVERDUE
      </span>
    );
  }
  if (daysSince >= 60) {
    return (
      <span style={{ padding: '2px 6px', borderRadius: 10, background: '#FFEBEE', color: '#C62828', fontSize: 10, fontWeight: 600 }}>
        Register — {90 - daysSince}d!
      </span>
    );
  }
  return (
    <span style={{ padding: '2px 6px', borderRadius: 10, background: '#FFF3E0', color: '#E65100', fontSize: 10, fontWeight: 600 }}>
      Register
    </span>
  );
}

interface InventoryTabProps {
  inventory: ToolInventoryItem[];
}

export function InventoryTab({ inventory }: InventoryTabProps) {
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPlatform, setFilterPlatform] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [retireItem, setRetireItem] = useState<ToolInventoryItem | null>(null);
  const [registerItem, setRegisterItem] = useState<ToolInventoryItem | null>(null);
  const [maintenanceItem, setMaintenanceItem] = useState<ToolInventoryItem | null>(null);
  const [detailItem, setDetailItem] = useState<ToolInventoryItem | null>(null);

  const retireMutation = useRetireInventoryItem();
  const registerMutation = useRegisterRidgid();
  const logUseMutation = useLogToolUse();
  const advanceContent = useAdvanceContentStatus();

  const statuses = ['All', ...new Set(inventory.map((i) => i.status))];
  const platforms = ['All', ...new Set(inventory.map((i) => i.platform))];
  const categories = ['All', ...new Set(inventory.map((i) => i.category))];

  const filtered = useMemo(() => {
    return inventory.filter((i) => {
      if (filterStatus !== 'All' && i.status !== filterStatus) return false;
      if (filterPlatform !== 'All' && i.platform !== filterPlatform) return false;
      if (filterCategory !== 'All' && i.category !== filterCategory) return false;
      return true;
    });
  }, [inventory, filterStatus, filterPlatform, filterCategory]);

  const owned = inventory.filter((i) => i.status === 'Owned').length;
  const purchasing = inventory.filter((i) => i.status === 'Purchasing').length;
  const totalTools = inventory.length;
  const ridgidItems = inventory.filter((i) => i.platform === 'RIDGID 18V');
  const ridgidCount = ridgidItems.length;
  const unregisteredRidgid = ridgidItems.filter((i) => !i.ridgidRegistered).length;
  const knownCost = inventory
    .filter((i) => i.pricePaid != null)
    .reduce((s, i) => s + (i.pricePaid ?? 0), 0);

  const FilterBtn = ({
    label,
    value,
    current,
    onChange,
  }: {
    label: string;
    value: string;
    current: string;
    onChange: (v: string) => void;
  }) => (
    <button
      onClick={() => onChange(value)}
      style={{
        padding: '4px 10px',
        borderRadius: 12,
        border: '1px solid',
        borderColor: current === value ? TEAL : '#DDD',
        background: current === value ? TEAL + '18' : 'white',
        color: current === value ? TEAL : '#666',
        fontSize: 11,
        fontWeight: current === value ? 700 : 400,
        cursor: 'pointer',
        minHeight: 44,
      }}
    >
      {label}
    </button>
  );

  return (
    <>
      {/* RIDGID Registration Warning */}
      {unregisteredRidgid > 0 && (
        <div
          style={{
            padding: '12px 16px',
            background: LIGHT_CORAL,
            borderRadius: 8,
            borderLeft: `3px solid ${CORAL}`,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 20 }}>&#9888;</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: CORAL }}>
              {unregisteredRidgid} RIDGID tool{unregisteredRidgid > 1 ? 's' : ''} not registered
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>
              Register within 90 days of purchase at ridgid.com for Lifetime Service Agreement
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
          marginBottom: 16,
        }}
      >
        {[
          { label: 'Total Items', value: String(totalTools), colorVal: NAVY, bg: LIGHT_BG },
          { label: 'Owned', value: String(owned), colorVal: '#2E7D32', bg: '#E8F5E9' },
          { label: 'Purchasing', value: String(purchasing), colorVal: '#1565C0', bg: '#E3F2FD' },
          {
            label: 'RIDGID 18V Platform',
            value: `${ridgidCount} items`,
            colorVal: CORAL,
            bg: LIGHT_CORAL,
          },
          {
            label: 'Known Cost',
            value: `$${knownCost}`,
            colorVal: TEAL,
            bg: LIGHT_TEAL,
          },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              padding: '12px 14px',
              background: s.bg,
              borderRadius: 8,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: s.colorVal,
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              {s.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: NAVY, marginTop: 2 }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Main table with filters */}
      <ToolResearchCard
        title="TOOL INVENTORY"
        accent={`${filtered.length} of ${totalTools} items`}
        color={TEAL}
      >
        <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#888' }}>Status:</span>
            {statuses.map((s) => (
              <FilterBtn
                key={s}
                label={s}
                value={s}
                current={filterStatus}
                onChange={setFilterStatus}
              />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#888' }}>Platform:</span>
            {platforms.map((p) => (
              <FilterBtn
                key={p}
                label={p}
                value={p}
                current={filterPlatform}
                onChange={setFilterPlatform}
              />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#888' }}>Category:</span>
            {categories.map((c) => (
              <FilterBtn
                key={c}
                label={c}
                value={c}
                current={filterCategory}
                onChange={setFilterCategory}
              />
            ))}
          </div>
        </div>

        <SortableTable
          columns={[
            { key: 'item', label: 'Item', minW: 200 },
            { key: 'brand', label: 'Brand', nowrap: true },
            { key: 'platform', label: 'Platform', nowrap: true },
            {
              key: 'status',
              label: 'Status',
              nowrap: true,
              render: (v) => {
                const s = STATUS_STYLES[v as string] || { bg: '#EEE', color: '#666' };
                return (
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 10,
                      background: s.bg,
                      color: s.color,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {v as string}
                  </span>
                );
              },
            },
            {
              key: 'pricePaid',
              label: 'Price',
              nowrap: true,
              render: (v) =>
                v === null || v === undefined
                  ? '\u2014'
                  : v === 0
                    ? 'FREE'
                    : `$${v}`,
            },
            {
              key: 'usageCount',
              label: 'Uses',
              nowrap: true,
              render: (v) => (v ? String(v) : '\u2014'),
            },
            {
              key: '_costPerUse',
              label: '$/Use',
              nowrap: true,
              render: (_: unknown, row: ToolInventoryItem) => {
                if (!row.usageCount || !row.pricePaid) return '\u2014';
                return `$${(row.pricePaid / row.usageCount).toFixed(2)}`;
              },
            },
            {
              key: '_ridgid',
              label: 'LSA',
              nowrap: true,
              render: (_: unknown, row: ToolInventoryItem) => ridgidBadge(row),
            },
            {
              key: 'contentStatus',
              label: 'Content',
              nowrap: true,
              render: (_: unknown, row: ToolInventoryItem) => (
                <ContentStatusBadge
                  status={row.contentStatus}
                  onAdvance={() => advanceContent.mutate({ entityType: 'inventory', id: row.id })}
                />
              ),
            },
            { key: 'source', label: 'Source', nowrap: true },
            { key: 'notes', label: 'Notes', small: true, maxW: 200 },
            {
              key: '_actions',
              label: 'Actions',
              nowrap: true,
              render: (_: unknown, row: ToolInventoryItem) => (
                <div style={{ display: 'flex', gap: 4 }}>
                  {row.status === 'Owned' && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); logUseMutation.mutate(row.id); }}
                        style={{
                          padding: '3px 8px',
                          border: `1px solid ${TEAL}`,
                          borderRadius: 4,
                          background: 'white',
                          color: TEAL,
                          fontSize: 10,
                          fontWeight: 600,
                          cursor: 'pointer',
                          minHeight: 28,
                        }}
                      >
                        Log Use
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setRetireItem(row); }}
                        style={{
                          padding: '3px 8px',
                          border: `1px solid ${CORAL}`,
                          borderRadius: 4,
                          background: 'white',
                          color: CORAL,
                          fontSize: 10,
                          fontWeight: 600,
                          cursor: 'pointer',
                          minHeight: 28,
                        }}
                      >
                        Retire
                      </button>
                    </>
                  )}
                  {row.status === 'Owned' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setMaintenanceItem(row); }}
                      style={{
                        padding: '3px 8px',
                        border: '1px solid #6B7280',
                        borderRadius: 4,
                        background: 'white',
                        color: '#6B7280',
                        fontSize: 10,
                        fontWeight: 600,
                        cursor: 'pointer',
                        minHeight: 28,
                        position: 'relative',
                      }}
                    >
                      Maint.
                      {(row.maintenanceLog?.length ?? 0) > 0 && (
                        <span style={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          background: TEAL,
                          color: 'white',
                          fontSize: 8,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {row.maintenanceLog!.length}
                        </span>
                      )}
                    </button>
                  )}
                  {row.platform === 'RIDGID 18V' && !row.ridgidRegistered && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setRegisterItem(row); }}
                      style={{
                        padding: '3px 8px',
                        border: '1px solid #E65100',
                        borderRadius: 4,
                        background: 'white',
                        color: '#E65100',
                        fontSize: 10,
                        fontWeight: 600,
                        cursor: 'pointer',
                        minHeight: 28,
                      }}
                    >
                      Register
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          data={filtered}
          defaultSort={0}
          onRowClick={(row) => setDetailItem(row)}
        />
      </ToolResearchCard>

      {/* RIDGID Kit Breakdown — only show when RIDGID items exist */}
      {ridgidCount > 0 && (
        <ToolResearchCard
          title="RIDGID 18V PURCHASE BREAKDOWN"
          accent={`${ridgidCount} item${ridgidCount > 1 ? 's' : ''} in inventory`}
          color={CORAL}
        >
          <div style={{ display: 'grid', gap: 8 }}>
            {ridgidItems.map((item, i) => (
              <div
                key={item.id}
                onClick={() => setDetailItem(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setDetailItem(item)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto',
                  gap: 12,
                  padding: '10px 14px',
                  background: i % 2 === 0 ? LIGHT_BG : 'white',
                  borderRadius: 6,
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#EDF2F7'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? LIGHT_BG : 'white'; }}
              >
                <div>
                  <span style={{ fontWeight: 600, fontSize: 13, color: NAVY }}>{item.item}</span>
                  {item.notes && (
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{item.notes}</div>
                  )}
                </div>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: (STATUS_STYLES[item.status] || { bg: '#EEE' }).bg,
                    color: (STATUS_STYLES[item.status] || { color: '#666' }).color,
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {item.status}
                </span>
                <span style={{ fontWeight: 600, fontSize: 13, color: NAVY }}>
                  {item.pricePaid != null ? (item.pricePaid === 0 ? 'FREE' : `$${item.pricePaid}`) : '\u2014'}
                </span>
              </div>
            ))}
          </div>
          {unregisteredRidgid > 0 && (
            <div
              style={{
                marginTop: 12,
                padding: 10,
                background: LIGHT_CORAL,
                borderRadius: 6,
                fontSize: 12,
                color: CORAL,
                fontWeight: 600,
              }}
            >
              REGISTER ALL TOOLS within 90 days of purchase at ridgid.com for Lifetime Service
              Agreement: FREE parts, FREE service, FOR LIFE.
            </div>
          )}
        </ToolResearchCard>
      )}

      {/* Platform Summary — only show when inventory has items */}
      {inventory.length > 0 && (
        <ToolResearchCard title="PLATFORM STATUS" color={NAVY}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
            {Object.entries(
              inventory.reduce<Record<string, number>>((acc, item) => {
                const p = item.platform || 'Other';
                acc[p] = (acc[p] || 0) + 1;
                return acc;
              }, {}),
            ).map(([platform, count]) => (
              <div key={platform} style={{ padding: 14, background: LIGHT_BG, borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: TEAL, textTransform: 'uppercase' }}>
                  {platform}
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: NAVY, margin: '4px 0' }}>
                  {count} item{count > 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        </ToolResearchCard>
      )}

      {/* Modals */}
      {retireItem && (
        <RetireModal
          isOpen
          onClose={() => setRetireItem(null)}
          item={retireItem}
          ownedItems={inventory}
          isPending={retireMutation.isPending}
          onConfirm={(reason, replacedById) =>
            retireMutation.mutate(
              { id: retireItem.id, reason, replacedById },
              { onSuccess: () => setRetireItem(null) },
            )
          }
        />
      )}
      {registerItem && (
        <RidgidRegistrationModal
          isOpen
          onClose={() => setRegisterItem(null)}
          item={registerItem}
          isPending={registerMutation.isPending}
          onConfirm={(registrationDate) =>
            registerMutation.mutate(
              { id: registerItem.id, registrationDate },
              { onSuccess: () => setRegisterItem(null) },
            )
          }
        />
      )}
      {maintenanceItem && (
        <MaintenanceLog
          isOpen
          onClose={() => setMaintenanceItem(null)}
          item={maintenanceItem}
        />
      )}
      {detailItem && (
        <ToolDetailSheet
          isOpen
          onClose={() => setDetailItem(null)}
          item={detailItem}
          ownedItems={inventory}
        />
      )}
    </>
  );
}
