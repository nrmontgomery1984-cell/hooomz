'use client';

/**
 * Estimate Filter Bar — Group mode selector + three-axis filter chips
 *
 * Row 1: Segmented control — Location | Trade | Stage
 * Row 2: Filter pills (trade, stage, location) + clear button
 */

import { useMemo } from 'react';
import { X } from 'lucide-react';
import { TRADE_CODES, STAGE_CODES } from '@/lib/types/intake.types';
import {
  resolveThreeAxes,
  getTradeOrder,
  getStageOrder,
  getStageColor,
  getLocationIcon,
} from '@/lib/utils/axisMapping';
import type { LineItem } from '@hooomz/shared-contracts';

// ============================================================================
// Types
// ============================================================================

export type GroupMode = 'location' | 'category' | 'stage';

export interface EstimateFilterValues {
  workCategoryCode: string | null;
  stageCode: string | null;
  locationLabel: string | null;
}

interface EstimateFilterBarProps {
  items: LineItem[];
  groupMode: GroupMode;
  onGroupModeChange: (mode: GroupMode) => void;
  filters: EstimateFilterValues;
  onFiltersChange: (filters: EstimateFilterValues) => void;
}

// ============================================================================
// Component
// ============================================================================

export function EstimateFilterBar({
  items,
  groupMode,
  onGroupModeChange,
  filters,
  onFiltersChange,
}: EstimateFilterBarProps) {
  // Derive available trades from actual items
  const availableTrades = useMemo(() => {
    const codes = new Set<string>();
    for (const item of items) {
      const { workCategoryCode } = resolveThreeAxes(item);
      codes.add(workCategoryCode);
    }
    return Array.from(codes)
      .filter((c) => c in TRADE_CODES)
      .sort((a, b) => getTradeOrder(a) - getTradeOrder(b));
  }, [items]);

  // Derive available stages
  const availableStages = useMemo(() => {
    const codes = new Set<string>();
    for (const item of items) {
      const { stageCode } = resolveThreeAxes(item);
      codes.add(stageCode);
    }
    return Array.from(codes)
      .filter((c) => c in STAGE_CODES)
      .sort((a, b) => getStageOrder(a) - getStageOrder(b));
  }, [items]);

  // Derive available locations
  const availableLocations = useMemo(() => {
    const labels = new Set<string>();
    for (const item of items) {
      const { locationLabel } = resolveThreeAxes(item);
      labels.add(locationLabel);
    }
    return Array.from(labels).sort();
  }, [items]);

  const activeCount = [filters.workCategoryCode, filters.stageCode, filters.locationLabel].filter(Boolean).length;

  const handleToggleTrade = (code: string) => {
    onFiltersChange({
      ...filters,
      workCategoryCode: filters.workCategoryCode === code ? null : code,
    });
  };

  const handleToggleStage = (code: string) => {
    onFiltersChange({
      ...filters,
      stageCode: filters.stageCode === code ? null : code,
    });
  };

  const handleLocationChange = (label: string) => {
    onFiltersChange({
      ...filters,
      locationLabel: label || null,
    });
  };

  const handleClear = () => {
    onFiltersChange({ workCategoryCode: null, stageCode: null, locationLabel: null });
  };

  const GROUP_MODES: { key: GroupMode; label: string }[] = [
    { key: 'location', label: 'Location' },
    { key: 'category', label: 'Trade' },
    { key: 'stage', label: 'Stage' },
  ];

  return (
    <div className="space-y-2">
      {/* Row 1: Group mode segmented control */}
      <div
        className="inline-flex rounded-lg overflow-hidden"
        style={{ border: '1px solid #E5E7EB' }}
      >
        {GROUP_MODES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onGroupModeChange(key)}
            className="text-[11px] font-medium px-3 py-1.5 transition-colors"
            style={{
              minHeight: '30px',
              background: groupMode === key ? '#0F766E' : '#FFFFFF',
              color: groupMode === key ? '#FFFFFF' : '#374151',
              borderRight: key !== 'stage' ? '1px solid #E5E7EB' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Row 2: Filter chips */}
      <div className="space-y-1.5">
        {/* Trade pills */}
        {availableTrades.length > 1 && (
          <div className="flex gap-1.5 flex-wrap">
            {availableTrades.map((code) => {
              const meta = TRADE_CODES[code as keyof typeof TRADE_CODES];
              const isActive = filters.workCategoryCode === code;
              return (
                <button
                  key={code}
                  onClick={() => handleToggleTrade(code)}
                  className="text-[11px] font-medium px-2.5 py-1.5 rounded-full transition-colors"
                  style={{
                    minHeight: '30px',
                    background: isActive ? '#0F766E' : '#FFFFFF',
                    color: isActive ? '#FFFFFF' : '#374151',
                    border: isActive ? '1px solid #0F766E' : '1px solid #E5E7EB',
                  }}
                >
                  {meta?.icon} {meta?.name || code}
                </button>
              );
            })}
          </div>
        )}

        {/* Stage pills + Location dropdown + Clear */}
        <div className="flex gap-1.5 flex-wrap items-center">
          {availableStages.length > 1 && availableStages.map((code) => {
            const meta = STAGE_CODES[code as keyof typeof STAGE_CODES];
            const isActive = filters.stageCode === code;
            const color = getStageColor(code);
            return (
              <button
                key={code}
                onClick={() => handleToggleStage(code)}
                className="text-[11px] font-medium px-2.5 py-1.5 rounded-full transition-colors"
                style={{
                  minHeight: '30px',
                  background: isActive ? color : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : '#374151',
                  border: isActive ? `1px solid ${color}` : '1px solid #E5E7EB',
                }}
              >
                {meta?.name || code}
              </button>
            );
          })}

          {/* Location dropdown */}
          {availableLocations.length > 1 && (
            <select
              value={filters.locationLabel || ''}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="text-[11px] font-medium px-2.5 py-1.5 rounded-full appearance-none cursor-pointer"
              style={{
                minHeight: '30px',
                background: filters.locationLabel ? '#0F766E' : '#FFFFFF',
                color: filters.locationLabel ? '#FFFFFF' : '#374151',
                border: filters.locationLabel ? '1px solid #0F766E' : '1px solid #E5E7EB',
                paddingRight: '20px',
              }}
            >
              <option value="">All Locations</option>
              {availableLocations.map((label) => (
                <option key={label} value={label}>
                  {getLocationIcon(label)} {label}
                </option>
              ))}
            </select>
          )}

          {/* Clear button */}
          {activeCount > 0 && (
            <button
              onClick={handleClear}
              className="text-[11px] font-medium px-2 py-1.5 rounded-full flex items-center gap-1 transition-colors"
              style={{
                minHeight: '30px',
                color: '#EF4444',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
              }}
            >
              <X size={10} />
              Clear ({activeCount})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
