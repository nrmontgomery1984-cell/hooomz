/**
 * Task Parsing Utilities
 *
 * Shared functions for extracting room, stage, trade, and SOP info
 * from task titles and descriptions. Used by the project detail page
 * and filter bar.
 */

import { TRADE_CODES, STAGE_CODES, ROOM_LOCATIONS } from '@/lib/types/intake.types';
import { getSOPForTaskByTradeName } from '@/lib/data/sops';

// =============================================================================
// Types
// =============================================================================

export interface EnrichedTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  sopId?: string;
  sopCode?: string;
  blueprintId?: string;
  loopIterationId?: string;
  labsFlagged?: boolean;
  // Parsed fields
  taskName: string;
  room: string;
  stageCode: string | null;
  stageName: string | null;
  tradeCode: string | null;
  tradeName: string | null;
  resolvedSopId: string | undefined;
  userNotes: string;
  // Pass-through for any extra fields
  [key: string]: unknown;
}

// =============================================================================
// Room Parsing
// =============================================================================

export function parseRoomFromTitle(title: string): { taskName: string; room: string } {
  const sepIndex = title.lastIndexOf(' — ');
  return {
    taskName: sepIndex >= 0 ? title.slice(0, sepIndex) : title,
    room: sepIndex >= 0 ? title.slice(sepIndex + 3) : 'General',
  };
}

// =============================================================================
// Stage / Trade Parsing
// =============================================================================

const STAGE_NAME_TO_CODE: Record<string, string> = {};
for (const [code, meta] of Object.entries(STAGE_CODES)) {
  STAGE_NAME_TO_CODE[meta.name.toLowerCase()] = code;
}

const TRADE_NAME_TO_CODE: Record<string, string> = {};
for (const [code, meta] of Object.entries(TRADE_CODES)) {
  TRADE_NAME_TO_CODE[meta.name.toLowerCase()] = code;
}

export function parseStageTradeFromDescription(description: string): {
  stageCode: string | null;
  stageName: string | null;
  tradeCode: string | null;
  tradeName: string | null;
} {
  const firstLine = description.split('\n')[0] || '';
  const parts = firstLine.split(' · ').map((s) => s.trim());

  const stageName = parts[0] || null;
  const tradeName = parts[1] || null;

  const stageCode = stageName ? STAGE_NAME_TO_CODE[stageName.toLowerCase()] ?? null : null;
  const tradeCode = tradeName ? TRADE_NAME_TO_CODE[tradeName.toLowerCase()] ?? null : null;

  return { stageCode, stageName, tradeCode, tradeName };
}

// =============================================================================
// SOP ID Resolution
// =============================================================================

export function parseSopIdFromDescription(description: string): string | undefined {
  const lines = description.split('\n');
  const sopLine = lines.find((l) => l.startsWith('sopId:'));
  return sopLine?.replace('sopId:', '').trim() || undefined;
}

export function resolveSopId(
  task: { sopId?: string; description?: string },
  taskName: string,
  tradeCode: string | null,
): string | undefined {
  // 1. Direct field (Build 3b+)
  if (task.sopId) return task.sopId;

  // 2. Embedded in description
  const fromDesc = parseSopIdFromDescription(task.description || '');
  if (fromDesc) return fromDesc;

  // 3. Infer from trade name
  if (tradeCode) {
    const tradeMeta = TRADE_CODES[tradeCode as keyof typeof TRADE_CODES];
    if (tradeMeta) {
      return getSOPForTaskByTradeName(taskName, tradeMeta.name);
    }
  }

  return undefined;
}

// =============================================================================
// User Notes Extraction
// =============================================================================

export function extractUserNotes(description: string): string {
  return description
    .split('\n')
    .slice(1)
    .filter((l) => !l.startsWith('sopId:'))
    .join('\n')
    .trim();
}

// =============================================================================
// Room Icon / Code Lookup
// =============================================================================

const ROOM_NAME_TO_ENTRY: Record<string, { code: string; icon: string }> = {};
for (const [code, meta] of Object.entries(ROOM_LOCATIONS)) {
  ROOM_NAME_TO_ENTRY[meta.name.toLowerCase()] = { code, icon: meta.icon };
}

export function getRoomIcon(roomName: string): string {
  return ROOM_NAME_TO_ENTRY[roomName.toLowerCase()]?.icon || '📍';
}

export function getRoomLocationCode(roomName: string): string | null {
  return ROOM_NAME_TO_ENTRY[roomName.toLowerCase()]?.code || null;
}

// =============================================================================
// Full Task Enrichment
// =============================================================================

export function enrichTask(task: {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  sopId?: string;
  sopCode?: string;
  blueprintId?: string;
  loopIterationId?: string;
  labsFlagged?: boolean;
  [key: string]: unknown;
}): EnrichedTask {
  const { taskName, room } = parseRoomFromTitle(task.title);
  const { stageCode, stageName, tradeCode, tradeName } = parseStageTradeFromDescription(task.description || '');
  const resolvedSopId = resolveSopId(task, taskName, tradeCode);
  const userNotes = extractUserNotes(task.description || '');

  return {
    ...task,
    taskName,
    room,
    stageCode,
    stageName,
    tradeCode,
    tradeName,
    resolvedSopId,
    userNotes,
  };
}
