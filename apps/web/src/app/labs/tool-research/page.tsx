'use client';

/**
 * Labs Tool Research Page — 10-tab research dashboard
 * EXP-002 through EXP-009: Cordless platforms, saws, fastening, measuring, PPE, instruments, site mgmt
 */

import { useState } from 'react';
import Link from 'next/link';
import { useToolPlatforms, useToolResearchItems, useToolInventory } from '@/lib/hooks/useLabsData';
import {
  DashboardTab,
  InventoryTab,
  PlatformTab,
  CordedSawsTab,
  FasteningTab,
  MeasuringTab,
  PPETab,
  LabInstrumentsTab,
  SiteMgmtTab,
  ShoppingPlanTab,
  ExportButtons,
} from '@/components/labs/tool-research';

const NAVY = '#1B2A4A';
const TEAL = '#2A9D8F';
const GOLD = '#E9C46A';
const CORAL = '#E76F51';

type TabId =
  | 'dash'
  | 'inv'
  | '002'
  | '003'
  | '004'
  | '005'
  | '007'
  | '008'
  | '009'
  | 'shop';

const TABS: { id: TabId; label: string; color: string }[] = [
  { id: 'dash', label: 'Dashboard', color: NAVY },
  { id: 'inv', label: 'Tool Inventory', color: TEAL },
  { id: '002', label: 'Cordless Platform', color: TEAL },
  { id: '003', label: 'Saws & Track Saws', color: GOLD },
  { id: '004', label: 'Fastening', color: CORAL },
  { id: '005', label: 'Measuring', color: TEAL },
  { id: '007', label: 'PPE & Safety', color: CORAL },
  { id: '008', label: 'Lab Instruments', color: NAVY },
  { id: '009', label: 'Site Mgmt', color: GOLD },
  { id: 'shop', label: 'Shopping Plan', color: TEAL },
];

export default function ToolResearchPage() {
  const [tab, setTab] = useState<TabId>('dash');

  const { data: platforms = [], isLoading: platformsLoading } = useToolPlatforms();
  const { data: allItems = [], isLoading: itemsLoading } = useToolResearchItems();
  const { data: inventory = [], isLoading: inventoryLoading } = useToolInventory();

  const isLoading = platformsLoading || itemsLoading || inventoryLoading;

  // Filter research items by category for each tab
  const sawItems = allItems.filter(
    (i) => i.category === 'mitre_saw' || i.category === 'table_saw',
  );
  const fasteningItems = allItems.filter((i) => i.category === 'fastening');
  const measuringItems = allItems.filter((i) => i.category === 'measuring');
  const ppeItems = allItems.filter((i) => i.category === 'ppe');
  const instrumentItems = allItems.filter((i) => i.category === 'lab_instrument');
  const siteMgmtItems = allItems.filter((i) => i.category === 'site_mgmt');

  // Export data based on current tab
  const exportDataMap: Record<TabId, { data: readonly object[]; columns: { key: string; label: string }[]; filename: string }> = {
    dash: { data: allItems, columns: [{ key: 'item', label: 'Item' }, { key: 'category', label: 'Category' }, { key: 'price', label: 'Price' }, { key: 'retailer', label: 'Retailer' }, { key: 'notes', label: 'Notes' }], filename: 'tool-research-all' },
    inv: { data: inventory, columns: [{ key: 'item', label: 'Tool' }, { key: 'brand', label: 'Brand' }, { key: 'platform', label: 'Platform' }, { key: 'status', label: 'Status' }, { key: 'pricePaid', label: 'Price Paid' }], filename: 'tool-inventory' },
    '002': { data: platforms, columns: [{ key: 'platform', label: 'Platform' }, { key: 'brand', label: 'Brand' }, { key: 'score', label: 'Score' }], filename: 'cordless-platforms' },
    '003': { data: sawItems, columns: [{ key: 'item', label: 'Model' }, { key: 'type', label: 'Type' }, { key: 'retailer', label: 'Retailer' }, { key: 'price', label: 'Price' }, { key: 'notes', label: 'Notes' }], filename: 'saws' },
    '004': { data: fasteningItems, columns: [{ key: 'item', label: 'Model' }, { key: 'type', label: 'Type' }, { key: 'retailer', label: 'Retailer' }, { key: 'price', label: 'Price' }, { key: 'notes', label: 'Notes' }], filename: 'fastening' },
    '005': { data: measuringItems, columns: [{ key: 'item', label: 'Item' }, { key: 'priority', label: 'Priority' }, { key: 'price', label: 'Price' }, { key: 'retailer', label: 'Retailer' }, { key: 'notes', label: 'Notes' }], filename: 'measuring' },
    '007': { data: ppeItems, columns: [{ key: 'item', label: 'Item' }, { key: 'cat', label: 'Category' }, { key: 'priority', label: 'Priority' }, { key: 'price', label: 'Price' }, { key: 'retailer', label: 'Retailer' }], filename: 'ppe' },
    '008': { data: instrumentItems, columns: [{ key: 'item', label: 'Instrument' }, { key: 'source', label: 'Source' }, { key: 'priority', label: 'Priority' }, { key: 'price', label: 'Price' }, { key: 'retailer', label: 'Retailer' }], filename: 'lab-instruments' },
    '009': { data: siteMgmtItems, columns: [{ key: 'item', label: 'Item' }, { key: 'priority', label: 'Priority' }, { key: 'price', label: 'Price' }, { key: 'retailer', label: 'Retailer' }, { key: 'notes', label: 'Notes' }], filename: 'site-mgmt' },
    shop: { data: allItems, columns: [{ key: 'item', label: 'Item' }, { key: 'category', label: 'Category' }, { key: 'price', label: 'Price' }, { key: 'retailer', label: 'Retailer' }], filename: 'shopping-plan' },
  };

  const currentExport = exportDataMap[tab];

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <Link
              href="/labs"
              style={{
                color: '#0F766E',
                fontSize: 13,
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Labs
            </Link>
            <span style={{ color: '#9CA3AF', fontSize: 13 }}>/</span>
            <span style={{ color: '#111827', fontSize: 13, fontWeight: 600 }}>
              Tool Research
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#111827',
                  margin: '8px 0 4px',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                Tool Purchase Research
              </h1>
              <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
                EXP-002 through EXP-009 — Independent testing, evidence-based construction
              </p>
            </div>
            {!isLoading && (
              <ExportButtons
                data={currentExport.data}
                columns={currentExport.columns}
                filename={currentExport.filename}
              />
            )}
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div
        style={{
          background: 'white',
          borderBottom: '2px solid #EEE',
          padding: '0 12px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '10px 14px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: tab === t.id ? 700 : 500,
                color: tab === t.id ? t.color : '#888',
                borderBottom:
                  tab === t.id ? `3px solid ${t.color}` : '3px solid transparent',
                minHeight: 44,
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
        {isLoading ? (
          <div
            style={{
              textAlign: 'center',
              padding: 40,
              color: '#6B7280',
              fontSize: 14,
            }}
          >
            Loading tool research data...
          </div>
        ) : (
          <>
            {tab === 'dash' && <DashboardTab onNav={(id) => setTab(id as TabId)} researchItems={allItems} inventory={inventory} />}
            {tab === 'inv' && <InventoryTab inventory={inventory} />}
            {tab === '002' && <PlatformTab platforms={platforms} />}
            {tab === '003' && <CordedSawsTab items={sawItems} />}
            {tab === '004' && <FasteningTab items={fasteningItems} />}
            {tab === '005' && <MeasuringTab items={measuringItems} />}
            {tab === '007' && <PPETab items={ppeItems} />}
            {tab === '008' && <LabInstrumentsTab items={instrumentItems} />}
            {tab === '009' && <SiteMgmtTab items={siteMgmtItems} />}
            {tab === 'shop' && <ShoppingPlanTab />}
          </>
        )}
      </div>
    </div>
  );
}
