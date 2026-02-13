'use client';

/**
 * RoomScopeBuilder — Shared room-by-room scope builder for both intake wizards
 *
 * Displays a list of room cards with measurements and trade badges.
 * Tap a card to open the RoomDetailPanel. "+ Add Room" opens a BottomSheet picker.
 * Used by both homeowner (bundleType) and contractor (enabledTrades) flows.
 */

import { useState } from 'react';
import { Plus, Trash2, ChevronRight } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { RoomDetailPanel } from './RoomDetailPanel';
import type {
  RoomScope,
  InteriorsBundle,
  RoomTradeScopes,
} from '@/lib/types/intake.types';
import {
  ROOM_LOCATIONS,
  getDefaultTradesForBundle,
  getDefaultTradesFromCodes,
  getActiveTradesFromScopes,
} from '@/lib/types/intake.types';

// Rooms available for Interiors (excludes 'loc-general' and 'loc-garage')
const AVAILABLE_ROOMS = Object.entries(ROOM_LOCATIONS)
  .filter(([id]) => id !== 'loc-general' && id !== 'loc-garage')
  .map(([id, info]) => ({ id, name: info.name, icon: info.icon }));

// Priority dot colors
const PRIORITY_COLORS: Record<string, string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#9CA3AF',
};

// =============================================================================
// RoomCard
// =============================================================================

interface RoomCardProps {
  room: RoomScope;
  onClick: () => void;
  onDelete: () => void;
}

function RoomCard({ room, onClick, onDelete }: RoomCardProps) {
  const activeTrades = getActiveTradesFromScopes(room.trades);
  const sqft = room.measurements.sqft;
  const icon = ROOM_LOCATIONS[room.id as keyof typeof ROOM_LOCATIONS]?.icon ?? '🏠';

  return (
    <div
      className="flex items-center gap-3 rounded-xl p-3 min-h-[64px]"
      style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}
    >
      {/* Room icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-lg"
        style={{ background: '#F3F4F6' }}
      >
        {icon}
      </div>

      {/* Info — clickable */}
      <button
        type="button"
        onClick={onClick}
        className="flex-1 min-w-0 text-left min-h-[44px] flex flex-col justify-center"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold truncate" style={{ color: '#111827' }}>
            {room.name}
          </span>
          {sqft != null && sqft > 0 && (
            <span className="text-xs" style={{ color: '#9CA3AF' }}>
              {sqft} sqft
            </span>
          )}
        </div>

        {/* Trade badges + priority */}
        <div className="flex items-center gap-1.5 mt-0.5">
          {activeTrades.map((code) => (
            <span
              key={code}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ background: '#F0FDFA', color: '#0F766E' }}
            >
              {code}
            </span>
          ))}
          {activeTrades.length === 0 && (
            <span className="text-[10px]" style={{ color: '#D1D5DB' }}>No trades</span>
          )}
          <span
            className="w-2 h-2 rounded-full ml-auto flex-shrink-0"
            style={{ background: PRIORITY_COLORS[room.priority] ?? '#9CA3AF' }}
          />
        </div>
      </button>

      {/* Chevron */}
      <button
        type="button"
        onClick={onClick}
        className="flex-shrink-0 min-h-[44px] min-w-[32px] flex items-center justify-center"
      >
        <ChevronRight size={16} style={{ color: '#D1D5DB' }} />
      </button>

      {/* Delete */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="flex-shrink-0 min-h-[44px] min-w-[36px] flex items-center justify-center"
      >
        <Trash2 size={14} style={{ color: '#D1D5DB' }} />
      </button>
    </div>
  );
}

// =============================================================================
// AddRoomSheet
// =============================================================================

interface AddRoomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (roomId: string, roomName: string) => void;
  existingRoomIds: string[];
}

function AddRoomSheet({ isOpen, onClose, onAdd, existingRoomIds }: AddRoomSheetProps) {
  const [customName, setCustomName] = useState('');

  const availableRooms = AVAILABLE_ROOMS.filter((r) => !existingRoomIds.includes(r.id));

  const handleAddCustom = () => {
    if (!customName.trim()) return;
    const id = `loc-custom-${Date.now()}`;
    onAdd(id, customName.trim());
    setCustomName('');
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Add Room">
      <div className="space-y-3">
        {/* Room grid */}
        <div className="grid grid-cols-2 gap-2">
          {availableRooms.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => { onAdd(room.id, room.name); onClose(); }}
              className="flex items-center gap-2 rounded-xl p-3 min-h-[52px] text-left transition-colors"
              style={{ background: '#F3F4F6' }}
            >
              <span className="text-base">{room.icon}</span>
              <span className="text-sm font-medium" style={{ color: '#374151' }}>{room.name}</span>
            </button>
          ))}
        </div>

        {availableRooms.length === 0 && (
          <p className="text-sm text-center py-4" style={{ color: '#9CA3AF' }}>
            All rooms added
          </p>
        )}

        {/* Custom room */}
        <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 12 }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>
            Custom Room
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g., Sunroom, Den"
              className="input flex-1"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustom(); }}
            />
            <button
              type="button"
              onClick={handleAddCustom}
              disabled={!customName.trim()}
              className="px-4 min-h-[48px] rounded-xl text-sm font-medium disabled:opacity-40"
              style={{ background: '#0F766E', color: '#FFFFFF' }}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}

// =============================================================================
// RoomScopeBuilder (main export)
// =============================================================================

interface RoomScopeBuilderProps {
  rooms: RoomScope[];
  onChange: (rooms: RoomScope[]) => void;
  bundleType?: InteriorsBundle;
  enabledTrades?: string[];
}

export function RoomScopeBuilder({
  rooms,
  onChange,
  bundleType,
  enabledTrades,
}: RoomScopeBuilderProps) {
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);

  const editingRoom = editingRoomId ? rooms.find((r) => r.id === editingRoomId) : null;

  // Build default trades for a new room
  const getDefaultTrades = (roomId: string): RoomTradeScopes => {
    if (bundleType) return getDefaultTradesForBundle(bundleType, roomId);
    if (enabledTrades) return getDefaultTradesFromCodes(enabledTrades);
    return {};
  };

  const handleAddRoom = (roomId: string, roomName: string) => {
    const newRoom: RoomScope = {
      id: roomId,
      name: roomName,
      measurements: { height_ft: 9 },
      priority: 'medium',
      trades: getDefaultTrades(roomId),
    };
    onChange([...rooms, newRoom]);
  };

  const handleUpdateRoom = (updatedRoom: RoomScope) => {
    onChange(rooms.map((r) => (r.id === updatedRoom.id ? updatedRoom : r)));
  };

  const handleDeleteRoom = (roomId: string) => {
    onChange(rooms.filter((r) => r.id !== roomId));
    if (editingRoomId === roomId) setEditingRoomId(null);
  };

  // Summary stats
  const totalSqft = rooms.reduce((sum, r) => sum + (r.measurements.sqft ?? 0), 0);
  const allTrades = new Set<string>();
  rooms.forEach((r) => {
    getActiveTradesFromScopes(r.trades).forEach((t) => allTrades.add(t));
  });

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: '#111827' }}>
          Rooms ({rooms.length})
        </h3>
        <button
          type="button"
          onClick={() => setShowAddSheet(true)}
          className="flex items-center gap-1 text-sm font-medium min-h-[44px] px-3 rounded-lg"
          style={{ color: '#0F766E' }}
        >
          <Plus size={16} />
          Add Room
        </button>
      </div>

      {/* Room cards */}
      {rooms.length === 0 ? (
        <button
          type="button"
          onClick={() => setShowAddSheet(true)}
          className="w-full rounded-xl p-6 text-center min-h-[80px]"
          style={{ background: '#F9FAFB', border: '2px dashed #E5E7EB' }}
        >
          <Plus size={24} className="mx-auto mb-2" style={{ color: '#D1D5DB' }} />
          <p className="text-sm" style={{ color: '#9CA3AF' }}>
            Add your first room
          </p>
        </button>
      ) : (
        <div className="space-y-2">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onClick={() => setEditingRoomId(room.id)}
              onDelete={() => handleDeleteRoom(room.id)}
            />
          ))}
        </div>
      )}

      {/* Summary */}
      {rooms.length > 0 && (
        <div className="rounded-xl p-3" style={{ background: '#F0FDFA' }}>
          <p className="text-sm" style={{ color: '#0F766E' }}>
            <span className="font-medium">{rooms.length} room{rooms.length !== 1 ? 's' : ''}</span>
            {totalSqft > 0 && <> · {totalSqft.toLocaleString()} sqft</>}
            {allTrades.size > 0 && <> · {Array.from(allTrades).sort().join(', ')}</>}
          </p>
        </div>
      )}

      {/* Add Room BottomSheet */}
      <AddRoomSheet
        isOpen={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        onAdd={handleAddRoom}
        existingRoomIds={rooms.map((r) => r.id)}
      />

      {/* Room Detail Panel */}
      {editingRoom && (
        <RoomDetailPanel
          room={editingRoom}
          onChange={handleUpdateRoom}
          onClose={() => setEditingRoomId(null)}
          onDelete={() => handleDeleteRoom(editingRoom.id)}
          bundleType={bundleType}
          enabledTrades={enabledTrades}
        />
      )}
    </div>
  );
}
