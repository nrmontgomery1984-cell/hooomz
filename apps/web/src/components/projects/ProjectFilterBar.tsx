'use client';

/**
 * Project Filter Bar — Sticky pills for trade, stage, room filtering
 *
 * Derives available options from actual task data so only relevant
 * filters are shown. Sticks below the project header.
 */

import { useMemo } from 'react';
import { X } from 'lucide-react';
import { TRADE_CODES, STAGE_CODES } from '@/lib/types/intake.types';
import type { EnrichedTask } from '@/lib/utils/taskParsing';
import { getRoomIcon } from '@/lib/utils/taskParsing';

export type ProjectGroupMode = 'location' | 'category' | 'stage';

export interface ProjectFilterValues {
  tradeCode: string | null;
  stageCode: string | null;
  room: string | null;
}

interface ProjectFilterBarProps {
  tasks: EnrichedTask[];
  filters: ProjectFilterValues;
  onFiltersChange: (filters: ProjectFilterValues) => void;
  groupMode: ProjectGroupMode;
  onGroupModeChange: (mode: ProjectGroupMode) => void;
}

const GROUP_MODES: { key: ProjectGroupMode; label: string }[] = [
  { key: 'location', label: 'Location' },
  { key: 'category', label: 'Trade' },
  { key: 'stage', label: 'Stage' },
];

export function ProjectFilterBar({ tasks, filters, onFiltersChange, groupMode, onGroupModeChange }: ProjectFilterBarProps) {
  // Derive unique trades present in project tasks
  const availableTrades = useMemo(() => {
    const codes = new Set<string>();
    for (const t of tasks) {
      if (t.tradeCode) codes.add(t.tradeCode);
    }
    return Array.from(codes)
      .filter((c) => c in TRADE_CODES)
      .sort((a, b) => {
        const aOrder = TRADE_CODES[a as keyof typeof TRADE_CODES]?.order ?? 99;
        const bOrder = TRADE_CODES[b as keyof typeof TRADE_CODES]?.order ?? 99;
        return aOrder - bOrder;
      });
  }, [tasks]);

  // Derive unique stages present in project tasks
  const availableStages = useMemo(() => {
    const codes = new Set<string>();
    for (const t of tasks) {
      if (t.stageCode) codes.add(t.stageCode);
    }
    return Array.from(codes)
      .filter((c) => c in STAGE_CODES)
      .sort((a, b) => {
        const aOrder = STAGE_CODES[a as keyof typeof STAGE_CODES]?.order ?? 99;
        const bOrder = STAGE_CODES[b as keyof typeof STAGE_CODES]?.order ?? 99;
        return aOrder - bOrder;
      });
  }, [tasks]);

  // Derive unique rooms
  const availableRooms = useMemo(() => {
    const rooms = new Set<string>();
    for (const t of tasks) {
      rooms.add(t.room);
    }
    return Array.from(rooms).sort();
  }, [tasks]);

  const activeCount = [filters.tradeCode, filters.stageCode, filters.room].filter(Boolean).length;

  const handleToggleTrade = (code: string) => {
    onFiltersChange({
      ...filters,
      tradeCode: filters.tradeCode === code ? null : code,
    });
  };

  const handleToggleStage = (code: string) => {
    onFiltersChange({
      ...filters,
      stageCode: filters.stageCode === code ? null : code,
    });
  };

  const handleRoomChange = (room: string) => {
    onFiltersChange({
      ...filters,
      room: room || null,
    });
  };

  const handleClear = () => {
    onFiltersChange({ tradeCode: null, stageCode: null, room: null });
  };

  // Don't render if there's nothing to filter
  if (availableTrades.length <= 1 && availableStages.length <= 1 && availableRooms.length <= 1) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Group mode segmented control */}
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

      {/* Trade pills */}
      {availableTrades.length > 1 && (
        <div className="flex gap-1.5 flex-wrap">
          {availableTrades.map((code) => {
            const meta = TRADE_CODES[code as keyof typeof TRADE_CODES];
            const isActive = filters.tradeCode === code;
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

      {/* Stage pills + Room dropdown + Clear */}
      <div className="flex gap-1.5 flex-wrap items-center">
        {availableStages.length > 1 && availableStages.map((code) => {
          const meta = STAGE_CODES[code as keyof typeof STAGE_CODES];
          const isActive = filters.stageCode === code;
          return (
            <button
              key={code}
              onClick={() => handleToggleStage(code)}
              className="text-[11px] font-medium px-2.5 py-1.5 rounded-full transition-colors"
              style={{
                minHeight: '30px',
                background: isActive ? '#0F766E' : '#FFFFFF',
                color: isActive ? '#FFFFFF' : '#374151',
                border: isActive ? '1px solid #0F766E' : '1px solid #E5E7EB',
              }}
            >
              {meta?.name || code}
            </button>
          );
        })}

        {/* Room dropdown */}
        {availableRooms.length > 1 && (
          <select
            value={filters.room || ''}
            onChange={(e) => handleRoomChange(e.target.value)}
            className="text-[11px] font-medium px-2.5 py-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              minHeight: '30px',
              background: filters.room ? '#0F766E' : '#FFFFFF',
              color: filters.room ? '#FFFFFF' : '#374151',
              border: filters.room ? '1px solid #0F766E' : '1px solid #E5E7EB',
              paddingRight: '20px',
            }}
          >
            <option value="">All Rooms</option>
            {availableRooms.map((room) => (
              <option key={room} value={room}>
                {getRoomIcon(room)} {room}
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
  );
}
