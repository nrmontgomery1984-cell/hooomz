'use client';

/**
 * RoomDetailPanel — BottomSheet for editing room measurements and per-trade scope
 *
 * Sections:
 * 1. Priority selector (high/med/low)
 * 2. Measurements (L × W → sqft, height, perimeter)
 * 3. Trade toggles (FL, PT, FC, TL, DW)
 * 4. Per-trade detail forms (only for enabled trades)
 * 5. Notes
 */

import { useCallback, useRef, useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Trash2, Camera, X } from 'lucide-react';
import type {
  RoomScope,
  RoomTradeScopes,
  FlooringScope,
  PaintScope,
  TrimScope,
  TileScope,
  DrywallScope,
  FlooringMaterial,
  FlooringComparisonOption,
  PaintMaterial,
  TrimMaterial,
  TileMaterial,
  RoomPhoto,
  PhotoTradeTag,
  QualityTier,
  PaintFinish,
  TrimProfile,
  TrimMaterialType,
  TileType,
  TilePattern,
  InteriorsBundle,
} from '@/lib/types/intake.types';
import { TRADE_CODES } from '@/lib/types/intake.types';

// =============================================================================
// Helpers
// =============================================================================

const PRIORITIES = [
  { value: 'high' as const, label: 'High', color: 'var(--red)' },
  { value: 'medium' as const, label: 'Med', color: 'var(--yellow)' },
  { value: 'low' as const, label: 'Low', color: 'var(--muted)' },
];

const TRADE_LIST = [
  { code: 'FL', key: 'flooring' as const },
  { code: 'PT', key: 'paint' as const },
  { code: 'FC', key: 'trim' as const },
  { code: 'TL', key: 'tile' as const },
  { code: 'DW', key: 'drywall' as const },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[11px] font-semibold uppercase tracking-wider mb-2"
      style={{ color: 'var(--muted)' }}
    >
      {children}
    </p>
  );
}

// =============================================================================
// NumberField
// =============================================================================

function NumberField({
  label,
  value,
  onChange,
  placeholder,
  unit,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
  unit?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--mid)' }}>
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          step="0.5"
          min="0"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
          placeholder={placeholder}
          className="input w-full"
          style={{ minHeight: 44 }}
        />
        {unit && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
            style={{ color: 'var(--muted)' }}
          >
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// TogglePill
// =============================================================================

function TogglePill({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 min-h-[36px] rounded-lg text-xs font-medium transition-colors"
      style={{
        background: selected ? 'var(--green-bg)' : 'var(--surface-2)',
        color: selected ? 'var(--accent)' : 'var(--muted)',
        border: selected ? '1.5px solid var(--accent)' : '1.5px solid transparent',
      }}
    >
      {label}
    </button>
  );
}

// =============================================================================
// Multi-select checkbox row
// =============================================================================

function CheckboxRow<T extends string>({
  options,
  selected,
  onChange,
}: {
  options: { value: T; label: string }[];
  selected: T[];
  onChange: (selected: T[]) => void;
}) {
  const toggle = (val: T) => {
    onChange(
      selected.includes(val)
        ? selected.filter((s) => s !== val)
        : [...selected, val]
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <TogglePill
          key={opt.value}
          label={opt.label}
          selected={selected.includes(opt.value)}
          onClick={() => toggle(opt.value)}
        />
      ))}
    </div>
  );
}

// =============================================================================
// ButtonGroup (single select)
// =============================================================================

function ButtonGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (val: T) => void;
}) {
  return (
    <div className="flex gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className="flex-1 min-h-[40px] rounded-lg text-xs font-medium transition-colors"
          style={{
            background: value === opt.value ? 'var(--accent)' : 'var(--surface-2)',
            color: value === opt.value ? '#fff' : 'var(--muted)',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// =============================================================================
// Per-Trade Detail Forms
// =============================================================================

function FlooringForm({
  scope,
  onChange,
}: {
  scope: FlooringScope;
  onChange: (s: FlooringScope) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--mid)' }}>Type</label>
        <select
          value={scope.type}
          onChange={(e) => onChange({ ...scope, type: e.target.value as FlooringScope['type'] })}
          className="input w-full"
          style={{ minHeight: 44 }}
        >
          <option value="lvp">LVP / LVT</option>
          <option value="hardwood">Hardwood</option>
          <option value="engineered">Engineered Hardwood</option>
          <option value="laminate">Laminate</option>
          <option value="tile">Tile</option>
          <option value="carpet">Carpet</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--mid)' }}>Condition</label>
        <ButtonGroup
          options={[
            { value: 'new_subfloor' as const, label: 'New Subfloor' },
            { value: 'over_existing' as const, label: 'Over Existing' },
            { value: 'remove_replace' as const, label: 'Remove & Replace' },
          ]}
          value={scope.condition}
          onChange={(v) => onChange({ ...scope, condition: v })}
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--mid)' }}>Scope</label>
        <ButtonGroup
          options={[
            { value: 'full_room' as const, label: 'Full Room' },
            { value: 'partial' as const, label: 'Partial' },
          ]}
          value={scope.scope}
          onChange={(v) => onChange({ ...scope, scope: v })}
        />
      </div>
      <NumberField
        label="Sqft Override"
        value={scope.sqft_override}
        onChange={(v) => onChange({ ...scope, sqft_override: v })}
        placeholder="Auto from measurements"
        unit="sqft"
      />
    </div>
  );
}

function PaintForm({
  scope,
  onChange,
}: {
  scope: PaintScope;
  onChange: (s: PaintScope) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--mid)' }}>Surfaces</label>
        <CheckboxRow
          options={[
            { value: 'walls' as const, label: 'Walls' },
            { value: 'ceiling' as const, label: 'Ceiling' },
            { value: 'trim' as const, label: 'Trim' },
          ]}
          selected={scope.surfaces}
          onChange={(v) => onChange({ ...scope, surfaces: v })}
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--mid)' }}>Prep Level</label>
        <ButtonGroup
          options={[
            { value: 'minimal' as const, label: 'Minimal' },
            { value: 'standard' as const, label: 'Standard' },
            { value: 'extensive' as const, label: 'Extensive' },
          ]}
          value={scope.prep}
          onChange={(v) => onChange({ ...scope, prep: v })}
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--mid)' }}>Coats</label>
        <ButtonGroup
          options={[
            { value: 1 as unknown as string, label: '1' },
            { value: 2 as unknown as string, label: '2' },
            { value: 3 as unknown as string, label: '3' },
          ]}
          value={scope.coats as unknown as string}
          onChange={(v) => onChange({ ...scope, coats: Number(v) as 1 | 2 | 3 })}
        />
      </div>
    </div>
  );
}

function TrimForm({
  scope,
  onChange,
}: {
  scope: TrimScope;
  onChange: (s: TrimScope) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--mid)' }}>Items</label>
        <CheckboxRow
          options={[
            { value: 'baseboard' as const, label: 'Baseboard' },
            { value: 'casing' as const, label: 'Casing' },
            { value: 'crown' as const, label: 'Crown' },
            { value: 'shoe' as const, label: 'Shoe' },
            { value: 'wainscoting' as const, label: 'Wainscoting' },
          ]}
          selected={scope.items}
          onChange={(v) => onChange({ ...scope, items: v })}
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--mid)' }}>Action</label>
        <ButtonGroup
          options={[
            { value: 'replace' as const, label: 'Replace' },
            { value: 'new_install' as const, label: 'New Install' },
            { value: 'repair_repaint' as const, label: 'Repair/Repaint' },
          ]}
          value={scope.action}
          onChange={(v) => onChange({ ...scope, action: v })}
        />
      </div>
      <NumberField
        label="LF Override"
        value={scope.lf_override}
        onChange={(v) => onChange({ ...scope, lf_override: v })}
        placeholder="Auto from perimeter"
        unit="lf"
      />
    </div>
  );
}

function TileForm({
  scope,
  onChange,
}: {
  scope: TileScope;
  onChange: (s: TileScope) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--mid)' }}>Surfaces</label>
        <CheckboxRow
          options={[
            { value: 'floor' as const, label: 'Floor' },
            { value: 'walls' as const, label: 'Walls' },
            { value: 'backsplash' as const, label: 'Backsplash' },
          ]}
          selected={scope.surfaces}
          onChange={(v) => onChange({ ...scope, surfaces: v })}
        />
      </div>
      <NumberField
        label="Sqft Override"
        value={scope.sqft_override}
        onChange={(v) => onChange({ ...scope, sqft_override: v })}
        placeholder="Auto from measurements"
        unit="sqft"
      />
    </div>
  );
}

function DrywallForm({
  scope,
  onChange,
}: {
  scope: DrywallScope;
  onChange: (s: DrywallScope) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--mid)' }}>Extent</label>
        <ButtonGroup
          options={[
            { value: 'patch' as const, label: 'Patch' },
            { value: 'skim_coat' as const, label: 'Skim Coat' },
            { value: 'full_replacement' as const, label: 'Full Replace' },
          ]}
          value={scope.extent}
          onChange={(v) => onChange({ ...scope, extent: v })}
        />
      </div>
      <NumberField
        label="Sqft Override"
        value={scope.sqft_override}
        onChange={(v) => onChange({ ...scope, sqft_override: v })}
        placeholder="Auto from measurements"
        unit="sqft"
      />
    </div>
  );
}

// =============================================================================
// Material Forms (per-trade)
// =============================================================================

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--mid)' }}>
        {label}
      </label>
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        placeholder={placeholder}
        className="input w-full"
        style={{ minHeight: 44 }}
      />
    </div>
  );
}

function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--mid)' }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="input w-full"
        style={{ minHeight: 44 }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function FlooringMaterialForm({
  material,
  onChange,
}: {
  material: FlooringMaterial | undefined;
  onChange: (m: FlooringMaterial) => void;
}) {
  const m: FlooringMaterial = material ?? { category: 'lvp', grade: 'good' };
  const upd = (partial: Partial<FlooringMaterial>) => onChange({ ...m, ...partial });

  return (
    <div className="space-y-2 mt-2 pt-2" style={{ borderTop: '1px dashed var(--border)' }}>
      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
        Material Selection
      </p>
      <div className="grid grid-cols-2 gap-2">
        <SelectField
          label="Category"
          value={m.category}
          onChange={(v) => upd({ category: v })}
          options={[
            { value: 'lvp', label: 'LVP / LVT' },
            { value: 'hardwood', label: 'Hardwood' },
            { value: 'laminate', label: 'Laminate' },
            { value: 'tile', label: 'Tile' },
            { value: 'carpet', label: 'Carpet' },
            { value: 'other', label: 'Other' },
          ]}
        />
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--mid)' }}>Grade</label>
          <ButtonGroup
            options={[
              { value: 'good' as QualityTier, label: 'Good' },
              { value: 'better' as QualityTier, label: 'Better' },
              { value: 'best' as QualityTier, label: 'Best' },
            ]}
            value={m.grade ?? 'good'}
            onChange={(v) => upd({ grade: v as QualityTier })}
          />
        </div>
      </div>
      <TextField label="Product" value={m.product} onChange={(v) => upd({ product: v })} placeholder="e.g. Lifeproof Sterling Oak" />
      <div className="grid grid-cols-2 gap-2">
        <TextField label="Color" value={m.color} onChange={(v) => upd({ color: v })} placeholder="Natural Oak" />
        <NumberField label="$/sqft" value={m.pricePerSqft} onChange={(v) => upd({ pricePerSqft: v })} placeholder="0.00" unit="$" />
      </div>
      <TextField label="SKU" value={m.sku} onChange={(v) => upd({ sku: v })} placeholder="Optional catalog ref" />
      <TextField label="Notes" value={m.notes} onChange={(v) => upd({ notes: v })} placeholder="e.g. Match hallway" />
    </div>
  );
}

function PaintMaterialForm({
  material,
  onChange,
}: {
  material: PaintMaterial | undefined;
  onChange: (m: PaintMaterial) => void;
}) {
  const m: PaintMaterial = material ?? { finish: 'eggshell', colors: {} };
  const upd = (partial: Partial<PaintMaterial>) => onChange({ ...m, ...partial });
  const updColor = (key: string, v: string | undefined) =>
    onChange({ ...m, colors: { ...m.colors, [key]: v } });

  return (
    <div className="space-y-2 mt-2 pt-2" style={{ borderTop: '1px dashed var(--border)' }}>
      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
        Material Selection
      </p>
      <div className="grid grid-cols-2 gap-2">
        <TextField label="Brand" value={m.brand} onChange={(v) => upd({ brand: v })} placeholder="Benjamin Moore" />
        <TextField label="Product" value={m.product} onChange={(v) => upd({ product: v })} placeholder="Regal Select" />
      </div>
      <SelectField<PaintFinish>
        label="Finish"
        value={m.finish}
        onChange={(v) => upd({ finish: v })}
        options={[
          { value: 'flat', label: 'Flat' },
          { value: 'matte', label: 'Matte' },
          { value: 'eggshell', label: 'Eggshell' },
          { value: 'satin', label: 'Satin' },
          { value: 'semi_gloss', label: 'Semi-Gloss' },
          { value: 'gloss', label: 'Gloss' },
        ]}
      />
      <p className="text-[10px] font-medium" style={{ color: 'var(--muted)' }}>Colors</p>
      <div className="grid grid-cols-2 gap-2">
        <TextField label="Walls" value={m.colors.walls} onChange={(v) => updColor('walls', v)} placeholder="SW 7015 Repose Gray" />
        <TextField label="Ceiling" value={m.colors.ceiling} onChange={(v) => updColor('ceiling', v)} placeholder="White" />
        <TextField label="Trim" value={m.colors.trim} onChange={(v) => updColor('trim', v)} placeholder="SW 7006 Extra White" />
        <TextField label="Accent" value={m.colors.accent} onChange={(v) => updColor('accent', v)} placeholder="Optional" />
      </div>
      <TextField label="Notes" value={m.notes} onChange={(v) => upd({ notes: v })} placeholder="" />
    </div>
  );
}

function TrimMaterialForm({
  material,
  onChange,
}: {
  material: TrimMaterial | undefined;
  onChange: (m: TrimMaterial) => void;
}) {
  const m: TrimMaterial = material ?? { profile: 'colonial', material: 'mdf', finish: 'paint_grade' };
  const upd = (partial: Partial<TrimMaterial>) => onChange({ ...m, ...partial });

  return (
    <div className="space-y-2 mt-2 pt-2" style={{ borderTop: '1px dashed var(--border)' }}>
      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
        Material Selection
      </p>
      <div className="grid grid-cols-2 gap-2">
        <SelectField<TrimProfile>
          label="Profile"
          value={m.profile}
          onChange={(v) => upd({ profile: v })}
          options={[
            { value: 'colonial', label: 'Colonial' },
            { value: 'craftsman', label: 'Craftsman' },
            { value: 'modern_flat', label: 'Modern Flat' },
            { value: 'ogee', label: 'Ogee' },
            { value: 'ranch', label: 'Ranch' },
            { value: 'custom', label: 'Custom' },
          ]}
        />
        <SelectField<TrimMaterialType>
          label="Material"
          value={m.material}
          onChange={(v) => upd({ material: v })}
          options={[
            { value: 'mdf', label: 'MDF' },
            { value: 'pine', label: 'Pine' },
            { value: 'poplar', label: 'Poplar' },
            { value: 'oak', label: 'Oak' },
            { value: 'pvc', label: 'PVC' },
          ]}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <TextField label="Width" value={m.width} onChange={(v) => upd({ width: v })} placeholder='3-1/4"' />
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--mid)' }}>Finish</label>
          <ButtonGroup
            options={[
              { value: 'paint_grade', label: 'Paint' },
              { value: 'stain_grade', label: 'Stain' },
              { value: 'prefinished', label: 'Prefin.' },
            ]}
            value={m.finish}
            onChange={(v) => upd({ finish: v as TrimMaterial['finish'] })}
          />
        </div>
      </div>
      <TextField label="Notes" value={m.notes} onChange={(v) => upd({ notes: v })} placeholder="" />
    </div>
  );
}

function TileMaterialForm({
  material,
  onChange,
}: {
  material: TileMaterial | undefined;
  onChange: (m: TileMaterial) => void;
}) {
  const m: TileMaterial = material ?? { type: 'ceramic' };
  const upd = (partial: Partial<TileMaterial>) => onChange({ ...m, ...partial });

  return (
    <div className="space-y-2 mt-2 pt-2" style={{ borderTop: '1px dashed var(--border)' }}>
      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
        Material Selection
      </p>
      <div className="grid grid-cols-2 gap-2">
        <SelectField<TileType>
          label="Type"
          value={m.type}
          onChange={(v) => upd({ type: v })}
          options={[
            { value: 'ceramic', label: 'Ceramic' },
            { value: 'porcelain', label: 'Porcelain' },
            { value: 'natural_stone', label: 'Natural Stone' },
            { value: 'glass', label: 'Glass' },
            { value: 'mosaic', label: 'Mosaic' },
          ]}
        />
        <SelectField<TilePattern>
          label="Pattern"
          value={m.pattern ?? 'straight'}
          onChange={(v) => upd({ pattern: v })}
          options={[
            { value: 'straight', label: 'Straight' },
            { value: 'offset', label: 'Offset / Brick' },
            { value: 'herringbone', label: 'Herringbone' },
            { value: 'diagonal', label: 'Diagonal' },
          ]}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <TextField label="Size" value={m.size} onChange={(v) => upd({ size: v })} placeholder='12x24"' />
        <TextField label="Color" value={m.color} onChange={(v) => upd({ color: v })} placeholder="White marble" />
      </div>
      <TextField label="Grout Color" value={m.grout_color} onChange={(v) => upd({ grout_color: v })} placeholder="Warm gray" />
      <TextField label="Notes" value={m.notes} onChange={(v) => upd({ notes: v })} placeholder="" />
    </div>
  );
}

// =============================================================================
// Flooring Comparison
// =============================================================================

const FLOORING_CATEGORY_LABELS: Record<FlooringMaterial['category'], string> = {
  lvp: 'LVP / LVT',
  hardwood: 'Hardwood',
  laminate: 'Laminate',
  tile: 'Tile',
  carpet: 'Carpet',
  other: 'Other',
};

/** Default $/sqft by type + grade from cost catalog seed */
const DEFAULT_PRICES: Record<string, Record<QualityTier, number>> = {
  lvp:        { good: 2.99, better: 3.99, best: 5.49 },
  hardwood:   { good: 5.49, better: 6.99, best: 9.99 },
  laminate:   { good: 1.79, better: 2.49, best: 3.49 },
  tile:       { good: 3.49, better: 5.99, best: 8.99 },
  carpet:     { good: 1.99, better: 3.49, best: 5.99 },
  engineered: { good: 4.49, better: 5.99, best: 7.99 },
  other:      { good: 3.00, better: 5.00, best: 7.00 },
};

function FlooringComparisonSection({
  options,
  onChange,
  onSelectOption,
  roomSqft,
}: {
  options: FlooringComparisonOption[];
  onChange: (opts: FlooringComparisonOption[]) => void;
  onSelectOption: (opt: FlooringComparisonOption) => void;
  roomSqft: number;
}) {
  const [expanded, setExpanded] = useState(true);

  const addOption = () => {
    if (options.length >= 4) return;
    const newOpt: FlooringComparisonOption = {
      id: `fco-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      category: 'lvp',
      grade: 'good',
      pricePerSqft: DEFAULT_PRICES.lvp.good,
    };
    onChange([...options, newOpt]);
  };

  const updateOption = (id: string, partial: Partial<FlooringComparisonOption>) => {
    onChange(options.map((o) => {
      if (o.id !== id) return o;
      const updated = { ...o, ...partial };
      // Auto-fill price when type or grade changes
      if (('category' in partial || 'grade' in partial) && !('pricePerSqft' in partial)) {
        const cat = updated.category;
        const grade = updated.grade;
        const defaultPrice = DEFAULT_PRICES[cat]?.[grade];
        if (defaultPrice) updated.pricePerSqft = defaultPrice;
      }
      return updated;
    }));
  };

  const removeOption = (id: string) => {
    onChange(options.filter((o) => o.id !== id));
  };

  return (
    <div className="mt-3 pt-3" style={{ borderTop: '1px dashed var(--border)' }}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full mb-2"
      >
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--blue)' }}>
          Compare Options ({options.length})
        </span>
        <span className="text-[10px] font-medium" style={{ color: 'var(--muted)' }}>
          {expanded ? '▾' : '▸'}
        </span>
      </button>

      {expanded && (
        <div className="space-y-2">
          {/* Option rows */}
          {options.map((opt, idx) => (
            <div
              key={opt.id}
              className="rounded-lg p-2.5"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold" style={{ color: 'var(--mid)' }}>
                  Option {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeOption(opt.id)}
                  className="text-[10px] font-medium"
                  style={{ color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Remove
                </button>
              </div>

              {/* Type + Grade */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block text-[10px] font-medium mb-0.5" style={{ color: 'var(--muted)' }}>Type</label>
                  <select
                    value={opt.category}
                    onChange={(e) => updateOption(opt.id, { category: e.target.value as FlooringMaterial['category'] })}
                    className="input w-full text-xs"
                    style={{ minHeight: 36 }}
                  >
                    {Object.entries(FLOORING_CATEGORY_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium mb-0.5" style={{ color: 'var(--muted)' }}>Grade</label>
                  <div className="flex gap-1">
                    {(['good', 'better', 'best'] as QualityTier[]).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => updateOption(opt.id, { grade: g })}
                        className="flex-1 min-h-[36px] rounded-lg text-[10px] font-medium"
                        style={{
                          background: opt.grade === g ? 'var(--accent)' : 'var(--surface-2)',
                          color: opt.grade === g ? '#fff' : 'var(--muted)',
                        }}
                      >
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Price + Product */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block text-[10px] font-medium mb-0.5" style={{ color: 'var(--muted)' }}>$/sqft</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={opt.pricePerSqft}
                    onChange={(e) => updateOption(opt.id, { pricePerSqft: parseFloat(e.target.value) || 0 })}
                    className="input w-full text-xs"
                    style={{ minHeight: 36 }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium mb-0.5" style={{ color: 'var(--muted)' }}>Product</label>
                  <input
                    type="text"
                    value={opt.productName ?? ''}
                    onChange={(e) => updateOption(opt.id, { productName: e.target.value || undefined })}
                    placeholder="Optional"
                    className="input w-full text-xs"
                    style={{ minHeight: 36 }}
                  />
                </div>
              </div>

              {/* Total + Select */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color: 'var(--mid)', fontFamily: 'var(--font-mono, monospace)' }}>
                  Total: ${(opt.pricePerSqft * roomSqft).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <button
                  type="button"
                  onClick={() => onSelectOption(opt)}
                  className="px-3 min-h-[32px] rounded-lg text-[10px] font-semibold"
                  style={{ background: 'var(--green-bg)', color: 'var(--accent)', border: '1px solid var(--accent)' }}
                >
                  Use This
                </button>
              </div>
            </div>
          ))}

          {/* Comparison table (when 2+ options) */}
          {options.length >= 2 && (
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface)' }}>
                    <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>Type</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 600, color: 'var(--muted)' }}>Grade</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: 'var(--muted)' }}>$/sqft</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: 'var(--muted)' }}>Total ({roomSqft} sqft)</th>
                  </tr>
                </thead>
                <tbody>
                  {options
                    .slice()
                    .sort((a, b) => a.pricePerSqft * roomSqft - b.pricePerSqft * roomSqft)
                    .map((opt) => {
                      const total = opt.pricePerSqft * roomSqft;
                      return (
                        <tr key={opt.id} style={{ borderTop: '1px solid var(--border)' }}>
                          <td style={{ padding: '6px 8px', color: 'var(--mid)' }}>
                            {FLOORING_CATEGORY_LABELS[opt.category]}
                            {opt.productName && <span style={{ color: 'var(--muted)' }}> — {opt.productName}</span>}
                          </td>
                          <td style={{ padding: '6px 8px', textAlign: 'center', color: 'var(--mid)', textTransform: 'capitalize' }}>
                            {opt.grade}
                          </td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'var(--font-mono, monospace)', color: 'var(--mid)' }}>
                            ${opt.pricePerSqft.toFixed(2)}
                          </td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', color: 'var(--mid)' }}>
                            ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}

          {/* Add option button */}
          {options.length < 4 && (
            <button
              type="button"
              onClick={addOption}
              className="w-full min-h-[36px] rounded-lg text-xs font-medium"
              style={{ background: 'var(--blue-bg)', color: 'var(--blue)', border: '1px dashed var(--blue-border)' }}
            >
              + Add Option to Compare
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Photo Capture
// =============================================================================

/** Resize image to max 1200px longest side, JPEG quality 0.7 */
function resizeImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 1200;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) {
          height = Math.round(height * (MAX / width));
          width = MAX;
        } else {
          width = Math.round(width * (MAX / height));
          height = MAX;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => resolve(dataUrl); // fallback to original
    img.src = dataUrl;
  });
}

function PhotoSection({
  photos,
  onChange,
  enabledTrades,
}: {
  photos: RoomPhoto[];
  onChange: (photos: RoomPhoto[]) => void;
  enabledTrades: string[];
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingDataUrl, setPendingDataUrl] = useState<string | null>(null);
  const [pendingTag, setPendingTag] = useState<PhotoTradeTag>('general');
  const [pendingCaption, setPendingCaption] = useState('');
  const [viewingPhoto, setViewingPhoto] = useState<RoomPhoto | null>(null);
  const [editCaption, setEditCaption] = useState('');

  // Map trade codes to PhotoTradeTag
  const tradeTagOptions: { value: PhotoTradeTag; label: string }[] = [
    ...(enabledTrades.includes('FL') ? [{ value: 'flooring' as PhotoTradeTag, label: 'Flooring' }] : []),
    ...(enabledTrades.includes('PT') ? [{ value: 'paint' as PhotoTradeTag, label: 'Paint' }] : []),
    ...(enabledTrades.includes('FC') ? [{ value: 'trim' as PhotoTradeTag, label: 'Trim' }] : []),
    ...(enabledTrades.includes('TL') ? [{ value: 'tile' as PhotoTradeTag, label: 'Tile' }] : []),
    ...(enabledTrades.includes('DW') ? [{ value: 'drywall' as PhotoTradeTag, label: 'Drywall' }] : []),
    { value: 'general' as PhotoTradeTag, label: 'General' },
  ];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const raw = ev.target?.result as string;
      const resized = await resizeImage(raw);
      setPendingDataUrl(resized);
      setPendingTag(tradeTagOptions[0]?.value ?? 'general');
      setPendingCaption('');
    };
    reader.readAsDataURL(file);
    // Reset file input so the same file can be selected again
    e.target.value = '';
  };

  const savePendingPhoto = () => {
    if (!pendingDataUrl) return;
    const photo: RoomPhoto = {
      id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      dataUrl: pendingDataUrl,
      caption: pendingCaption || undefined,
      trade: pendingTag,
      timestamp: new Date().toISOString(),
    };
    onChange([...photos, photo]);
    setPendingDataUrl(null);
  };

  const deletePhoto = (id: string) => {
    onChange(photos.filter((p) => p.id !== id));
    if (viewingPhoto?.id === id) setViewingPhoto(null);
  };

  const updatePhotoCaption = () => {
    if (!viewingPhoto) return;
    onChange(photos.map((p) => p.id === viewingPhoto.id ? { ...p, caption: editCaption || undefined } : p));
    setViewingPhoto(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <SectionLabel>Photos ({photos.length})</SectionLabel>
      </div>

      {/* Thumbnail grid */}
      <div className="flex flex-wrap gap-2">
        {photos.map((photo) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => { setViewingPhoto(photo); setEditCaption(photo.caption ?? ''); }}
            className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0"
            style={{ border: '1px solid var(--border)' }}
          >
            <img src={photo.dataUrl} alt={photo.caption || 'Room photo'} className="w-full h-full object-cover" />
            {photo.trade && (
              <span
                className="absolute bottom-0 left-0 right-0 text-[8px] text-center font-medium py-0.5 truncate"
                style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}
              >
                {photo.trade}
              </span>
            )}
          </button>
        ))}

        {/* Add button */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-16 h-16 rounded-lg flex flex-col items-center justify-center flex-shrink-0"
          style={{ border: '2px dashed var(--border)', color: 'var(--muted)' }}
        >
          <Camera size={18} />
          <span className="text-[9px] mt-0.5">Add</span>
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Tag & caption sheet for new photo */}
      {pendingDataUrl && (
        <div className="mt-3 rounded-xl p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex gap-3">
            <img
              src={pendingDataUrl}
              alt="Preview"
              className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 space-y-2">
              <p className="text-xs font-medium" style={{ color: 'var(--mid)' }}>Tag this photo</p>
              <div className="flex flex-wrap gap-1">
                {tradeTagOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPendingTag(opt.value)}
                    className="px-2 py-1 rounded text-[10px] font-medium"
                    style={{
                      background: pendingTag === opt.value ? 'var(--green-bg)' : 'var(--surface-2)',
                      color: pendingTag === opt.value ? 'var(--accent)' : 'var(--muted)',
                      border: pendingTag === opt.value ? '1px solid var(--accent)' : '1px solid transparent',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={pendingCaption}
                onChange={(e) => setPendingCaption(e.target.value)}
                placeholder="Caption (optional)"
                className="input w-full text-xs"
                style={{ minHeight: 36 }}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => setPendingDataUrl(null)}
              className="flex-1 min-h-[40px] rounded-lg text-xs font-medium"
              style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={savePendingPhoto}
              className="flex-1 min-h-[40px] rounded-lg text-xs font-medium"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              Save Photo
            </button>
          </div>
        </div>
      )}

      {/* Full-size viewer / edit / delete */}
      {viewingPhoto && (
        <div className="mt-3 rounded-xl p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs font-medium" style={{ color: 'var(--mid)' }}>
              {viewingPhoto.trade ?? 'General'} — {new Date(viewingPhoto.timestamp).toLocaleDateString()}
            </p>
            <button type="button" onClick={() => setViewingPhoto(null)}>
              <X size={16} style={{ color: 'var(--muted)' }} />
            </button>
          </div>
          <img
            src={viewingPhoto.dataUrl}
            alt={viewingPhoto.caption || 'Room photo'}
            className="w-full rounded-lg object-contain max-h-48"
          />
          <input
            type="text"
            value={editCaption}
            onChange={(e) => setEditCaption(e.target.value)}
            placeholder="Edit caption"
            className="input w-full text-xs mt-2"
            style={{ minHeight: 36 }}
          />
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => deletePhoto(viewingPhoto.id)}
              className="min-h-[40px] px-4 rounded-lg text-xs font-medium"
              style={{ background: 'var(--red-bg)', color: 'var(--red)' }}
            >
              Delete
            </button>
            <button
              type="button"
              onClick={updatePhotoCaption}
              className="flex-1 min-h-[40px] rounded-lg text-xs font-medium"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              Save Caption
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// RoomDetailPanel (main export)
// =============================================================================

interface RoomDetailPanelProps {
  room: RoomScope;
  onChange: (room: RoomScope) => void;
  onClose: () => void;
  onDelete: () => void;
  bundleType?: InteriorsBundle;
  enabledTrades?: string[];
}

export function RoomDetailPanel({
  room,
  onChange,
  onClose,
  onDelete,
  bundleType: _bundleType,
  enabledTrades,
}: RoomDetailPanelProps) {
  // Update a nested field on room
  const update = useCallback(
    (partial: Partial<RoomScope>) => {
      onChange({ ...room, ...partial });
    },
    [room, onChange]
  );

  // Update measurements with auto-calc
  const updateMeasurement = useCallback(
    (field: string, value: number | undefined) => {
      const m = { ...room.measurements, [field]: value };

      // Auto-calculate sqft if both length and width present
      if (field === 'length_ft' || field === 'width_ft') {
        const l = field === 'length_ft' ? value : m.length_ft;
        const w = field === 'width_ft' ? value : m.width_ft;
        if (l != null && w != null && l > 0 && w > 0) {
          m.sqft = Math.round(l * w);
          m.perimeter_lf = Math.round(2 * (l + w));
        }
      }

      onChange({ ...room, measurements: m });
    },
    [room, onChange]
  );

  // Toggle a trade on/off
  const toggleTrade = useCallback(
    (tradeKey: keyof RoomTradeScopes) => {
      const trades = { ...room.trades };
      const current = trades[tradeKey];

      if (current && current.enabled) {
        // Disable — keep the scope data but mark disabled
        (trades as Record<string, unknown>)[tradeKey] = { ...current, enabled: false };
      } else if (current) {
        // Re-enable
        (trades as Record<string, unknown>)[tradeKey] = { ...current, enabled: true };
      } else {
        // Create new with defaults
        switch (tradeKey) {
          case 'flooring':
            trades.flooring = { enabled: true, type: 'lvp', condition: 'remove_replace', scope: 'full_room' };
            break;
          case 'paint':
            trades.paint = { enabled: true, surfaces: ['walls', 'ceiling'], prep: 'standard', coats: 2 };
            break;
          case 'trim':
            trades.trim = { enabled: true, items: ['baseboard'], action: 'replace' };
            break;
          case 'tile':
            trades.tile = { enabled: true, surfaces: ['floor'] };
            break;
          case 'drywall':
            trades.drywall = { enabled: true, extent: 'patch' };
            break;
        }
      }

      onChange({ ...room, trades });
    },
    [room, onChange]
  );

  // Determine which trades to show toggles for
  const visibleTrades = TRADE_LIST.filter((t) => {
    // Contractor: only show trades in enabledTrades
    if (enabledTrades && !enabledTrades.includes(t.code)) return false;
    // Always show OH is excluded (not relevant for room scope)
    return true;
  });

  return (
    <BottomSheet isOpen={true} onClose={onClose} title={room.name}>
      <div className="space-y-5 pb-4">
        {/* Priority */}
        <div>
          <SectionLabel>Priority</SectionLabel>
          <div className="flex gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => update({ priority: p.value })}
                className="flex-1 min-h-[40px] rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                style={{
                  background: room.priority === p.value ? `${p.color}15` : 'var(--surface-2)',
                  color: room.priority === p.value ? p.color : 'var(--muted)',
                  border: room.priority === p.value ? `1.5px solid ${p.color}` : '1.5px solid transparent',
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: p.color }}
                />
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Measurements */}
        <div>
          <SectionLabel>Measurements</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="Length"
              value={room.measurements.length_ft}
              onChange={(v) => updateMeasurement('length_ft', v)}
              placeholder="ft"
              unit="ft"
            />
            <NumberField
              label="Width"
              value={room.measurements.width_ft}
              onChange={(v) => updateMeasurement('width_ft', v)}
              placeholder="ft"
              unit="ft"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <NumberField
              label="Height"
              value={room.measurements.height_ft}
              onChange={(v) => updateMeasurement('height_ft', v)}
              placeholder="9"
              unit="ft"
            />
            <NumberField
              label="Area"
              value={room.measurements.sqft}
              onChange={(v) => onChange({ ...room, measurements: { ...room.measurements, sqft: v } })}
              placeholder="auto"
              unit="sqft"
            />
            <NumberField
              label="Perimeter"
              value={room.measurements.perimeter_lf}
              onChange={(v) => onChange({ ...room, measurements: { ...room.measurements, perimeter_lf: v } })}
              placeholder="auto"
              unit="lf"
            />
          </div>
        </div>

        {/* Trade Toggles */}
        <div>
          <SectionLabel>Trades</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {visibleTrades.map((t) => {
              const scope = room.trades[t.key];
              const isEnabled = scope?.enabled ?? false;
              const tradeName = TRADE_CODES[t.code as keyof typeof TRADE_CODES]?.name ?? t.code;

              return (
                <button
                  key={t.code}
                  type="button"
                  onClick={() => toggleTrade(t.key)}
                  className="px-3 min-h-[40px] rounded-lg text-xs font-medium transition-colors"
                  style={{
                    background: isEnabled ? 'var(--green-bg)' : 'var(--surface-2)',
                    color: isEnabled ? 'var(--accent)' : 'var(--muted)',
                    border: isEnabled ? '1.5px solid var(--accent)' : '1.5px solid transparent',
                  }}
                >
                  {tradeName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Per-Trade Detail Forms + Material Selections */}
        {room.trades.flooring?.enabled && (
          <div>
            <SectionLabel>Flooring Details</SectionLabel>
            <div className="rounded-xl p-3" style={{ background: 'var(--surface)' }}>
              <FlooringForm
                scope={room.trades.flooring}
                onChange={(s) => onChange({ ...room, trades: { ...room.trades, flooring: s } })}
              />
              <FlooringMaterialForm
                material={room.materials?.flooring}
                onChange={(m) => onChange({ ...room, materials: { ...room.materials, flooring: m } })}
              />
              <FlooringComparisonSection
                options={room.flooringComparison ?? []}
                onChange={(opts) => onChange({ ...room, flooringComparison: opts })}
                onSelectOption={(opt) => onChange({
                  ...room,
                  materials: {
                    ...room.materials,
                    flooring: {
                      category: opt.category,
                      grade: opt.grade,
                      pricePerSqft: opt.pricePerSqft,
                      product: opt.productName,
                      color: opt.color,
                    },
                  },
                })}
                roomSqft={room.measurements.sqft || (room.measurements.length_ft && room.measurements.width_ft
                  ? Math.round(room.measurements.length_ft * room.measurements.width_ft)
                  : 0) || 100}
              />
            </div>
          </div>
        )}

        {room.trades.paint?.enabled && (
          <div>
            <SectionLabel>Paint Details</SectionLabel>
            <div className="rounded-xl p-3" style={{ background: 'var(--surface)' }}>
              <PaintForm
                scope={room.trades.paint}
                onChange={(s) => onChange({ ...room, trades: { ...room.trades, paint: s } })}
              />
              <PaintMaterialForm
                material={room.materials?.paint}
                onChange={(m) => onChange({ ...room, materials: { ...room.materials, paint: m } })}
              />
            </div>
          </div>
        )}

        {room.trades.trim?.enabled && (
          <div>
            <SectionLabel>Trim Details</SectionLabel>
            <div className="rounded-xl p-3" style={{ background: 'var(--surface)' }}>
              <TrimForm
                scope={room.trades.trim}
                onChange={(s) => onChange({ ...room, trades: { ...room.trades, trim: s } })}
              />
              <TrimMaterialForm
                material={room.materials?.trim}
                onChange={(m) => onChange({ ...room, materials: { ...room.materials, trim: m } })}
              />
            </div>
          </div>
        )}

        {room.trades.tile?.enabled && (
          <div>
            <SectionLabel>Tile Details</SectionLabel>
            <div className="rounded-xl p-3" style={{ background: 'var(--surface)' }}>
              <TileForm
                scope={room.trades.tile}
                onChange={(s) => onChange({ ...room, trades: { ...room.trades, tile: s } })}
              />
              <TileMaterialForm
                material={room.materials?.tile}
                onChange={(m) => onChange({ ...room, materials: { ...room.materials, tile: m } })}
              />
            </div>
          </div>
        )}

        {room.trades.drywall?.enabled && (
          <div>
            <SectionLabel>Drywall Details</SectionLabel>
            <div className="rounded-xl p-3" style={{ background: 'var(--surface)' }}>
              <DrywallForm
                scope={room.trades.drywall}
                onChange={(s) => onChange({ ...room, trades: { ...room.trades, drywall: s } })}
              />
            </div>
          </div>
        )}

        {/* Photos */}
        <PhotoSection
          photos={room.photos ?? []}
          onChange={(photos) => onChange({ ...room, photos })}
          enabledTrades={
            visibleTrades
              .filter((t) => room.trades[t.key]?.enabled)
              .map((t) => t.code)
          }
        />

        {/* Notes */}
        <div>
          <SectionLabel>Notes</SectionLabel>
          <textarea
            value={room.notes ?? ''}
            onChange={(e) => update({ notes: e.target.value })}
            className="textarea w-full"
            rows={2}
            placeholder="Room-specific notes..."
          />
        </div>

        {/* Delete room */}
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center justify-center gap-2 w-full min-h-[44px] rounded-xl text-sm font-medium"
          style={{ color: 'var(--red)', background: 'var(--red-bg)' }}
        >
          <Trash2 size={14} />
          Remove Room
        </button>
      </div>
    </BottomSheet>
  );
}
