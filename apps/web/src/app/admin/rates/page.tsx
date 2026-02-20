'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, RotateCcw, Plus, Trash2, Save, Check, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCostCatalog, useSaveCostCatalog, useResetCostCatalog } from '@/lib/hooks/useCostCatalog';
import { DEFAULT_COST_CATALOG, computeAssemblyTotals, RATE_ASSEMBLY_MAP } from '@/lib/instantEstimate';
import type { CostCatalog, CatalogUnit, Assembly, AssemblyComponent } from '@/lib/types/costCatalog.types';
import { CATALOG_UNITS } from '@/lib/types/costCatalog.types';

// ============================================================================
// Types
// ============================================================================

type TabId = 'rates' | 'materials' | 'labour' | 'assemblies';

const TABS: { id: TabId; label: string }[] = [
  { id: 'rates', label: 'Installed Rates' },
  { id: 'materials', label: 'Materials' },
  { id: 'labour', label: 'Labour' },
  { id: 'assemblies', label: 'Assemblies' },
];

// Installed rate categories only (excludes materials/assemblies/labour)
type InstalledRateCategory = 'floorRates' | 'paintRates' | 'trimRates' | 'tileRates' | 'drywallRates' | 'doorTrimRates' | 'windowTrimRates' | 'hardwareRates' | 'tradeRanges';

interface CategoryConfig {
  key: InstalledRateCategory;
  title: string;
  unit: string;
  columns: ColumnDef[];
}

interface ColumnDef {
  field: string;
  label: string;
  type: 'number' | 'boolean' | 'text';
  step?: number;
  prefix?: string;
}

// ============================================================================
// Installed Rate Category Definitions
// ============================================================================

const INSTALLED_RATE_CATEGORIES: CategoryConfig[] = [
  {
    key: 'floorRates',
    title: 'Flooring',
    unit: 'per sqft, material + labor',
    columns: [
      { field: 'rate', label: 'Rate', type: 'number', step: 0.5, prefix: '$' },
      { field: 'label', label: 'Label', type: 'text' },
    ],
  },
  {
    key: 'paintRates',
    title: 'Paint',
    unit: 'per wall sqft + ceiling adder',
    columns: [
      { field: 'ratePerWallSqft', label: 'Wall Rate', type: 'number', step: 0.25, prefix: '$' },
      { field: 'ceilingAdder', label: 'Ceiling Add', type: 'number', step: 0.25, prefix: '$' },
      { field: 'label', label: 'Label', type: 'text' },
    ],
  },
  {
    key: 'trimRates',
    title: 'Trim',
    unit: 'per linear foot, supply + install',
    columns: [
      { field: 'ratePerLft', label: 'Rate/lft', type: 'number', step: 0.5, prefix: '$' },
      { field: 'label', label: 'Label', type: 'text' },
    ],
  },
  {
    key: 'tileRates',
    title: 'Tile',
    unit: 'per sqft, supply + install',
    columns: [
      { field: 'rate', label: 'Rate', type: 'number', step: 0.5, prefix: '$' },
      { field: 'label', label: 'Label', type: 'text' },
    ],
  },
  {
    key: 'drywallRates',
    title: 'Drywall',
    unit: 'per room or per sqft',
    columns: [
      { field: 'rate', label: 'Rate', type: 'number', step: 0.5, prefix: '$' },
      { field: 'perRoom', label: 'Per Room', type: 'boolean' },
      { field: 'label', label: 'Label', type: 'text' },
    ],
  },
  {
    key: 'doorTrimRates',
    title: 'Door Trim',
    unit: 'per door, supply + install',
    columns: [
      { field: 'rate', label: 'Rate', type: 'number', step: 5, prefix: '$' },
      { field: 'label', label: 'Label', type: 'text' },
    ],
  },
  {
    key: 'windowTrimRates',
    title: 'Window Trim',
    unit: 'per window, supply + install',
    columns: [
      { field: 'rate', label: 'Rate', type: 'number', step: 5, prefix: '$' },
      { field: 'label', label: 'Label', type: 'text' },
    ],
  },
  {
    key: 'hardwareRates',
    title: 'Hardware',
    unit: 'per door',
    columns: [
      { field: 'rate', label: 'Rate', type: 'number', step: 5, prefix: '$' },
      { field: 'label', label: 'Label', type: 'text' },
    ],
  },
  {
    key: 'tradeRanges',
    title: 'Room-Count Fallbacks',
    unit: 'per room, low/mid/high',
    columns: [
      { field: 'low', label: 'Low', type: 'number', step: 50, prefix: '$' },
      { field: 'mid', label: 'Mid', type: 'number', step: 50, prefix: '$' },
      { field: 'high', label: 'High', type: 'number', step: 50, prefix: '$' },
      { field: 'label', label: 'Label', type: 'text' },
    ],
  },
];

// ============================================================================
// Material / Labour category labels
// ============================================================================

const MATERIAL_CATEGORY_LABELS: Record<string, string> = {
  flooring: 'Flooring',
  paint: 'Paint',
  trim: 'Trim',
  tile: 'Tile',
  drywall: 'Drywall',
  doors: 'Doors',
  hardware: 'Hardware',
  general: 'General Supplies',
};

const LABOUR_CATEGORY_LABELS: Record<string, string> = {
  flooring: 'Flooring',
  paint: 'Paint',
  trim: 'Trim',
  tile: 'Tile',
  drywall: 'Drywall',
  carpentry: 'Carpentry',
  general: 'General',
};

const MATERIAL_CATEGORY_ORDER = ['flooring', 'paint', 'trim', 'tile', 'drywall', 'doors', 'hardware', 'general'];
const LABOUR_CATEGORY_ORDER = ['flooring', 'paint', 'trim', 'tile', 'drywall', 'carpentry', 'general'];

// ============================================================================
// Helpers — type-safe access to catalog categories as generic records
// ============================================================================

function getInstalledRateItems(catalog: CostCatalog, key: InstalledRateCategory): Record<string, Record<string, unknown>> {
  return { ...catalog[key] } as unknown as Record<string, Record<string, unknown>>;
}

function getDefaultInstalledRate(key: InstalledRateCategory): unknown {
  return structuredClone(DEFAULT_COST_CATALOG[key]);
}

// ============================================================================
// Page
// ============================================================================

export default function AdminRatesPage() {
  const router = useRouter();
  const { data: stored, isLoading } = useCostCatalog();
  const saveMutation = useSaveCostCatalog();
  const resetMutation = useResetCostCatalog();

  const [draft, setDraft] = useState<CostCatalog | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('rates');

  useEffect(() => {
    if (!isLoading && draft === null) {
      const base = stored ?? DEFAULT_COST_CATALOG;
      // Ensure new fields exist for older stored catalogs
      const merged: CostCatalog = {
        ...DEFAULT_COST_CATALOG,
        ...base,
        materials: base.materials ?? DEFAULT_COST_CATALOG.materials,
        assemblies: base.assemblies ?? DEFAULT_COST_CATALOG.assemblies,
        labour: base.labour ?? DEFAULT_COST_CATALOG.labour,
      };
      // Migrate old-format assemblies (inline costs → reference-based)
      const asmKeys = Object.keys(merged.assemblies);
      const hasOldFormat = asmKeys.some((k) => {
        const comps = merged.assemblies[k].components;
        return comps.length > 0 && !('type' in comps[0]);
      });
      if (hasOldFormat) {
        merged.assemblies = structuredClone(DEFAULT_COST_CATALOG.assemblies);
      }
      setDraft(structuredClone(merged));
    }
  }, [isLoading, stored, draft]);

  const hasChanges = useMemo(() => {
    if (!draft) return false;
    const baseline = stored ?? DEFAULT_COST_CATALOG;
    return JSON.stringify(draft) !== JSON.stringify(baseline);
  }, [draft, stored]);

  const handleSave = useCallback(async () => {
    if (!draft) return;
    await saveMutation.mutateAsync(draft);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  }, [draft, saveMutation]);

  const handleResetAll = useCallback(async () => {
    await resetMutation.mutateAsync();
    setDraft(structuredClone(DEFAULT_COST_CATALOG));
    setShowResetConfirm(false);
  }, [resetMutation]);

  // --- Installed rates mutations ---
  const handleResetCategory = useCallback((catKey: InstalledRateCategory) => {
    if (!draft) return;
    setDraft({ ...draft, [catKey]: getDefaultInstalledRate(catKey) });
  }, [draft]);

  const updateInstalledItem = useCallback((catKey: InstalledRateCategory, itemKey: string, field: string, value: unknown) => {
    if (!draft) return;
    const category = getInstalledRateItems(draft, catKey);
    category[itemKey] = { ...category[itemKey], [field]: value };
    setDraft({ ...draft, [catKey]: category });
  }, [draft]);

  // --- Material mutations ---
  const updateMaterialItem = useCallback((category: string, itemKey: string, field: string, value: unknown) => {
    if (!draft) return;
    const materials = structuredClone(draft.materials);
    if (!materials[category]) materials[category] = {};
    materials[category][itemKey] = { ...materials[category][itemKey], [field]: value };
    setDraft({ ...draft, materials });
  }, [draft]);

  const addMaterialItem = useCallback((category: string) => {
    if (!draft) return;
    const materials = structuredClone(draft.materials);
    if (!materials[category]) materials[category] = {};
    const newKey = `custom_${Date.now()}`;
    materials[category][newKey] = { name: 'New material', unit: 'each' as CatalogUnit, good: 0, better: 0, best: 0, supplier: '' };
    setDraft({ ...draft, materials });
  }, [draft]);

  const removeMaterialItem = useCallback((category: string, itemKey: string) => {
    if (!draft) return;
    const materials = structuredClone(draft.materials);
    if (materials[category]) {
      delete materials[category][itemKey];
    }
    setDraft({ ...draft, materials });
  }, [draft]);

  const renameMaterialItem = useCallback((category: string, oldKey: string, newKey: string) => {
    if (!draft || oldKey === newKey) return;
    const materials = structuredClone(draft.materials);
    if (!materials[category] || materials[category][newKey]) return;
    materials[category][newKey] = materials[category][oldKey];
    delete materials[category][oldKey];
    setDraft({ ...draft, materials });
  }, [draft]);

  const resetMaterialCategory = useCallback((category: string) => {
    if (!draft) return;
    const materials = structuredClone(draft.materials);
    materials[category] = structuredClone(DEFAULT_COST_CATALOG.materials[category] ?? {});
    setDraft({ ...draft, materials });
  }, [draft]);

  // --- Assembly mutations ---
  const addAssembly = useCallback(() => {
    if (!draft) return;
    const assemblies = structuredClone(draft.assemblies);
    const newKey = `assembly_${Date.now()}`;
    assemblies[newKey] = { name: 'New Assembly', category: 'general', unit: 'sqft' as CatalogUnit, components: [] };
    setDraft({ ...draft, assemblies });
  }, [draft]);

  const removeAssembly = useCallback((key: string) => {
    if (!draft) return;
    const assemblies = structuredClone(draft.assemblies);
    delete assemblies[key];
    setDraft({ ...draft, assemblies });
  }, [draft]);

  const updateAssemblyField = useCallback((key: string, field: string, value: unknown) => {
    if (!draft) return;
    const assemblies = structuredClone(draft.assemblies);
    if (assemblies[key]) {
      (assemblies[key] as unknown as Record<string, unknown>)[field] = value;
    }
    setDraft({ ...draft, assemblies });
  }, [draft]);

  const addAssemblyComponent = useCallback((assemblyKey: string) => {
    if (!draft) return;
    const assemblies = structuredClone(draft.assemblies);
    if (assemblies[assemblyKey]) {
      const firstMatCat = Object.keys(draft.materials)[0] ?? 'flooring';
      const firstMatKey = Object.keys(draft.materials[firstMatCat] ?? {})[0] ?? '';
      assemblies[assemblyKey].components.push({
        type: 'material',
        sourceCategory: firstMatCat,
        sourceKey: firstMatKey,
        coverageRate: 1,
      });
    }
    setDraft({ ...draft, assemblies });
  }, [draft]);

  const updateAssemblyComponent = useCallback((assemblyKey: string, idx: number, updates: Record<string, unknown>) => {
    if (!draft) return;
    const assemblies = structuredClone(draft.assemblies);
    if (assemblies[assemblyKey]?.components[idx]) {
      Object.assign(assemblies[assemblyKey].components[idx], updates);
    }
    setDraft({ ...draft, assemblies });
  }, [draft]);

  const removeAssemblyComponent = useCallback((assemblyKey: string, idx: number) => {
    if (!draft) return;
    const assemblies = structuredClone(draft.assemblies);
    if (assemblies[assemblyKey]) {
      assemblies[assemblyKey].components.splice(idx, 1);
    }
    setDraft({ ...draft, assemblies });
  }, [draft]);

  const resetAssemblies = useCallback(() => {
    if (!draft) return;
    setDraft({ ...draft, assemblies: structuredClone(DEFAULT_COST_CATALOG.assemblies) });
  }, [draft]);

  // --- Labour mutations ---
  const updateLabourItem = useCallback((category: string, itemKey: string, field: string, value: unknown) => {
    if (!draft) return;
    const labour = structuredClone(draft.labour);
    if (!labour[category]) labour[category] = {};
    labour[category][itemKey] = { ...labour[category][itemKey], [field]: value };
    setDraft({ ...draft, labour });
  }, [draft]);

  const addLabourItem = useCallback((category: string) => {
    if (!draft) return;
    const labour = structuredClone(draft.labour);
    if (!labour[category]) labour[category] = {};
    const newKey = `custom_${Date.now()}`;
    labour[category][newKey] = { name: 'New task', unit: 'hour' as CatalogUnit, rate: 0 };
    setDraft({ ...draft, labour });
  }, [draft]);

  const removeLabourItem = useCallback((category: string, itemKey: string) => {
    if (!draft) return;
    const labour = structuredClone(draft.labour);
    if (labour[category]) {
      delete labour[category][itemKey];
    }
    setDraft({ ...draft, labour });
  }, [draft]);

  const renameLabourItem = useCallback((category: string, oldKey: string, newKey: string) => {
    if (!draft || oldKey === newKey) return;
    const labour = structuredClone(draft.labour);
    if (!labour[category] || labour[category][newKey]) return;
    labour[category][newKey] = labour[category][oldKey];
    delete labour[category][oldKey];
    setDraft({ ...draft, labour });
  }, [draft]);

  const resetLabourCategory = useCallback((category: string) => {
    if (!draft) return;
    const labour = structuredClone(draft.labour);
    labour[category] = structuredClone(DEFAULT_COST_CATALOG.labour[category] ?? {});
    setDraft({ ...draft, labour });
  }, [draft]);

  if (isLoading || !draft) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm" style={{ color: '#6B7280' }}>Loading rates...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F9FAFB' }}>
      {/* Header */}
      <div className="sticky top-0 z-10" style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg" style={{ color: '#6B7280' }}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold" style={{ color: '#111827' }}>Cost Catalogue</h1>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>
              {hasChanges ? 'Unsaved changes' : justSaved ? 'Saved' : 'Edit rates, materials & labour'}
            </p>
          </div>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="min-h-[44px] px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium"
            style={{ color: '#EF4444', border: '1px solid #FCA5A5' }}
          >
            <RotateCcw size={14} />
            Reset All
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex px-4 gap-1" style={{ borderTop: '1px solid #F3F4F6' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2.5 text-sm font-medium text-center transition-colors"
              style={{
                color: activeTab === tab.id ? '#0F766E' : '#6B7280',
                borderBottom: activeTab === tab.id ? '2px solid #0F766E' : '2px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'rates' && (
        <InstalledRatesTab
          draft={draft}
          setDraft={setDraft}
          onUpdateItem={updateInstalledItem}
          onResetCategory={handleResetCategory}
          onSwitchTab={setActiveTab}
        />
      )}
      {activeTab === 'materials' && (
        <MaterialsTab
          draft={draft}
          onUpdateItem={updateMaterialItem}
          onAddItem={addMaterialItem}
          onRemoveItem={removeMaterialItem}
          onRenameItem={renameMaterialItem}
          onResetCategory={resetMaterialCategory}
        />
      )}
      {activeTab === 'labour' && (
        <LabourTab
          draft={draft}
          onUpdateItem={updateLabourItem}
          onAddItem={addLabourItem}
          onRemoveItem={removeLabourItem}
          onRenameItem={renameLabourItem}
          onResetCategory={resetLabourCategory}
        />
      )}
      {activeTab === 'assemblies' && (
        <AssembliesTab
          draft={draft}
          onAddAssembly={addAssembly}
          onRemoveAssembly={removeAssembly}
          onUpdateField={updateAssemblyField}
          onAddComponent={addAssemblyComponent}
          onUpdateComponent={updateAssemblyComponent}
          onRemoveComponent={removeAssemblyComponent}
          onReset={resetAssemblies}
        />
      )}

      {/* Sticky Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 px-4 py-3 md:pl-[256px]" style={{ background: '#FFFFFF', borderTop: '1px solid #E5E7EB' }}>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saveMutation.isPending}
          className="w-full min-h-[52px] rounded-xl text-base font-semibold text-white flex items-center justify-center gap-2 transition-opacity"
          style={{
            background: hasChanges ? '#0F766E' : '#9CA3AF',
            opacity: saveMutation.isPending ? 0.7 : 1,
          }}
        >
          {justSaved ? (
            <><Check size={20} /> Saved</>
          ) : saveMutation.isPending ? (
            'Saving...'
          ) : (
            <><Save size={20} /> Save All Changes</>
          )}
        </button>
      </div>

      {/* Reset Confirm Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: '#FFFFFF' }}>
            <h3 className="text-lg font-bold mb-2" style={{ color: '#111827' }}>Reset All Rates?</h3>
            <p className="text-sm mb-5" style={{ color: '#6B7280' }}>
              This will revert all rates, materials, assemblies & labour to the original defaults. Any custom items will be removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 min-h-[44px] rounded-xl text-sm font-medium"
                style={{ color: '#374151', border: '1px solid #E5E7EB' }}
              >
                Cancel
              </button>
              <button
                onClick={handleResetAll}
                disabled={resetMutation.isPending}
                className="flex-1 min-h-[44px] rounded-xl text-sm font-semibold text-white"
                style={{ background: '#EF4444' }}
              >
                {resetMutation.isPending ? 'Resetting...' : 'Reset All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Tab 1: Installed Rates
// ============================================================================

function InstalledRatesTab({
  draft,
  setDraft,
  onUpdateItem,
  onResetCategory,
  onSwitchTab,
}: {
  draft: CostCatalog;
  setDraft: (d: CostCatalog) => void;
  onUpdateItem: (catKey: InstalledRateCategory, itemKey: string, field: string, value: unknown) => void;
  onResetCategory: (catKey: InstalledRateCategory) => void;
  onSwitchTab: (tab: TabId) => void;
}) {
  // Assembly-driven rate categories (read-only, computed from assemblies)
  const assemblyCategories: { key: string; title: string; unit: string; mapKey: keyof typeof RATE_ASSEMBLY_MAP }[] = [
    { key: 'floorRates', title: 'Flooring', unit: 'per sqft', mapKey: 'floorRates' },
    { key: 'paintRates', title: 'Paint', unit: 'per sqft (wall + ceiling)', mapKey: 'paintRates' },
    { key: 'trimRates', title: 'Trim', unit: 'per linear foot', mapKey: 'trimRates' },
    { key: 'tileRates', title: 'Tile', unit: 'per sqft', mapKey: 'tileRates' },
    { key: 'drywallRates', title: 'Drywall', unit: 'per room or sqft', mapKey: 'drywallRates' },
    { key: 'doorTrimRates', title: 'Door Trim', unit: 'per door', mapKey: 'doorTrimRates' },
    { key: 'windowTrimRates', title: 'Window Trim', unit: 'per window', mapKey: 'windowTrimRates' },
    { key: 'hardwareRates', title: 'Hardware', unit: 'per door', mapKey: 'hardwareRates' },
  ];

  return (
    <>
      {/* Info banner */}
      <div className="mx-4 mt-4 p-3 rounded-xl" style={{ background: '#F0FDFA', border: '1px solid #99F6E4' }}>
        <p className="text-xs font-medium" style={{ color: '#0F766E' }}>
          Installed rates are now computed from Assemblies (Materials + Labour).
        </p>
        <p className="text-xs mt-1" style={{ color: '#5EEAD4' }}>
          Edit rates in the{' '}
          <button onClick={() => onSwitchTab('materials')} className="underline font-medium" style={{ color: '#0F766E' }}>Materials</button>,{' '}
          <button onClick={() => onSwitchTab('labour')} className="underline font-medium" style={{ color: '#0F766E' }}>Labour</button>, or{' '}
          <button onClick={() => onSwitchTab('assemblies')} className="underline font-medium" style={{ color: '#0F766E' }}>Assemblies</button> tabs.
        </p>
      </div>

      {/* Variance — still editable (used by room-count fallback) */}
      <div className="mx-4 mt-4 p-3 rounded-xl" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: '#111827' }}>Estimate Variance</p>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>Used for room-count fallback estimates only</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium" style={{ color: '#6B7280' }}>±</span>
            <input
              type="number"
              value={Math.round(draft.variance * 100)}
              onChange={(e) => setDraft({ ...draft, variance: (parseInt(e.target.value, 10) || 25) / 100 })}
              className="w-16 h-10 px-2 text-center text-sm font-semibold rounded-lg"
              style={{ color: '#111827', background: '#F9FAFB', border: '1px solid #E5E7EB' }}
              min={0}
              max={100}
              step={5}
            />
            <span className="text-sm font-medium" style={{ color: '#6B7280' }}>%</span>
          </div>
        </div>
      </div>

      {/* Assembly-computed rate categories (read-only) */}
      <div className="px-4 mt-4 space-y-4">
        {assemblyCategories.map((cat) => (
          <AssemblyRateSummaryCard
            key={cat.key}
            title={cat.title}
            unit={cat.unit}
            rateMap={RATE_ASSEMBLY_MAP[cat.mapKey]}
            rateLabels={getInstalledRateItems(draft, cat.key as InstalledRateCategory)}
            assemblies={draft.assemblies}
            materials={draft.materials}
            labour={draft.labour}
            isPaint={cat.key === 'paintRates'}
            onSwitchTab={onSwitchTab}
          />
        ))}
      </div>

      {/* Trade Ranges — still editable (room-count fallback) */}
      <div className="px-4 mt-4 space-y-4 pb-4">
        <InstalledRateCategoryCard
          config={INSTALLED_RATE_CATEGORIES.find((c) => c.key === 'tradeRanges')!}
          items={getInstalledRateItems(draft, 'tradeRanges')}
          onUpdateItem={(itemKey, field, value) => onUpdateItem('tradeRanges', itemKey, field, value)}
          onReset={() => onResetCategory('tradeRanges')}
        />
      </div>
    </>
  );
}

// ============================================================================
// Assembly Rate Summary Card (read-only, computed from assemblies)
// ============================================================================

function AssemblyRateSummaryCard({
  title,
  unit,
  rateMap,
  rateLabels,
  assemblies,
  materials,
  labour,
  isPaint,
  onSwitchTab,
}: {
  title: string;
  unit: string;
  rateMap: Record<string, string | { wall: string; ceiling: string | null }>;
  rateLabels: Record<string, Record<string, unknown>>;
  assemblies: CostCatalog['assemblies'];
  materials: CostCatalog['materials'];
  labour: CostCatalog['labour'];
  isPaint: boolean;
  onSwitchTab: (tab: TabId) => void;
}) {
  const entries = Object.keys(rateMap);

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #F3F4F6' }}>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: '#111827' }}>{title}</h3>
          <p className="text-[11px]" style={{ color: '#9CA3AF' }}>{unit} — computed from assemblies</p>
        </div>
        <button
          onClick={() => onSwitchTab('assemblies')}
          className="min-h-[32px] px-2 flex items-center gap-1 rounded-lg text-[11px] font-medium"
          style={{ color: '#0F766E', border: '1px solid #E5E7EB' }}
        >
          Edit Assemblies
        </button>
      </div>

      {/* Column headers */}
      <div className="px-4 py-2 grid grid-cols-[100px_1fr_1fr_72px_72px_72px] gap-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF', borderBottom: '1px solid #F3F4F6' }}>
        <span>Key</span>
        <span>Label</span>
        <span>Assembly</span>
        <span className="text-right">Good</span>
        <span className="text-right">Better</span>
        <span className="text-right">Best</span>
      </div>

      <div className="divide-y" style={{ borderColor: '#F3F4F6' }}>
        {entries.map((key) => {
          const mapping = rateMap[key];
          const label = (rateLabels[key] as Record<string, unknown>)?.label as string ?? key;

          if (isPaint && typeof mapping === 'object' && mapping !== null && 'wall' in mapping) {
            // Paint: compute from wall + ceiling assemblies
            const paintMapping = mapping as { wall: string; ceiling: string | null };
            const wallAsm = assemblies[paintMapping.wall];
            const ceilAsm = paintMapping.ceiling ? assemblies[paintMapping.ceiling] : undefined;
            let good = 0, better = 0, best = 0;
            let asmName = '';
            if (wallAsm) {
              const t = computeAssemblyTotals(wallAsm, materials, labour);
              good += t.good; better += t.better; best += t.best;
              asmName = wallAsm.name;
            }
            if (ceilAsm) {
              const t = computeAssemblyTotals(ceilAsm, materials, labour);
              good += t.good; better += t.better; best += t.best;
              asmName += ' + ' + ceilAsm.name;
            }
            if (!wallAsm && !ceilAsm) asmName = 'No assembly';

            return (
              <div key={key} className="px-4 py-2.5 grid grid-cols-[100px_1fr_1fr_72px_72px_72px] gap-2 items-center">
                <span className="text-xs font-mono" style={{ color: '#6B7280' }}>{key}</span>
                <span className="text-xs" style={{ color: '#111827' }}>{label}</span>
                <span className="text-xs" style={{ color: wallAsm ? '#374151' : '#D1D5DB' }}>{asmName}</span>
                <span className="text-xs font-medium text-right" style={{ color: '#059669' }}>${good.toFixed(2)}</span>
                <span className="text-xs font-medium text-right" style={{ color: '#0369A1' }}>${better.toFixed(2)}</span>
                <span className="text-xs font-medium text-right" style={{ color: '#7C3AED' }}>${best.toFixed(2)}</span>
              </div>
            );
          }

          // Standard: single assembly
          const assemblyKey = mapping as string;
          const assembly = assemblies[assemblyKey];
          if (assembly) {
            const t = computeAssemblyTotals(assembly, materials, labour);
            return (
              <div key={key} className="px-4 py-2.5 grid grid-cols-[100px_1fr_1fr_72px_72px_72px] gap-2 items-center">
                <span className="text-xs font-mono" style={{ color: '#6B7280' }}>{key}</span>
                <span className="text-xs" style={{ color: '#111827' }}>{label}</span>
                <span className="text-xs" style={{ color: '#374151' }}>{assembly.name}</span>
                <span className="text-xs font-medium text-right" style={{ color: '#059669' }}>${t.good.toFixed(2)}</span>
                <span className="text-xs font-medium text-right" style={{ color: '#0369A1' }}>${t.better.toFixed(2)}</span>
                <span className="text-xs font-medium text-right" style={{ color: '#7C3AED' }}>${t.best.toFixed(2)}</span>
              </div>
            );
          }

          return (
            <div key={key} className="px-4 py-2.5 grid grid-cols-[100px_1fr_1fr_72px_72px_72px] gap-2 items-center">
              <span className="text-xs font-mono" style={{ color: '#6B7280' }}>{key}</span>
              <span className="text-xs" style={{ color: '#111827' }}>{label}</span>
              <span className="text-xs" style={{ color: '#D1D5DB' }}>No assembly</span>
              <span className="text-xs text-right" style={{ color: '#D1D5DB' }}>—</span>
              <span className="text-xs text-right" style={{ color: '#D1D5DB' }}>—</span>
              <span className="text-xs text-right" style={{ color: '#D1D5DB' }}>—</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Tab 2: Materials
// ============================================================================

function MaterialsTab({
  draft,
  onUpdateItem,
  onAddItem,
  onRemoveItem,
  onRenameItem,
  onResetCategory,
}: {
  draft: CostCatalog;
  onUpdateItem: (category: string, itemKey: string, field: string, value: unknown) => void;
  onAddItem: (category: string) => void;
  onRemoveItem: (category: string, itemKey: string) => void;
  onRenameItem: (category: string, oldKey: string, newKey: string) => void;
  onResetCategory: (category: string) => void;
}) {
  const materialCategories = MATERIAL_CATEGORY_ORDER.filter(
    (cat) => draft.materials[cat] && Object.keys(draft.materials[cat]).length > 0
  );
  const allCategories = [...new Set([...materialCategories, ...MATERIAL_CATEGORY_ORDER.filter((cat) => DEFAULT_COST_CATALOG.materials[cat])])];

  return (
    <div className="px-4 mt-4 space-y-4">
      {allCategories.map((cat) => {
        const items = draft.materials[cat] ?? {};
        return (
          <MaterialCategoryCard
            key={cat}
            category={cat}
            label={MATERIAL_CATEGORY_LABELS[cat] ?? cat}
            items={items}
            onUpdateItem={(itemKey, field, value) => onUpdateItem(cat, itemKey, field, value)}
            onAddItem={() => onAddItem(cat)}
            onRemoveItem={(itemKey) => onRemoveItem(cat, itemKey)}
            onRenameItem={(oldKey, newKey) => onRenameItem(cat, oldKey, newKey)}
            onReset={() => onResetCategory(cat)}
          />
        );
      })}
    </div>
  );
}

// ============================================================================
// Tab 3: Labour
// ============================================================================

function LabourTab({
  draft,
  onUpdateItem,
  onAddItem,
  onRemoveItem,
  onRenameItem,
  onResetCategory,
}: {
  draft: CostCatalog;
  onUpdateItem: (category: string, itemKey: string, field: string, value: unknown) => void;
  onAddItem: (category: string) => void;
  onRemoveItem: (category: string, itemKey: string) => void;
  onRenameItem: (category: string, oldKey: string, newKey: string) => void;
  onResetCategory: (category: string) => void;
}) {
  const allCategories = [...new Set([
    ...LABOUR_CATEGORY_ORDER.filter((cat) => draft.labour[cat] && Object.keys(draft.labour[cat]).length > 0),
    ...LABOUR_CATEGORY_ORDER.filter((cat) => DEFAULT_COST_CATALOG.labour[cat]),
  ])];

  return (
    <div className="px-4 mt-4 space-y-4">
      {allCategories.map((cat) => {
        const items = draft.labour[cat] ?? {};
        return (
          <LabourCategoryCard
            key={cat}
            category={cat}
            label={LABOUR_CATEGORY_LABELS[cat] ?? cat}
            items={items}
            onUpdateItem={(itemKey, field, value) => onUpdateItem(cat, itemKey, field, value)}
            onAddItem={() => onAddItem(cat)}
            onRemoveItem={(itemKey) => onRemoveItem(cat, itemKey)}
            onRenameItem={(oldKey, newKey) => onRenameItem(cat, oldKey, newKey)}
            onReset={() => onResetCategory(cat)}
          />
        );
      })}
    </div>
  );
}

// ============================================================================
// Installed Rate Category Card (for Tab 1)
// ============================================================================

function InstalledRateCategoryCard({
  config,
  items,
  onUpdateItem,
  onReset,
}: {
  config: CategoryConfig;
  items: Record<string, Record<string, unknown>>;
  onUpdateItem: (itemKey: string, field: string, value: unknown) => void;
  onReset: () => void;
}) {
  const itemKeys = Object.keys(items);

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #F3F4F6' }}>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: '#111827' }}>{config.title}</h3>
          <p className="text-[11px]" style={{ color: '#9CA3AF' }}>{config.unit}</p>
        </div>
        <button onClick={onReset} className="min-h-[32px] px-2 flex items-center gap-1 rounded-lg text-[11px] font-medium" style={{ color: '#6B7280', border: '1px solid #E5E7EB' }}>
          <RotateCcw size={12} />
          Reset
        </button>
      </div>
      <div className="divide-y" style={{ borderColor: '#F3F4F6' }}>
        {itemKeys.map((itemKey) => (
          <InstalledRateRow
            key={itemKey}
            itemKey={itemKey}
            item={items[itemKey]}
            columns={config.columns}
            onUpdate={(field, value) => onUpdateItem(itemKey, field, value)}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Material Category Card (for Tab 2)
// ============================================================================

function MaterialCategoryCard({
  category: _category,
  label,
  items,
  onUpdateItem,
  onAddItem,
  onRemoveItem,
  onRenameItem,
  onReset,
}: {
  category: string;
  label: string;
  items: Record<string, { name: string; unit: CatalogUnit; good: number; better: number; best: number; supplier?: string; sku?: string; manufacturer?: string; productName?: string; modelNumber?: string }>;
  onUpdateItem: (itemKey: string, field: string, value: unknown) => void;
  onAddItem: () => void;
  onRemoveItem: (itemKey: string) => void;
  onRenameItem: (oldKey: string, newKey: string) => void;
  onReset: () => void;
}) {
  const itemKeys = Object.keys(items);

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #F3F4F6' }}>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: '#111827' }}>{label}</h3>
          <p className="text-[11px]" style={{ color: '#9CA3AF' }}>Good / Better / Best tiers</p>
        </div>
        <button onClick={onReset} className="min-h-[32px] px-2 flex items-center gap-1 rounded-lg text-[11px] font-medium" style={{ color: '#6B7280', border: '1px solid #E5E7EB' }}>
          <RotateCcw size={12} />
          Reset
        </button>
      </div>

      {/* Header rows */}
      <div className="px-4 pt-2 grid grid-cols-[1fr_1fr_120px_100px] gap-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>
        <span>Manufacturer</span>
        <span>Product</span>
        <span>Model #</span>
        <span>SKU</span>
      </div>
      <div className="px-4 py-2 grid grid-cols-[1fr_80px_100px_72px_72px_72px_28px] gap-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF', borderBottom: '1px solid #F3F4F6' }}>
        <span>Name</span>
        <span>Unit</span>
        <span>Supplier</span>
        <span>Good</span>
        <span>Better</span>
        <span>Best</span>
        <span />
      </div>

      <div className="divide-y" style={{ borderColor: '#F3F4F6' }}>
        {itemKeys.map((itemKey) => (
          <MaterialRow
            key={itemKey}
            itemKey={itemKey}
            item={items[itemKey]}
            onUpdate={(field, value) => onUpdateItem(itemKey, field, value)}
            onRemove={() => onRemoveItem(itemKey)}
            onRename={(newKey) => onRenameItem(itemKey, newKey)}
            isCustom={itemKey.startsWith('custom_')}
          />
        ))}
      </div>

      <button onClick={onAddItem} className="w-full min-h-[44px] flex items-center justify-center gap-1.5 text-xs font-medium" style={{ color: '#0F766E', borderTop: '1px solid #F3F4F6' }}>
        <Plus size={14} />
        Add Item
      </button>
    </div>
  );
}

function MaterialRow({
  itemKey,
  item,
  onUpdate,
  onRemove,
  onRename: _onRename,
  isCustom,
}: {
  itemKey: string;
  item: { name: string; unit: CatalogUnit; good: number; better: number; best: number; supplier?: string; sku?: string; manufacturer?: string; productName?: string; modelNumber?: string };
  onUpdate: (field: string, value: unknown) => void;
  onRemove: () => void;
  onRename: (newKey: string) => void;
  isCustom: boolean;
}) {
  return (
    <div className="px-4 py-2.5">
      {/* Key label */}
      <div className="mb-1.5">
        <span className="text-[10px] font-mono" style={{ color: '#9CA3AF' }}>{itemKey}</span>
      </div>
      {/* Product details row */}
      <div className="grid grid-cols-[1fr_1fr_120px_100px] gap-2 mb-2">
        <input
          type="text"
          value={item.manufacturer ?? ''}
          onChange={(e) => onUpdate('manufacturer', e.target.value)}
          placeholder="Manufacturer"
          className="h-8 px-2 text-[11px] rounded-lg"
          style={{ color: '#374151', background: '#F9FAFB', border: '1px solid #E5E7EB' }}
        />
        <input
          type="text"
          value={item.productName ?? ''}
          onChange={(e) => onUpdate('productName', e.target.value)}
          placeholder="Product Name"
          className="h-8 px-2 text-[11px] rounded-lg"
          style={{ color: '#374151', background: '#F9FAFB', border: '1px solid #E5E7EB' }}
        />
        <input
          type="text"
          value={item.modelNumber ?? ''}
          onChange={(e) => onUpdate('modelNumber', e.target.value)}
          placeholder="Model #"
          className="h-8 px-2 text-[11px] font-mono rounded-lg"
          style={{ color: '#374151', background: '#F9FAFB', border: '1px solid #E5E7EB' }}
        />
        <input
          type="text"
          value={item.sku ?? ''}
          onChange={(e) => onUpdate('sku', e.target.value)}
          placeholder="SKU"
          className="h-8 px-2 text-[11px] font-mono rounded-lg"
          style={{ color: '#374151', background: '#F9FAFB', border: '1px solid #E5E7EB' }}
        />
      </div>
      {/* Pricing grid */}
      <div className="grid grid-cols-[1fr_80px_100px_72px_72px_72px_28px] gap-2 items-end">
        {/* Name */}
        <input
          type="text"
          value={item.name}
          onChange={(e) => onUpdate('name', e.target.value)}
          className="h-9 px-2 text-sm rounded-lg"
          style={{ color: '#111827', background: '#F9FAFB', border: '1px solid #E5E7EB' }}
        />
        {/* Unit */}
        <select
          value={item.unit}
          onChange={(e) => onUpdate('unit', e.target.value)}
          className="h-9 px-1 text-xs rounded-lg"
          style={{ color: '#374151', background: '#F9FAFB', border: '1px solid #E5E7EB' }}
        >
          {CATALOG_UNITS.map((u) => (
            <option key={u.value} value={u.value}>{u.label}</option>
          ))}
        </select>
        {/* Supplier */}
        <input
          type="text"
          value={item.supplier ?? ''}
          onChange={(e) => onUpdate('supplier', e.target.value)}
          placeholder="Supplier"
          className="h-9 px-2 text-xs rounded-lg"
          style={{ color: '#374151', background: '#F9FAFB', border: '1px solid #E5E7EB' }}
        />
        {/* Good */}
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#9CA3AF' }}>$</span>
          <input
            type="number"
            value={item.good}
            onChange={(e) => onUpdate('good', parseFloat(e.target.value) || 0)}
            step={0.5}
            min={0}
            className="w-full h-9 text-sm rounded-lg"
            style={{ color: '#111827', background: '#F9FAFB', border: '1px solid #E5E7EB', paddingLeft: '18px', paddingRight: '4px' }}
          />
        </div>
        {/* Better */}
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#9CA3AF' }}>$</span>
          <input
            type="number"
            value={item.better}
            onChange={(e) => onUpdate('better', parseFloat(e.target.value) || 0)}
            step={0.5}
            min={0}
            className="w-full h-9 text-sm rounded-lg"
            style={{ color: '#111827', background: '#F9FAFB', border: '1px solid #E5E7EB', paddingLeft: '18px', paddingRight: '4px' }}
          />
        </div>
        {/* Best */}
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#9CA3AF' }}>$</span>
          <input
            type="number"
            value={item.best}
            onChange={(e) => onUpdate('best', parseFloat(e.target.value) || 0)}
            step={0.5}
            min={0}
            className="w-full h-9 text-sm rounded-lg"
            style={{ color: '#111827', background: '#F9FAFB', border: '1px solid #E5E7EB', paddingLeft: '18px', paddingRight: '4px' }}
          />
        </div>
        {/* Delete */}
        {isCustom ? (
          <button onClick={onRemove} className="min-h-[28px] min-w-[28px] flex items-center justify-center rounded" style={{ color: '#EF4444' }}>
            <Trash2 size={14} />
          </button>
        ) : <div />}
      </div>
    </div>
  );
}

// ============================================================================
// Tab 4: Assemblies
// ============================================================================

function AssembliesTab({
  draft,
  onAddAssembly,
  onRemoveAssembly,
  onUpdateField,
  onAddComponent,
  onUpdateComponent,
  onRemoveComponent,
  onReset,
}: {
  draft: CostCatalog;
  onAddAssembly: () => void;
  onRemoveAssembly: (key: string) => void;
  onUpdateField: (key: string, field: string, value: unknown) => void;
  onAddComponent: (key: string) => void;
  onUpdateComponent: (key: string, idx: number, updates: Record<string, unknown>) => void;
  onRemoveComponent: (key: string, idx: number) => void;
  onReset: () => void;
}) {
  const assemblyKeys = Object.keys(draft.assemblies);

  return (
    <div className="px-4 mt-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: '#111827' }}>Assemblies</p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>Composite installed rates — materials + labour with G/B/B tiers</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onReset} className="min-h-[32px] px-2 flex items-center gap-1 rounded-lg text-[11px] font-medium" style={{ color: '#6B7280', border: '1px solid #E5E7EB' }}>
            <RotateCcw size={12} />
            Reset
          </button>
          <button onClick={onAddAssembly} className="min-h-[32px] px-3 flex items-center gap-1 rounded-lg text-xs font-medium text-white" style={{ background: '#0F766E' }}>
            <Plus size={14} />
            Add Assembly
          </button>
        </div>
      </div>

      {assemblyKeys.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
          <Package size={32} style={{ color: '#D1D5DB' }} className="mx-auto mb-2" />
          <p className="text-sm" style={{ color: '#6B7280' }}>No assemblies yet</p>
          <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Add an assembly to combine materials & labour into installed rates</p>
        </div>
      ) : (
        assemblyKeys.map((key) => (
          <NewAssemblyCard
            key={key}
            assemblyKey={key}
            assembly={draft.assemblies[key]}
            materials={draft.materials}
            labour={draft.labour}
            onUpdateField={(field, value) => onUpdateField(key, field, value)}
            onAddComponent={() => onAddComponent(key)}
            onUpdateComponent={(idx, updates) => onUpdateComponent(key, idx, updates)}
            onRemoveComponent={(idx) => onRemoveComponent(key, idx)}
            onRemove={() => onRemoveAssembly(key)}
          />
        ))
      )}
    </div>
  );
}

// ============================================================================
// Assembly Card (reference-based, G/B/B)
// ============================================================================

function NewAssemblyCard({
  assemblyKey: _assemblyKey,
  assembly,
  materials,
  labour,
  onUpdateField,
  onAddComponent,
  onUpdateComponent,
  onRemoveComponent,
  onRemove,
}: {
  assemblyKey: string;
  assembly: Assembly;
  materials: CostCatalog['materials'];
  labour: CostCatalog['labour'];
  onUpdateField: (field: string, value: unknown) => void;
  onAddComponent: () => void;
  onUpdateComponent: (idx: number, updates: Record<string, unknown>) => void;
  onRemoveComponent: (idx: number) => void;
  onRemove: () => void;
}) {
  const totals = useMemo(() => {
    let good = 0, better = 0, best = 0;
    for (const comp of assembly.components) {
      if (comp.type === 'material') {
        const mat = materials[comp.sourceCategory]?.[comp.sourceKey];
        if (mat) {
          good += mat.good * comp.coverageRate;
          better += mat.better * comp.coverageRate;
          best += mat.best * comp.coverageRate;
        }
      } else {
        const lab = labour[comp.sourceCategory]?.[comp.sourceKey];
        if (lab) {
          const val = lab.rate * comp.coverageRate;
          good += val;
          better += val;
          best += val;
        }
      }
    }
    return { good, better, best };
  }, [assembly.components, materials, labour]);

  const allCategories = [...new Set([...MATERIAL_CATEGORY_ORDER, ...LABOUR_CATEGORY_ORDER])];

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid #F3F4F6' }}>
        <div className="flex-1 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={assembly.name}
            onChange={(e) => onUpdateField('name', e.target.value)}
            className="h-9 px-2 text-sm font-semibold rounded-lg flex-1 min-w-[140px]"
            style={{ color: '#111827', background: '#F9FAFB', border: '1px solid #E5E7EB' }}
          />
          <select
            value={assembly.category}
            onChange={(e) => onUpdateField('category', e.target.value)}
            className="h-9 px-2 text-xs rounded-lg"
            style={{ color: '#374151', background: '#F9FAFB', border: '1px solid #E5E7EB' }}
          >
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>{MATERIAL_CATEGORY_LABELS[cat] ?? LABOUR_CATEGORY_LABELS[cat] ?? cat}</option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-medium" style={{ color: '#9CA3AF' }}>per</span>
            <select
              value={assembly.unit}
              onChange={(e) => onUpdateField('unit', e.target.value)}
              className="h-9 px-1 text-xs rounded-lg"
              style={{ color: '#374151', background: '#F9FAFB', border: '1px solid #E5E7EB' }}
            >
              {CATALOG_UNITS.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </div>
        </div>
        <button onClick={onRemove} className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg" style={{ color: '#EF4444' }}>
          <Trash2 size={16} />
        </button>
      </div>

      {/* Column headers */}
      <div className="px-4 py-2 grid grid-cols-[80px_1fr_1fr_72px_72px_72px_72px_28px] gap-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF', borderBottom: '1px solid #F3F4F6' }}>
        <span>Type</span>
        <span>Category</span>
        <span>Item</span>
        <span>Coverage</span>
        <span>Good</span>
        <span>Better</span>
        <span>Best</span>
        <span />
      </div>

      {/* Component rows */}
      <div className="divide-y" style={{ borderColor: '#F3F4F6' }}>
        {assembly.components.map((comp, idx) => (
          <NewAssemblyComponentRow
            key={idx}
            component={comp}
            materials={materials}
            labour={labour}
            onUpdate={(updates) => onUpdateComponent(idx, updates)}
            onRemove={() => onRemoveComponent(idx)}
          />
        ))}
      </div>

      {/* Footer: totals + add button */}
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderTop: '1px solid #E5E7EB', background: '#F9FAFB' }}>
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold" style={{ color: '#111827' }}>
            Totals per {CATALOG_UNITS.find((u) => u.value === assembly.unit)?.label ?? assembly.unit}:
          </span>
          <span className="text-xs font-medium" style={{ color: '#059669' }}>G ${totals.good.toFixed(2)}</span>
          <span className="text-xs font-medium" style={{ color: '#0369A1' }}>B ${totals.better.toFixed(2)}</span>
          <span className="text-xs font-medium" style={{ color: '#7C3AED' }}>B ${totals.best.toFixed(2)}</span>
        </div>
        <button onClick={onAddComponent} className="min-h-[32px] px-3 flex items-center gap-1 rounded-lg text-xs font-medium" style={{ color: '#0F766E', border: '1px solid #E5E7EB', background: '#FFFFFF' }}>
          <Plus size={14} />
          Add Component
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Assembly Component Row (reference-based, cascading dropdowns)
// ============================================================================

function NewAssemblyComponentRow({
  component,
  materials,
  labour,
  onUpdate,
  onRemove,
}: {
  component: AssemblyComponent;
  materials: CostCatalog['materials'];
  labour: CostCatalog['labour'];
  onUpdate: (updates: Record<string, unknown>) => void;
  onRemove: () => void;
}) {
  const resolved = useMemo(() => {
    if (component.type === 'material') {
      const mat = materials[component.sourceCategory]?.[component.sourceKey];
      if (!mat) return { good: 0, better: 0, best: 0 };
      return {
        good: mat.good * component.coverageRate,
        better: mat.better * component.coverageRate,
        best: mat.best * component.coverageRate,
      };
    } else {
      const lab = labour[component.sourceCategory]?.[component.sourceKey];
      if (!lab) return { good: 0, better: 0, best: 0 };
      const val = lab.rate * component.coverageRate;
      return { good: val, better: val, best: val };
    }
  }, [component, materials, labour]);

  const categories = component.type === 'material'
    ? MATERIAL_CATEGORY_ORDER.filter((c) => materials[c] && Object.keys(materials[c]).length > 0)
    : LABOUR_CATEGORY_ORDER.filter((c) => labour[c] && Object.keys(labour[c]).length > 0);

  const itemsInCategory = component.type === 'material'
    ? Object.entries(materials[component.sourceCategory] ?? {})
    : Object.entries(labour[component.sourceCategory] ?? {});

  const handleTypeChange = (newType: string) => {
    const source = newType === 'material' ? materials : labour;
    const order = newType === 'material' ? MATERIAL_CATEGORY_ORDER : LABOUR_CATEGORY_ORDER;
    const firstCat = order.find((c) => source[c] && Object.keys(source[c]).length > 0) ?? '';
    const firstKey = Object.keys(source[firstCat] ?? {})[0] ?? '';
    onUpdate({ type: newType, sourceCategory: firstCat, sourceKey: firstKey });
  };

  const handleCategoryChange = (newCat: string) => {
    const source = component.type === 'material' ? materials : labour;
    const firstKey = Object.keys(source[newCat] ?? {})[0] ?? '';
    onUpdate({ sourceCategory: newCat, sourceKey: firstKey });
  };

  return (
    <div className="px-4 py-2 grid grid-cols-[80px_1fr_1fr_72px_72px_72px_72px_28px] gap-2 items-center">
      {/* Type */}
      <select
        value={component.type}
        onChange={(e) => handleTypeChange(e.target.value)}
        className="h-9 px-1 text-xs rounded-lg"
        style={{ color: '#374151', background: '#F9FAFB', border: '1px solid #E5E7EB' }}
      >
        <option value="material">Material</option>
        <option value="labour">Labour</option>
      </select>
      {/* Category */}
      <select
        value={component.sourceCategory}
        onChange={(e) => handleCategoryChange(e.target.value)}
        className="h-9 px-2 text-xs rounded-lg"
        style={{ color: '#374151', background: '#F9FAFB', border: '1px solid #E5E7EB' }}
      >
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {(component.type === 'material' ? MATERIAL_CATEGORY_LABELS : LABOUR_CATEGORY_LABELS)[cat] ?? cat}
          </option>
        ))}
      </select>
      {/* Item */}
      <select
        value={component.sourceKey}
        onChange={(e) => onUpdate({ sourceKey: e.target.value })}
        className="h-9 px-2 text-xs rounded-lg"
        style={{ color: '#374151', background: '#F9FAFB', border: '1px solid #E5E7EB' }}
      >
        {itemsInCategory.map(([key, val]) => (
          <option key={key} value={key}>{(val as { name: string }).name}</option>
        ))}
      </select>
      {/* Coverage */}
      <input
        type="number"
        value={component.coverageRate}
        onChange={(e) => onUpdate({ coverageRate: parseFloat(e.target.value) || 0 })}
        step={0.01}
        min={0}
        className="h-9 px-2 text-sm rounded-lg"
        style={{ color: '#111827', background: '#F9FAFB', border: '1px solid #E5E7EB' }}
      />
      {/* Good */}
      <span className="text-xs font-medium text-right" style={{ color: '#059669' }}>${resolved.good.toFixed(2)}</span>
      {/* Better */}
      <span className="text-xs font-medium text-right" style={{ color: '#0369A1' }}>${resolved.better.toFixed(2)}</span>
      {/* Best */}
      <span className="text-xs font-medium text-right" style={{ color: '#7C3AED' }}>${resolved.best.toFixed(2)}</span>
      {/* Remove */}
      <button onClick={onRemove} className="min-h-[28px] min-w-[28px] flex items-center justify-center rounded" style={{ color: '#EF4444' }}>
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ============================================================================
// Labour Category Card (for Tab 3)
// ============================================================================

function LabourCategoryCard({
  category: _category,
  label,
  items,
  onUpdateItem,
  onAddItem,
  onRemoveItem,
  onRenameItem,
  onReset,
}: {
  category: string;
  label: string;
  items: Record<string, { name: string; unit: CatalogUnit; rate: number }>;
  onUpdateItem: (itemKey: string, field: string, value: unknown) => void;
  onAddItem: () => void;
  onRemoveItem: (itemKey: string) => void;
  onRenameItem: (oldKey: string, newKey: string) => void;
  onReset: () => void;
}) {
  const itemKeys = Object.keys(items);

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #F3F4F6' }}>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: '#111827' }}>{label}</h3>
          <p className="text-[11px]" style={{ color: '#9CA3AF' }}>Labour rates by task</p>
        </div>
        <button onClick={onReset} className="min-h-[32px] px-2 flex items-center gap-1 rounded-lg text-[11px] font-medium" style={{ color: '#6B7280', border: '1px solid #E5E7EB' }}>
          <RotateCcw size={12} />
          Reset
        </button>
      </div>

      {/* Header row */}
      <div className="px-4 py-2 grid grid-cols-[1fr_80px_80px_28px] gap-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF', borderBottom: '1px solid #F3F4F6' }}>
        <span>Name</span>
        <span>Unit</span>
        <span>Rate</span>
        <span />
      </div>

      <div className="divide-y" style={{ borderColor: '#F3F4F6' }}>
        {itemKeys.map((itemKey) => (
          <LabourRow
            key={itemKey}
            itemKey={itemKey}
            item={items[itemKey]}
            onUpdate={(field, value) => onUpdateItem(itemKey, field, value)}
            onRemove={() => onRemoveItem(itemKey)}
            onRename={(newKey) => onRenameItem(itemKey, newKey)}
            isCustom={itemKey.startsWith('custom_')}
          />
        ))}
      </div>

      <button onClick={onAddItem} className="w-full min-h-[44px] flex items-center justify-center gap-1.5 text-xs font-medium" style={{ color: '#0F766E', borderTop: '1px solid #F3F4F6' }}>
        <Plus size={14} />
        Add Item
      </button>
    </div>
  );
}

function LabourRow({
  itemKey,
  item,
  onUpdate,
  onRemove,
  onRename: _onRename,
  isCustom,
}: {
  itemKey: string;
  item: { name: string; unit: CatalogUnit; rate: number };
  onUpdate: (field: string, value: unknown) => void;
  onRemove: () => void;
  onRename: (newKey: string) => void;
  isCustom: boolean;
}) {
  return (
    <div className="px-4 py-2.5">
      <div className="mb-1.5">
        <span className="text-[10px] font-mono" style={{ color: '#9CA3AF' }}>{itemKey}</span>
      </div>
      <div className="grid grid-cols-[1fr_80px_80px_28px] gap-2 items-end">
        {/* Name */}
        <input
          type="text"
          value={item.name}
          onChange={(e) => onUpdate('name', e.target.value)}
          className="h-9 px-2 text-sm rounded-lg"
          style={{ color: '#111827', background: '#F9FAFB', border: '1px solid #E5E7EB' }}
        />
        {/* Unit */}
        <select
          value={item.unit}
          onChange={(e) => onUpdate('unit', e.target.value)}
          className="h-9 px-1 text-xs rounded-lg"
          style={{ color: '#374151', background: '#F9FAFB', border: '1px solid #E5E7EB' }}
        >
          {CATALOG_UNITS.map((u) => (
            <option key={u.value} value={u.value}>{u.label}</option>
          ))}
        </select>
        {/* Rate */}
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#9CA3AF' }}>$</span>
          <input
            type="number"
            value={item.rate}
            onChange={(e) => onUpdate('rate', parseFloat(e.target.value) || 0)}
            step={0.5}
            min={0}
            className="w-full h-9 text-sm rounded-lg"
            style={{ color: '#111827', background: '#F9FAFB', border: '1px solid #E5E7EB', paddingLeft: '18px', paddingRight: '4px' }}
          />
        </div>
        {/* Delete */}
        {isCustom ? (
          <button onClick={onRemove} className="min-h-[28px] min-w-[28px] flex items-center justify-center rounded" style={{ color: '#EF4444' }}>
            <Trash2 size={14} />
          </button>
        ) : <div />}
      </div>
    </div>
  );
}

// ============================================================================
// Installed Rate Row (reused from original)
// ============================================================================

function InstalledRateRow({
  itemKey,
  item,
  columns,
  onUpdate,
}: {
  itemKey: string;
  item: Record<string, unknown>;
  columns: ColumnDef[];
  onUpdate: (field: string, value: unknown) => void;
}) {
  return (
    <div className="px-4 py-3">
      <div className="mb-2">
        <span className="text-xs font-mono" style={{ color: '#6B7280' }}>{itemKey}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {columns.map((col) => (
          <RateField key={col.field} column={col} value={item[col.field]} onChange={(v) => onUpdate(col.field, v)} />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Rate Field (shared, for installed rates tab)
// ============================================================================

function RateField({
  column,
  value,
  onChange,
}: {
  column: ColumnDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (column.type === 'boolean') {
    return (
      <button
        onClick={() => onChange(!value)}
        className="min-h-[36px] px-3 rounded-lg text-xs font-medium flex items-center gap-1"
        style={{
          background: value ? '#F0FDFA' : '#F9FAFB',
          color: value ? '#0F766E' : '#6B7280',
          border: value ? '1px solid #0F766E' : '1px solid #E5E7EB',
        }}
      >
        {column.label}: {value ? 'Yes' : 'No'}
      </button>
    );
  }

  if (column.type === 'text') {
    return (
      <div className="flex-1 min-w-[120px]">
        <label className="block text-[10px] font-medium mb-0.5" style={{ color: '#9CA3AF' }}>{column.label}</label>
        <input
          type="text"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-9 px-2 text-sm rounded-lg"
          style={{ color: '#111827', background: '#F9FAFB', border: '1px solid #E5E7EB' }}
        />
      </div>
    );
  }

  return (
    <div className="min-w-[80px]">
      <label className="block text-[10px] font-medium mb-0.5" style={{ color: '#9CA3AF' }}>{column.label}</label>
      <div className="relative">
        {column.prefix && (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#9CA3AF' }}>
            {column.prefix}
          </span>
        )}
        <input
          type="number"
          value={value as number ?? 0}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          step={column.step ?? 1}
          min={0}
          className="w-full h-9 text-sm rounded-lg"
          style={{
            color: '#111827',
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            paddingLeft: column.prefix ? '18px' : '8px',
            paddingRight: '8px',
          }}
        />
      </div>
    </div>
  );
}
