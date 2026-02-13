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
  { value: 'high' as const, label: 'High', color: '#EF4444' },
  { value: 'medium' as const, label: 'Med', color: '#F59E0B' },
  { value: 'low' as const, label: 'Low', color: '#9CA3AF' },
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
      style={{ color: '#9CA3AF' }}
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
      <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>
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
            style={{ color: '#9CA3AF' }}
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
        background: selected ? '#F0FDFA' : '#F3F4F6',
        color: selected ? '#0F766E' : '#6B7280',
        border: selected ? '1.5px solid #0F766E' : '1.5px solid transparent',
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
            background: value === opt.value ? '#0F766E' : '#F3F4F6',
            color: value === opt.value ? '#FFFFFF' : '#6B7280',
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
        <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Type</label>
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
        <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Condition</label>
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
        <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Scope</label>
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
        <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Surfaces</label>
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
        <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Prep Level</label>
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
        <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Coats</label>
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
        <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Items</label>
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
        <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Action</label>
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
        <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Surfaces</label>
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
        <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Extent</label>
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
      <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>
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
      <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>
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
    <div className="space-y-2 mt-2 pt-2" style={{ borderTop: '1px dashed #E5E7EB' }}>
      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#0F766E' }}>
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
          <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Grade</label>
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
    <div className="space-y-2 mt-2 pt-2" style={{ borderTop: '1px dashed #E5E7EB' }}>
      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#0F766E' }}>
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
      <p className="text-[10px] font-medium" style={{ color: '#6B7280' }}>Colors</p>
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
    <div className="space-y-2 mt-2 pt-2" style={{ borderTop: '1px dashed #E5E7EB' }}>
      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#0F766E' }}>
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
          <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Finish</label>
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
    <div className="space-y-2 mt-2 pt-2" style={{ borderTop: '1px dashed #E5E7EB' }}>
      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#0F766E' }}>
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
            style={{ border: '1px solid #E5E7EB' }}
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
          style={{ border: '2px dashed #D1D5DB', color: '#9CA3AF' }}
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
        <div className="mt-3 rounded-xl p-3" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
          <div className="flex gap-3">
            <img
              src={pendingDataUrl}
              alt="Preview"
              className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 space-y-2">
              <p className="text-xs font-medium" style={{ color: '#374151' }}>Tag this photo</p>
              <div className="flex flex-wrap gap-1">
                {tradeTagOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPendingTag(opt.value)}
                    className="px-2 py-1 rounded text-[10px] font-medium"
                    style={{
                      background: pendingTag === opt.value ? '#F0FDFA' : '#F3F4F6',
                      color: pendingTag === opt.value ? '#0F766E' : '#6B7280',
                      border: pendingTag === opt.value ? '1px solid #0F766E' : '1px solid transparent',
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
              style={{ background: '#F3F4F6', color: '#6B7280' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={savePendingPhoto}
              className="flex-1 min-h-[40px] rounded-lg text-xs font-medium"
              style={{ background: '#0F766E', color: '#FFFFFF' }}
            >
              Save Photo
            </button>
          </div>
        </div>
      )}

      {/* Full-size viewer / edit / delete */}
      {viewingPhoto && (
        <div className="mt-3 rounded-xl p-3" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs font-medium" style={{ color: '#374151' }}>
              {viewingPhoto.trade ?? 'General'} — {new Date(viewingPhoto.timestamp).toLocaleDateString()}
            </p>
            <button type="button" onClick={() => setViewingPhoto(null)}>
              <X size={16} style={{ color: '#9CA3AF' }} />
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
              style={{ background: '#FEF2F2', color: '#EF4444' }}
            >
              Delete
            </button>
            <button
              type="button"
              onClick={updatePhotoCaption}
              className="flex-1 min-h-[40px] rounded-lg text-xs font-medium"
              style={{ background: '#0F766E', color: '#FFFFFF' }}
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
                  background: room.priority === p.value ? `${p.color}15` : '#F3F4F6',
                  color: room.priority === p.value ? p.color : '#6B7280',
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
                    background: isEnabled ? '#F0FDFA' : '#F3F4F6',
                    color: isEnabled ? '#0F766E' : '#6B7280',
                    border: isEnabled ? '1.5px solid #0F766E' : '1.5px solid transparent',
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
            <div className="rounded-xl p-3" style={{ background: '#F9FAFB' }}>
              <FlooringForm
                scope={room.trades.flooring}
                onChange={(s) => onChange({ ...room, trades: { ...room.trades, flooring: s } })}
              />
              <FlooringMaterialForm
                material={room.materials?.flooring}
                onChange={(m) => onChange({ ...room, materials: { ...room.materials, flooring: m } })}
              />
            </div>
          </div>
        )}

        {room.trades.paint?.enabled && (
          <div>
            <SectionLabel>Paint Details</SectionLabel>
            <div className="rounded-xl p-3" style={{ background: '#F9FAFB' }}>
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
            <div className="rounded-xl p-3" style={{ background: '#F9FAFB' }}>
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
            <div className="rounded-xl p-3" style={{ background: '#F9FAFB' }}>
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
            <div className="rounded-xl p-3" style={{ background: '#F9FAFB' }}>
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
          style={{ color: '#EF4444', background: '#FEF2F2' }}
        >
          <Trash2 size={14} />
          Remove Room
        </button>
      </div>
    </BottomSheet>
  );
}
