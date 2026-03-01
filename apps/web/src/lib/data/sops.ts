/**
 * SOP Static Data — Legacy reference types and lookup helpers
 *
 * SOPs are now created through the app (Standards > SOPs or Labs > SOPs),
 * not hardcoded here. The type definitions and lookup helpers are kept
 * for backward compatibility with existing consumers.
 *
 * Consumers: seedAll.ts, taskParsing.ts, SOPSheetContent.tsx,
 * SOPChecklist.tsx, estimates/[id]/page.tsx
 */

// ============================================================================
// Types
// ============================================================================

export interface SOPCriticalStandard {
  standard: string;
  source: string;
}

export interface SOPStep {
  order: number;
  action: string;
}

export interface SOP {
  id: string;
  title: string;
  guide_source: string;
  critical_standards: SOPCriticalStandard[];
  quick_steps: SOPStep[];
  stop_conditions: string[];
  linked_recommendations: string[];
}

// ============================================================================
// SOP Data — empty (content created through the app)
// ============================================================================

export const SOPS: SOP[] = [];

// ============================================================================
// Lookup helpers (return undefined/[] when no data — callers handle this)
// ============================================================================

/** Get SOP by its ID */
export function getSOPById(sopId: string): SOP | undefined {
  return SOPS.find((s) => s.id === sopId);
}

/** Get all SOPs for a trade code (matches guide_source prefix) */
export function getSOPsByTrade(tradePrefix: string): SOP[] {
  const prefix = tradePrefix.toUpperCase();
  if (prefix === 'OH') return SOPS.filter((s) => s.guide_source.startsWith('OH'));
  return SOPS.filter((s) => s.guide_source.startsWith(prefix));
}

/**
 * Task-to-SOP mapping — empty (SOPs now created through the app)
 */
export const TASK_SOP_MAP: Record<string, string> = {};

/** Trade name → trade code reverse map */
const TRADE_NAME_TO_CODE: Record<string, string> = {
  'flooring': 'FL',
  'paint': 'PT',
  'finish carpentry': 'FC',
  'tile': 'TL',
  'drywall': 'DW',
  'overhead': 'OH',
};

/** Look up the SOP ID for a task based on title and trade code */
export function getSOPForTask(taskTitle: string, tradeCode: string): string | undefined {
  const key = `${taskTitle.toLowerCase()}:${tradeCode.toUpperCase()}`;
  return TASK_SOP_MAP[key];
}

/** Look up the SOP ID for a task using the trade NAME (e.g. "Flooring" instead of "FL") */
export function getSOPForTaskByTradeName(taskTitle: string, tradeName: string): string | undefined {
  const code = TRADE_NAME_TO_CODE[tradeName.toLowerCase()];
  if (!code) return undefined;
  return getSOPForTask(taskTitle, code);
}
